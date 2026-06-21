import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import ProfileEditor from './ProfileEditor';
import ActivityManager from './ActivityManager';
import DocumentManager from './DocumentManager';

export default async function TentangKamiAdminPage() {
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Konten & Gallery</h1>
        <p className="text-sm text-muted-foreground">Kelola profil asrama, kegiatan, dan dokumentasi</p>
      </div>

      {/* Profile Section */}
      <ProfileEditor profile={profile} canEdit={canUpdate} userId={session.user.id} />

      {/* Activities Section */}
      <ActivityManager
        activities={activities}
        canCreate={canCreate}
        canDelete={canDelete}
      />

      {/* Documents Section */}
      <DocumentManager
        documents={documents}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
