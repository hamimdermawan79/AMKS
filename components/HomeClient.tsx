'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Images, ChevronDown, Quote, Home,
} from 'lucide-react';
import MapSection from '@/components/MapSection';
import SyaratWargaSection from '@/components/SyaratWargaSection';
import Marquee from '@/components/Marquee';
import StickyScrollGallery from '@/components/ui/sticky-scroll';
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
            src="/images/hero-bg.png"
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
      <section className="relative z-10 overflow-hidden py-24 md:py-32 bg-white">
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-slate-900 leading-[1.1]">
              Divisi <span className="text-primary italic font-serif">Asrama</span>
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
            <Marquee duration={30}>
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

      {/* ===== KEGIATAN TERKINI (STICKY SCROLL GALLERY) ===== */}
      <StickyScrollGallery activities={recentActivities} />

      {/* ===== FASILITAS ASRAMA ===== */}
      {facilityItems.length > 0 && (
        <FasilitasSection items={facilityItems} />
      )}

      {/* ===== SYARAT WARGA ===== */}
      <SyaratWargaSection />

      {/* ===== MAP LOCATION ===== */}
      <MapSection />

      {/* ===== TESTIMONIAL ===== */}
      <TestimonialSection />

      {/* ===== CTA (Clean Minimalist Redesign) ===== */}
      <section className="relative z-10 py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl"
          >
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 sm:p-12 md:p-14 text-center text-white border border-blue-400/30 shadow-xl shadow-blue-500/20 relative overflow-hidden">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-tight text-white leading-[1.15]">
                Siap Menjadi Bagian dari <span className="italic font-serif">AMKS?</span>
              </h2>
              <p className="mt-3.5 text-sm sm:text-base text-blue-100/90 max-w-lg mx-auto leading-relaxed">
                Daftarkan diri Anda sebagai calon warga asrama, atau masuk untuk mengakses dashboard layanan digital warga.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                  href="/daftar-warga"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm sm:text-base font-bold text-primary shadow-md transition-all hover:bg-blue-50 active:scale-95"
                >
                  Daftar Calon Warga
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 px-7 py-3.5 text-sm sm:text-base font-semibold text-white transition-all backdrop-blur-sm active:scale-95"
                >
                  Login Warga
                </Link>
              </div>
            </div>
          </motion.div>
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
    <section className="relative overflow-hidden bg-white text-slate-900 py-20 md:py-28">
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

// ── About Section (Tentang Kami — Clean Editorial Split Layout) ─────────────
function AboutSection({ about }: { about: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="tentang-kami"
      ref={ref}
      className="relative z-10 overflow-hidden bg-white py-16 sm:py-24 lg:py-28"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          
          {/* Sisi Kiri: Gambar Besar, Clean, Tanpa Border, Tanpa Badge */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center lg:col-span-6 xl:col-span-6"
          >
            <div className="relative w-full max-w-[520px] lg:max-w-none flex items-center justify-center">
              <img
                src="/images/about-us-char.png"
                alt="Warga Asrama Mahasiswa Kabupaten Sambas"
                className="w-full h-auto max-h-[580px] lg:max-h-[660px] object-contain object-center select-none pointer-events-none"
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Sisi Kanan: Editorial Layout Sesuai Referensi */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col justify-center lg:col-span-6 xl:col-span-6"
          >
            {/* Giant Title: Tentang Kami. */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-serif font-normal tracking-tight text-slate-900 leading-[1.05]">
              Tentang Kami<span className="text-primary font-sans font-bold">.</span>
            </h2>

            {/* 2-Column Content Grid Below Heading */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              {/* Kolom Sub Kiri: Lead / Statement Besar */}
              <div className="md:col-span-5">
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-montserrat text-justify">
                  Rumah kedua bagi mahasiswa Sambas di{' '}
                  <span className="text-primary font-semibold">Yogyakarta</span>, berfokus pada
                  pembentukan karakter, solidaritas kekeluargaan, dan prestasi akademik.
                </p>
              </div>

              {/* Kolom Sub Kanan: Paragraf Narasi Detail */}
              <div className="md:col-span-7 space-y-4">
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 text-justify">
                  {about
                    ? about
                    : 'Asrama Mahasiswa Kabupaten Sambas merupakan tempat tinggal mahasiswa yang berasal dari kabupaten sambas kalimantan barat, yang sedang menempuh masa studi lanjut di Kota Yogyakarta.'}
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 text-justify">
                  Melalui berbagai program divisi aktif, dari keolahragaan, kesenian, kebersihan, kerohanian hingga keamanan, kami berkomitmen menciptakan lingkungan asrama yang produktif, aman, dan berdaya saing.
                </p>
              </div>
            </div>

            {/* Navigasi Profil, Struktur, Galeri di atas garis, rata kanan, tanpa pemisah "/" */}
            <div className="mt-8 sm:mt-10 flex items-center justify-end gap-5 sm:gap-6 text-sm font-medium text-slate-600">
              <Link
                href="/tentang-kami"
                className="transition-colors hover:text-primary"
              >
                Profil
              </Link>
              <Link
                href="/tentang-kami/struktur"
                className="transition-colors hover:text-primary"
              >
                Struktur
              </Link>
              <Link
                href="/tentang-kami/galeri"
                className="transition-colors hover:text-primary"
              >
                Galeri
              </Link>
            </div>

            {/* Garis Pembatas & CTA di bawah garis, rata kanan, tanpa bold, link dengan garis putus-putus */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
              <Link
                href="/tentang-kami"
                className="inline-block text-sm font-medium text-slate-900 border-b border-dashed border-slate-900 pb-0.5 hover:text-primary hover:border-primary transition-colors font-montserrat text-right"
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

// ── Fasilitas Section (Compact Collage Photography Layout with Dynamic Hover) ──
function FasilitasSection({ items }: { items: FacilityItem[] }) {
  // Susun 8 barang fasilitas ke dalam 3 kolom persis seperti layout referensi
  const col1 = items.slice(0, 2);
  const col2 = items.slice(2, 5);
  const col3 = items.slice(5, 8);

  return (
    <section className="relative z-10 py-14 md:py-20 bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header Bersih */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-slate-900 leading-[1.1]">
            Fasilitas <span className="text-primary italic font-serif">Asrama</span>
          </h2>
        </div>

        {/* 3-Column Photography Collage Grid — Konsisten 3 Kolom di Mobile & Desktop */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3.5 items-start">
          {/* Kolom 1 (Kiri - 2 Foto Vertikal) */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1">
            {col1.map((item, idx) => {
              const isTop = idx === 0; // Item 0 di atas, Item 1 di bawah

              return (
                <div
                  key={item.id || `col1-${idx}`}
                  className="group relative w-full aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] bg-slate-100 shadow-sm cursor-pointer"
                >
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {/* Hover Overlay: Tersembunyi di desktop saat tidak di-hover, muncul saat kursor diarahkan */}
                  <div
                    className={`absolute inset-0 transition-all duration-300 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isTop
                        ? 'bg-gradient-to-b from-black/85 via-black/25 to-transparent'
                        : 'bg-gradient-to-t from-black/85 via-black/25 to-transparent'
                      }`}
                  >
                    <div
                      className={`absolute inset-x-0 ${isTop
                          ? 'top-0 pt-2.5 px-2.5 sm:pt-3.5 sm:px-3.5 md:pt-4 md:px-4'
                          : 'bottom-0 pb-2.5 px-2.5 sm:pb-3.5 sm:px-3.5 md:pb-4 md:px-4'
                        } flex items-start justify-between gap-1.5`}
                    >
                      {/* Nama Barang (Kiri) */}
                      <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm drop-shadow-md line-clamp-2 max-w-[65%]">
                        {item.name}
                      </h3>
                      {/* Status / Kondisi Barang (Kanan) — Plain Text Bersih Tanpa Card & Tanpa Warna Alay */}
                      <span className="shrink-0 text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 drop-shadow-sm">
                        {item.condition || 'Baik'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom 2 (Tengah - 3 Foto: Sedang, Landscape, Panjang) */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1">
            {col2.map((item, idx) => {
              const aspectClass =
                idx === 0 ? 'aspect-[4/5]' : idx === 1 ? 'aspect-[16/10]' : 'aspect-[3/4]';
              const isTop = idx === 1; // Item 2 di bawah, Item 3 di atas, Item 4 di bawah (variatif)

              return (
                <div
                  key={item.id || `col2-${idx}`}
                  className={`group relative w-full ${aspectClass} overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] bg-slate-100 shadow-sm cursor-pointer`}
                >
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {/* Hover Overlay: Tersembunyi di desktop saat tidak di-hover, muncul saat kursor diarahkan */}
                  <div
                    className={`absolute inset-0 transition-all duration-300 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isTop
                        ? 'bg-gradient-to-b from-black/85 via-black/25 to-transparent'
                        : 'bg-gradient-to-t from-black/85 via-black/25 to-transparent'
                      }`}
                  >
                    <div
                      className={`absolute inset-x-0 ${isTop
                          ? 'top-0 pt-2.5 px-2.5 sm:pt-3.5 sm:px-3.5 md:pt-4 md:px-4'
                          : 'bottom-0 pb-2.5 px-2.5 sm:pb-3.5 sm:px-3.5 md:pb-4 md:px-4'
                        } flex items-start justify-between gap-1.5`}
                    >
                      {/* Nama Barang (Kiri) */}
                      <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm drop-shadow-md line-clamp-2 max-w-[65%]">
                        {item.name}
                      </h3>
                      {/* Status / Kondisi Barang (Kanan) — Plain Text Bersih Tanpa Card & Tanpa Warna Alay */}
                      <span className="shrink-0 text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 drop-shadow-sm">
                        {item.condition || 'Baik'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom 3 (Kanan - 3 Foto: Sangat Panjang, Landscape, Sedang) */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1">
            {col3.map((item, idx) => {
              const aspectClass =
                idx === 0 ? 'aspect-[3/4] sm:aspect-[2/3]' : idx === 1 ? 'aspect-[16/10]' : 'aspect-[4/5]';
              const isTop = idx === 0 || idx === 2; // Item 5 di atas, Item 6 di bawah, Item 7 di atas (variatif)

              return (
                <div
                  key={item.id || `col3-${idx}`}
                  className={`group relative w-full ${aspectClass} overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] bg-slate-100 shadow-sm cursor-pointer`}
                >
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {/* Hover Overlay: Tersembunyi di desktop saat tidak di-hover, muncul saat kursor diarahkan */}
                  <div
                    className={`absolute inset-0 transition-all duration-300 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isTop
                        ? 'bg-gradient-to-b from-black/85 via-black/25 to-transparent'
                        : 'bg-gradient-to-t from-black/85 via-black/25 to-transparent'
                      }`}
                  >
                    <div
                      className={`absolute inset-x-0 ${isTop
                          ? 'top-0 pt-2.5 px-2.5 sm:pt-3.5 sm:px-3.5 md:pt-4 md:px-4'
                          : 'bottom-0 pb-2.5 px-2.5 sm:pb-3.5 sm:px-3.5 md:pb-4 md:px-4'
                        } flex items-start justify-between gap-1.5`}
                    >
                      {/* Nama Barang (Kiri) */}
                      <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm drop-shadow-md line-clamp-2 max-w-[65%]">
                        {item.name}
                      </h3>
                      {/* Status / Kondisi Barang (Kanan) — Plain Text Bersih Tanpa Card & Tanpa Warna Alay */}
                      <span className="shrink-0 text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 drop-shadow-sm">
                        {item.condition || 'Baik'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tautan Bawah dengan Garis Putus-putus */}
        <div className="mt-10 md:mt-14 text-center">
          <Link
            href="/fasilitas/inventaris"
            className="inline-block text-sm md:text-base font-medium text-slate-900 border-b border-dashed border-slate-900 pb-0.5 hover:text-primary hover:border-primary transition-colors font-montserrat"
          >
            Lihat semua fasilitas dan inventaris
          </Link>
        </div>
      </div>
    </section>
  );
}
