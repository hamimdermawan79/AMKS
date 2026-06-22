import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import KebersihanUserView from './KebersihanUserView';

export default async function KebersihanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:kebersihan', 'KEBERSIHAN');

  const period = await db.piketPeriod.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      assignments: {
        include: {
          user: { select: { id: true, fullName: true } },
          attendance: { select: { id: true, status: true } },
        },
        orderBy: [{ date: 'asc' }, { sector: 'asc' }],
      },
      kerjaBaktiDates: { orderBy: { date: 'asc' } },
    },
  });

  const announcements = await db.announcement.findMany({
    where: { division: 'KEBERSIHAN' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 10,
    select: { id: true, title: true, body: true, pinned: true, createdAt: true },
  });

  const myId = session.user.id;

  // Build vertical calendar: group assignments by date
  const dateMap = new Map<string, { sector: number; assignmentId: string; userId: string; fullName: string; isMe: boolean; present: boolean }[]>();
  for (const a of period?.assignments ?? []) {
    const key = a.date.toISOString().slice(0, 10);
    const list = dateMap.get(key) ?? [];
    list.push({
      sector: a.sector,
      assignmentId: a.id,
      userId: a.userId,
      fullName: a.user.fullName,
      isMe: a.userId === myId,
      present: a.attendance?.status === 'HADIR',
    });
    dateMap.set(key, list);
  }

  const scheduledDates = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sectors]) => ({ date, sectors }));

  const sectorCount = period?.peoplePerDay ?? 0;
  const sectorLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Next piket + next kerja bakti
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const myUpcoming = (period?.assignments ?? [])
    .filter((a) => a.userId === myId && a.date >= today)
    .sort((x, y) => x.date.getTime() - y.date.getTime());
  const myNextPiket = myUpcoming[0]
    ? {
        date: myUpcoming[0].date.toISOString(),
        sector: myUpcoming[0].sector,
        assignmentId: myUpcoming[0].id,
        present: myUpcoming[0].attendance?.status === 'HADIR',
      }
    : null;

  const nextKerjaBakti = (period?.kerjaBaktiDates ?? [])
    .filter((k) => k.date >= today)
    .sort((x, y) => x.date.getTime() - y.date.getTime())[0];

  // All kerja bakti dates in the period (for the schedule grid)
  const kerjaBaktiDates = (period?.kerjaBaktiDates ?? [])
    .map((k) => k.date.toISOString().slice(0, 10))
    .sort();

  // My assignments needing presensi
  const myAssignments = (period?.assignments ?? [])
    .filter((a) => a.userId === myId)
    .map((a) => ({
      assignmentId: a.id,
      date: a.date.toISOString(),
      sector: a.sector,
      present: a.attendance?.status === 'HADIR',
    }));

  return (
    <KebersihanUserView
      canManage={canManage}
      hasPeriod={!!period}
      sectorCount={sectorCount}
      sectorLabels={sectorLabels}
      finePerDay={period?.finePerDay ?? 0}
      scheduledDates={scheduledDates}
      kerjaBaktiDates={kerjaBaktiDates}
      announcements={announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      myNextPiket={myNextPiket}
      nextKerjaBakti={nextKerjaBakti ? nextKerjaBakti.date.toISOString() : null}
      myAssignments={myAssignments}
    />
  );
}
