import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import SportsManager from '../SportsManager';

export default async function KeolahragaanKelolaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('division:manage:keolahragaan', 'KEOLAHRAGAAN');
  if (!allowed) {
    redirect('/admin/keolahragaan');
  }

  // Query Warga
  const wargaList = await db.user.findMany({
    where: { 
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
    },
    orderBy: { fullName: 'asc' },
  });

  // Query Sports Activities
  const activities = await db.sportsActivity.findMany({
    include: {
      attendance: {
        select: {
          userId: true,
          status: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Query Sports Transactions
  const transactions = await db.transaction.findMany({
    where: {
      division: 'KEOLAHRAGAAN',
    },
    orderBy: {
      occurredAt: 'desc',
    },
  });

  // Query Sports Denda Bills
  const dendaList = await db.bill.findMany({
    where: {
      type: 'DENDA_OLAHRAGA',
    },
    include: {
      user: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <SportsManager
      wargaList={wargaList}
      activities={activities.map((a) => ({
        ...a,
        attendance: a.attendance.map((att) => ({
          userId: att.userId,
          status: att.status as any,
        })),
      }))}
      transactions={transactions}
      dendaList={dendaList.map((d) => ({
        id: d.id,
        title: d.title,
        amount: d.amount,
        status: d.status,
        createdAt: d.createdAt,
        note: d.note,
        user: d.user,
      }))}
      isAdmin={true}
      isKelolaMode={true}
    />
  );
}
