import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { WORK_TYPE_LABELS } from '@/lib/karya-ilmiah';
import PermintaanAksesClient from './PermintaanAksesClient';

export default async function PermintaanAksesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canRead = await canFromSession('access_request:read');
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

  const requests = await db.accessRequest.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      work: { select: { title: true, authorName: true, type: true, year: true } },
    },
  });

  const canManage = await canFromSession('access_request:manage');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Permintaan Akses Karya Ilmiah
        </h1>
        <p className="text-muted-foreground">
          Daftar permintaan akses berkas lengkap karya ilmiah yang diajukan oleh
          publik melalui halaman repositori.
        </p>
      </div>

      <PermintaanAksesClient
        requests={requests.map((r) => ({
          id: r.id,
          name: r.name,
          whatsapp: r.whatsapp,
          email: r.email,
          purpose: r.purpose,
          institution: r.institution,
          status: r.status,
          note: r.note,
          createdAt: r.createdAt.toISOString(),
          workTitle: r.work.title,
          workMeta: `${r.work.authorName} · ${WORK_TYPE_LABELS[r.work.type]} · ${r.work.year}`,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
