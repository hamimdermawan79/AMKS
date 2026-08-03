import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import InventoryManager from './InventoryManager';

export const metadata: Metadata = {
  title: 'Manajemen Inventaris - Admin AMKS',
};

export default async function SekretarisInventarisPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const hasAccess = await canFromSession('division:manage:sekretaris');
  const canRead = await canFromSession('inventory:read');

  if (!hasAccess && !canRead) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
        <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman Sekretaris.</p>
      </div>
    );
  }

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    canFromSession('inventory:create'),
    canFromSession('inventory:update'),
    canFromSession('inventory:delete'),
  ]);

  const items = await db.inventory.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Manajemen Inventaris</h1>
        <p className="text-slate-600 mt-2">
          Kelola data barang inventaris asrama. Data yang dimasukkan di sini akan tampil di halaman fasilitas publik.
        </p>
      </div>

      <InventoryManager
        items={items}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
