import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PengaturanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pengaturan
        </h1>
        <p className="text-muted-foreground">
          Kelola role, permission, dan konfigurasi sistem (SuperAdmin only)
        </p>
      </div>

      <div className="bg-white border border-border p-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            FASE 1 - IN DEVELOPMENT
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            System Settings & RBAC
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Konfigurasi role-based access control dan pengaturan sistem (SuperAdmin only).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Role Management</h3>
            <p className="text-sm text-muted-foreground">CRUD roles dengan label dan system flags</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Permission Matrix</h3>
            <p className="text-sm text-muted-foreground">Toggle permission per role dengan visual matrix</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Permission Groups</h3>
            <p className="text-sm text-muted-foreground">Kelola granular permissions berdasarkan resource</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Audit Log</h3>
            <p className="text-sm text-muted-foreground">Track semua perubahan sistem dan user actions</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">System Configuration</h3>
            <p className="text-sm text-muted-foreground">General settings dan parameter global</p>
          </div>
        </div>
      </div>
    </div>
  );
}
