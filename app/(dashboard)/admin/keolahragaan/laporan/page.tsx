import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import SportsLaporanClient from './SportsLaporanClient';

export const metadata: Metadata = {
  title: 'Laporan Bulanan Keolahragaan | AMKS',
  robots: { index: false, follow: false },
};

function getWIBDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

export default async function KeolahragaanLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Strict Admin access check: only authorized Keolahragaan admins can access
  const allowed = await canFromSession('division:manage:keolahragaan', 'KEOLAHRAGAAN');
  if (!allowed) {
    redirect('/admin/keolahragaan');
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

  // 1. Query activities for the selected month
  const rawActivities = await db.sportsActivity.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      attendance: {
        include: {
          user: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // 2. Query transactions for the selected month
  const rawTransactions = await db.transaction.findMany({
    where: {
      division: 'KEOLAHRAGAAN',
      occurredAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: {
      occurredAt: 'asc',
    },
  });

  // 3. Query all-time transactions to get the ending balance
  const allTxs = await db.transaction.findMany({
    where: { division: 'KEOLAHRAGAAN' },
    select: { type: true, amount: true, occurredAt: true },
  });

  let cumulativeBalanceUntilMonth = 0;
  let totalBalanceOverall = 0;

  allTxs.forEach((t) => {
    const val = t.type === 'PEMASUKAN' ? t.amount : -t.amount;
    totalBalanceOverall += val;
    if (t.occurredAt <= endOfMonth) {
      cumulativeBalanceUntilMonth += val;
    }
  });

  // Serialize dates for client component
  const activities = rawActivities.map((a) => ({
    ...a,
    date: a.date.toISOString(),
    endDate: a.endDate ? a.endDate.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const transactions = rawTransactions.map((t) => ({
    ...t,
    occurredAt: t.occurredAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto py-2">
      <SportsLaporanClient
        activities={activities}
        transactions={transactions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        endingMonthBalance={cumulativeBalanceUntilMonth}
        totalBalanceOverall={totalBalanceOverall}
      />
    </div>
  );
}
