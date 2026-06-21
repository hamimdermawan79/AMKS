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
 * Warga self check-in for a piket assignment they own (on its date).
 * Any logged-in warga can mark their own assignment present.
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

  await db.piketAttendance.create({
    data: {
      assignmentId: assignment.id,
      status: 'HADIR',
      markedById: session.user.id,
    },
  });

  revalidatePath('/admin/kebersihan');
}
