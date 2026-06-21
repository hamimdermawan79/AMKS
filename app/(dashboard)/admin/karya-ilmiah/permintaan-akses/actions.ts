'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { AccessRequestStatus } from '@prisma/client';

export async function updateAccessRequestStatus(
  id: string,
  status: AccessRequestStatus,
  note?: string
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await canFromSession('access_request:manage');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk mengelola permintaan akses');
  }

  await db.accessRequest.update({
    where: { id },
    data: { status, note: note?.trim() || null },
  });

  revalidatePath('/admin/karya-ilmiah/permintaan-akses');
  return { success: true };
}

export async function deleteAccessRequest(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await canFromSession('access_request:manage');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk menghapus permintaan akses');
  }

  await db.accessRequest.delete({ where: { id } });

  revalidatePath('/admin/karya-ilmiah/permintaan-akses');
  return { success: true };
}
