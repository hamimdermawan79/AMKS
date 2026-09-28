import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import { Division } from '@prisma/client';
import KeamananAdminClient from './KeamananAdminClient';
import { getCctvStatus } from '../security-actions';

export default async function KeamananKelolaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const divisionKey = 'KEAMANAN' as Division;

  const [canManageKeamanan, canManageDuty, canInputGuest] = await Promise.all([
    canFromSession('division:manage:keamanan', divisionKey),
    canFromSession('security:duty:manage'),
    canFromSession('guest:book:write'),
  ]);

  const allowed = canManageKeamanan || canManageDuty || canInputGuest;
  if (!allowed) {
    redirect('/admin/keamanan');
  }

  // Fetch all required data in parallel
  const [cctvStatus, announcements, activities, securityPeriods, guestEntries, allUsers] = await Promise.all([
    getCctvStatus(),

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

    // Security duty periods
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

    // Active users excluding SUPERADMIN
    db.user.findMany({
      where: {
        status: 'AKTIF',
        roles: { none: { role: { name: 'SUPERADMIN' } } },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto py-2">
      <KeamananAdminClient
        currentUserId={session.user.id}
        cctvStatus={cctvStatus}
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          pinned: a.pinned,
          createdAt: a.createdAt.toISOString(),
        }))}
        activities={activities.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          location: a.location,
          startAt: a.startAt ? a.startAt.toISOString() : null,
          endAt: a.endAt ? a.endAt.toISOString() : null,
        }))}
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
