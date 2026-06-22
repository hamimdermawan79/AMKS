import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import RohaniManager from '../RohaniManager';

export default async function RohaniKelolaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('division:manage:rohani', 'ROHANI');
  if (!allowed) {
    redirect('/admin/rohani');
  }

  // Query schedules
  const schedules = await db.rohaniSchedule.findMany({
    include: {
      imamMaghrib: { select: { id: true, fullName: true } },
      imamIsha: { select: { id: true, fullName: true } },
      kultumBy: { select: { id: true, fullName: true } },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Query active users for queue status
  const activeUsers = await db.user.findMany({
    where: { status: 'AKTIF' },
    select: {
      id: true,
      fullName: true,
    },
  });

  // Map each user to their latest rohani duties
  const queuesData = await Promise.all(
    activeUsers.map(async (user) => {
      const lastMaghrib = await db.rohaniSchedule.findFirst({
        where: { imamMaghribId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      const lastIsha = await db.rohaniSchedule.findFirst({
        where: { imamIshaId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      const lastKultum = await db.rohaniSchedule.findFirst({
        where: { kultumById: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      const lastMaghribTime = lastMaghrib?.date ? lastMaghrib.date.getTime() : 0;
      const lastIshaTime = lastIsha?.date ? lastIsha.date.getTime() : 0;
      const lastKultumTime = lastKultum?.date ? lastKultum.date.getTime() : 0;

      // Combined metric: minimum timestamp is who has the oldest duty in general
      const oldestDutyTime = Math.min(lastMaghribTime, lastIshaTime, lastKultumTime);

      return {
        id: user.id,
        fullName: user.fullName,
        lastMaghribTime,
        lastIshaTime,
        lastKultumTime,
        oldestDutyTime,
      };
    })
  );

  // Sort queue by oldest duty time ascending
  const sortedQueues = queuesData.sort((a, b) => a.oldestDutyTime - b.oldestDutyTime);

  return (
    <RohaniManager
      schedules={schedules}
      queues={sortedQueues.map(({ oldestDutyTime, ...rest }) => rest)}
      isAdmin={true}
      isKelolaMode={true}
      currentUserId={session.user.id}
    />
  );
}
