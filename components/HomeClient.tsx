'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, BookOpen, Palette, Heart, Users,
  Calendar, MapPin, Images, ChevronDown, Quote,
} from 'lucide-react';
import MapSection from '@/components/MapSection';
import SyaratWargaSection from '@/components/SyaratWargaSection';

// ── Types ──────────────────────────────────────────────────────────────────
interface ActivityPreview {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startAt: Date | null;
  location: string | null;
  division: string | null;
}

interface Props {
  totalWarga: number;
  totalAlumni: number;
  totalAngkatan: number;
  recentActivities: ActivityPreview[];
  profileAbout: string | null;
}

// ── Floating orbs ──────────────────────────────────────────────────────────
function FloatingOrbs() {
  const orbs = [
    { size: 280, mobileSize: 168, x: '20%', y: '15%', color: 'bg-blue-200/25', dur: 20, delay: 0, hideMobile: true },
    { size: 200, mobileSize: 120, x: '70%', y: '30%', color: 'bg-indigo-200/20', dur: 24, delay: 3, hideMobile: false },
    { size: 160, mobileSize: 96, x: '50%', y: '65%', color: 'bg-sky-200/20', dur: 22, delay: 1, hideMobile: false },
  ];

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => {
        if (isMobile && o.hideMobile) return null;
        const size = isMobile ? o.mobileSize : o.size;
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${o.color}`}
            style={{ width: size, height: size, left: o.x, top: o.y }}
            animate={{ x: [0, 20, -15, 0], y: [0, -20, 10, 0], scale: [1, 1.05, 0.97, 1] }}
            transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────
function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate(val) {
        if (ref.current) ref.current.textContent = Math.round(val) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Card reveal variants ───────────────────────────────────────────────────
const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

const divisi = [
  { icon: BookOpen, name: 'Kebersihan', desc: 'Jadwal piket, kerja bakti, dan kebersihan lingkungan', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Palette, name: 'Kesenian', desc: 'Kegiatan seni, budaya, dan kreativitas warga', color: 'bg-purple-100 text-purple-600' },
  { icon: Heart, name: 'Keolahragaan', desc: 'Olahraga, turnamen, dan kesehatan fisik', color: 'bg-rose-100 text-rose-600' },
  { icon: Users, name: 'Rohani', desc: 'Kegiatan keagamaan dan pengembangan spiritual', color: 'bg-amber-100 text-amber-600' },
];

const divisionColorMap: Record<string, string> = {
  KEBERSIHAN: 'from-emerald-500 to-teal-500',
  KESENIAN: 'from-purple-500 to-violet-500',
  KEOLAHRAGAAN: 'from-rose-500 to-pink-500',
  ROHANI: 'from-amber-500 to-orange-500',
};

// ── Main component ─────────────────────────────────────────────────────────
export default function HomeClient({
  totalWarga,
  totalAlumni,
  totalAngkatan,
  recentActivities,
  profileAbout,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);

  const stats = [
    { label: 'Warga Aktif', value: totalWarga, suffix: '+', icon: '🏠' },
    { label: 'Alumni', value: totalAlumni, suffix: '+', icon: '🎓' },
    { label: 'Angkatan', value: totalAngkatan, suffix: '', icon: '📅' },
    { label: 'Divisi Aktif', value: 4, suffix: '', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ===== HERO ===== */}
      <motion.section
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-12 sm:pb-16"
      >
        {/* Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white" />
        <div className="pointer-events-none absolute -left-[10%] top-0 h-[400px] w-[400px] sm:h-[700px] sm:w-[700px] rounded-[40%_60%_70%_30%] bg-primary/20 mix-blend-multiply blur-[120px] animate-blob" />
        <div className="pointer-events-none absolute left-[15%] -top-[10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-[60%_40%_30%_70%] bg-blue-200/40 mix-blend-multiply blur-[120px] animate-blob animation-delay-2000" />
        <div className="pointer-events-none absolute -left-[5%] bottom-[-10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-[50%_50%_60%_40%] bg-blue-300/30 mix-blend-multiply blur-[120px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {mounted && <FloatingOrbs />}

        <div className="container relative mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            {/* Label */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              Selamat Datang di
            </motion.p>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-snug tracking-tight text-foreground"
            >
              Layanan Terpadu Warga{' '}
              <span className="text-primary">Asrama Mahasiswa</span>
              <br className="hidden sm:block" />
              {' '}Kabupaten Sambas Yogyakarta
            </motion.h1>

            {/* Sub-description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
            >
              Platform digital resmi untuk warga, pengurus, dan calon warga Asrama Mahasiswa
              Kabupaten Sambas di Daerah Istimewa Yogyakarta.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link
                href="/login"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-blue-200/50 bg-blue-500/10 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-primary shadow-[0_8px_32px_rgba(37,99,235,0.15)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-blue-500/20 hover:shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:border-blue-300/60"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-400/20 via-transparent to-primary/20 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">Akses Warga Asrama</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/daftar-warga"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-slate-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:text-primary hover:shadow-md"
              >
                🏠 Daftar Calon Warga
              </Link>
            </motion.div>

            {/* Stat counters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-10 md:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/60 shadow-sm bg-white/30 backdrop-blur-xl divide-x divide-white/40"
            >
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center px-2 sm:px-4 py-4 sm:py-5 bg-white/60 hover:bg-white/80 transition-colors">
                  <span className="text-xl sm:text-2xl mb-1">{s.icon}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                    <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
        >
          <span className="text-[11px] font-medium uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ===== DIVISI ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-16 md:py-24 lg:py-32">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.05),_transparent_70%)]" />
        <div className="container relative mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-10 md:mb-16 max-w-2xl text-center"
          >
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Organisasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Divisi Asrama
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Empat pilar kegiatan yang mewadahi minat, bakat, dan pengembangan diri warga
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
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
                  className="group rounded-2xl border border-border bg-white p-4 sm:p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className={`mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${item.color} transition-all group-hover:scale-110`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">{item.name}</h3>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SEKILAS PROFIL ===== */}
      <AboutSection about={profileAbout} />

      {/* ===== GALERI KEGIATAN PREVIEW ===== */}
      {recentActivities.length > 0 && (
        <GaleriPreviewSection activities={recentActivities} />
      )}

      {/* ===== SYARAT WARGA ===== */}
      <SyaratWargaSection />

      {/* ===== MAP LOCATION ===== */}
      <MapSection />

      {/* ===== TESTIMONIAL ===== */}
      <TestimonialSection />

      {/* ===== CTA ===== */}
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 sm:p-10 md:p-14 text-center text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              {/* BG blobs */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-2xl" />

              <div className="relative z-10">
                <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                  Bergabung Sekarang
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold md:text-4xl">Siap Bergabung?</h2>
                <p className="mt-4 text-white/75 max-w-md mx-auto text-sm md:text-base">
                  Sudah memenuhi syarat? Daftar sebagai calon warga, atau login untuk mengakses dashboard warga asrama.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link
                    href="/daftar-warga"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-blue-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    🏠 Daftar Calon Warga
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all hover:border-white/70 hover:bg-white/10"
                  >
                    Login Warga
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ── Testimonial Section ────────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      'Tinggal di AMKS bukan sekadar kost — ini adalah rumah kedua. Saya belajar berorganisasi, berteman lintas angkatan, dan tumbuh sebagai manusia yang lebih mandiri.',
    name: 'Arif Zefrizen',
    year: 'Angkatan 2023',
    role: 'Alumni',
    avatar: 'MR',
    color: 'bg-blue-500',
  },
  {
    quote:
      'Dari AMKS saya dapat jaringan yang luar biasa. Teman-teman lintas jurusan dan angkatan membantu saya dalam kuliah maupun mencari kerja setelah lulus.',
    name: 'Dwi Aldi',
    year: 'Angkatan 2021',
    role: 'Alumni',
    avatar: 'MR',
    color: 'bg-indigo-500',
  },
  {
    quote:
      'Program kegiatan divisinya variatif banget. Mulai dari olahraga, seni, sampai kajian rohani — semua ada. Tidak pernah bosan tinggal di sini.',
    name: 'Al Hajj',
    year: 'Angkatan 2024',
    role: 'Alumni',
    avatar: 'DP',
    color: 'bg-emerald-500',
  },
];

function TestimonialSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50/60 py-16 md:py-24 lg:py-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="container relative mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 md:mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Suara Warga
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Apa Kata Mereka?
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Pengalaman nyata dari alumni Asrama Mahasiswa Kabupaten Sambas Yogyakarta
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={cardReveal}
              className="relative flex flex-col rounded-2xl sm:rounded-3xl border border-border bg-white p-4 sm:p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Quote icon */}
              <Quote className="mb-3 sm:mb-4 h-5 w-5 sm:h-7 sm:w-7 shrink-0 text-primary/30" />

              <p className="flex-1 text-xs sm:text-sm leading-relaxed text-slate-600 italic line-clamp-4 sm:line-clamp-none">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3 border-t border-slate-100 pt-3 sm:pt-5">
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${t.color} text-xs sm:text-sm font-bold text-white`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t.role} · {t.year}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About Section ──────────────────────────────────────────────────────────
function AboutSection({ about }: { about: string | null }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const highlights = [
    { icon: '🏠', label: 'Hunian Nyaman', desc: 'Fasilitas lengkap untuk mahasiswa Sambas di Yogyakarta' },
    { icon: '🤝', label: 'Komunitas Solid', desc: 'Kebersamaan dan rasa kekeluargaan yang erat antar sesama' },
    { icon: '📚', label: 'Pengembangan Diri', desc: 'Ruang tumbuh akademik, seni, rohani, dan olahraga' },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-16 md:py-24 lg:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] -translate-x-1/2 rounded-full bg-blue-50/80 blur-3xl" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Tentang Kami
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-snug">
              Rumah Kedua{' '}
              <span className="text-primary">Rang Bujang Sambas</span>
              {' '}di Yogyakarta
            </h2>
            <p className="mt-5 text-sm md:text-base text-muted-foreground leading-relaxed">
              {about
                ? about
                : 'Asrama Mahasiswa Kabupaten Sambas Yogyakarta (AMKS) adalah tempat tinggal sekaligus komunitas bagi mahasiswa asal Kabupaten Sambas, Kalimantan Barat yang sedang menempuh pendidikan di Daerah Istimewa Yogyakarta. Di sini, kami membangun karakter, kebersamaan, dan prestasi bersama.'}
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                    {h.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{h.label}</p>
                    <p className="text-sm text-muted-foreground">{h.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Link
                href="/tentang-kami"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
              >
                Selengkapnya tentang asrama
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: visual card stack */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mt-4 lg:mt-0"
          >
            {/* Decorative card behind */}
            <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 w-full h-full rounded-3xl bg-gradient-to-br from-blue-200/50 to-indigo-200/50 border border-blue-100" />
            <div className="absolute -right-1 sm:-right-2 -top-1 sm:-top-2 w-full h-full rounded-3xl bg-gradient-to-br from-blue-100/50 to-sky-100/50 border border-blue-100/50" />

            {/* Main card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-2xl shadow-blue-500/30">
              <div className="text-4xl sm:text-5xl mb-4">🏛️</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">AMKS Yogyakarta</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Asrama Mahasiswa Kabupaten Sambas — menjadi rumah, sekolah, dan komunitas bagi generasi Sambas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Kab. Sambas', sub: 'Kalimantan Barat' },
                  { label: 'Yogyakarta', sub: 'D.I. Yogyakarta' },
                ].map((loc) => (
                  <div key={loc.label} className="rounded-2xl bg-white/15 backdrop-blur-sm p-3 sm:p-4">
                    <MapPin className="h-4 w-4 mb-1.5 text-white/70" />
                    <p className="font-semibold text-sm">{loc.label}</p>
                    <p className="text-white/60 text-xs">{loc.sub}</p>
                  </div>
                ))}
              </div>

              {/* Link to profil */}
              <Link
                href="/tentang-kami"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm py-3 text-sm font-semibold transition-colors hover:bg-white/30"
              >
                Lihat Profil Lengkap <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Galeri Preview Section ─────────────────────────────────────────────────
function GaleriPreviewSection({ activities }: { activities: ActivityPreview[] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 md:py-24 lg:py-32">
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="container relative mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-12"
        >
          <div>
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Galeri Kegiatan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Kegiatan Terkini
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">
              Dokumentasi momen kebersamaan dan kegiatan warga asrama
            </p>
          </div>
          <Link
            href="/tentang-kami/galeri"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-primary/30 hover:text-primary hover:shadow-md shrink-0 min-h-[44px]"
          >
            <Images className="h-4 w-4" />
            Lihat Semua
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 sm:gap-6">
          {activities.slice(0, 3).map((act, i) => {
            const gradientClass = act.division
              ? divisionColorMap[act.division] ?? 'from-slate-400 to-slate-600'
              : 'from-blue-500 to-indigo-600';

            return (
              <motion.div
                key={act.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardReveal}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 220, damping: 20 } }}
                className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <Link href={`/tentang-kami/${act.id}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Lihat {act.title}</span>
                </Link>

                {/* Image / Gradient fallback */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {act.coverUrl ? (
                    <Image
                      src={act.coverUrl}
                      alt={act.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                      <span className="text-5xl opacity-50">📸</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

                  {/* Division badge */}
                  {act.division && (
                    <span className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-slate-700">
                      {act.division.charAt(0) + act.division.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5">
                  {act.startAt && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(act.startAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                  )}
                  <h3 className="font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{act.description}</p>
                  )}
                  {act.location && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{act.location}</span>
                    </div>
                  )}
                </div>

                {/* Hover accent */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
