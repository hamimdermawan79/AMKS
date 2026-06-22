import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import DivisionClient from '../division-shared/DivisionClient';

export default async function RohaniPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:rohani', 'ROHANI');

  const announcements = await db.announcement.findMany({
    where: { division: 'ROHANI' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const activities = await db.activity.findMany({
    where: { division: 'ROHANI' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <DivisionClient
      division="ROHANI"
      divisionLabel="Rohani"
      description="Mengelola kegiatan keagamaan, kajian rutin, pengajian berkala, serta memfasilitasi pengembangan nilai spiritual dan moral warga asrama."
      themeColor="emerald"
      announcements={announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      activities={activities.map((a) => ({
        ...a,
        startAt: a.startAt ? a.startAt.toISOString() : null,
        endAt: a.endAt ? a.endAt.toISOString() : null,
      }))}
      canManage={canManage}
    />
  );
}

