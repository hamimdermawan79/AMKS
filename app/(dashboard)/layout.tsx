import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { handleLogout } from './logout-action';
import NotificationBell from '@/components/ui/notification-bell';
import SidebarNav, { type NavLinkItem } from './SidebarNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user roles (used for the account-settings toggle)
  const userWithRoles = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      roles: {
        select: {
          role: { select: { name: true } },
        },
      },
    },
  });

  const roleNames = userWithRoles?.roles.map((r) => r.role.name) ?? [];
  const isFullAccess = roleNames.includes('SUPERADMIN') || roleNames.includes('KETUA');

  // Permission-driven nav visibility (RBAC source of truth) so that scoped
  // roles like Sekretaris see exactly the admin pages they can manage.
  const [
    canManageUsers,
    canManageContent,
    canManageWorks,
    canViewAccessRequests,
    canManageSystem,
  ] = await Promise.all([
    canFromSession('user:create'),
    canFromSession('post:create'),
    canFromSession('work:create'),
    canFromSession('access_request:read'),
    canFromSession('permission:manage'),
  ]);

  const hasAdminSection =
    canManageUsers ||
    canManageContent ||
    canManageWorks ||
    canViewAccessRequests ||
    canManageSystem;

  // Build nav items server-side (RBAC-aware) for the client SidebarNav.
  const navItems: NavLinkItem[] = [
    { label: 'Dashboard', href: '/user' },
    { label: 'Kebersihan', href: '/admin/kebersihan' },
    { label: 'Kesenian', href: '/admin/kesenian' },
    { label: 'Keolahragaan', href: '/admin/keolahragaan' },
    { label: 'Rohani', href: '/admin/rohani' },
    { label: 'Keuangan', href: '/admin/keuangan' },
  ];

  if (hasAdminSection) {
    if (canManageUsers) {
      navItems.push({ label: 'Warga', href: '/admin/warga' });
      navItems.push({ label: 'Calon Warga Asrama', href: '/admin/calon-warga' });
    }
    if (canManageContent) {
      navItems.push({ label: 'Konten & Gallery', href: '/admin/tentang-kami' });
    }
    if (canManageWorks) {
      navItems.push({ label: 'Karya Ilmiah', href: '/admin/karya-ilmiah' });
    }
    if (canViewAccessRequests) {
      navItems.push({ label: 'Permintaan Akses', href: '/admin/karya-ilmiah/permintaan-akses' });
    }
    if (canManageSystem) {
      navItems.push({ label: 'WhatsApp Bot', href: '/admin/whatsapp' });
      navItems.push({ label: 'Pengaturan Sistem', href: '/admin/pengaturan' });
    }
  }

  if (!isFullAccess) {
    navItems.push({ label: 'Pengaturan Akun', href: '/admin/akun' });
  }

  // Hrefs that should be preceded by a visual divider in the nav.
  const dividerHrefs: string[] = ['/admin/warga', '/admin/whatsapp'];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-x-hidden">
      <SidebarNav
        navItems={navItems}
        dividerHrefs={dividerHrefs}
        user={{
          fullName: session.user.fullName,
          jabatan: session.user.jabatan,
          id: session.user.id,
        }}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col bg-slate-50/20">
        {/* Desktop header bar */}
        <header className="hidden md:flex glass border-b border-border/80 py-4 px-8 items-center justify-between flex-shrink-0 z-20">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-foreground">{session.user.fullName}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase font-bold tracking-wider">
              {session.user.jabatan || 'Warga'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={session.user.id} />
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-6 py-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
