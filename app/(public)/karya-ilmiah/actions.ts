'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Form permintaan akses karya ilmiah dari publik (tanpa login)
const accessRequestSchema = z.object({
  workId: z.string().min(1, 'Karya tidak valid'),
  name: z.string().min(2, 'Nama wajib diisi'),
  whatsapp: z
    .string()
    .regex(/^[0-9+\s-]{8,20}$/, 'Nomor WhatsApp tidak valid'),
  email: z.string().email('Email tidak valid'),
  purpose: z.string().min(5, 'Keperluan wajib diisi (minimal 5 karakter)'),
  institution: z.string().min(2, 'Institusi / Kampus wajib diisi'),
});

export type AccessRequestInput = z.input<typeof accessRequestSchema>;

export async function submitAccessRequest(data: AccessRequestInput) {
  const validated = accessRequestSchema.parse(data);

  // Pastikan karya ada & dipublikasikan
  const work = await db.scientificWork.findUnique({
    where: { id: validated.workId },
    select: { id: true, isPublished: true },
  });

  if (!work || !work.isPublished) {
    throw new Error('Karya tidak ditemukan');
  }

  await db.accessRequest.create({
    data: {
      workId: validated.workId,
      name: validated.name.trim(),
      whatsapp: validated.whatsapp.trim(),
      email: validated.email.trim(),
      purpose: validated.purpose.trim(),
      institution: validated.institution.trim(),
    },
  });

  revalidatePath('/admin/karya-ilmiah/permintaan-akses');
  return { success: true };
}
