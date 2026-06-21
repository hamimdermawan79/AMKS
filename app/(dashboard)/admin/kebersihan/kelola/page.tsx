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

  // Active warga for the participant picker
  const warga = await db.user.findMany({
    where: { status: 'AKTIF' },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: 'asc' },
  });

  // Current active period summary
  const activePeriod = await db.piketPeriod.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { assignments: true, kerjaBaktiDates: true } },
    },
  });

  // Existing pemberitahuan
  const announcements = await db.announcement.findMany({
    where: { division: 'KEBERSIHAN' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, body: true, pinned: true, createdAt: true },
  });

  return (
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
    />
  );
}
