'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getUserNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return { success: true, notifications };
  } catch (error: any) {
    console.error('Failed to fetch user notifications:', error);
    return { success: false, error: error.message };
  }
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) {
    return { count: 0 };
  }

  try {
    const count = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });
    return { count };
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return { count: 0 };
  }
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    await db.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, error: error.message };
  }
}
