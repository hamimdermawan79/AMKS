'use client';

import { useState } from 'react';
import Image from 'next/image';
import { submitLoanRequest } from '@/app/(dashboard)/admin/sekretaris/inventaris/actions';

export default function InventarisPublicClient({ items, templates }: { items: any[], templates: any[] }) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const categories = ['Semua', ...Array.from(new Set(items.map(item => item.category || 'Lainnya')))].sort();

  const filteredItems = items.filter(item => 
    activeCategory === 'Semua' ? true : (item.category || 'Lainnya') === activeCategory
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('inventoryId', selectedItem.id);

    try {
      await submitLoanRequest(formData);
      alert('Permintaan peminjaman berhasil dikirim. Menunggu persetujuan sekretaris.');
      setSelectedItem(null);
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat meminjam barang.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as string)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat as string}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filteredItems.map((item, i) => {
          const approvedLoans = item.loans?.filter((l: any) => l.status === 'APPROVED') || [];
          const borrowedQuantity = approvedLoans.reduce((sum: number, l: any) => sum + l.quantity, 0);
          const availableQuantity = Math.max(0, item.quantity - borrowedQuantity);
          const isAvailable = availableQuantity > 0;

          return (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
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
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${
                      item.condition.toLowerCase() === 'baik' ? 'bg-green-500/90 text-white' : 
                      item.condition.toLowerCase() === 'rusak' ? 'bg-red-500/90 text-white' : 
                      'bg-slate-800/90 text-white'
                    }`}>
                      {item.condition}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full shadow-sm backdrop-blur-md bg-blue-500/90 text-white uppercase tracking-wider">
                      {item.category || 'Lainnya'}
                    </span>
                  </div>
                )}
                {!item.condition && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full shadow-sm backdrop-blur-md bg-blue-500/90 text-white uppercase tracking-wider">
                      {item.category || 'Lainnya'}
                    </span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm backdrop-blur-md ${
                    isAvailable ? 'bg-blue-600/90 text-white' : 'bg-red-600/90 text-white'
                  }`}>
                    {isAvailable ? 'TERSEDIA' : 'DIPINJAM'}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{item.name}</h3>
                
                {item.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600 gap-1.5">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="font-medium text-slate-900">{availableQuantity}</span> / {item.quantity} tersedia
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
                  
                  <button
                    onClick={() => setSelectedItem(item)}
                    disabled={!isAvailable}
                    className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    Pinjam Barang
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Peminjaman */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Pinjam {selectedItem.name}</h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {templates.length > 0 && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                  <p className="font-semibold mb-2">Persyaratan Peminjaman:</p>
                  <p className="mb-3">Mohon unduh, isi, dan tandatangani surat peminjaman berikut, lalu unggah kembali di bawah.</p>
                  <div className="flex flex-col gap-2">
                    {templates.map(t => (
                      <a key={t.id} href={t.fileUrl} download={t.fileName} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Peminjam</label>
                <input required name="borrowerName" type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan nama Anda" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
                <input required name="quantity" type="number" min="1" max={Math.max(0, selectedItem.quantity - (selectedItem.loans?.filter((l: any) => l.status === 'APPROVED').reduce((sum: number, l: any) => sum + l.quantity, 0) || 0))} defaultValue="1" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Pinjam</label>
                  <input required name="startDate" type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Kembali</label>
                  <input required name="endDate" type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surat Peminjaman (Sudah ditandatangan)</label>
                <input required name="letterFile" type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Ajukan Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
