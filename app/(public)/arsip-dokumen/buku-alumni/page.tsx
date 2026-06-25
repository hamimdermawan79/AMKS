'use client';

import { motion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import { GraduationCap, Calendar, MapPin } from 'lucide-react';

// Mock data untuk UI Preview sebelum backend siap
const mockAlumni = [
  {
    id: '1',
    name: 'Budi Santoso',
    campus: 'Universitas Gadjah Mada',
    entryDate: '2015-08-01',
    exitDate: '2019-10-15',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    name: 'Ahmad Fauzi',
    campus: 'Universitas Negeri Yogyakarta',
    entryDate: '2016-09-01',
    exitDate: '2020-11-20',
    photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    name: 'Rian Pratama',
    campus: 'Universitas Muhammadiyah Yogyakarta',
    entryDate: '2017-08-15',
    exitDate: '2021-12-05',
    photoUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    name: 'Hendra Gunawan',
    campus: 'UIN Sunan Kalijaga',
    entryDate: '2018-09-10',
    exitDate: '2022-10-30',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function BukuAlumniPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <HeroSection 
        title="Buku Alumni" 
        subtitle="Jejak langkah keluarga besar Asrama Mahasiswa Kabupaten Sambas yang pernah menetap di Yogyakarta."
      />

      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {mockAlumni.map((alumni) => {
            const entryYear = new Date(alumni.entryDate).getFullYear();
            const exitYear = new Date(alumni.exitDate).getFullYear();
            
            return (
              <motion.div
                key={alumni.id}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400 } }}
                className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Photo Section */}
                <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                  <img 
                    src={alumni.photoUrl} 
                    alt={`Foto ${alumni.name}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
                  
                  {/* Floating Info inside Image */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1 group-hover:text-blue-300 transition-colors">
                      {alumni.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                      <GraduationCap className="h-4 w-4" />
                      <span>{alumni.campus}</span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 bg-white">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs uppercase tracking-wider">Tahun Masuk</span>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        {entryYear}
                      </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200" />
                    
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-slate-500 text-xs uppercase tracking-wider">Tahun Keluar</span>
                      <div className="flex items-center justify-end gap-1.5 text-slate-700">
                        <Calendar className="h-4 w-4 text-rose-500" />
                        {exitYear}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
