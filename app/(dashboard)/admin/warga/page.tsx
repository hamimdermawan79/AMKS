import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import UserManagementClient from './UserManagementClient';

export default async function WargaManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check permission: user:read
  const hasPermission = await canFromSession('user:read');

  if (!hasPermission) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  // Fetch all users with their roles
  const users = await db.user.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all available roles (SUPERADMIN excluded — it cannot be assigned via this UI)
  const roles = await db.role.findMany({
    where: {
      name: { not: 'SUPERADMIN' },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Check if user can create/update/delete
  const canCreate = await canFromSession('user:create');
  const canUpdate = await canFromSession('user:update');
  const canDelete = await canFromSession('user:delete');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Manajemen Warga
        </h1>
        <p className="text-muted-foreground">
          Kelola data warga asrama, termasuk username, nomor WA, status, dan role.
        </p>
      </div>

      <UserManagementClient
        users={users}
        roles={roles}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
