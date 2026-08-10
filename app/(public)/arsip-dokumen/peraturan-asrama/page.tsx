import { db } from '@/lib/db';
import HeroSection from '@/components/HeroSection';
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
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <HeroSection 
        title="Peraturan Asrama & Arsip Dokumen" 
        subtitle="Kumpulan dokumen resmi, Anggaran Dasar/Anggaran Rumah Tangga, dan peraturan asrama."
      />

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <PeraturanClient documents={documents} />
      </div>
    </div>
  );
}
