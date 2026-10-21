import type { Metadata } from 'next';
import { db } from '@/lib/db';
import KaryaIlmiahList from './KaryaIlmiahList';

export const metadata: Metadata = {
  title: 'Repositori Karya Ilmiah',
  description:
    'Kumpulan karya tulis ilmiah warga Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Jurnal, penelitian, dan makalah dari mahasiswa Sambas.',
  openGraph: {
    title: 'Repositori Karya Ilmiah | SIMAS-KS',
    description: 'Jelajahi karya ilmiah terbitan warga asrama mahasiswa Sambas.',
    type: 'website',
  },
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

  return <KaryaIlmiahList worksByYear={worksByYear} />;
}
