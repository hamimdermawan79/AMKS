import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import RohaniLaporanClient from './RohaniLaporanClient';

export const metadata: Metadata = {
  title: 'Laporan Bulanan Rohani | AMKS',
  robots: { index: false, follow: false },
};

function getWIBDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

export default async function RohaniLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('division:manage:rohani', 'ROHANI');
  if (!allowed) {
    redirect('/admin/rohani');
  }

  const sp = await searchParams;
  const now = getWIBDate();

  const parsedMonth = parseInt(sp.month || '', 10);
  const parsedYear = parseInt(sp.year || '', 10);

  const selectedMonth = !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : now.getMonth() + 1;

  const selectedYear = !isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2040
    ? parsedYear
    : now.getFullYear();

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  // Query schedules in the selected month
  const rawSchedules = await db.rohaniSchedule.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      imamMaghrib: { select: { id: true, fullName: true } },
      imamIsha: { select: { id: true, fullName: true } },
      kultumBy: { select: { id: true, fullName: true } },
      cadanganImam: { select: { id: true, fullName: true } },
      cadanganKultum: { select: { id: true, fullName: true } },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Query active users for adding/editing entries
  const activeUsers = await db.user.findMany({
    where: {
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } },
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  // Serialize date to ISO string for client component
  const schedules = rawSchedules.map((s) => ({
    ...s,
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto py-2">
      <RohaniLaporanClient
        schedules={schedules}
        activeUsers={activeUsers}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
}
