'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Palette, Heart, Users, ShieldCheck,
  GraduationCap, Calendar, MapPin, Images, ChevronDown, Quote,
  Home, Zap, Building2,
} from 'lucide-react';
import MapSection from '@/components/MapSection';
import SyaratWargaSection from '@/components/SyaratWargaSection';
import { useIsLowEndDevice } from '@/lib/animation-utils';

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
    { size: 280, x: '20%', y: '15%', color: 'bg-blue-200/25', dur: 20, delay: 0 },
    { size: 200, x: '70%', y: '30%', color: 'bg-indigo-200/20', dur: 24, delay: 3 },
    { size: 160, x: '50%', y: '65%', color: 'bg-sky-200/20', dur: 22, delay: 1 },
  ];
  const isLowEnd = useIsLowEndDevice();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${o.color}`}
          style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
          animate={isLowEnd ? {} : { x: [0, 20, -15, 0], y: [0, -20, 10, 0], scale: [1, 1.05, 0.97, 1] }}
          transition={isLowEnd ? {} : { duration: o.dur, delay: o.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      ))}
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
  { icon: ShieldCheck, name: 'Keamanan', desc: 'Maintenance CCTV, pengamanan lingkungan, dan inventaris', color: 'bg-blue-100 text-blue-600' },
];

const divisionColorMap: Record<string, string> = {
  KEBERSIHAN: 'from-emerald-500 to-teal-500',
  KESENIAN: 'from-purple-500 to-violet-500',
  KEOLAHRAGAAN: 'from-rose-500 to-pink-500',
  ROHANI: 'from-amber-500 to-orange-500',
  KEAMANAN: 'from-blue-500 to-indigo-500',
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

  const isLowEnd = useIsLowEndDevice();
  const { scrollYProgress } = useScroll();
  const heroScaleRaw = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
  const heroOpacityRaw = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);
  const heroScale = isLowEnd ? 1 : heroScaleRaw;
  const heroOpacity = isLowEnd ? 1 : heroOpacityRaw;

  const stats = [
    { label: 'Warga Aktif', value: totalWarga, suffix: '+', icon: <Users className="h-5 w-5" /> },
    { label: 'Alumni', value: totalAlumni, suffix: '+', icon: <GraduationCap className="h-5 w-5" /> },
    { label: 'Angkatan', value: totalAngkatan, suffix: '', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Divisi Aktif', value: 5, suffix: '', icon: <Zap className="h-5 w-5" /> },
  ];

  return (
    <div className="relative isolate min-h-screen bg-white">

      {/* ===== HERO ===== */}
      <motion.section
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden"
      >
        {/* Blobs */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50/50" />
        <div className="pointer-events-none absolute -left-[10%] top-0 h-[700px] w-[700px] rounded-[40%_60%_70%_30%] bg-primary/20 mix-blend-multiply blur-[120px] animate-blob" />
        <div className="pointer-events-none absolute left-[15%] -top-[10%] h-[600px] w-[600px] rounded-[60%_40%_30%_70%] bg-blue-200/40 mix-blend-multiply blur-[120px] animate-blob animation-delay-2000" />
        <div className="pointer-events-none absolute -left-[5%] bottom-[-10%] h-[600px] w-[600px] rounded-[50%_50%_60%_40%] bg-blue-300/30 mix-blend-multiply blur-[120px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {mounted && <FloatingOrbs />}

        <div className="container relative mx-auto px-6">
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center lg:gap-14">

            {/* ── Mobile hero ── */}
            <div className="lg:hidden">
              {/* Typography left + Mascot right (overlapping, clipped right) */}
              <div className="relative overflow-x-clip">
                {/* Mascot — bright, shifted right so part is clipped */}
                <motion.img
                  src="/images/1-mascott.webp"
                  alt="Mascot SIMAS-KS"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="pointer-events-none absolute right-[-8%] top-0 h-[130%] w-auto object-contain drop-shadow-xl select-none"
                />

                {/* Typography — left aligned, z above mascot */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative z-10 max-w-[65%] text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl"
                >
                  Tempat<br />
                  Berkumpul<br />
                  Biak Sambas<br />
                  di{' '}<span className="italic text-primary">Yogyakarta</span>
                </motion.h1>
              </div>

              {/* Narasi — full width */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-8 text-justify text-sm leading-relaxed text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2 align-middle"><img src="/images/3-amks-logo.webp" alt="AMKS" className="h-5 w-5 rounded object-contain inline" /><span className="font-semibold text-foreground">SIMAS-KS</span></span> merupakan platform digital resmi Asrama Mahasiswa Kabupaten Sambas di Yogyakarta — wadah terpadu untuk administrasi, pendaftaran calon warga, dan informasi kegiatan asrama.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex flex-col w-full gap-4"
              >
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-blue-200/50 bg-blue-500/10 px-6 py-3.5 text-sm font-bold text-primary shadow-[0_8px_32px_rgba(37,99,235,0.15)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-blue-500/20 hover:shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:border-blue-300/60"
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-400/20 via-transparent to-primary/20 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Akses Warga Asrama</span>
                </Link>
                <Link
                  href="/daftar-warga"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:text-primary hover:shadow-md"
                >
                  <Home className="h-4 w-4" /> Daftar Calon Warga
                </Link>
              </motion.div>

              {/* KPI single line */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 flex items-center justify-center gap-5"
              >
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center gap-1">
                    <span className="text-primary [&>svg]:h-3 [&>svg]:w-3">{s.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-extrabold leading-none tabular-nums text-foreground">
                        <AnimatedCounter to={s.value} suffix={s.suffix} />
                      </span>
                      <span className="text-[8px] font-medium leading-none text-muted-foreground">{s.label}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Desktop layout (unchanged) ── */}
            <div className="hidden w-full lg:col-span-7 lg:block">
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-6xl font-black leading-[1.05] tracking-tight text-foreground lg:text-7xl"
              >
                Tempat Berkumpul<br />
                Biak Sambas<br />
                di{' '}
                <span className="italic text-primary">Yogyakarta</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-6 max-w-2xl text-justify text-sm leading-relaxed text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2 align-middle"><img src="/images/3-amks-logo.webp" alt="AMKS" className="h-5 w-5 rounded object-contain inline" /><span className="font-semibold text-foreground">SIMAS-KS</span></span> merupakan platform digital resmi yang dikelola untuk mendukung pengelolaan Asrama Mahasiswa Kabupaten Sambas di Daerah Istimewa Yogyakarta. Sistem ini menjadi wadah terpadu bagi warga asrama, pengurus, dan calon warga dalam mengakses layanan administrasi, informasi, serta pendaftaran calon warga baru, pengelolaan data huni, hingga penyampaian informasi dan kegiatan asrama.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-8 flex flex-row items-center gap-4"
              >
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-blue-200/50 bg-blue-500/10 px-8 py-4 text-base font-bold text-primary shadow-[0_8px_32px_rgba(37,99,235,0.15)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-blue-500/20 hover:shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:border-blue-300/60"
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-400/20 via-transparent to-primary/20 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Akses Warga Asrama</span>
                </Link>

                <Link
                  href="/daftar-warga"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-7 py-4 text-base font-semibold text-slate-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:text-primary hover:shadow-md"
                >
                  <Home className="h-4 w-4" /> Daftar Calon Warga
                </Link>
              </motion.div>
            </div>

            {/* Right — mascot (desktop only) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="relative hidden justify-end lg:col-span-5 lg:flex"
            >
              <svg className="absolute inset-0 h-full w-full overflow-visible opacity-[0.15]" viewBox="0 0 500 500" fill="none">
                <line x1="50" y1="100" x2="150" y2="80" stroke="currentColor" strokeWidth="0.5" />
                <line x1="180" y1="60" x2="250" y2="120" stroke="currentColor" strokeWidth="0.5" />
                <line x1="280" y1="150" x2="380" y2="100" stroke="currentColor" strokeWidth="0.5" />
                <line x1="120" y1="250" x2="80" y2="320" stroke="currentColor" strokeWidth="0.5" />
                <line x1="320" y1="280" x2="400" y2="250" stroke="currentColor" strokeWidth="0.5" />
                <line x1="200" y1="350" x2="300" y2="380" stroke="currentColor" strokeWidth="0.5" />
                <path d="M60 180 L100 150 L140 190 L110 230 Z" stroke="currentColor" strokeWidth="0.4" />
                <path d="M360 160 L410 130 L440 180 L390 210 Z" stroke="currentColor" strokeWidth="0.4" />
                <path d="M250 400 L290 360 L330 390 L290 430 Z" stroke="currentColor" strokeWidth="0.4" />
                <path d="M80 400 L120 370 L150 410 L100 440 Z" stroke="currentColor" strokeWidth="0.4" />
                <path d="M380 320 L430 290 L460 340 L410 370 Z" stroke="currentColor" strokeWidth="0.4" />
                <circle cx="180" cy="80" r="15" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="420" cy="220" r="20" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="150" cy="380" r="12" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="380" cy="420" r="18" stroke="currentColor" strokeWidth="0.3" />
              </svg>
              <motion.img
                src="/images/1-mascott.webp"
                alt="Mascot SIMAS-KS"
                className="relative z-10 h-auto w-full max-w-xl translate-x-14 drop-shadow-2xl"
                animate={isLowEnd ? {} : { y: [0, -12, 0] }}
                transition={isLowEnd ? {} : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Stat counters — desktop only, centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mx-auto mt-10 hidden items-center justify-center gap-6 sm:flex sm:flex-wrap md:gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="text-primary">{s.icon}</span>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold leading-tight tabular-nums text-foreground">
                    <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-muted-foreground">{s.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
        >
          <span className="text-[11px] font-medium uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={isLowEnd ? {} : { y: [0, 6, 0] }}
            transition={isLowEnd ? {} : { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Page-wide continuous ambient blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full overflow-hidden">
        <div className="absolute left-[5%] top-[70vh] h-[800px] w-[800px] rounded-full bg-blue-200/25 blur-[150px]" />
        <div className="absolute right-[10%] top-[180vh] h-[600px] w-[600px] rounded-full bg-indigo-200/20 blur-[140px]" />
        <div className="absolute left-[40%] top-[300vh] h-[500px] w-[500px] rounded-full bg-sky-200/15 blur-[120px]" />
      </div>

      {/* ===== DIVISI ===== */}
      <section className="relative z-10 overflow-hidden py-24 md:py-32">
        {/* Gradient blending from Hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.05),_transparent_70%)]" />
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              <span className="h-px w-8 bg-blue-400/70" />
              Organisasi
              <span className="h-px w-8 bg-blue-400/70" />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Divisi Asrama
            </h2>
            <p className="mt-3 text-muted-foreground">
              Empat pilar kegiatan yang mewadahi minat, bakat, dan pengembangan diri warga
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
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${item.color} transition-all group-hover:scale-110`}>
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

      {/* ===== SEKILAS PROFIL: BARU ===== */}
      <AboutSection about={profileAbout} />

      {/* ===== GALERI KEGIATAN PREVIEW: BARU ===== */}
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
      <section className="relative z-10 py-24 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-10 md:p-14 text-center text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              {/* BG blobs */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-2xl" />

              <div className="relative z-10">
                <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                  Bergabung Sekarang
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">Siap Bergabung?</h2>
                <p className="mt-4 text-white/75 max-w-md mx-auto">
                  Sudah memenuhi syarat? Daftar sebagai calon warga, atau login untuk mengakses dashboard warga asrama.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/daftar-warga"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Home className="h-4 w-4" /> Daftar Calon Warga
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-4 text-base font-semibold text-white transition-all hover:border-white/70 hover:bg-white/10"
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
      'Tinggal di AMKS bukan sekadar kost; ini adalah rumah kedua. Saya belajar berorganisasi, berteman lintas angkatan, dan tumbuh sebagai manusia yang lebih mandiri.',
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
      'Program kegiatan divisinya variatif banget. Mulai dari olahraga, seni, sampai kajian rohani; semua ada. Tidak pernah bosan tinggal di sini.',
    name: 'Al Hajj',
    year: 'Angkatan 2024',
    role: 'Alumni',
    avatar: 'DP',
    color: 'bg-emerald-500',
  },
];

function TestimonialSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            <span className="h-px w-8 bg-blue-400/70" />
            Suara Warga
            <span className="h-px w-8 bg-blue-400/70" />
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Apa Kata Mereka?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pengalaman nyata dari  alumni Asrama Mahasiswa Kabupaten Sambas Yogyakarta
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={cardReveal}
              className="relative flex flex-col rounded-3xl border border-border bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Quote icon */}
              <Quote className="mb-4 h-7 w-7 shrink-0 text-primary/30" />

              <p className="flex-1 text-sm leading-relaxed text-slate-600 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
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
    { icon: <Home className="h-5 w-5" />, label: 'Hunian Nyaman', desc: 'Fasilitas lengkap untuk mahasiswa Sambas di Yogyakarta' },
    { icon: <Users className="h-5 w-5" />, label: 'Komunitas Solid', desc: 'Kebersamaan dan rasa kekeluargaan yang erat antar sesama' },
    { icon: <BookOpen className="h-5 w-5" />, label: 'Pengembangan Diri', desc: 'Ruang tumbuh akademik, seni, rohani, dan olahraga' },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-50/80 blur-3xl" />

      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              <span className="h-px w-8 bg-blue-400/70" />
              Tentang Kami
              <span className="h-px w-8 bg-blue-400/70" />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-snug">
              Rumah Kedua{' '}
              <span className="text-primary">Rang Bujang Sambas</span>
              {' '}di Yogyakarta
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
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
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: visual card stack */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {/* Decorative card behind */}
            <div className="absolute -right-4 -top-4 w-full h-full rounded-3xl bg-gradient-to-br from-blue-200/50 to-indigo-200/50 border border-blue-100" />
            <div className="absolute -right-2 -top-2 w-full h-full rounded-3xl bg-gradient-to-br from-blue-100/50 to-sky-100/50 border border-blue-100/50" />

            {/* Main card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-500/30">
              <div className="text-5xl mb-4"><Building2 className="h-12 w-12" /></div>
              <h3 className="text-2xl font-bold mb-2">AMKS Yogyakarta</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Asrama Mahasiswa Kabupaten Sambas: rumah, sekolah, dan komunitas bagi generasi Sambas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Kab. Sambas', sub: 'Kalimantan Barat' },
                  { label: 'Yogyakarta', sub: 'D.I. Yogyakarta' },
                ].map((loc) => (
                  <div key={loc.label} className="rounded-2xl bg-white/15 backdrop-blur-sm p-4">
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
                Lihat Profil Lengkap
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
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              <span className="h-px w-8 bg-blue-400/70" />
              Galeri Kegiatan
              <span className="h-px w-8 bg-blue-400/70" />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Kegiatan Terkini
            </h2>
            <p className="mt-2 text-muted-foreground">
              Dokumentasi momen kebersamaan dan kegiatan warga asrama
            </p>
          </div>
          <Link
            href="/tentang-kami/galeri"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-primary/30 hover:text-primary hover:shadow-md shrink-0"
          >
            <Images className="h-4 w-4" />
            Lihat Semua
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <img
                      src={act.coverUrl}
                      alt={act.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
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
                <div className="p-5">
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
