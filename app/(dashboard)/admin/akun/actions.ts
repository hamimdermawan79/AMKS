'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function updateOwnAccount(data: { password?: string }) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!data.password) {
    return { success: true };
  }

  const validated = passwordSchema.parse(data);
  const passwordHash = await bcrypt.hash(validated.password, 10);

  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath('/admin/akun');
  return { success: true };
}
