import { Metadata } from 'next';
import { db } from '@/lib/db';
import InventarisPublicClient from './InventarisPublicClient';

export const metadata: Metadata = {
  title: 'Inventaris Asrama Mahasiswa Kabupaten Sambas',
  description: 'Daftar fasilitas dan inventaris yang tersedia di Asrama Mahasiswa Kabupaten Sambas.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function InventarisPublicPage() {
  const items = await db.inventory.findMany({
    include: {
      loans: {
        where: { status: 'APPROVED' },
      }
    },
    orderBy: { name: 'asc' },
  });

  const templates = await db.letterTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Fasilitas & Inventaris Asrama
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Berikut adalah daftar fasilitas dan inventaris yang tersedia untuk menunjang 
            kegiatan dan kenyamanan warga di Asrama Mahasiswa Kabupaten Sambas.
          </p>
        </div>

        {/* Grid Section */}
        {items.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Belum Ada Data Inventaris</h3>
            <p className="text-slate-500">Data inventaris sedang dalam proses pendataan oleh pengurus.</p>
          </div>
        ) : (
          <InventarisPublicClient items={items} templates={templates} />
        )}
      </div>
    </div>
  );
}
