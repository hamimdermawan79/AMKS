'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { AttendanceStatus } from '@prisma/client';
import {
  assertPemasukanDeletionAllowed,
  assertPengeluaranAllowed,
} from '@/lib/finance/saldo';

async function authorizeSports(permission: string = 'division:manage:keolahragaan') {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  const allowed = await canFromSession(permission, 'KEOLAHRAGAAN');
  if (!allowed) {
    throw new Error('Anda tidak memiliki izin mengelola divisi Keolahragaan');
  }
  return session;
}

function parseWibDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('+') || dateStr.endsWith('Z')) {
    return new Date(dateStr);
  }
  // If formatted as YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss without timezone, append +07:00 (WIB)
  const normalized = dateStr.length === 16 ? `${dateStr}:00+07:00` : `${dateStr}+07:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
}

const sportsActivitySchema = z
  .object({
    title: z.string().min(1, 'Nama kegiatan wajib diisi'),
    date: z.string().min(1, 'Waktu mulai wajib diisi'),
    endDate: z.string().min(1, 'Waktu selesai wajib diisi'),
    location: z.string().trim().optional(),
    locationUrl: z.string().trim().optional(),
    feeAmount: z.number().int().min(0, 'Uang iuran tidak valid'),
    fineAmount: z.number().int().min(0, 'Denda tidak valid'),
    participantIds: z.array(z.string()).min(1, 'Pilih minimal 1 warga peserta'),
  })
  .superRefine((data, ctx) => {
    const start = parseWibDate(data.date);
    const end = parseWibDate(data.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format waktu tidak valid',
        path: ['date'],
      });
      return;
    }
    if (end.getTime() <= start.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Waktu selesai harus setelah waktu mulai',
        path: ['endDate'],
      });
    }
  });

export async function createSportsActivity(data: {
  title: string;
  date: string;
  endDate: string;
  location?: string;
  locationUrl?: string;
  feeAmount: number;
  fineAmount: number;
  participantIds: string[];
}) {
  await authorizeSports();
  const parsed = sportsActivitySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data kegiatan tidak valid');
  }
  const v = parsed.data;

  const startDate = parseWibDate(v.date);
  const endDate = parseWibDate(v.endDate);

  // Buat kegiatan olahraga
  const activity = await db.sportsActivity.create({
    data: {
      title: v.title,
      date: startDate,
      endDate: endDate,
      location: v.location ? v.location.trim() : null,
      locationUrl: v.locationUrl ? v.locationUrl.trim() : null,
      feeAmount: v.feeAmount,
      fineAmount: v.fineAmount,
    },
  });

  // Pre-populate absensi untuk peserta terpilih (status default: HADIR)
  // Warga yang tidak dipilih (misal pulang) tidak dibuatkan attendance sehingga tidak terkena denda
  if (v.participantIds.length > 0) {
    await db.sportsAttendance.createMany({
      data: v.participantIds.map((userId) => ({
        sportsActivityId: activity.id,
        userId,
        status: 'HADIR' as AttendanceStatus,
        billId: null,
      })),
      skipDuplicates: true,
    });

    // Kirim notifikasi pengumuman jadwal olahraga (in-app & WhatsApp) ke seluruh peserta terpilih
    const dateFormatted = startDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    const startTimeFormatted = startDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
    const endTimeFormatted = endDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

    const timeString = `${dateFormatted}, pukul ${startTimeFormatted} – ${endTimeFormatted} WIB`;
    const locationName = v.location?.trim();
    const mapsLink = v.locationUrl?.trim();

    const notifTitle = `Jadwal Olahraga: ${v.title}`;
    let notifMessage = `Halo warga asrama! Anda terdaftar wajib mengikuti kegiatan olahraga bersama:\n\n` +
      `🏆 *${v.title}*\n` +
      `⏰ *Waktu:* ${timeString}\n`;

    if (locationName) {
      notifMessage += `📍 *Lokasi:* ${locationName}\n`;
    }
    if (mapsLink) {
      notifMessage += `🗺️ *Google Maps:* ${mapsLink}\n`;
    }

    notifMessage += `💵 *Iuran Kehadiran:* Rp${v.feeAmount.toLocaleString('id-ID')}\n` +
      `⚠️ *Denda Absen:* Rp${v.fineAmount.toLocaleString('id-ID')}\n\n` +
      `_Mohon hadir tepat waktu. Bagi yang memiliki kendala/berhalangan harap konfirmasi ke pengurus Divisi Keolahragaan._`;

    for (const userId of v.participantIds) {
      try {
        await createNotification({
          userId,
          title: notifTitle,
          message: notifMessage,
          type: 'PENGUMUMAN',
          referenceId: `SPORTS_ACT:${activity.id}:${userId}`,
        });
      } catch (notifErr) {
        console.error(`Failed to send sports notification to user ${userId}:`, notifErr);
      }
    }
  }

  revalidatePath('/admin/keolahragaan');
  revalidatePath('/admin/keolahragaan/kelola');
  return { success: true, activity };
}

export async function deleteSportsActivity(id: string) {
  await authorizeSports();

  // Find if there are any settled bills or transactions associated
  const attendances = await db.sportsAttendance.findMany({
    where: { sportsActivityId: id },
    include: { bill: true },
  });

  const hasPaidBill = attendances.some(a => a.bill?.status === 'LUNAS');
  if (hasPaidBill) {
    throw new Error('Kegiatan tidak dapat dihapus karena sudah ada warga yang melunasi iuran/denda terkait.');
  }

  // Delete associated bills
  for (const att of attendances) {
    if (att.billId) {
      await db.bill.delete({ where: { id: att.billId } });
    }
  }

  await db.sportsActivity.delete({ where: { id } });

  revalidatePath('/admin/keolahragaan');
  return { success: true };
}

export async function saveSportsAttendance(
  activityId: string,
  attendanceData: { userId: string; status: AttendanceStatus }[]
) {
  const session = await authorizeSports();

  const activity = await db.sportsActivity.findUnique({
    where: { id: activityId },
  });
  if (!activity) {
    throw new Error('Kegiatan olahraga tidak ditemukan');
  }

  // Process each attendance
  for (const item of attendanceData) {
    // 1. Check if there is an existing attendance
    const existing = await db.sportsAttendance.findUnique({
      where: {
        sportsActivityId_userId: {
          sportsActivityId: activityId,
          userId: item.userId,
        },
      },
      include: { bill: true },
    });

    // If bill exists and is already paid, we skip editing it to prevent financial discrepancies
    if (existing?.bill?.status === 'LUNAS') {
      continue;
    }

    // Delete existing bill if any (since we are overwriting attendance and re-generating the bill)
    if (existing?.billId) {
      await db.bill.delete({ where: { id: existing.billId } });
    }

    // Determine type, title and amount for the new bill
    const isPresent = item.status === 'HADIR';
    const billType = isPresent ? 'IURAN_OLAHRAGA' : 'DENDA_OLAHRAGA';
    const amount = isPresent ? activity.feeAmount : activity.fineAmount;
    const title = isPresent 
      ? `Iuran Olahraga: ${activity.title}`
      : `Denda Olahraga: ${activity.title} (Tidak Ikut)`;

    const activityDateWib = new Date(activity.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

    // Create the bill
    const bill = await db.bill.create({
      data: {
        userId: item.userId,
        type: billType,
        title,
        amount,
        status: 'BELUM_LUNAS',
        division: 'KEOLAHRAGAAN',
        note: isPresent
          ? `Iuran kegiatan olahraga "${activity.title}" tanggal ${activityDateWib}`
          : `Denda karena berhalangan hadir pada kegiatan olahraga "${activity.title}" tanggal ${activityDateWib}`,
      },
    });

    // Create or update attendance
    await db.sportsAttendance.upsert({
      where: {
        sportsActivityId_userId: {
          sportsActivityId: activityId,
          userId: item.userId,
        },
      },
      create: {
        sportsActivityId: activityId,
        userId: item.userId,
        status: item.status,
        billId: bill.id,
      },
      update: {
        status: item.status,
        billId: bill.id,
      },
    });

    // Queue notification
    try {
      await createNotification({
        userId: item.userId,
        title: isPresent ? 'Tagihan Iuran Olahraga Baru' : 'Denda Olahraga Terbit',
        message: `Terbit tagihan baru untuk kegiatan olahraga "${activity.title}" (${activityDateWib}): Rp${amount.toLocaleString('id-ID')} (${isPresent ? 'Iuran Keikutsertaan' : 'Denda Ketidakhadiran'}). Silakan lakukan koordinasi dengan Bendahara/Divisi Olahraga.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: bill.id,
      });
    } catch (err) {
      console.error('Failed to create notification for sports bill:', err);
    }
  }

  revalidatePath('/admin/keolahragaan');
  return { success: true };
}

const sportsTxSchema = z.object({
  type: z.enum(['PEMASUKAN', 'PENGELUARAN']),
  category: z.string().min(1, 'Kategori wajib diisi'),
  amount: z.number().int().min(1, 'Nominal harus lebih dari 0'),
  description: z.string().optional(),
  occurredAt: z.string().min(1, 'Tanggal wajib diisi'),
});

export async function addSportsTransaction(data: {
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string;
  amount: number;
  description?: string;
  occurredAt: string;
}) {
  const session = await authorizeSports();
  const v = sportsTxSchema.parse(data);

  if (v.type === 'PENGELUARAN') {
    await assertPengeluaranAllowed(
      { scope: 'DIVISION', division: 'KEOLAHRAGAAN' },
      v.amount,
      'Saldo kas olahraga'
    );
  }

  await db.transaction.create({
    data: {
      type: v.type,
      category: v.category,
      amount: v.amount,
      description: v.description || '',
      occurredAt: new Date(v.occurredAt),
      division: 'KEOLAHRAGAAN',
      createdById: session.user.id,
    },
  });

  revalidatePath('/admin/keolahragaan');
  return { success: true };
}

export async function deleteSportsTransaction(id: string) {
  await authorizeSports();

  const existing = await db.transaction.findFirst({
    where: { id, division: 'KEOLAHRAGAAN' },
  });

  if (!existing) {
    throw new Error('Transaksi tidak ditemukan');
  }

  await assertPemasukanDeletionAllowed(
    { scope: 'DIVISION', division: 'KEOLAHRAGAAN' },
    existing,
    'Saldo kas olahraga'
  );

  await db.transaction.delete({ where: { id } });

  revalidatePath('/admin/keolahragaan');
  return { success: true };
}
