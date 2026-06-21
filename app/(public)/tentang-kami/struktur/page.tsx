import { db } from '@/lib/db';
import StrukturBagan from './StrukturBagan';
import HeroSection from '@/components/HeroSection';

export default async function StrukturPage() {
  const users = await db.user.findMany({
    where: { status: 'AKTIF' },
    select: {
      id: true,
      fullName: true,
      jabatan: true,
      photoUrl: true,
      divisionScope: true,
      roles: {
        select: { role: { select: { name: true, label: true } } },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Struktur Organisasi" subtitle="Susunan kepengurusan asrama" />

      <section className="pb-24">
        <div className="container mx-auto px-6">
          {users.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-slate-50/60 p-12 text-center">
              <p className="text-muted-foreground italic">
                Belum ada data struktur organisasi.
              </p>
            </div>
          ) : (
            <StrukturBagan users={users} />
          )}
        </div>
      </section>
    </div>
  );
}
