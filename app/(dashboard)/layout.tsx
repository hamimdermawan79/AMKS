import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
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
    { label: 'Keamanan', href: '/admin/keamanan' },
    { label: 'Keuangan', href: '/admin/keuangan' },
    { label: 'Inventaris', href: '/admin/sekretaris/inventaris' },
    { label: 'Surat Menyurat', href: '/admin/sekretaris/surat' },
    { label: 'Kesekretariatan', href: '/admin/kesekretariatan' },
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
          jabatan: session.user.jabatan ?? null,
          id: session.user.id,
        }}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
