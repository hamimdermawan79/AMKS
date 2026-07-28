import { auth } from '@/lib/auth';
import type { Metadata } from 'next';export const metadata: Metadata = {  robots: { index: false, follow: false },};
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import { Division } from '@prisma/client';
import KeamananManager from './KeamananManager';

export default async function KeamananPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const divisionKey = 'KEAMANAN' as Division;

  const [canManage, canViewCctv] = await Promise.all([
    canFromSession('division:manage:keamanan', divisionKey),
    canFromSession('cctv:view'),
  ]);

  // Query Keamanan announcements
  const announcements = await db.announcement.findMany({
    where: { division: divisionKey },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Query Keamanan activities (maintenance & events)
  const activities = await db.activity.findMany({
    where: { division: divisionKey },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <KeamananManager
      activities={activities.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        location: a.location,
        startAt: a.startAt ? a.startAt.toISOString() : null,
      }))}
      announcements={announcements.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
      }))}
      canManage={canManage}
      canViewCctv={canViewCctv}
    />
    </div>
  );
}
