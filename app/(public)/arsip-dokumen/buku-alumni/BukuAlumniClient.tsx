'use client';

import { motion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import { GraduationCap, Calendar, MapPin, BookOpen, Users } from 'lucide-react';

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

      <div className="container mx-auto px-6 py-16 max-w-6xl space-y-16">
        {/* Summary */}
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Users className="h-4 w-4" />
          <span>Total <strong className="text-slate-700">{totalAlumni}</strong> alumni dari <strong className="text-slate-700">{groupedAngkatan.filter(g => g.year > 0).length}</strong> angkatan</span>
        </div>

        {groupedAngkatan.map((group) => (
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {group.members.map((alumni) => (
                <AlumniCard key={alumni.id} alumni={alumni} />
              ))}
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AlumniCard({ alumni }: { alumni: AlumniEntry }) {
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
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="text-xl font-bold mb-1 group-hover:text-blue-300 transition-colors leading-tight">
            {alumni.fullName}
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
      <div className="p-5 bg-white space-y-3">
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
