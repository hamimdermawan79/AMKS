import type { Metadata } from 'next';
import { db } from '@/lib/db';
import KaryaIlmiahList from './KaryaIlmiahList';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Karya Ilmiah',
  description:
    'Repositori karya tulis ilmiah warga Asrama Mahasiswa Kabupaten Sambas Yogyakarta.',
};

export const dynamic = 'force-dynamic';

export default async function KaryaIlmiahPage() {
  const works = await db.scientificWork.findMany({
    where: { isPublished: true },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      authorName: true,
      authorInstitution: true,
      type: true,
      year: true,
      abstractFileUrl: true,
      titlePageFileUrl: true,
      tocFileUrl: true,
    },
  });

  const byYear = new Map<number, typeof works>();
  for (const work of works) {
    const list = byYear.get(work.year) ?? [];
    list.push(work);
    byYear.set(work.year, list);
  }
  const worksByYear = Array.from(byYear.keys())
    .sort((a, b) => b - a)
    .map((year) => ({ year, works: byYear.get(year)! }));

  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Repositori Karya Ilmiah" subtitle="Karya tulis ilmiah warga asrama: skripsi, tesis, jurnal, dan artikel" />

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto max-w-4xl px-6">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-border bg-slate-50/60 p-12 text-center">
              <p className="text-lg font-semibold text-foreground">Belum ada karya ilmiah</p>
              <p className="mt-1 text-muted-foreground">
                Karya tulis ilmiah warga asrama akan ditampilkan di sini setelah ditambahkan oleh pengurus.
              </p>
            </div>
          ) : (
            <KaryaIlmiahList worksByYear={worksByYear} />
          )}
        </div>
      </section>
    </div>
  );
}
