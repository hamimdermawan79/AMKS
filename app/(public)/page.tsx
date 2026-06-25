'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Palette, Heart, Users } from 'lucide-react';
import MapSection from '@/components/MapSection';

function FloatingOrbs() {
  const orbs = [
    { size: 280, x: '20%', y: '15%', color: 'bg-blue-200/25', dur: 20, delay: 0 },
    { size: 200, x: '70%', y: '30%', color: 'bg-indigo-200/20', dur: 24, delay: 3 },
    { size: 160, x: '50%', y: '65%', color: 'bg-sky-200/20', dur: 22, delay: 1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${o.color}`}
          style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
          animate={{ x: [0, 20, -15, 0], y: [0, -20, 10, 0], scale: [1, 1.05, 0.97, 1] }}
          transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

const divisi = [
  { icon: BookOpen, name: 'Kebersihan', desc: 'Jadwal piket, kerja bakti, dan kebersihan lingkungan' },
  { icon: Palette, name: 'Kesenian', desc: 'Kegiatan seni, budaya, dan kreativitas warga' },
  { icon: Heart, name: 'Keolahragaan', desc: 'Olahraga, turnamen, dan kesehatan fisik' },
  { icon: Users, name: 'Rohani', desc: 'Kegiatan keagamaan dan pengembangan spiritual' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <motion.section
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white"
      >
        {/* Soft Blue Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white" />
        
        {/* Abstract Blurry Blobs for Mesh Gradient Effect - Blue Monochromatic Theme */}
        {/* Top Left Blob */}
        <div className="pointer-events-none absolute -left-[10%] top-0 h-[700px] w-[700px] rounded-[40%_60%_70%_30%] bg-primary/20 mix-blend-multiply blur-[120px] animate-blob" />
        {/* Top Center Blob */}
        <div className="pointer-events-none absolute left-[15%] -top-[10%] h-[600px] w-[600px] rounded-[60%_40%_30%_70%] bg-blue-200/40 mix-blend-multiply blur-[120px] animate-blob animation-delay-2000" />
        {/* Bottom Left Blob */}
        <div className="pointer-events-none absolute -left-[5%] bottom-[-10%] h-[600px] w-[600px] rounded-[50%_50%_60%_40%] bg-blue-300/30 mix-blend-multiply blur-[120px] animate-blob animation-delay-4000" />
        
        {/* Optional Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {mounted && <FloatingOrbs />}

        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground md:text-base"
            >
              Selamat Datang di
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-balance text-3xl font-bold leading-snug tracking-tight text-foreground md:text-5xl lg:text-6xl"
            >
              Layanan Terpadu Warga{' '}
              <span className="text-primary">Asrama Mahasiswa</span>
              <br />
              Kabupaten Sambas Yogyakarta
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex justify-center w-full"
            >
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-blue-200/50 bg-blue-500/10 px-8 py-4 text-base font-bold text-primary shadow-[0_8px_32px_rgba(37,99,235,0.15)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-blue-500/20 hover:shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:border-blue-300/60"
              >
                {/* Inner Blur Gradient */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-400/20 via-transparent to-primary/20 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                
                <span className="relative z-10 flex items-center justify-center">
                  Akses Warga Asrama
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== DIVISI ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-24 md:py-32">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.05),_transparent_70%)]" />

        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Divisi Asrama
            </h2>
            <p className="mt-3 text-muted-foreground">
              Empat pilar kegiatan yang mewadahi minat dan bakat warga
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {divisi.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={cardReveal}
                  whileHover={{ y: -6, transition: { type: 'spring', stiffness: 200, damping: 18 } }}
                  className="group rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== MAP LOCATION ===== */}
      <MapSection />

      {/* ===== CTA ===== */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Siap Bergabung?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Login untuk mengakses dashboard dan berkontribusi mengelola asrama.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-lg font-medium text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300"
              >
                Login Sekarang
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
