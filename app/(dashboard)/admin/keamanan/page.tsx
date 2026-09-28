import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import { Division } from '@prisma/client';
import KeamananManager from './KeamananManager';
import { getCctvStatus } from './security-actions';

export default async function KeamananPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const divisionKey = 'KEAMANAN' as Division;

  const [canManageKeamanan, canManageDuty, canViewCctv, canInputGuest] = await Promise.all([
    canFromSession('division:manage:keamanan', divisionKey),
    canFromSession('security:duty:manage'),
    canFromSession('cctv:view'),
    canFromSession('guest:book:write'),
  ]);
  const canManage = canManageKeamanan || canManageDuty;

  const [announcements, activities, securityPeriods, guestEntries, allUsers] = await Promise.all([
    // Keamanan announcements
    db.announcement.findMany({
      where: { division: divisionKey },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    }),

    // Keamanan activities
    db.activity.findMany({
      where: { division: divisionKey },
      orderBy: { createdAt: 'desc' },
    }),

    // Security duty periods (all generated periods)
    db.securityDutyPeriod.findMany({
      include: {
        assignments: {
          include: {
            user: { select: { id: true, fullName: true } },
            attendance: true,
          },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),

    // Guest book entries
    db.guestBook.findMany({
      include: {
        createdBy: { select: { id: true, fullName: true } },
        knownBy: { select: { id: true, fullName: true } },
      },
      orderBy: { entryTime: 'desc' },
    }),

    // All active users for assignment selects (exclude SUPERADMIN)
    db.user.findMany({
      where: {
        status: 'AKTIF',
        roles: { none: { role: { name: 'SUPERADMIN' } } },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  // Fetch CCTV status (with auto-deactivation logic)
  const cctvStatus = await getCctvStatus();

  return (
    <div className="max-w-6xl mx-auto">
      <KeamananManager
        activities={activities.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          location: a.location,
          startAt: a.startAt ? a.startAt.toISOString() : null,
        }))}
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          createdAt: a.createdAt.toISOString(),
        }))}
        canManage={canManage}
        canViewCctv={canViewCctv}
        canInputGuest={canInputGuest}
        currentUserId={session.user.id}
        cctvStatus={cctvStatus}
        securityPeriods={securityPeriods.map((p) => ({
          id: p.id,
          month: p.month,
          year: p.year,
          startDate: p.startDate ? p.startDate.toISOString() : null,
          endDate: p.endDate ? p.endDate.toISOString() : null,
          isActive: p.isActive,
          assignments: p.assignments.map((a) => ({
            id: a.id,
            date: a.date.toISOString(),
            userId: a.userId,
            user: { id: a.user.id, fullName: a.user.fullName },
            attendance: a.attendance
              ? {
                  id: a.attendance.id,
                  status: a.attendance.status,
                  doorsLocked: a.attendance.doorsLocked,
                  garagesClosed: a.attendance.garagesClosed,
                  bikesSecured: a.attendance.bikesSecured,
                  note: a.attendance.note,
                  markedAt: a.attendance.markedAt.toISOString(),
                }
              : null,
          })),
        }))}
        guestEntries={guestEntries.map((g) => ({
          id: g.id,
          visitorName: g.visitorName,
          originCity: g.originCity,
          institution: g.institution,
          purpose: g.purpose,
          knownById: g.knownById,
          knownByOther: g.knownByOther,
          entryTime: g.entryTime.toISOString(),
          exitTime: g.exitTime ? g.exitTime.toISOString() : null,
          isStaying: g.isStaying,
          stayDuration: g.stayDuration,
          note: g.note,
          month: g.month,
          year: g.year,
          createdBy: g.createdBy ? { id: g.createdBy.id, fullName: g.createdBy.fullName } : null,
          knownBy: g.knownBy ? { id: g.knownBy.id, fullName: g.knownBy.fullName } : null,
        }))}
        allUsers={allUsers}
      />
    </div>
  );
}
