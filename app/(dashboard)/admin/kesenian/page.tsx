import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import DivisionClient from '../division-shared/DivisionClient';

export default async function KesenianPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:kesenian', 'KESENIAN');

  const announcements = await db.announcement.findMany({
    where: { division: 'KESENIAN' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const activities = await db.activity.findMany({
    where: { division: 'KESENIAN' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <DivisionClient
      division="KESENIAN"
      divisionLabel="Kesenian"
      description="Mengembangkan minat, bakat, dan kreativitas warga asrama di bidang seni musik, rupa, tari, sastra, serta mengelola pertunjukan budaya berkala."
      themeColor="purple"
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

