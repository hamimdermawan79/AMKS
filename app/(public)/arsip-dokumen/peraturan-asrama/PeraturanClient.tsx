'use client';

import { useState } from 'react';
import { FileText, Download, FileArchive, Search, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Doc {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  coverUrl: string | null;
  category: string | null;
  createdAt: Date;
}

interface Props {
  documents: Doc[];
}

export default function PeraturanClient({ documents }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const matchSearch = doc.title.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query)) ||
      (doc.category && doc.category.toLowerCase().includes(query));
      
    const matchCategory = selectedCategory === 'Semua' || doc.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const category = doc.category || 'Lainnya';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const sortedCategories = Object.keys(groupedDocs).sort((a, b) => {
    // Keep 'Lainnya' at the end
    if (a === 'Lainnya') return 1;
    if (b === 'Lainnya') return -1;
    return a.localeCompare(b);
  });

  const availableCategories = ['Semua', ...Array.from(new Set(documents.map(d => d.category || 'Lainnya')))];

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto mb-12">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari peraturan, judul, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="block w-full md:w-64 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        >
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'Semua' ? 'Semua Bagian Peraturan' : cat}
            </option>
          ))}
        </select>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <FileArchive className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Tidak Ditemukan</h3>
          <p className="text-slate-500">
            {searchQuery ? 'Peraturan yang Anda cari tidak ditemukan.' : 'Belum ada peraturan asrama yang diunggah oleh pengurus.'}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">{category}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedDocs[category].map((doc) => {
                  const ext = doc.fileUrl.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      {doc.coverUrl ? (
                        <div className="h-52 bg-slate-100 relative overflow-hidden group-hover:shadow-inner">
                          <img 
                            src={doc.coverUrl} 
                            alt={doc.title} 
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                          
                          <div className="absolute top-4 right-4">
                            <div className="px-2 py-1 bg-black/30 backdrop-blur-md rounded-md text-[10px] font-bold tracking-wider uppercase text-white border border-white/20">
                              {ext}
                            </div>
                          </div>
                          
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase mb-1.5">{doc.category}</p>
                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{doc.title}</h3>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative p-6 flex flex-col justify-end">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10 flex items-center justify-between text-white/90">
                            <BookOpen className="h-10 w-10 opacity-50 mb-2" />
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
                              {ext}
                            </div>
                          </div>
                          <div className="relative z-10 mt-auto">
                            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1">{doc.category}</p>
                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{doc.title}</h3>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        {doc.description ? (
                          <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                            {doc.description}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 italic mb-4 flex-1">
                            Tidak ada deskripsi singkat.
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100">
                          <span suppressHydrationWarning>
                            {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <div className="flex items-center gap-1.5 font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                            <Download className="h-3.5 w-3.5" />
                            Unduh
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
