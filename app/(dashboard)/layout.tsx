import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { handleLogout } from './logout-action';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user roles
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

              {/* SuperAdmin & Ketua only */}
              {isFullAccess && (
                <>
                  <Link href="/admin/warga" className="nav-item">
                    Warga
                  </Link>
                  <Link href="/admin/tentang-kami" className="nav-item">
                    Konten & Gallery
                  </Link>
                  <Link href="/admin/karya-ilmiah" className="nav-item">
                    Karya Ilmiah
                  </Link>
                  <Link href="/admin/pengaturan" className="nav-item">
                    Pengaturan Sistem
                  </Link>
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
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
