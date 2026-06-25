import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/rbac/can';
import Link from 'next/link';
import UserDashboard from './user-dashboard';

const DIVISION_SLUGS: Record<string, string> = {
  KEBERSIHAN: 'kebersihan',
  KESENIAN: 'kesenian',
  KEOLAHRAGAAN: 'keolahragaan',
  ROHANI: 'rohani',
};

export default async function DashboardPage() {
  const session = await auth();

  // Fetch user roles + division scope (for Ketua Divisi)
  const userWithRoles = await db.user.findUnique({
    where: { id: session?.user.id },
    select: {
      divisionScope: true,
      roles: {
        select: {
          role: { select: { name: true } },
        },
      },
    },
  });

  const roleNames = userWithRoles?.roles.map((r) => r.role.name) ?? [];
  const isSuperAdmin = roleNames.includes('SUPERADMIN');
  const isKetua = roleNames.includes('KETUA');
  const isDivisionHead = roleNames.includes('DIVISION_HEAD');
  const divisionSlug =
    userWithRoles?.divisionScope && DIVISION_SLUGS[userWithRoles.divisionScope]
      ? DIVISION_SLUGS[userWithRoles.divisionScope]
      : null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Fetch upcoming activities
  const [
    myUpcomingPiket,
    upcomingKerjaBakti,
    upcomingSports,
    upcomingGeneralActivity,
    myUpcomingRohani,
    pendingBills,
  ] = await Promise.all([
    db.piketAssignment.findFirst({
      where: { 
        userId: session?.user.id, 
        date: { gte: now },
        period: { isActive: true }
      },
      orderBy: { date: 'asc' },
    }),
    db.piketKerjaBakti.findFirst({
      where: { 
        date: { gte: now },
        period: { isActive: true }
      },
      orderBy: { date: 'asc' },
    }),
    db.sportsActivity.findFirst({
      where: { date: { gte: now } },
      orderBy: { date: 'asc' },
    }),
    db.activity.findFirst({
      where: { startAt: { gte: now } },
      orderBy: { startAt: 'asc' },
    }),
    db.rohaniSchedule.findFirst({
      where: { date: { gte: now } },
      orderBy: { date: 'asc' },
    }),
    db.bill.findMany({
      where: { userId: session?.user.id, status: 'BELUM_LUNAS' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  let rohaniMessage = null;
  if (myUpcomingRohani && session?.user.id) {
    if (myUpcomingRohani.imamMaghribId === session.user.id) rohaniMessage = "Anda Bertugas Sebagai Imam Maghrib";
    else if (myUpcomingRohani.imamIshaId === session.user.id) rohaniMessage = "Anda Bertugas Sebagai Imam Isya";
    else if (myUpcomingRohani.kultumById === session.user.id) rohaniMessage = "Anda Berkesempatan Mengisi Kultum";
  }

  const dashboardProps = {
    session,
    myUpcomingPiket: myUpcomingPiket ? { date: myUpcomingPiket.date.toISOString(), sector: myUpcomingPiket.sector } : null,
    upcomingKerjaBakti: upcomingKerjaBakti ? upcomingKerjaBakti.date.toISOString() : null,
    upcomingSports: upcomingSports ? { id: upcomingSports.id, title: upcomingSports.title, date: upcomingSports.date.toISOString() } : null,
    upcomingGeneralActivity: upcomingGeneralActivity ? { id: upcomingGeneralActivity.id, title: upcomingGeneralActivity.title, date: upcomingGeneralActivity.startAt?.toISOString() || null, division: upcomingGeneralActivity.division } : null,
    myUpcomingRohani: myUpcomingRohani ? { date: myUpcomingRohani.date.toISOString(), message: rohaniMessage } : null,
    pendingBills: pendingBills.map(b => ({ id: b.id, title: b.title, amount: b.amount, type: b.type, dueDate: b.dueDate ? b.dueDate.toISOString() : null })),
  };

  // SuperAdmin → full admin system overview
  if (isSuperAdmin) {
    return <AdminDashboard session={session} />;
  }

  // Ketua → user view + global admin access button (full access)
  if (isKetua) {
    return <UserDashboard {...dashboardProps} showAdminButton={true} />;
  }

  // Ketua Divisi → user view + a button linking to their own division admin panel
  if (isDivisionHead && divisionSlug) {
    return (
      <UserDashboard
        {...dashboardProps}
        showAdminButton={false}
        divisionManageHref={`/admin/${divisionSlug}/kelola`}
      />
    );
  }

  // Everyone else — Warga, Sekretaris, Bendahara — plain user dashboard.
  return <UserDashboard {...dashboardProps} showAdminButton={false} />;
}

import { Users, Activity, GraduationCap, FileWarning, Settings, UsersRound, Wallet, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';

// ==================== ADMIN DASHBOARD ====================
async function AdminDashboard({ session }: { session: any }) {
  // System stats
  const [totalUsers, activeUsers, alumniUsers, roleCounts] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'AKTIF' } }),
    db.user.count({ where: { status: 'ALUMNI' } }),
    db.role.findMany({
      include: { users: true },
    }),
  ]);

  // Recent registered users
  const recentUsers = await db.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, fullName: true, status: true, createdAt: true },
  });

  // Active piket periods
  const activePiketPeriods = await db.piketPeriod.count({
    where: { isActive: true },
  });

  // Total bills outstanding
  const outstandingBills = await db.bill.count({
    where: { status: 'BELUM_LUNAS' },
  });

  const isSuper = await isSuperAdmin({
    id: session.user.id,
    username: session.user.username,
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Administrator Panel</h1>
          <p className="text-slate-500">
            Selamat datang kembali, <span className="font-semibold text-slate-700">{session.user.fullName}</span>. Berikut adalah ringkasan sistem hari ini.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
          <ShieldCheck className="text-blue-500 h-8 w-8" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Akses Hak</p>
            <p className="text-sm font-bold text-slate-700">Super Administrator</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Pengguna" value={totalUsers} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatBox label="Warga Aktif" value={activeUsers} icon={<Activity className="h-5 w-5" />} color="green" />
        <StatBox label="Alumni" value={alumniUsers} icon={<GraduationCap className="h-5 w-5" />} color="amber" />
        <StatBox label="Tagihan Tertunggak" value={outstandingBills} icon={<FileWarning className="h-5 w-5" />} color="rose" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Akses Cepat (Modul Utama)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard 
            href="/admin/warga" 
            title="Kelola Warga" 
            desc="Tambah, edit, hapus data warga asrama" 
            icon={<UsersRound className="h-6 w-6 text-indigo-500" />} 
          />
          {isSuper && (
            <ActionCard 
              href="/admin/pengaturan" 
              title="Pengaturan Sistem" 
              desc="Konfigurasi role & permission" 
              icon={<Settings className="h-6 w-6 text-slate-500" />} 
            />
          )}
          <ActionCard 
            href="/admin/keuangan" 
            title="Keuangan" 
            desc="Laporan transaksi & tagihan iuran" 
            icon={<Wallet className="h-6 w-6 text-emerald-500" />} 
          />
          <ActionCard 
            href="/admin/kebersihan" 
            title="Sistem Piket" 
            desc={`${activePiketPeriods} periode piket sedang aktif`} 
            icon={<ClipboardCheck className="h-6 w-6 text-cyan-500" />} 
          />
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800">Pendaftar Terbaru</h2>
            <Link href="/admin/warga" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500 font-medium">@{user.username}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  user.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {user.status}
                </span>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                Belum ada pengguna terdaftar
              </div>
            )}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="font-bold text-slate-800 mb-6">Distribusi Peran (Roles)</h2>
          <div className="space-y-3 flex-1">
            {roleCounts.map((role) => {
              const count = role.users.length;
              const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
              return (
                <div key={role.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{role.label}</span>
                    <span className="text-sm font-bold text-slate-500">{count} akun</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== HELPERS ====================

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'blue' | 'green' | 'amber' | 'rose' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
      <div className={`shrink-0 h-14 w-14 flex items-center justify-center rounded-2xl border ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col gap-3">
      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
