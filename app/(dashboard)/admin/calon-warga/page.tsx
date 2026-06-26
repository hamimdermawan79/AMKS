import { auth } from '@/lib/auth';
import { canFromSession } from '@/lib/rbac/can';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import CalonWargaAdminClient from './CalonWargaAdminClient';

export default async function CalonWargaAdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Only ketua, sekretaris, superadmin can access
  const canAccess = await canFromSession('user:read');
  if (!canAccess) redirect('/user');

  const calonWargaList = await db.calonWarga.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Serialize dates
  const serialized = calonWargaList.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <CalonWargaAdminClient initialData={serialized} />;
}
