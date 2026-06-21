'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const accountSchema = z.object({
  phone: z
    .string()
    .regex(/^62\d{9,13}$/, 'Format nomor WA: 62xxx (9-13 digit)'),
  password: z.string().optional(),
});

export async function updateOwnAccount(data: { phone: string; password?: string }) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validated = accountSchema.parse(data);

  const updateData: any = {
    phone: validated.phone,
  };

  if (validated.password && validated.password.length >= 6) {
    updateData.passwordHash = await bcrypt.hash(validated.password, 10);
  }

  await db.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath('/admin/akun');
  return { success: true };
}
