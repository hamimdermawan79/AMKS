'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { CreditCard, GraduationCap, FileText } from 'lucide-react';

const syarat = [
  {
    step: '01',
    icon: CreditCard,
    title: 'KTP Asli Kabupaten Sambas',
    desc: 'Calon warga wajib memiliki KTP asli yang terdaftar di wilayah Kabupaten Sambas, Kalimantan Barat, sebagai bukti identitas daerah asal.',
  },
  {
    step: '02',
    icon: GraduationCap,
    title: 'Mahasiswa Aktif di Yogyakarta',
    desc: 'Calon warga harus berstatus mahasiswa aktif yang sedang menempuh pendidikan di salah satu perguruan tinggi di wilayah Daerah Istimewa Yogyakarta.',
  },
  {
    step: '03',
    icon: FileText,
    title: 'Menaati Tata Tertib dan AD/ART Asrama',
    desc: 'Setiap warga wajib membaca, memahami, dan bersedia mengikuti seluruh peraturan tata tertib serta Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) yang berlaku di asrama.',
  },
];

function TimelineItem({
  item,
  index,
  isLast,
}: {
  item: (typeof syarat)[0];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const Icon = item.icon;

  return (
    <div ref={ref} className="relative flex gap-4 sm:gap-6">
      {/* Left: Clean Monochrome SVG Icon Box + Connector Line */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.12 }}
          className="relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-white shadow-sm"
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-800 stroke-[1.6]" />
        </motion.div>

        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.12 + 0.2, ease: 'easeOut' }}
            style={{ originY: 0 }}
            className="my-2 w-px flex-1 bg-slate-200"
          />
        )}
      </div>

      {/* Right: Clean Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: index * 0.12 + 0.1 }}
        className="pb-8 sm:pb-10 pt-1 text-left"
      >
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 font-sans tracking-tight">
          {item.title}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
          {item.desc}
        </p>
      </motion.div>
    </div>
  );
}

export default function SyaratWargaSection() {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true });

  return (
    <section className="relative overflow-hidden bg-white py-14 md:py-20">
      {/* Header 2 Baris: Jadi bagian dari Keluarga AMKS */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-10 md:mb-14">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal tracking-tight text-slate-900 leading-[1.12]">
          <span className="ml-2.5 sm:ml-4 md:ml-5 inline-block text-slate-900">Jadi bagian dari</span><br />
          <span className="text-primary font-normal font-serif">Keluarga AMKS</span>
        </h2>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-sans max-w-2xl">
          Setiap perjalanan dimulai dari sebuah langkah. Kenali persyaratan dan mulailah menjadi bagian dari keluarga besar Asrama Mahasiswa Kabupaten Sambas Yogyakarta.
        </p>
      </div>

      {/* Timeline Items */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="space-y-1">
          {syarat.map((item, i) => (
            <TimelineItem
              key={i}
              item={item}
              index={i}
              isLast={i === syarat.length - 1}
            />
          ))}
        </div>

        {/* Divider & Prominent CTA Button — Primary Concern */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-sans text-center sm:text-left">
            Proses pendaftaran 100% online · Gratis · Tanpa dipungut biaya
          </p>
          <Link
            href="/daftar-warga"
            className="inline-flex items-center justify-center rounded-[10px] bg-slate-900 px-7 sm:px-9 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition-all duration-200 hover:bg-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95 whitespace-nowrap font-montserrat tracking-wide"
          >
            <span>Jadi Bagian dari AMKS</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
