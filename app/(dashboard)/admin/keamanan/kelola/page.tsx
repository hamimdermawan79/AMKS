import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import { Division } from '@prisma/client';
import DivisionClient from '../../division-shared/DivisionClient';

export default async function KeamananKelolaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const divisionKey = 'KEAMANAN' as Division;

  const allowed = await canFromSession('division:manage:keamanan', divisionKey);
  if (!allowed) {
    redirect('/admin/keamanan');
  }

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
      <DivisionClient
      division={divisionKey}
      divisionLabel="Keamanan"
      description="Mengelola keamanan asrama, jadwal maintenance CCTV bulanan, serta penyelenggaraan kegiatan keamanan lingkungan asrama."
      themeColor="blue"
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
