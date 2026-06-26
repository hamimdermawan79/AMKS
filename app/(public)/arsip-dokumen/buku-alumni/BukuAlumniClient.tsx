'use client';

import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import { GraduationCap, Calendar, MapPin, BookOpen, Users, Search, X, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface AlumniEntry {
  id: string;
  fullName: string;
  photoUrl: string | null;
  jurusan: string | null;
  namaKampus: string | null;
  tahunMasuk: number | null;
  asalDaerah: string | null;
  tahunKeluar: number | null;
}

interface AngkatanGroup {
  year: number; // 0 = belum ada data angkatan
  members: AlumniEntry[];
}

interface Props {
  groupedAngkatan: AngkatanGroup[];
  totalAlumni: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function BukuAlumniClient({ groupedAngkatan, totalAlumni }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAngkatan, setSelectedAngkatan] = useState<number | 'all'>('all');

  // Build angkatan options from actual data
  const angkatanOptions = useMemo(() => {
    return groupedAngkatan
      .filter((g) => g.year > 0)
      .map((g) => g.year)
      .sort((a, b) => a - b);
  }, [groupedAngkatan]);

  // Filter logic: search by name + filter by angkatan
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return groupedAngkatan
      .filter((g) => selectedAngkatan === 'all' || g.year === selectedAngkatan)
      .map((group) => ({
        ...group,
        members: group.members.filter((m) =>
          q === '' || m.fullName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [groupedAngkatan, searchQuery, selectedAngkatan]);

  const totalFiltered = filteredGroups.reduce((acc, g) => acc + g.members.length, 0);
  const isFiltering = searchQuery.trim() !== '' || selectedAngkatan !== 'all';

  function clearFilters() {
    setSearchQuery('');
    setSelectedAngkatan('all');
  }

  if (totalAlumni === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <HeroSection
          title="Buku Alumni"
          subtitle="Jejak langkah keluarga besar Asrama Mahasiswa Kabupaten Sambas yang pernah menetap di Yogyakarta."
        />
        <div className="container mx-auto px-6 py-24 max-w-6xl text-center">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Users className="h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">Belum ada data alumni</p>
            <p className="text-sm text-slate-400">Data alumni akan muncul di sini setelah admin menambahkan warga dengan status Alumni.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <HeroSection
        title="Buku Alumni"
        subtitle="Jejak langkah keluarga besar Asrama Mahasiswa Kabupaten Sambas yang pernah menetap di Yogyakarta."
      />

      <div className="container mx-auto px-6 py-16 max-w-6xl space-y-10">

        {/* ── Search & Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
        >
          {/* Search by name */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama alumni..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-slate-200 self-center" />

          {/* Filter by angkatan */}
          <div className="relative">
            <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedAngkatan}
              onChange={(e) =>
                setSelectedAngkatan(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer"
            >
              <option value="all">Semua Angkatan</option>
              {angkatanOptions.map((year) => (
                <option key={year} value={year}>
                  Angkatan {year}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Clear filters */}
          <AnimatePresence>
            {isFiltering && (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Result summary ── */}
        <motion.div
          key={`${searchQuery}-${selectedAngkatan}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-slate-500 text-sm"
        >
          <Users className="h-4 w-4" />
          {isFiltering ? (
            <span>
              Menampilkan <strong className="text-slate-700">{totalFiltered}</strong> alumni
              {searchQuery && (
                <> dengan nama "<strong className="text-slate-700">{searchQuery}</strong>"</>
              )}
              {selectedAngkatan !== 'all' && (
                <> · Angkatan <strong className="text-slate-700">{selectedAngkatan}</strong></>
              )}
            </span>
          ) : (
            <span>
              Total <strong className="text-slate-700">{totalAlumni}</strong> alumni dari{' '}
              <strong className="text-slate-700">{groupedAngkatan.filter((g) => g.year > 0).length}</strong> angkatan
            </span>
          )}
        </motion.div>

        {/* ── Alumni groups ── */}
        <AnimatePresence mode="wait">
          {filteredGroups.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20 text-slate-400"
            >
              <Search className="h-14 w-14 opacity-30" />
              <p className="text-lg font-medium">Tidak ada alumni yang ditemukan</p>
              <p className="text-sm">Coba ubah kata kunci atau filter angkatan.</p>
              <button
                onClick={clearFilters}
                className="mt-2 rounded-xl bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Reset pencarian
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`${searchQuery}-${selectedAngkatan}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              {filteredGroups.map((group) => (
                <section key={group.year}>
                  {/* Angkatan header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                          {group.year === 0 ? 'Angkatan Tidak Diketahui' : `Angkatan ${group.year}`}
                        </h2>
                        <p className="text-sm text-slate-500">{group.members.length} alumni</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Alumni cards */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
                  >
                    {group.members.map((alumni) => (
                      <AlumniCard key={alumni.id} alumni={alumni} highlight={searchQuery.trim()} />
                    ))}
                  </motion.div>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Highlight helper ────────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function AlumniCard({ alumni, highlight }: { alumni: AlumniEntry; highlight: string }) {
  const initial = alumni.fullName.charAt(0).toUpperCase();

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400 } }}
      className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Photo / Initials */}
      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        {alumni.photoUrl ? (
          <img
            src={alumni.photoUrl}
            alt={`Foto ${alumni.fullName}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <span className="text-6xl font-bold text-blue-400 select-none">{initial}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white">
          <h3 className="text-sm sm:text-xl font-bold mb-0.5 sm:mb-1 group-hover:text-blue-300 transition-colors leading-tight">
            <HighlightText text={alumni.fullName} query={highlight} />
          </h3>
          {alumni.namaKampus && (
            <div className="flex items-center gap-1.5 text-sm text-slate-300">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{alumni.namaKampus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-3 sm:p-5 bg-white space-y-2 sm:space-y-3">
        {alumni.jurusan && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <GraduationCap className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>{alumni.jurusan}</span>
          </div>
        )}
        {alumni.asalDaerah && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{alumni.asalDaerah}</span>
          </div>
        )}

        {/* Tahun masuk & keluar */}
        {(alumni.tahunMasuk || alumni.tahunKeluar) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
            {alumni.tahunMasuk && (
              <div className="flex flex-col gap-0.5">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Masuk</span>
                <div className="flex items-center gap-1 text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  {alumni.tahunMasuk}
                </div>
              </div>
            )}
            {alumni.tahunMasuk && alumni.tahunKeluar && <div className="h-7 w-px bg-slate-200" />}
            {alumni.tahunKeluar && (
              <div className="flex flex-col gap-0.5 text-right">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Keluar</span>
                <div className="flex items-center justify-end gap-1 text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" />
                  {alumni.tahunKeluar}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
