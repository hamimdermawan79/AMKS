'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { Division } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

async function authorizeDivisionManage(division: Division) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const permCode = `division:manage:${division.toLowerCase()}`;
  const allowed = await canFromSession(permCode, division);
  if (!allowed) {
    throw new Error(`Anda tidak memiliki izin mengelola divisi ${division}`);
  }
  return session;
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  body: z.string().min(1, 'Isi pengumuman wajib diisi'),
  pinned: z.boolean().default(false),
});

export async function addAnnouncementAction(division: Division, data: {
  title: string;
  body: string;
  pinned?: boolean;
}) {
  const session = await authorizeDivisionManage(division);
  const v = announcementSchema.parse(data);

  const announcement = await db.announcement.create({
    data: {
      division,
      title: v.title,
      body: v.body,
      pinned: v.pinned,
      createdById: session.user.id,
    },
  });

  // Broadcast announcement to all active warga
  try {
    const activeUsers = await db.user.findMany({
      where: { 
        status: 'AKTIF',
        roles: { none: { role: { name: 'SUPERADMIN' } } },
      },
      select: { id: true },
    });

    const divisionLabels: Record<Division, string> = {
      KEBERSIHAN: 'Kebersihan',
      KESENIAN: 'Kesenian',
      KEOLAHRAGAAN: 'Keolahragaan',
      ROHANI: 'Rohani',
    };
    const divLabel = divisionLabels[division] || division;

    for (const u of activeUsers) {
      await createNotification({
        userId: u.id,
        title: `Pengumuman Baru: ${v.title}`,
        message: `Terdapat pengumuman baru dari Divisi ${divLabel}:\n\n${v.body}`,
        type: 'PENGUMUMAN',
        referenceId: announcement.id,
      });
    }
  } catch (err) {
    console.error('Failed to broadcast announcement notification:', err);
  }

  revalidatePath(`/admin/${division.toLowerCase()}`);
  return { success: true, id: announcement.id };
}

export async function deleteAnnouncementAction(division: Division, id: string) {
  await authorizeDivisionManage(division);

  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing || existing.division !== division) {
    throw new Error('Pengumuman tidak ditemukan');
  }

  await db.announcement.delete({ where: { id } });

  revalidatePath(`/admin/${division.toLowerCase()}`);
  return { success: true };
}

const activitySchema = z.object({
  title: z.string().min(1, 'Nama kegiatan wajib diisi'),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
});

export async function addActivityAction(division: Division, data: {
  title: string;
  description?: string;
  location?: string;
  startAt?: string | null;
  endAt?: string | null;
}) {
  const session = await authorizeDivisionManage(division);
  const v = activitySchema.parse(data);

  const start = v.startAt ? new Date(v.startAt) : null;
  const end = v.endAt ? new Date(v.endAt) : null;

  if (start && end && end < start) {
    throw new Error('Tanggal selesai harus setelah tanggal mulai');
  }

  const activity = await db.activity.create({
    data: {
      division,
      title: v.title,
      description: v.description || '',
      location: v.location || '',
      startAt: start,
      endAt: end,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/admin/${division.toLowerCase()}`);
  return { success: true, id: activity.id };
}

export async function deleteActivityAction(division: Division, id: string) {
  await authorizeDivisionManage(division);

  const existing = await db.activity.findUnique({ where: { id } });
  if (!existing || existing.division !== division) {
    throw new Error('Kegiatan tidak ditemukan');
  }

  await db.activity.delete({ where: { id } });

  revalidatePath(`/admin/${division.toLowerCase()}`);
  return { success: true };
}

export async function toggleAnnouncementPinAction(division: Division, id: string, pinned: boolean) {
  await authorizeDivisionManage(division);

  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing || existing.division !== division) {
    throw new Error('Pengumuman tidak ditemukan');
  }

  await db.announcement.update({
    where: { id },
    data: { pinned },
  });

  revalidatePath(`/admin/${division.toLowerCase()}`);
  revalidatePath(`/admin/${division.toLowerCase()}/kelola`);
  return { success: true };
}
