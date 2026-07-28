import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import NotificationsListClient from './NotificationsListClient';

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch all notifications for the current logged-in user
  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pusat Notifikasi
        </h1>
        <p className="text-muted-foreground">
          Kelola semua pemberitahuan, tagihan masuk, denda piket, dan informasi kegiatan asrama Anda.
        </p>
      </div>

      <NotificationsListClient
        initialNotifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
