'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { AttendanceStatus } from '@prisma/client';

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

const sportsActivitySchema = z.object({
  title: z.string().min(1, 'Nama kegiatan wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  feeAmount: z.number().int().min(0, 'Uang iuran tidak valid'),
  fineAmount: z.number().int().min(0, 'Denda tidak valid'),
});

export async function createSportsActivity(data: {
  title: string;
  date: string;
  feeAmount: number;
  fineAmount: number;
}) {
  const session = await authorizeSports();
  const v = sportsActivitySchema.parse(data);

  const activity = await db.sportsActivity.create({
    data: {
      title: v.title,
      date: new Date(v.date),
      feeAmount: v.feeAmount,
      fineAmount: v.fineAmount,
    },
  });

  revalidatePath('/admin/keolahragaan');
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
          ? `Iuran kegiatan olahraga "${activity.title}" tanggal ${activity.date.toLocaleDateString('id-ID')}`
          : `Denda karena berhalangan hadir pada kegiatan olahraga "${activity.title}" tanggal ${activity.date.toLocaleDateString('id-ID')}`,
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
        message: `Terbit tagihan baru untuk kegiatan olahraga "${activity.title}": Rp${amount.toLocaleString('id-ID')} (${isPresent ? 'Iuran Keikutsertaan' : 'Denda Ketidakhadiran'}). Silakan lakukan koordinasi dengan Bendahara/Divisi Olahraga.`,
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

  await db.transaction.delete({ where: { id } });

  revalidatePath('/admin/keolahragaan');
  return { success: true };
}
