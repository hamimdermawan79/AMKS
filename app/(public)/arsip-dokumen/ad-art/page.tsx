import { db } from '@/lib/db';
import HeroSection from '@/components/HeroSection';
import { FileText, Download, FileArchive, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Arsip & Dokumen Resmi | AMKS',
  description: 'Kumpulan dokumen resmi, AD/ART, dan arsip Asrama Mahasiswa Kabupaten Sambas.',
};

export default async function AdArtPage() {
  // Ambil semua dokumen yang di-set public dari database
  // Sesuai pipeline yang sudah ada (DocumentManager di dashboard)
  const documents = await db.document.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  });

  // Kelompokkan dokumen berdasarkan kategori
  const groupedDocs = documents.reduce((acc, doc) => {
    const category = doc.category || 'Lainnya';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  // Kategori yang diutamakan untuk ditampilkan paling atas
  const sortedCategories = Object.keys(groupedDocs).sort((a, b) => {
    if (a === 'AD/ART') return -1;
    if (b === 'AD/ART') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <HeroSection 
        title="Arsip & Dokumen" 
        subtitle="Kumpulan dokumen resmi, Anggaran Dasar/Anggaran Rumah Tangga, dan peraturan asrama."
      />

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {documents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <FileArchive className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Dokumen</h3>
            <p className="text-slate-500">
              Saat ini belum ada dokumen publik atau AD/ART yang diunggah oleh pengurus.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedCategories.map((category) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedDocs[category].map((doc) => {
                    const ext = doc.fileUrl.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {doc.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {ext}
                              </span>
                              <span>
                                {doc.createdAt.toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 pt-3 border-t border-slate-100 group-hover:text-blue-700">
                          <Download className="h-4 w-4" />
                          Unduh Dokumen
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-blue-50 rounded-2xl p-6 flex gap-4 border border-blue-100">
          <Info className="h-6 w-6 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Dokumen-dokumen di atas adalah dokumen publik resmi dari Asrama Mahasiswa Kabupaten Sambas Yogyakarta. 
            Jika Anda membutuhkan dokumen spesifik yang tidak tercantum di sini, silakan hubungi pengurus melalui halaman <Link href="/hubungi-kami" className="font-bold underline">Hubungi Kami</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
