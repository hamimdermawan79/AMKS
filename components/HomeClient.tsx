'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, animate, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Images, ChevronDown, Quote, Home, ArrowRight, ChevronLeft, ChevronRight,
} from 'lucide-react';
import MapSection from '@/components/MapSection';
import SyaratWargaSection from '@/components/SyaratWargaSection';
import Marquee from '@/components/Marquee';
import KegiatanTerkiniSection from '@/components/ui/gallery-animation';
import AnimatedMarqueeHero from '@/components/ui/hero-3';
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

interface FacilityItem {
  id: string;
  name: string;
  category: string | null;
  photoUrl: string | null;
  condition: string | null;
  quantity: number;
}

interface Props {
  totalWarga: number;
  totalAlumni: number;
  totalAngkatan: number;
  recentActivities: ActivityPreview[];
  profileAbout: string | null;
  facilityItems?: FacilityItem[];
  divisionImages?: string[];
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
  facilityItems = [],
  divisionImages = [],
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
    { label: 'Warga Aktif', value: totalWarga, suffix: '+', href: '/daftar-warga' },
    { label: 'Alumni', value: totalAlumni, suffix: '+', href: '/arsip-dokumen/buku-alumni' },
    { label: 'Angkatan', value: totalAngkatan, suffix: '', href: '/arsip-dokumen/buku-alumni' },
    { label: 'Divisi', value: 5, suffix: '', href: '/tentang-kami/struktur' },
  ];

  const activityImages = recentActivities
    .map((a) => a.coverUrl)
    .filter((url): url is string => Boolean(url));

  const fallbackHeroImages = [
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
  ];

  const [heroImage, setHeroImage] = useState<string>(
    activityImages[0] || fallbackHeroImages[0]
  );

  useEffect(() => {
    const pool = activityImages.length > 0 ? activityImages : fallbackHeroImages;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setHeroImage(pool[randomIndex]);
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-white">

      {/* ===== HERO (Background hero-bg.png + Loaded Random Gambar Kegiatan di Kanan + Typography Rata Kiri) ===== */}
      <motion.section
        id="home-hero"
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative z-10 flex min-h-[85vh] lg:min-h-[92vh] flex-col justify-between bg-white pt-24 pb-6 sm:pt-32 sm:pb-8 lg:pt-28 lg:pb-8 overflow-hidden"
      >
        {/* Layer 1: Background Hero (hero-bg.png) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/images/hero-bg.webp"
            alt="AMKS Hero Background"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            draggable={false}
            loading="eager"
          />
        </div>

        {/* Layer 2: Loaded Random Gambar Kegiatan (Rata Kanan Penuh dengan Gradient Mask Memudar ke Kiri) */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[85vw] lg:w-[58vw] xl:w-[52vw] h-full pointer-events-none select-none z-[1] overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.04)_10%,rgba(0,0,0,0.4)_35%,rgba(0,0,0,0.85)_65%,black_90%,black_100%)]">
          <img
            src={heroImage}
            alt="Kegiatan AMKS"
            className="w-full h-full object-cover object-right select-none pointer-events-none opacity-40 sm:opacity-55 lg:opacity-100"
            draggable={false}
            loading="eager"
          />
        </div>

        {/* Main Content Area */}
        <div className="container relative mx-auto px-5 sm:px-6 lg:px-8 z-10 my-auto">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 relative">

            {/* Kolom Kiri: Classy Editorial Typography (Clean Tanpa Tombol) */}
            <div className="flex flex-col text-left lg:col-span-7 xl:col-span-7 z-10 pt-2 pb-2 sm:py-4 relative">
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="font-serif text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-normal leading-[1.15] tracking-tight text-slate-900"
              >
                Tempat Bekumpol<br />
                Biak Sambas<br />
                di{' '}
                <span className="font-script text-5xl sm:text-7xl md:text-8xl xl:text-9xl text-primary font-normal tracking-normal inline-block ml-1">
                  Yogyakarta
                </span>
              </motion.h1>
            </div>

          </div>
        </div>

        {/* Minimalist Compact KPI Stats — Paling Bawah & Centered */}
        <div className="container relative mx-auto px-4 z-10 pt-6 pb-2 sm:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-center">
                <Link
                  href={s.href}
                  className="group flex flex-col items-center text-center transition-opacity hover:opacity-80"
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums tracking-tight transition-colors group-hover:text-primary font-montserrat">
                    <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-slate-500 font-medium font-montserrat transition-colors group-hover:text-slate-900 mt-0.5">
                    {s.label}
                  </span>
                </Link>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== DIVISI ===== */}
      <section className="relative z-20 w-full overflow-hidden pt-20 pb-28 sm:pt-24 sm:pb-36 lg:pb-40 bg-white rounded-b-[48px] sm:rounded-b-[72px] md:rounded-b-[96px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.18)]">
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-10 sm:mb-14 max-w-3xl text-center"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-slate-900 leading-[1.06]">
              Divisi Asrama
            </h2>
          </motion.div>
        </div>

        {/* Division artwork running marquee — constrained container with pure seamless alpha mask */}
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-5xl lg:max-w-6xl py-3"
          >
            <Marquee duration={70}>
              {(divisionImages.length > 0
                ? [...divisionImages, ...divisionImages]
                : [
                  '/images/divisi/keolahragaan.webp',
                  '/images/divisi/kesenian.webp',
                  '/images/divisi/kebersihan.webp',
                  '/images/divisi/rohani.webp',
                  '/images/divisi/keamanan.webp',
                  '/images/divisi/keolahragaan.webp',
                  '/images/divisi/kesenian.webp',
                  '/images/divisi/kebersihan.webp',
                  '/images/divisi/rohani.webp',
                  '/images/divisi/keamanan.webp',
                ]
              ).map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="group relative mx-2.5 sm:mx-3 md:mx-3.5 shrink-0 select-none py-2"
                >
                  <div className="relative h-[210px] w-[160px] sm:h-[250px] sm:w-[190px] md:h-[280px] md:w-[215px] overflow-hidden rounded-2xl md:rounded-[22px] transition-transform duration-500 group-hover:scale-[1.04]">
                    <img
                      src={src}
                      alt="Artwork Divisi Asrama"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </Marquee>
          </motion.div>
        </div>
      </section>

      {/* ===== SEKILAS PROFIL: BARU ===== */}
      <AboutSection about={profileAbout} />

      {/* ===== KEGIATAN TERKINI & FASILITAS ASRAMA (MERGED SECTION WITH SHARED BACKGROUND) ===== */}
      <section className="relative z-20 w-full overflow-hidden pt-28 pb-36 sm:pt-36 sm:pb-44 lg:pt-44 lg:pb-52 rounded-t-[48px] sm:rounded-t-[72px] md:rounded-t-[96px] rounded-b-[48px] sm:rounded-b-[72px] md:rounded-b-[96px] shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.12),0_25px_50px_-12px_rgba(0,0,0,0.12)]">
        {/* Background Image: public/images/kegiatan-fasilitas-bg.webp with soft opacity */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none bg-white overflow-hidden">
          <img
            src="/images/kegiatan-fasilitas-bg.webp"
            alt="Background Kegiatan dan Fasilitas"
            className="w-full h-[112%] -translate-y-8 sm:-translate-y-12 md:-translate-y-16 object-fill object-top opacity-30 sm:opacity-35 transition-all"
            loading="lazy"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 space-y-24 sm:space-y-32 lg:space-y-40">
          {/* Kegiatan Terkini */}
          <KegiatanTerkiniSection activities={recentActivities} />

          {/* Fasilitas Asrama */}
          {facilityItems.length > 0 && (
            <FasilitasSection items={facilityItems} />
          )}
        </div>
      </section>

      {/* ===== SYARAT WARGA ===== */}
      <SyaratWargaSection />

      {/* ===== MAP LOCATION ===== */}
      <MapSection />

      {/* ===== TESTIMONIAL ===== */}
      <TestimonialSection />

      {/* ===== CTA (Editorial 2-Column with Clean Large Dual Logos) ===== */}
      <section className="relative z-10 w-full overflow-hidden bg-[#edf4fc] pt-48 pb-20 sm:pt-60 sm:pb-28 lg:pt-68 lg:pb-36 -mt-24 sm:-mt-32 lg:-mt-40">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl pt-8 sm:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
            
            {/* Sisi Kiri: Typography Besar Editorial (Charcoal & Brand Blue) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center text-left"
            >
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-normal tracking-tight text-slate-900 leading-[1.04]">
                Siap menjadi<br />
                bagian dari <span className="text-primary font-normal font-serif">AMKS?</span>
              </h2>

              <p className="mt-5 sm:mt-6 text-sm sm:text-base text-slate-600 leading-relaxed font-sans max-w-lg text-justify">
                Mari bergabung bersama keluarga besar Asrama Mahasiswa Kabupaten Sambas di Yogyakarta. Kembangkan potensi diri, raih prestasi akademik, dan jalin persaudaraan erat bersama sesama perantau.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/daftar-warga"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm sm:text-base font-medium text-white shadow-md transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-95"
                >
                  <span>Daftar Calon Warga</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-800 border border-slate-300 px-7 py-3.5 text-sm sm:text-base font-medium transition-all duration-200 shadow-sm hover:shadow"
                >
                  <span>Akses Warga Asrama</span>
                </Link>
              </div>
            </motion.div>

            {/* Sisi Kanan: Clean Extra Large Dual Logos (Hidden di Mobile, Gap Sempit dengan Separator) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden lg:flex lg:col-span-5 xl:col-span-5 justify-center lg:justify-end"
            >
              <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
                {/* Logo SIMAS */}
                <img
                  src="/images/2-simas-logo.webp"
                  alt="Logo SIMAS Sambas"
                  className="h-36 sm:h-44 md:h-52 lg:h-60 xl:h-64 w-auto object-contain select-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />

                {/* Garis Pemisah Minimalis */}
                <div className="w-px h-32 sm:h-40 md:h-48 lg:h-56 bg-slate-300/80" />

                {/* Logo AMKS */}
                <img
                  src="/images/3-amks-logo.webp"
                  alt="Logo AMKS Yogyakarta"
                  className="h-36 sm:h-44 md:h-52 lg:h-60 xl:h-64 w-auto object-contain select-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}

// ── Testimonial Section (3D Isometric Smooth Running Vertical Marquee - Clean Light) ──
const testimonialsCol1 = [
  {
    name: 'Arif Zefrizen',
    username: '@arifzefrizen',
    origin: 'Sambas',
    originCode: 'SB',
    quote: 'Tinggal di AMKS bukan sekadar tempat tinggal; ini rumah kedua yang membentuk kedisiplinan dan rasa kekeluargaan yang erat.',
    avatar: 'AZ',
    avatarBg: 'bg-blue-600',
  },
  {
    name: 'Dwi Aldi',
    username: '@dwialdi',
    origin: 'Tebas',
    originCode: 'TB',
    quote: 'Dari AMKS saya mendapatkan relasi dan persaudaraan lintas angkatan yang luar biasa membantu perkuliahan di Jogja.',
    avatar: 'DA',
    avatarBg: 'bg-indigo-600',
  },
];

const testimonialsCol2 = [
  {
    name: 'Al Hajj',
    username: '@alhajj',
    origin: 'Pemangkat',
    originCode: 'PM',
    quote: 'Program divisi aktif dari olahraga hingga kajian rohani membuat masa studi di perantauan selalu seimbang dan produktif.',
    avatar: 'AH',
    avatarBg: 'bg-emerald-600',
  },
  {
    name: 'Farhan Maulana',
    username: '@farhan_m',
    origin: 'Jawai',
    originCode: 'JW',
    quote: 'Lingkungan asrama yang aman, tenang, dan fasilitasnya sangat mendukung kenyamanan saat mengerjakan tugas akhir.',
    avatar: 'FM',
    avatarBg: 'bg-purple-600',
  },
];

const testimonialsCol3 = [
  {
    name: 'Rian Pratama',
    username: '@rianpratama',
    origin: 'Teluk Keramat',
    originCode: 'TK',
    quote: 'Solidaritas Biak Sambas di Yogyakarta begitu terasa di sini. Banyak kenangan dan pembelajaran organisasi yang berharga.',
    avatar: 'RP',
    avatarBg: 'bg-amber-600',
  },
  {
    name: 'Dimas Wahyudi',
    username: '@dimasw',
    origin: 'Paloh',
    originCode: 'PL',
    quote: 'Mental kepemimpinan dan rasa saling tolong-menolong antar warga terasah sangat baik lewat kepengurusan asrama.',
    avatar: 'DW',
    avatarBg: 'bg-rose-600',
  },
];

function ReviewCard({ t }: { t: (typeof testimonialsCol1)[0] }) {
  return (
    <div className="w-64 sm:w-72 md:w-80 rounded-[20px] bg-white border border-slate-200/90 p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-xl select-none mb-6 sm:mb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${t.avatarBg} text-xs sm:text-sm font-bold text-white shadow-sm ring-1 ring-white/10`}
          >
            {t.avatar}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 font-montserrat">
              {t.name}
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              {t.username}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest font-montserrat">
            {t.originCode}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            {t.origin}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed font-sans">
        {t.quote}
      </p>
    </div>
  );
}

function TestimonialSection() {
  return (
    <section className="relative z-20 w-full overflow-hidden bg-white text-slate-900 pt-20 pb-28 sm:pt-24 sm:pb-36 lg:pb-40 rounded-b-[48px] sm:rounded-b-[72px] md:rounded-b-[96px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]">
      {/* Header — z-30 agar berada di atas gradien */}
      <div className="container relative mx-auto px-6 mb-10 sm:mb-14 z-30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-slate-900 leading-[1.1]">
            Suara Warga<span className="text-primary font-sans font-bold">.</span>
          </h2>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-600 font-sans">
            Pengalaman dan kesan berharga dari warga serta alumni Asrama Mahasiswa Kabupaten Sambas di Yogyakarta
          </p>
        </motion.div>
      </div>

      {/* 3D Isometric Tilted Vertical Marquee Arena */}
      <div className="relative z-10 flex h-[480px] sm:h-[540px] md:h-[600px] w-full flex-row items-center justify-center overflow-hidden [perspective:1000px] select-none">
        {/* Tilted Marquee Stage */}
        <div className="flex flex-row gap-5 sm:gap-7 md:gap-8 [transform:rotateX(22deg)_rotateZ(-20deg)_skewX(12deg)_scale(1.05)] sm:[transform:rotateX(22deg)_rotateZ(-20deg)_skewX(12deg)_scale(1.12)] [transform-style:preserve-3d]">
          {/* Column 1 (Scrolls Up) */}
          <div className="marquee-vertical-mask h-[580px] sm:h-[660px] md:h-[740px] overflow-hidden">
            <div className="marquee-track-vertical flex flex-col">
              {testimonialsCol1.concat(testimonialsCol1).map((t, idx) => (
                <ReviewCard key={`col1-${idx}`} t={t} />
              ))}
            </div>
          </div>

          {/* Column 2 (Scrolls Down) */}
          <div className="marquee-vertical-mask h-[580px] sm:h-[660px] md:h-[740px] overflow-hidden">
            <div className="marquee-track-vertical-reverse flex flex-col">
              {testimonialsCol2.concat(testimonialsCol2).map((t, idx) => (
                <ReviewCard key={`col2-${idx}`} t={t} />
              ))}
            </div>
          </div>

          {/* Column 3 (Scrolls Up - Desktop) */}
          <div className="marquee-vertical-mask h-[580px] sm:h-[660px] md:h-[740px] overflow-hidden hidden sm:block">
            <div className="marquee-track-vertical flex flex-col">
              {testimonialsCol3.concat(testimonialsCol3).map((t, idx) => (
                <ReviewCard key={`col3-${idx}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Bleed Section Gradient Overlays (Solid White Menutup Ujung Atas & Bawah Section Sepenuhnya) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 sm:h-60 md:h-72 bg-gradient-to-b from-white from-35% via-white/95 via-70% to-transparent z-20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 sm:h-60 md:h-72 bg-gradient-to-t from-white from-35% via-white/95 via-70% to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-white from-30% via-white/90 to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-white from-30% via-white/90 to-transparent z-20" />

      {/* Google Maps 4.9 Star Rating Summary (Clean Plain Text Tanpa Card — z-30) */}
      <div className="relative z-30 mt-6 sm:mt-8 flex items-center justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-slate-700 font-sans">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-900 font-montserrat mr-0.5">
              4.9
            </span>
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, idx) => (
                <svg
                  key={idx}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <span>on</span>
          <div className="inline-flex items-center gap-1 font-semibold text-slate-900">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="#EA4335"
              />
              <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
            </svg>
            <span>Google Maps</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600">99+ Penilaian</span>
        </div>
      </div>
    </section>
  );
}

// ── About Section (Tentang Kami — Gradient Navy with Rounded Section Boundary) ──
function AboutSection({ about }: { about: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  // Ambil hanya paragraf pertama dari narasi profil asrama
  const firstParagraph = about
    ? about
        .split(/\r?\n\s*\r?\n|\r?\n/)
        .map((p) => p.trim())
        .find((p) => p.length > 0) || about.trim()
    : 'Asrama Mahasiswa Kabupaten Sambas merupakan tempat tinggal mahasiswa yang berasal dari kabupaten sambas kalimantan barat, yang sedang menempuh masa studi lanjut di Kota Yogyakarta.';

  return (
    <section
      id="tentang-kami"
      ref={ref}
      className="relative z-10 w-full overflow-hidden bg-gradient-to-r from-[#12243d] via-[#183459] to-[#214778] text-white pt-48 pb-48 sm:pt-60 sm:pb-60 lg:pt-68 lg:pb-68 -mt-24 -mb-24 sm:-mt-32 sm:-mb-32 lg:-mt-40 lg:-mb-40"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-6 sm:py-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          
          {/* Sisi Kiri: Gambar Besar Karakter Warga */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center lg:col-span-6 xl:col-span-6"
          >
            <div className="relative w-full max-w-[520px] lg:max-w-none flex items-center justify-center bg-transparent">
              <img
                src="/images/about-us-char.webp"
                alt="Warga Asrama Mahasiswa Kabupaten Sambas"
                className="w-full h-auto max-h-[580px] lg:max-h-[660px] object-contain object-center select-none pointer-events-none bg-transparent"
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Sisi Kanan: Editorial Layout (Lighter Right Blue Ambient) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col justify-center lg:col-span-6 xl:col-span-6"
          >
            {/* Giant Title: Tentang Kami. */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-serif font-normal tracking-tight text-white leading-[1.05]">
              Tentang Kami<span className="text-sky-300 font-sans font-bold">.</span>
            </h2>

            {/* 2-Column Content Grid Below Heading */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              {/* Kolom Sub Kiri: Lead / Statement Besar */}
              <div className="md:col-span-5">
                <p className="text-base sm:text-lg font-medium text-blue-50 leading-relaxed font-montserrat text-justify">
                  Rumah kedua bagi mahasiswa Sambas di{' '}
                  <span className="text-sky-300 font-semibold">Yogyakarta</span>, berfokus pada
                  pembentukan karakter, solidaritas kekeluargaan, dan prestasi akademik.
                </p>
              </div>

              {/* Kolom Sub Kanan: Paragraf Narasi Detail (Hanya Paragraf Pertama) */}
              <div className="md:col-span-7">
                <p className="text-sm sm:text-base leading-relaxed text-blue-100/90 text-justify font-sans">
                  {firstParagraph}
                </p>
              </div>
            </div>

            {/* Navigasi Profil, Struktur, Galeri */}
            <div className="mt-8 sm:mt-10 flex items-center justify-end gap-5 sm:gap-6 text-sm font-medium text-blue-100">
              <Link
                href="/tentang-kami"
                className="transition-colors hover:text-sky-300"
              >
                Profil
              </Link>
              <Link
                href="/tentang-kami/struktur"
                className="transition-colors hover:text-sky-300"
              >
                Struktur
              </Link>
              <Link
                href="/tentang-kami/galeri"
                className="transition-colors hover:text-sky-300"
              >
                Galeri
              </Link>
            </div>

            {/* Garis Pembatas & CTA */}
            <div className="mt-4 pt-4 border-t border-blue-300/20 flex justify-end">
              <Link
                href="/tentang-kami"
                className="inline-block text-sm font-medium text-blue-100 border-b border-dashed border-blue-300/40 pb-0.5 hover:text-white hover:border-white transition-colors font-montserrat text-right"
              >
                Pelajari selengkapnya tentang profil asrama
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ── Fasilitas Section (Clean Split Layout + Reference Carousel with Thumbnail Strip) ──
function FasilitasSection({ items }: { items: FacilityItem[] }) {
  const facilityList = items.filter((item) => Boolean(item.photoUrl));
  const [currentIndex, setCurrentIndex] = useState(0);

  if (facilityList.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % facilityList.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + facilityList.length) % facilityList.length);
  };

  const current = facilityList[currentIndex];

  return (
    <div className="w-full text-slate-900">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
          
          {/* Sisi Kiri: Clean Photo Carousel dengan Strip Thumbnail di Bawah (Sesuai Referensi) */}
          <div className="lg:col-span-7 xl:col-span-7 order-2 lg:order-1 flex flex-col items-center w-full">
            
            {/* Main Large Photo Frame */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 shadow-xl group select-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={current.photoUrl!}
                    alt={current.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Clean Text Overlay (Nama & Jumlah Barang Ukuran Kompak) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-4 sm:p-6 md:p-7">
                    <div className="flex items-end justify-between gap-4 w-full">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight drop-shadow-md">
                        {current.name}
                      </h3>

                      {current.quantity > 0 && (
                        <span className="text-[11px] sm:text-xs font-semibold text-white/90 drop-shadow-sm shrink-0">
                          {current.quantity} Unit
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Clean Minimalist Navigation Arrows (Hidden on Mobile, Hover on Desktop) */}
              {facilityList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-10"
                    aria-label="Fasilitas sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-10"
                    aria-label="Fasilitas berikutnya"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[1.75]" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Preview Strip di Bawah Foto Utama (Sesuai Gambar Referensi) */}
            {facilityList.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-5 overflow-x-auto py-1 max-w-full px-2">
                {facilityList.map((item, idx) => {
                  const isActive = currentIndex === idx;
                  return (
                    <button
                      key={item.id || `thumb-${idx}`}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative overflow-hidden rounded-lg transition-all duration-300 shrink-0 ${
                        isActive
                          ? 'aspect-[16/10] w-14 sm:w-20 ring-2 ring-slate-900 scale-105 shadow-md opacity-100'
                          : 'aspect-[3/4] w-7 sm:w-10 opacity-50 hover:opacity-100'
                      }`}
                      aria-label={`Pilih ${item.name}`}
                    >
                      <img
                        src={item.photoUrl!}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* Sisi Kanan: Judul Besar 2 Baris & Narasi Tegas */}
          <div className="lg:col-span-5 xl:col-span-5 order-1 lg:order-2 flex flex-col justify-center text-left lg:pl-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-serif font-normal text-slate-900 tracking-tight leading-[1.05]">
              Fasilitas<br />
              Asrama
            </h2>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-lg text-justify">
              Sarana dan prasarana penunjang yang dirawat secara berkala untuk menciptakan kenyamanan serta produktivitas akademik seluruh warga asrama.
            </p>

            <div className="mt-8 sm:mt-10">
              <Link
                href="/fasilitas/inventaris"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-900 border-b border-slate-900 pb-0.5 hover:text-primary hover:border-primary transition-colors font-montserrat group"
              >
                <span>Lihat semua fasilitas dan inventaris</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
