'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { generatePiketSchedule } from '@/lib/piket/generate';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const KEBERSIHAN_PERM = 'division:manage:kebersihan';

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
    where: { status: 'AKTIF' },
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
 * issued for the period are NOT deleted silently — block deletion if any
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

  // assignments, attendances, and kerja bakti dates are removed via onDelete: Cascade
  await db.piketPeriod.delete({ where: { id: periodId } });

  revalidatePath('/admin/kebersihan');
  revalidatePath('/admin/kebersihan/kelola');
}

/**
 * Warga self check-in for a piket assignment they own (on its date).
 * Only allowed on the piket date between 01:00–11:00 WIB (Jakarta time).
 */
export async function selfPresensi(assignmentId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
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

  await db.piketAttendance.create({
    data: {
      assignmentId: assignment.id,
      status: 'HADIR',
      markedById: session.user.id,
    },
  });

  revalidatePath('/admin/kebersihan');
}
