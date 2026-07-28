import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/rbac/can';
import PengaturanClient from './PengaturanClient';

export default async function PengaturanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Double check authorization: must be SuperAdmin
  const isSuper = await isSuperAdmin({
    id: session.user.id,
    username: session.user.username,
  });

  if (!isSuper) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          Anda tidak memiliki izin (SuperAdmin) untuk mengakses halaman pengaturan sistem ini.
        </p>
      </div>
    );
  }

  // Fetch all roles with their current permissions
  const roles = await db.role.findMany({
    include: {
      permissions: {
        select: {
          permissionId: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch all permissions available
  const permissions = await db.permission.findMany({
    orderBy: {
      group: 'asc',
    },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pengaturan Sistem
        </h1>
        <p className="text-muted-foreground">
          Kelola peran (*roles*), perizinan (*permissions*), dan matriks hak akses RBAC global.
        </p>
      </div>

      <PengaturanClient roles={roles} permissions={permissions} />
    </div>
  );
}

