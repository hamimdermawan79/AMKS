import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { handleLogout } from './logout-action';
import NotificationBell from '@/components/ui/notification-bell';

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

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-border flex-shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 smooth-transition">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="text-xl font-semibold text-foreground">AMKS</span>
          </Link>

          <div className="space-y-6">
            {/* Navigation - All roles */}
            <nav className="space-y-2">
              <Link href="/user" className="nav-item">
                Dashboard
              </Link>

              <Link href="/admin/kebersihan" className="nav-item">
                Kebersihan
              </Link>
              <Link href="/admin/kesenian" className="nav-item">
                Kesenian
              </Link>
              <Link href="/admin/keolahragaan" className="nav-item">
                Keolahragaan
              </Link>
              <Link href="/admin/rohani" className="nav-item">
                Rohani
              </Link>
              <Link href="/admin/keuangan" className="nav-item">
                Keuangan
              </Link>

              {/* Divider */}
              <div className="border-t border-border my-2" />

              {/* Permission-driven admin section */}
              {hasAdminSection && (
                <>
                  {canManageUsers && (
                    <Link href="/admin/warga" className="nav-item">
                      Warga
                    </Link>
                  )}
                  {canManageUsers && (
                    <Link href="/admin/calon-warga" className="nav-item">
                      Calon Warga Asrama
                    </Link>
                  )}
                  {canManageContent && (
                    <Link href="/admin/tentang-kami" className="nav-item">
                      Konten & Gallery
                    </Link>
                  )}
                  {canManageWorks && (
                    <Link href="/admin/karya-ilmiah" className="nav-item">
                      Karya Ilmiah
                    </Link>
                  )}
                  {canViewAccessRequests && (
                    <Link href="/admin/karya-ilmiah/permintaan-akses" className="nav-item">
                      Permintaan Akses
                    </Link>
                  )}
                  {canManageSystem && (
                    <>
                      {/* Divider */}
                      <div className="border-t border-border my-2" />
                      <Link href="/admin/whatsapp" className="nav-item">
                        WhatsApp Bot
                      </Link>
                      <Link href="/admin/pengaturan" className="nav-item">
                        Pengaturan Sistem
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* Account settings - non-admin roles */}
              {!isFullAccess && (
                <Link href="/admin/akun" className="nav-item">
                  Pengaturan Akun
                </Link>
              )}
            </nav>

            {/* Logout */}
            <form action={handleLogout}>
              <button type="submit" className="w-full nav-item text-red-600 hover:bg-red-50">
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col bg-slate-50/20">
        {/* Header bar */}
        <header className="glass border-b border-border/80 py-4 px-8 flex items-center justify-between flex-shrink-0 z-20">
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

        <div className="container mx-auto px-6 py-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
