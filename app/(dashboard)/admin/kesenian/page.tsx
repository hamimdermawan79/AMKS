import { auth } from '@/lib/auth';
import type { Metadata } from 'next';export const metadata: Metadata = {  robots: { index: false, follow: false },};
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import KesenianManager from './KesenianManager';

export default async function KesenianPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:kesenian', 'KESENIAN');

  // 1. Query total count of Galeri Kegiatan asrama
  const totalGalleryCount = await db.activity.count();

  // 2. Query activities representing Galeri Kegiatan
  const galleryActivities = await db.activity.findMany({
    orderBy: [
      { startAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    take: 30,
  });

  // 3. Query Kesenian announcements
  const announcements = await db.announcement.findMany({
    where: { division: 'KESENIAN' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // 4. Query Kesenian specific activities (entertainment events)
  const activities = await db.activity.findMany({
    where: { division: 'KESENIAN' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Map gallery activities into post items for Kesenian publication view
  const posts = galleryActivities.map((act) => ({
    id: act.id,
    title: act.title,
    body: act.description || 'Dokumentasi kegiatan asrama.',
    createdAt: act.startAt || act.createdAt,
    coverUrl: act.coverUrl || (act.images && act.images.length > 0 ? act.images[0] : null),
    images: act.images || [],
    location: act.location,
    division: act.division,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <KesenianManager
        posts={posts}
        totalGalleryCount={totalGalleryCount}
        activities={activities}
        announcements={announcements}
        canManage={canManage}
      />
    </div>
  );
}
