'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { CreditCard, GraduationCap, BookOpen, CheckCircle2, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';
import Link from 'next/link';

const syarat = [
  {
    step: '01',
    icon: CreditCard,
    title: 'KTP Asli Kabupaten Sambas',
    desc: 'Calon warga wajib memiliki KTP asli yang terdaftar di wilayah Kabupaten Sambas, Kalimantan Barat, sebagai bukti identitas daerah asal.',
    tag: 'Identitas',
    tagColor: 'bg-blue-100 text-blue-700',
    accent: 'from-blue-400 to-blue-600',
  },
  {
    step: '02',
    icon: GraduationCap,
    title: 'Mahasiswa Aktif di Yogyakarta',
    desc: 'Calon warga harus berstatus mahasiswa aktif yang sedang menempuh pendidikan di salah satu perguruan tinggi di wilayah Daerah Istimewa Yogyakarta.',
    tag: 'Akademik',
    tagColor: 'bg-indigo-100 text-indigo-700',
    accent: 'from-indigo-400 to-indigo-600',
  },
  {
    step: '03',
    icon: BookOpen,
    title: 'Menaati Tata Tertib & AD/ART Asrama',
    desc: 'Setiap warga wajib membaca, memahami, dan bersedia mengikuti seluruh peraturan tata tertib serta Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) yang berlaku di asrama.',
    tag: 'Peraturan',
    tagColor: 'bg-sky-100 text-sky-700',
    accent: 'from-sky-400 to-sky-600',
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
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = item.icon;

  return (
    <div ref={ref} className="relative flex gap-4 md:gap-10">
      {/* Left: Step + Line */}
      <div className="flex flex-col items-center">
        {/* Step circle */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.15, type: 'spring', stiffness: 200 }}
          className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
          {/* Step number badge */}
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-blue-100">
            {item.step}
          </span>
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.3, ease: 'easeOut' }}
            style={{ originY: 0 }}
            className="mt-3 w-0.5 flex-1 bg-gradient-to-b from-blue-200 to-transparent"
          />
        )}
      </div>

      {/* Right: Content */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.15 + 0.1 }}
        className="pb-12 pt-1"
      >
        <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          <span className="h-px w-6 bg-blue-400/70" />
          {item.tag}
          <span className="h-px w-6 bg-blue-400/70" />
        </span>
        <h3 className="text-lg font-bold text-foreground md:text-xl">{item.title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{item.desc}</p>
      </motion.div>
    </div>
  );
}

export default function SyaratWargaSection() {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 md:py-24 lg:py-32">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-100/30 blur-3xl" />

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Heading */}
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 md:mb-16 max-w-2xl text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            <span className="h-px w-8 bg-blue-400/70" />
            Syarat Pendaftaran
            <span className="h-px w-8 bg-blue-400/70" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Ingin Menjadi Warga Asrama?
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground">
            Ada tiga syarat utama yang harus dipenuhi sebelum bergabung menjadi bagian dari keluarga besar Asrama Mahasiswa Kabupaten Sambas Yogyakarta.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="mx-auto max-w-2xl">
          {syarat.map((item, i) => (
            <TimelineItem
              key={i}
              item={item}
              index={i}
              isLast={i === syarat.length - 1}
            />
          ))}

          {/* Final checkmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 mb-8"
          >
            <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
            <div>
              <p className="font-semibold text-green-800">Siap Mendaftar?</p>
              <p className="mt-0.5 text-sm text-green-700">
                Jika semua syarat terpenuhi, kamu bisa langsung mengisi formulir pendaftaran di bawah ini.
              </p>
            </div>
          </motion.div>

          {/* ── CTA Button ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Glowing pill label */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Daftar Sekarang
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </div>

            {/* Main CTA */}
            <Link
              href="/daftar-warga"
              className="group relative w-full sm:w-auto inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              {/* Animated shimmer overlay */}
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden="true"
              />

              <span className="relative flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur-sm">
                  🏠
                </span>
                <span>
                  <span className="block text-[11px] font-medium text-white/70 leading-none mb-0.5">
                    Formulir Pendaftaran Calon Warga
                  </span>
                  <span className="block text-base font-bold leading-tight">
                    Daftar Menjadi Warga Asrama
                  </span>
                </span>
                <ArrowRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <p className="text-xs text-muted-foreground">
              Proses pendaftaran 100% online · Gratis · Tanpa biaya
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
