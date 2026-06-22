import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import LaporanClient from './LaporanClient';

/* ─── WIB date helpers (server) ─── */
function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function wibNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}
function wibTodayKey(): string {
  const w = wibNow();
  return `${w.getFullYear()}-${pad2(w.getMonth() + 1)}-${pad2(w.getDate())}`;
}

type DayStatus = 'piket' | 'tidakPiket' | 'pending';

/** Finalized status for a piket day (mirrors the user-view 01:00–11:00 WIB rule). */
function dayStatus(dateKey: string, present: boolean): DayStatus {
  if (present) return 'piket';
  const today = wibTodayKey();
  if (dateKey < today) return 'tidakPiket';
  if (dateKey > today) return 'pending';
  // same WIB day: window closes at 11:00
  return wibNow().getHours() >= 11 ? 'tidakPiket' : 'pending';
}

const SECTOR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const allowed = await canFromSession('division:manage:kebersihan', 'KEBERSIHAN');
  if (!allowed) redirect('/admin/kebersihan');

  const sp = await searchParams;

  // ── All periods (selector) ──
  const periods = await db.piketPeriod.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, startDate: true, endDate: true, isActive: true, finePerDay: true },
  });

  const selectedId =
    sp.period && periods.some((p) => p.id === sp.period)
      ? sp.period
      : periods.find((p) => p.isActive)?.id ?? periods[0]?.id ?? null;

  // ── Selected period detail ──
  const selected = selectedId
    ? await db.piketPeriod.findUnique({
        where: { id: selectedId },
        include: {
          assignments: {
            include: {
              user: { select: { id: true, fullName: true } },
              attendance: {
                select: { status: true, photoUrl: true, complaint: true, markedAt: true },
              },
            },
            orderBy: [{ date: 'asc' }, { sector: 'asc' }],
          },
          kerjaBaktiDates: { select: { date: true }, orderBy: { date: 'asc' } },
        },
      })
    : null;

  // ── Superadmins are excluded from per-person stats ──
  const superadmins = await db.user.findMany({
    where: { roles: { some: { role: { name: 'SUPERADMIN' } } } },
    select: { id: true },
  });
  const superadminIds = new Set(superadmins.map((s) => s.id));

  const finePerDay = selected?.finePerDay ?? 0;
  const kbSet = new Set(
    (selected?.kerjaBaktiDates ?? []).map((k) => k.date.toISOString().slice(0, 10))
  );

  // ── Per-day report ──
  type DaySector = {
    sector: number;
    sectorLabel: string;
    userId: string;
    fullName: string;
    status: DayStatus;
    complaint: string | null;
    photoUrl: string | null;
  };
  const dayMap = new Map<string, DaySector[]>();
  for (const a of selected?.assignments ?? []) {
    const key = a.date.toISOString().slice(0, 10);
    const present = a.attendance?.status === 'HADIR';
    const list = dayMap.get(key) ?? [];
    list.push({
      sector: a.sector,
      sectorLabel: SECTOR_LABELS[a.sector] ?? String(a.sector + 1),
      userId: a.userId,
      fullName: a.user.fullName,
      status: dayStatus(key, present),
      complaint: a.attendance?.complaint ?? null,
      photoUrl: a.attendance?.photoUrl ?? null,
    });
    dayMap.set(key, list);
  }
  const dayReport = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sectors]) => ({
      date,
      isKerjaBakti: kbSet.has(date),
      sectors: sectors.sort((x, y) => x.sector - y.sector),
    }));

  // ── Per-person stats (within selected period, excluding superadmin) ──
  const personMap = new Map<
    string,
    { fullName: string; piket: number; tidakPiket: number; pending: number }
  >();
  for (const a of selected?.assignments ?? []) {
    if (superadminIds.has(a.userId)) continue;
    const present = a.attendance?.status === 'HADIR';
    const st = dayStatus(a.date.toISOString().slice(0, 10), present);
    const cur =
      personMap.get(a.userId) ?? { fullName: a.user.fullName, piket: 0, tidakPiket: 0, pending: 0 };
    if (st === 'piket') cur.piket++;
    else if (st === 'tidakPiket') cur.tidakPiket++;
    else cur.pending++;
    personMap.set(a.userId, cur);
  }
  const personStats = Array.from(personMap.entries())
    .map(([userId, v]) => ({
      userId,
      fullName: v.fullName,
      piket: v.piket,
      tidakPiket: v.tidakPiket,
      pending: v.pending,
      estimasiDenda: v.tidakPiket * finePerDay,
    }))
    .sort((a, b) => b.tidakPiket - a.tidakPiket || a.fullName.localeCompare(b.fullName));

  // ── All-time denda (Fines persist across schedule regen) ──
  const fines = await db.fine.findMany({
    include: {
      user: { select: { id: true, fullName: true } },
      period: { select: { startDate: true, endDate: true } },
      payments: {
        select: { id: true, amount: true, note: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      },
      bill: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  type FineDetail = {
    fineId: string;
    periodStart: string;
    periodEnd: string;
    daysMissed: number;
    amount: number;
    paid: number;
    remaining: number;
    payments: { id: string; amount: number; note: string | null; paidAt: string }[];
  };
  const userDendaMap = new Map<
    string,
    { fullName: string; totalFined: number; totalPaid: number; fines: FineDetail[] }
  >();
  let totalFinedAllTime = 0;
  let totalPaidAllTime = 0;

  for (const f of fines) {
    const paid = f.payments.reduce((s, p) => s + p.amount, 0);
    totalFinedAllTime += f.amount;
    totalPaidAllTime += paid;
    const cur =
      userDendaMap.get(f.userId) ??
      { fullName: f.user.fullName, totalFined: 0, totalPaid: 0, fines: [] as FineDetail[] };
    cur.totalFined += f.amount;
    cur.totalPaid += paid;
    cur.fines.push({
      fineId: f.id,
      periodStart: f.period.startDate.toISOString(),
      periodEnd: f.period.endDate.toISOString(),
      daysMissed: f.daysMissed,
      amount: f.amount,
      paid,
      remaining: f.amount - paid,
      payments: f.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        note: p.note,
        paidAt: p.paidAt.toISOString(),
      })),
    });
    userDendaMap.set(f.userId, cur);
  }

  const dendaAllTime = Array.from(userDendaMap.entries())
    .map(([userId, v]) => ({
      userId,
      fullName: v.fullName,
      totalFined: v.totalFined,
      totalPaid: v.totalPaid,
      remaining: v.totalFined - v.totalPaid,
      fines: v.fines,
    }))
    .sort((a, b) => b.remaining - a.remaining || a.fullName.localeCompare(b.fullName));

  return (
    <LaporanClient
      periods={periods.map((p) => ({
        id: p.id,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        isActive: p.isActive,
        finePerDay: p.finePerDay,
      }))}
      selectedPeriod={
        selected
          ? {
              id: selected.id,
              startDate: selected.startDate.toISOString(),
              endDate: selected.endDate.toISOString(),
              isActive: selected.isActive,
              finePerDay: selected.finePerDay,
              peoplePerDay: selected.peoplePerDay,
            }
          : null
      }
      dayReport={dayReport}
      personStats={personStats}
      dendaAllTime={dendaAllTime}
      totals={{
        totalFinedAllTime,
        totalPaidAllTime,
        totalUnpaidAllTime: totalFinedAllTime - totalPaidAllTime,
      }}
    />
  );
}
