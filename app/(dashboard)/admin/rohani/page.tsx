import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';

export default async function RohaniPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('division:manage:rohani', 'ROHANI');
  if (!allowed) {
    redirect('/user');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Divisi Rohani
        </h1>
        <p className="text-muted-foreground">
          Kelola kegiatan keagamaan dan pengembangan spiritual warga
        </p>
      </div>

      <div className="bg-white border border-border p-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            FASE 3 - IN DEVELOPMENT
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Divisi Rohani Management
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sistem manajemen kegiatan keagamaan dan pengembangan spiritual warga asrama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Religious Activities</h3>
            <p className="text-sm text-muted-foreground">CRUD kegiatan rohani dan kajian keagamaan</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Schedule Management</h3>
            <p className="text-sm text-muted-foreground">Jadwal kajian, ibadah, dan pengajian rutin</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Manajerial Access</h3>
            <p className="text-sm text-muted-foreground">Interface khusus untuk Ketua Divisi Rohani</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Announcements</h3>
            <p className="text-sm text-muted-foreground">Pengumuman dan notifikasi untuk anggota divisi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
