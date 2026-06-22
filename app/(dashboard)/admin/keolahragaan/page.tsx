import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import DivisionClient from '../division-shared/DivisionClient';

export default async function KeolahragaanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:keolahragaan', 'KEOLAHRAGAAN');

  const announcements = await db.announcement.findMany({
    where: { division: 'KEOLAHRAGAAN' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const activities = await db.activity.findMany({
    where: { division: 'KEOLAHRAGAAN' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <DivisionClient
      division="KEOLAHRAGAAN"
      divisionLabel="Keolahragaan"
      description="Mengelola kegiatan olahraga rutin, turnamen persahabatan antar-asrama, pelatihan fisik, serta menjaga kesehatan jasmani warga."
      themeColor="amber"
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

