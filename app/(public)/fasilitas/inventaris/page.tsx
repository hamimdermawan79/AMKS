import { Metadata } from 'next';
import { db } from '@/lib/db';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Inventaris Asrama Mahasiswa Kabupaten Sambas',
  description: 'Daftar fasilitas dan inventaris yang tersedia di Asrama Mahasiswa Kabupaten Sambas.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function InventarisPublicPage() {
  const items = await db.inventory.findMany({
    orderBy: { name: 'asc' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {items.map((item, i) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                {/* Image Placeholder or Actual Image */}
                <div className="aspect-[4/3] bg-slate-100 relative group overflow-hidden">
                  {item.photoUrl ? (
                    <Image
                      src={item.photoUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Tanpa Foto</span>
                    </div>
                  )}
                  
                  {/* Condition Badge */}
                  {item.condition && (
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm backdrop-blur-md ${
                        item.condition.toLowerCase() === 'baik' 
                          ? 'bg-green-500/90 text-white' 
                          : item.condition.toLowerCase() === 'rusak ringan' || item.condition.toLowerCase() === 'rusak berat'
                          ? 'bg-red-500/90 text-white'
                          : 'bg-slate-800/90 text-white'
                      }`}>
                        {item.condition}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{item.name}</h3>
                  
                  {item.description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600 gap-1.5">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="font-medium text-slate-900">{item.quantity}</span> unit
                    </div>
                    
                    {item.location && (
                      <div className="flex items-center text-slate-500 gap-1.5">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate max-w-[120px]">{item.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
