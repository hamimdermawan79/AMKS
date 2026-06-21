import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import KaryaIlmiahClient from './KaryaIlmiahClient';

export default async function KaryaIlmiahAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Hak baca: semua role yang punya akses dashboard
  const canRead = await canFromSession('work:read');
  if (!canRead) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">Akses Ditolak</h1>
        <p className="text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  const works = await db.scientificWork.findMany({
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: {
      publishedBy: { select: { fullName: true } },
      _count: { select: { accessRequests: true } },
    },
  });

  // Hanya Super Admin / Ketua yang dapat mengelola
  const canCreate = await canFromSession('work:create');
  const canUpdate = await canFromSession('work:update');
  const canDelete = await canFromSession('work:delete');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Repositori Karya Ilmiah
        </h1>
        <p className="text-muted-foreground">
          Kelola daftar karya tulis ilmiah warga asrama. Karya yang dipublikasikan
          akan tampil di halaman publik{' '}
          <span className="font-medium text-foreground">/karya-ilmiah</span>.
          Permintaan akses dari publik dapat dilihat di{' '}
          <span className="font-medium text-foreground">Permintaan Akses</span>.
        </p>
      </div>

      <KaryaIlmiahClient
        works={works.map((w) => ({
          id: w.id,
          title: w.title,
          authorName: w.authorName,
          authorInstitution: w.authorInstitution,
          type: w.type,
          year: w.year,
          abstractFileUrl: w.abstractFileUrl,
          titlePageFileUrl: w.titlePageFileUrl,
          tocFileUrl: w.tocFileUrl,
          isPublished: w.isPublished,
          publishedByName: w.publishedBy.fullName,
          requestCount: w._count.accessRequests,
        }))}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
