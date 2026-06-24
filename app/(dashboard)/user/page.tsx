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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Administrator Panel</h1>
        <p className="text-sm text-muted-foreground">
          System overview &amp; quick access. Logged in as{' '}
          <span className="font-medium text-foreground">{session.user.fullName}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Users" value={totalUsers} />
        <StatBox label="Active" value={activeUsers} />
        <StatBox label="Alumni" value={alumniUsers} />
        <StatBox
          label="Outstanding Bills"
          value={outstandingBills}
          valueClass="text-red-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/warga"
            className="border border-border p-4 hover:border-primary/30 hover:bg-blue-50/50 transition-colors"
          >
            <p className="font-medium text-foreground text-sm">User Management</p>
            <p className="text-xs text-muted-foreground mt-1">Add, edit, delete users</p>
          </Link>
          {isSuper && (
            <Link
              href="/admin/pengaturan"
              className="border border-border p-4 hover:border-primary/30 hover:bg-blue-50/50 transition-colors"
            >
              <p className="font-medium text-foreground text-sm">Settings</p>
              <p className="text-xs text-muted-foreground mt-1">Roles &amp; permissions</p>
            </Link>
          )}
          <Link
            href="/admin/keuangan"
            className="border border-border p-4 hover:border-primary/30 hover:bg-blue-50/50 transition-colors"
          >
            <p className="font-medium text-foreground text-sm">Finance</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions &amp; bills</p>
          </Link>
          <Link
            href="/admin/kebersihan"
            className="border border-border p-4 hover:border-primary/30 hover:bg-blue-50/50 transition-colors"
          >
            <p className="font-medium text-foreground text-sm">Piket System</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activePiketPeriods} active period{activePiketPeriods !== 1 ? 's' : ''}
            </p>
          </Link>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Registrations</h2>
            <Link href="/admin/warga" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 font-medium ${
                    user.status === 'AKTIF'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Role Distribution</h2>
          <div className="space-y-3">
            {roleCounts.map((role) => (
              <div key={role.id} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{role.label}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {role.users.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== HELPERS ====================
function StatBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="border border-border p-5 bg-white">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueClass || 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
