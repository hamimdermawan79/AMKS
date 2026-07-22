'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { generatePiketSchedule, closePiketPeriod } from '@/lib/piket/generate';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const KEBERSIHAN_PERM = 'division:manage:kebersihan';

const PIKET_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'piket');
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Simpan foto bukti piket ke public/uploads/piket.
 * Mengembalikan path publik (mis. /uploads/piket/xxx.jpg), atau null bila tidak ada berkas.
 */
async function savePiketPhoto(file: File | null): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('Foto bukti piket wajib diunggah');
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error('Foto harus berformat JPG, PNG, atau WEBP');
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Ukuran foto maksimal 10 MB');
  }

  await mkdir(PIKET_UPLOAD_DIR, { recursive: true });
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(PIKET_UPLOAD_DIR, filename), buffer);

  return `/uploads/piket/${filename}`;
}

/**
 * Authorize the current session for Kebersihan management.
 * SuperAdmin / Ketua pass via global access inside `can`; the scoped
 * Ketua Divisi Kebersihan passes when their divisionScope matches.
 */
async function authorizeManage() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  const allowed = await canFromSession(KEBERSIHAN_PERM, 'KEBERSIHAN');
  if (!allowed) {
    throw new Error('Anda tidak memiliki izin mengelola divisi Kebersihan');
  }
  return session;
}

/** Fetch warga for the participant picker (active members first). */
export async function fetchWargaForPicker() {
  await authorizeManage();
  return db.user.findMany({
    where: { 
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } },
    },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: 'asc' },
  });
}

const createScheduleSchema = z.object({
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  kerjaBaktiCount: z.number().int().min(0, 'Jumlah kerja bakti tidak valid'),
  kerjaBaktiWeekday: z.number().int().min(0).max(6).default(0),
  peoplePerDay: z.number().int().min(1, 'Minimal 1 sektor per hari').max(10),
  finePerDay: z.number().int().min(0, 'Tarif denda tidak valid'),
  participantIds: z.array(z.string()).min(1, 'Pilih minimal 1 warga'),
});

export async function createSchedule(data: {
  startDate: string;
  endDate: string;
  kerjaBaktiCount: number;
  kerjaBaktiWeekday: number;
  peoplePerDay: number;
  finePerDay: number;
  participantIds: string[];
}) {
  const session = await authorizeManage();
  const v = createScheduleSchema.parse(data);

  if (v.participantIds.length < v.peoplePerDay) {
    throw new Error(
      `Jumlah warga yang dipilih (${v.participantIds.length} orang) kurang dari jumlah petugas per hari (${v.peoplePerDay} orang).`
    );
  }

  const start = new Date(v.startDate);
  const end = new Date(v.endDate);
  if (end < start) {
    throw new Error('Tanggal selesai harus setelah tanggal mulai');
  }

  const result = await generatePiketSchedule({
    startDate: start,
    endDate: end,
    kerjaBaktiCount: v.kerjaBaktiCount,
    kerjaBaktiWeekday: v.kerjaBaktiWeekday,
    peoplePerDay: v.peoplePerDay,
    finePerDay: v.finePerDay,
    participantIds: v.participantIds,
    generatedById: session.user.id,
  });

  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');

  return {
    periodId: result.period.id,
    kerjaBaktiDates: result.kerjaBaktiDates,
    piketDates: result.piketDates,
    totalAssignments: result.totalAssignments,
  };
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  body: z.string().min(1, 'Isi pemberitahuan wajib diisi'),
  pinned: z.boolean().default(false),
});

export async function addPemberitahuan(data: {
  title: string;
  body: string;
  pinned?: boolean;
}) {
  const session = await authorizeManage();
  const v = announcementSchema.parse(data);

  await db.announcement.create({
    data: {
      division: 'KEBERSIHAN',
      title: v.title,
      body: v.body,
      pinned: v.pinned,
      createdById: session.user.id,
    },
  });

  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');
}

export async function deletePemberitahuan(id: string) {
  await authorizeManage();
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing || existing.division !== 'KEBERSIHAN') {
    throw new Error('Pemberitahuan tidak ditemukan');
  }
  await db.announcement.delete({ where: { id } });
  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');
}

/**
 * Delete a piket period and everything generated under it (assignments,
 * attendances, kerja bakti dates cascade via the schema). Fines already
 * issued for the period are NOT deleted silently; block deletion if any
 * exist, so we never strip a warga's outstanding denda by accident.
 */
export async function deletePiketPeriod(periodId: string) {
  await authorizeManage();

  const period = await db.piketPeriod.findUnique({
    where: { id: periodId },
    include: { _count: { select: { fines: true } } },
  });

  if (!period) {
    throw new Error('Jadwal piket tidak ditemukan');
  }

  if (period._count.fines > 0) {
    throw new Error(
      'Jadwal tidak dapat dihapus karena sudah memiliki denda terkait. Tutup periode atau batalkan denda terlebih dahulu.'
    );
  }

  // Explicitly delete all related records in a transaction to prevent database drift or orphaned data
  await db.$transaction([
    db.piketAttendance.deleteMany({
      where: { assignment: { periodId } },
    }),
    db.piketAssignment.deleteMany({
      where: { periodId },
    }),
    db.piketKerjaBakti.deleteMany({
      where: { periodId },
    }),
    db.piketPeriod.delete({
      where: { id: periodId },
    }),
  ]);

  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');
  revalidatePath('/user');
  revalidatePath('/');
}

/**
 * Warga self check-in for a piket assignment they own (on its date).
 * Only allowed on the piket date between 01:00–11:00 WIB (Jakarta time).
 *
 * Wajib menyertakan: foto bukti, pernyataan kejujuran (agreement), dan keluhan.
 * Dipanggil dari form (FormData) karena ada unggahan berkas.
 */
export async function selfPresensi(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const assignmentId = String(formData.get('assignmentId') ?? '');
  const complaint = String(formData.get('complaint') ?? '').trim();
  const agreement = formData.get('agreement') === 'true';
  const photo = formData.get('photo');

  if (!assignmentId) {
    throw new Error('Jadwal piket tidak valid');
  }
  if (!agreement) {
    throw new Error('Anda harus menyetujui pernyataan kejujuran sebelum presensi');
  }
  if (!complaint) {
    throw new Error('Keluhan wajib diisi');
  }

  const assignment = await db.piketAssignment.findUnique({
    where: { id: assignmentId },
    include: { attendance: true },
  });

  if (!assignment) {
    throw new Error('Jadwal piket tidak ditemukan');
  }
  if (assignment.userId !== session.user.id) {
    throw new Error('Anda hanya dapat presensi untuk jadwal piket Anda sendiri');
  }
  if (assignment.attendance) {
    throw new Error('Anda sudah melakukan presensi untuk jadwal ini');
  }

  // Validate time window: only on the piket date, 01:00–11:00 WIB (Jakarta)
  const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const piketDate = new Date(assignment.date.toISOString().slice(0, 10) + 'T00:00:00+07:00');
  const todayWib = new Date(nowWib.toDateString() + ' 00:00:00+07:00');

  if (piketDate.getTime() !== todayWib.getTime()) {
    throw new Error('Presensi hanya dapat dilakukan pada hari piket yang bersangkutan');
  }

  const hour = nowWib.getHours();
  if (hour < 1 || hour >= 11) {
    throw new Error('Presensi hanya dibuka pukul 01:00–11:00 WIB');
  }

  // Simpan foto bukti (wajib) sebelum menulis attendance
  const photoUrl = await savePiketPhoto(photo instanceof File ? photo : null);

  await db.piketAttendance.create({
    data: {
      assignmentId: assignment.id,
      status: 'HADIR',
      markedById: session.user.id,
      photoUrl,
      complaint,
    },
  });

  revalidatePath('/admin/kebersihan');
}

/**
 * Tutup periode piket: finalisasi denda (buat Fine + Bill untuk warga yang tidak
 * piket) dan tandai periode non-aktif. Idempoten: periode yang sudah ditutup
 * (isActive=false) ditolak agar denda tidak terbit ganda.
 */
export async function closePeriodAction(periodId: string) {
  await authorizeManage();

  const period = await db.piketPeriod.findUnique({
    where: { id: periodId },
    select: { id: true, isActive: true },
  });

  if (!period) {
    throw new Error('Periode piket tidak ditemukan');
  }
  if (!period.isActive) {
    throw new Error('Periode ini sudah ditutup sebelumnya');
  }

  const result = await closePiketPeriod(periodId);

  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');
  revalidatePath('/admin/kebersihan/laporan');
  revalidatePath('/admin/keuangan');

  return result;
}

const finePaymentSchema = z.object({
  fineId: z.string().min(1, 'Denda tidak valid'),
  amount: z.number().int().min(1, 'Nominal pembayaran harus lebih dari 0'),
  note: z.string().optional(),
});

/**
 * Catat pembayaran / cicilan denda piket.
 * - Membuat satu Transaction PEMASUKAN (kategori "Denda Piket") tanpa relasi Bill
 *   (relasi Bill↔Transaction bersifat 1:1; cicilan bisa banyak), lalu mencatat
 *   FinePayment yang menunjuk transaksi tersebut.
 * - Bila total terbayar >= nominal denda, Bill terkait diset LUNAS (jika ada &
 *   belum lunas). Tidak menyentuh settleBill agar modul keuangan tak berubah.
 */
export async function recordFinePayment(data: {
  fineId: string;
  amount: number;
  note?: string;
}) {
  const session = await authorizeManage();
  const v = finePaymentSchema.parse(data);

  const fine = await db.fine.findUnique({
    where: { id: v.fineId },
    include: {
      payments: { select: { amount: true } },
      bill: { select: { id: true, status: true } },
      user: { select: { fullName: true } },
    },
  });

  if (!fine) {
    throw new Error('Denda tidak ditemukan');
  }

  const alreadyPaid = fine.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, fine.amount - alreadyPaid);
  if (remaining <= 0) {
    throw new Error('Denda ini sudah lunas');
  }
  if (v.amount > remaining) {
    throw new Error(
      `Nominal melebihi sisa denda (sisa Rp${remaining.toLocaleString('id-ID')})`
    );
  }

  // 1) Catat pemasukan keuangan untuk pembayaran ini.
  const tx = await db.transaction.create({
    data: {
      type: 'PEMASUKAN',
      category: 'Denda Piket',
      amount: v.amount,
      description: `Pembayaran denda piket: ${fine.user.fullName}${v.note ? `: ${v.note}` : ''}`,
      occurredAt: new Date(),
      createdById: session.user.id,
      division: 'KEBERSIHAN',
    },
  });

  // 2) Catat cicilan denda yang menunjuk transaksi tersebut.
  await db.finePayment.create({
    data: {
      fineId: fine.id,
      amount: v.amount,
      note: v.note || null,
      recordedById: session.user.id,
      paymentTxId: tx.id,
    },
  });

  // 3) Bila lunas, sinkronkan status Bill (jika ada).
  const paidNow = alreadyPaid + v.amount;
  if (paidNow >= fine.amount && fine.bill && fine.bill.status !== 'LUNAS') {
    await db.bill.update({
      where: { id: fine.bill.id },
      data: {
        status: 'LUNAS',
        settledAt: new Date(),
        settledById: session.user.id,
      },
    });
  }

  revalidatePath('/admin/kebersihan/laporan');
  revalidatePath('/admin/keuangan');

  return {
    paid: paidNow,
    remaining: Math.max(0, fine.amount - paidNow),
    settled: paidNow >= fine.amount,
  };
}
