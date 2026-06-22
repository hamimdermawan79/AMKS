'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function toggleRolePermission(roleId: string, permissionId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const isSuper = await isSuperAdmin({
    id: session.user.id,
    username: session.user.username,
  });

  if (!isSuper) {
    return { success: false, error: 'Access denied: SuperAdmin only' };
  }

  try {
    if (enabled) {
      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    } else {
      // Find if it exists first
      const existing = await db.rolePermission.findUnique({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
      });

      if (existing) {
        await db.rolePermission.delete({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
        });
      }
    }

    revalidatePath('/admin/pengaturan');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling permission:', error);
    return { success: false, error: error.message || 'Failed to update permission' };
  }
}

export async function testWhatsAppAction(phone: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const isSuper = await isSuperAdmin({
    id: session.user.id,
    username: session.user.username,
  });

  if (!isSuper) {
    return { success: false, error: 'Access denied: SuperAdmin only' };
  }

  try {
    const res = await sendWhatsAppMessage(phone, '🤖 *AMKS WHATSAPP BOT TEST*\n\nHalo! Ini adalah pesan uji coba dari bot WhatsApp AMKS. Koneksi bot Anda berhasil aktif! 🎉');
    if (res.success) {
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Failed to send' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error occurred' };
  }
}

