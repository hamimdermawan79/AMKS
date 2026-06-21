import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession, isSuperAdmin } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import KebersihanUserView from './KebersihanUserView';

export default async function KebersihanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // SuperAdmin → pure admin tools view (no read-only user page)
  const isSuper = await isSuperAdmin({
    id: session.user.id,
    username: session.user.username,
  });
  if (isSuper) {
    redirect('/admin/kebersihan/kelola');
  }

  // Ketua / Ketua Divisi Kebersihan get the "Akses Layanan Admin" button
  const canManage = await canFromSession('division:manage:kebersihan', 'KEBERSIHAN');

  // Active piket period with assignments + kerja bakti dates
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

  // Division announcements (pemberitahuan)
  const announcements = await db.announcement.findMany({
    where: { division: 'KEBERSIHAN' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 10,
    select: { id: true, title: true, body: true, pinned: true, createdAt: true },
  });

  const myId = session.user.id;

  // Build schedule grid: unique sorted dates (columns) x sectors (rows)
  const dateKeys: string[] = [];
  const seen = new Set<string>();
  for (const a of period?.assignments ?? []) {
    const key = a.date.toISOString().slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      dateKeys.push(key);
    }
  }

  const sectorCount = period?.peoplePerDay ?? 0;

  // cell lookup: `${dateKey}|${sector}` -> assignment summary
  const cells: Record<
    string,
    {
      assignmentId: string;
      userId: string;
      fullName: string;
      isMe: boolean;
      present: boolean;
    }
  > = {};
  for (const a of period?.assignments ?? []) {
    const key = `${a.date.toISOString().slice(0, 10)}|${a.sector}`;
    cells[key] = {
      assignmentId: a.id,
      userId: a.userId,
      fullName: a.user.fullName,
      isMe: a.userId === myId,
      present: a.attendance?.status === 'HADIR',
    };
  }

  // Event terdekat: my next piket + next kerja bakti (>= today)
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

  // My assignments needing presensi (own + no attendance yet)
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
      dateKeys={dateKeys}
      cells={cells}
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
