import { db } from '@/lib/db';
import ArchiveShell from '@/components/public/ArchiveShell';
import PeraturanClient from './PeraturanClient';

export const metadata = {
  title: 'Peraturan Asrama & Dokumen Resmi | AMKS',
  description: 'Kumpulan dokumen resmi, Peraturan Asrama, dan arsip Asrama Mahasiswa Kabupaten Sambas.',
};

export default async function PeraturanAsramaPage() {
  // Ambil semua dokumen yang di-set public dari database
  const documents = await db.document.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ArchiveShell title="Peraturan dan Arsip Dokumen Asrama" patterned compactHeader
      subtitle="Kumpulan Dokumen Resmi, Anggaran Dasar/Anggaran Rumah Tangga, dan Peraturan Asrama">
      <PeraturanClient documents={documents} />
    </ArchiveShell>
  );
}
