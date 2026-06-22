import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import KeuanganClient from './KeuanganClient';

export default async function KeuanganPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Permission checks
  const hasFinanceAccess = await canFromSession('finance:read');
  if (!hasFinanceAccess) {
    redirect('/user');
  }

  const canCreateTx = await canFromSession('finance:transaction:create');
  const canDeleteTx = await canFromSession('finance:transaction:delete');
  const canUpdateBill = await canFromSession('bill:update');

  // Fetch transactions
  const transactions = await db.transaction.findMany({
    orderBy: {
      occurredAt: 'desc',
    },
  });

  // Fetch bills with associated user info
  const bills = await db.bill.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all active citizens for creating new bills
  const users = await db.user.findMany({
    where: {
      status: 'AKTIF',
    },
    select: {
      id: true,
      fullName: true,
      username: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  // --------- Compute aggregates for charts & stats ---------
const now = new Date();

// ----- previous month totals -----
const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

const prevPemasukanQuery = await db.transaction.aggregate({
  where: {
    type: 'PEMASUKAN',
    occurredAt: {
      gte: prevMonthStart,
      lte: prevMonthEnd,
    },
  },
  _sum: {
    amount: true,
  },
});

const prevPengeluaranQuery = await db.transaction.aggregate({
  where: {
    type: 'PENGELUARAN',
    occurredAt: {
      gte: prevMonthStart,
      lte: prevMonthEnd,
    },
  },
  _sum: {
    amount: true,
  },
});

const previousMonthTotals = {
  pemasukan: prevPemasukanQuery._sum.amount || 0,
  pengeluaran: prevPengeluaranQuery._sum.amount || 0,
};

// ----- monthly aggregates (last 12 months) -----
const monthlyAggregates = Array.from({ length: 12 }).map((_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
  const month = d.toLocaleString('id-ID', { month: 'short' });
  const year = d.getFullYear();
  return { month, year, pemasukan: 0, pengeluaran: 0 };
});
transactions.forEach((tx) => {
  const txDate = new Date(tx.occurredAt);
  const month = txDate.toLocaleString('id-ID', { month: 'short' });
  const year = txDate.getFullYear();
  const agg = monthlyAggregates.find((m) => m.month === month && m.year === year);
  if (agg) {
    if (tx.type === 'PEMASUKAN') agg.pemasukan += tx.amount;
    else agg.pengeluaran += tx.amount;
  }
});

// ----- monthly aggregation query (last 12 months) -----
const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const recentTransactions = await db.transaction.findMany({
  where: {
    occurredAt: {
      gte: twelveMonthsAgo,
    },
  },
  orderBy: {
    occurredAt: 'asc',
  },
});

const monthlyData = Array.from({ length: 12 }).map((_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
  const monthName = d.toLocaleString('id-ID', { month: 'short' });
  const year = d.getFullYear();
  return { month: monthName, year, pemasukan: 0, pengeluaran: 0 };
});

recentTransactions.forEach((tx) => {
  const txDate = new Date(tx.occurredAt);
  const monthName = txDate.toLocaleString('id-ID', { month: 'short' });
  const year = txDate.getFullYear();
  const agg = monthlyData.find((m) => m.month === monthName && m.year === year);
  if (agg) {
    if (tx.type === 'PEMASUKAN') agg.pemasukan += tx.amount;
    else agg.pengeluaran += tx.amount;
  }
});

// ----- category breakdown -----
const categoryMap = new Map();
transactions.forEach((tx) => {
  const cat = tx.category ?? 'Uncategorized';
  const key = `${cat}|${tx.type}`;
  const existing = categoryMap.get(key) ?? { category: cat, amount: 0, type: tx.type };
  existing.amount += tx.amount;
  categoryMap.set(key, existing);
});
const categoryBreakdown = Array.from(categoryMap.values());

// ----- aging data for bills -----
const agingBuckets = [
  { label: 'Belum Jatuh Tempo', count: 0, amount: 0 },
  { label: '1-30 hari', count: 0, amount: 0 },
  { label: '31-60 hari', count: 0, amount: 0 },
  { label: '61-90 hari', count: 0, amount: 0 },
  { label: '> 90 hari', count: 0, amount: 0 },
];

bills.forEach((b) => {
  if (b.status !== 'BELUM_LUNAS') return;
  if (!b.dueDate) {
    agingBuckets[0].count++;
    agingBuckets[0].amount += b.amount;
    return;
  }
  const due = new Date(b.dueDate);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    agingBuckets[0].count++;
    agingBuckets[0].amount += b.amount;
  } else {
    const overdue = -diffDays;
    if (overdue <= 30) {
      agingBuckets[1].count++;
      agingBuckets[1].amount += b.amount;
    } else if (overdue <= 60) {
      agingBuckets[2].count++;
      agingBuckets[2].amount += b.amount;
    } else if (overdue <= 90) {
      agingBuckets[3].count++;
      agingBuckets[3].amount += b.amount;
    } else {
      agingBuckets[4].count++;
      agingBuckets[4].amount += b.amount;
    }
  }
});
const agingData = agingBuckets;

return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Keuangan Asrama
        </h1>
        <p className="text-muted-foreground">
          Kelola arus kas masuk/keluar, denda piket, iuran wajib bulanan, dan laporan keuangan asrama.
        </p>
      </div>

      <KeuanganClient
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount: t.amount,
          description: t.description,
          occurredAt: t.occurredAt.toISOString(),
        }))}
        bills={bills.map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          amount: b.amount,
          status: b.status,
          dueDate: b.dueDate ? b.dueDate.toISOString() : null,
          note: b.note,
          createdAt: b.createdAt.toISOString(),
          user: b.user,
        }))}
        users={users}
        permissions={{
          canCreateTx,
          canDeleteTx,
          canUpdateBill,
        }}
        monthlyAggregates={monthlyAggregates}
        categoryBreakdown={categoryBreakdown}
        agingData={agingData}
        previousMonthTotals={previousMonthTotals}
        monthlyData={monthlyData}
      />
    </div>
  );
}

