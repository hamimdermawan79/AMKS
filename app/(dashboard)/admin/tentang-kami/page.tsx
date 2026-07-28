import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import TentangKamiTabs from './TentangKamiTabs';

export default async function TentangKamiAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const hasAccess = await canFromSession('post:read');
  if (!hasAccess) {
    return (
      <div className="border border-border bg-white p-8">
        <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground">Anda tidak memiliki izin mengakses halaman ini.</p>
      </div>
    );
  }

  const canCreate = await canFromSession('post:create');
  const canUpdate = await canFromSession('post:update');
  const canDelete = await canFromSession('post:delete');

  // Fetch profile
  const profile = await db.asramaProfile.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch activities
  const activities = await db.activity.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { fullName: true } } },
  });

  // Fetch documents
  const documents = await db.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { fullName: true } } },
  });

  const resolvedParams = await searchParams;
  const initialTab = resolvedParams.tab === 'galeri' || resolvedParams.tab === 'dokumen' ? resolvedParams.tab : 'profil';

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Konten & Gallery</h1>
        <p className="text-slate-500">Pilih modul di bawah ini untuk mengelola konten publik halaman Tentang Kami dan Dokumentasi.</p>
      </div>

      <TentangKamiTabs 
        profile={profile}
        activities={activities}
        documents={documents}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        userId={session.user.id}
        initialTab={initialTab}
      />
    </div>
  );
}
