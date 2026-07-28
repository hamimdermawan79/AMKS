import { auth } from '@/lib/auth';
import type { Metadata } from 'next';export const metadata: Metadata = {  robots: { index: false, follow: false },};
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import DivisionClient from '../../division-shared/DivisionClient';

export default async function KesenianKelolaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('division:manage:kesenian', 'KESENIAN');
  if (!allowed) {
    redirect('/admin/kesenian');
  }

  // Query Kesenian announcements
  const announcements = await db.announcement.findMany({
    where: { division: 'KESENIAN' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Query Kesenian activities (entertainment events)
  const activities = await db.activity.findMany({
    where: { division: 'KESENIAN' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <DivisionClient
        division="KESENIAN"
      divisionLabel="Kesenian"
      description="Mengelola publikasi kegiatan asrama, serta merencanakan event hiburan dan kreasi seni warga asrama sebulan sekali."
      themeColor="purple"
      announcements={announcements.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        createdAt: a.createdAt.toISOString()
      }))}
      activities={activities.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        location: a.location,
        startAt: a.startAt ? a.startAt.toISOString() : null,
        endAt: a.endAt ? a.endAt.toISOString() : null
      }))}
      canManage={true}
    />
    </div>
  );
}
