import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import KebersihanAdminClient from './KebersihanAdminClient';

export default async function KebersihanKelolaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Scope guard: SuperAdmin / Ketua (global) or Ketua Divisi Kebersihan (scoped)
  const allowed = await canFromSession('division:manage:kebersihan', 'KEBERSIHAN');
  if (!allowed) {
    redirect('/admin/kebersihan');
  }

  // Fetch users for Piket assignment (active only, excluding SUPERADMIN)
  const warga = await db.user.findMany({
    where: { 
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } },
    },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: 'asc' },
  });

  // Current active period summary with assignments
  const activePeriod = await db.piketPeriod.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { assignments: true, kerjaBaktiDates: true } },
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

  // Build schedule table data for active period
  let scheduleData: { date: string; sectors: { sector: number; fullName: string }[] }[] = [];
  if (activePeriod) {
    const map = new Map<string, { sector: number; fullName: string }[]>();
    for (const a of activePeriod.assignments) {
      const key = a.date.toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push({ sector: a.sector, fullName: a.user.fullName });
      map.set(key, list);
    }
    scheduleData = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sectors]) => ({ date, sectors }));
  }

  // Existing pemberitahuan
  const announcements = await db.announcement.findMany({
    where: { division: 'KEBERSIHAN' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, body: true, pinned: true, createdAt: true },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <KebersihanAdminClient
      warga={warga}
      activePeriod={
        activePeriod
          ? {
              id: activePeriod.id,
              startDate: activePeriod.startDate.toISOString(),
              endDate: activePeriod.endDate.toISOString(),
              peoplePerDay: activePeriod.peoplePerDay,
              finePerDay: activePeriod.finePerDay,
              assignmentCount: activePeriod._count.assignments,
              kerjaBaktiCount: activePeriod._count.kerjaBaktiDates,
            }
          : null
      }
      announcements={announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      scheduleData={scheduleData}
      sectorCount={activePeriod?.peoplePerDay ?? 0}
    />
    </div>
  );
}
