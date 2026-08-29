'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export interface ActivityItem {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startAt: Date | null;
  location: string | null;
  division: string | null;
}

export interface KegiatanCarouselSectionProps {
  activities?: ActivityItem[];
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

export default function KegiatanTerkiniSection({
  activities = [],
}: KegiatanCarouselSectionProps) {
  // Filter real activities with cover photos from database
  const items = activities
    .filter((a) => Boolean(a.coverUrl))
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      title: a.title,
      url: a.coverUrl!,
    }));

  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const paginate = useCallback((newDirection: number) => {
    if (items.length <= 1) return;
    setPage(([prevIndex]) => {
      const nextIndex = (prevIndex + newDirection + items.length) % items.length;
      return [nextIndex, newDirection];
    });
  }, [items.length]);

  const goToSlide = (targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    const newDirection = targetIndex > currentIndex ? 1 : -1;
    setPage([targetIndex, newDirection]);
  };

  // Autoplay slide animation every 6.5s when not hovered (slower, relaxed pace)
  useEffect(() => {
    if (items.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      paginate(1);
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isHovered, paginate]);

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div className="w-full text-slate-900">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Layered Card Container with Brand Theme Accent */}
        <div className="relative">
          
          {/* Offset Background Accent (Lighter Sky/Cyan to Blue Gradient) */}
          <div 
            className="absolute inset-0 translate-x-2.5 translate-y-2.5 sm:translate-x-4 sm:translate-y-4 rounded-[26px] sm:rounded-[36px] bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-500 opacity-90 transition-transform duration-500 shadow-xl"
            aria-hidden="true"
          />

          {/* Main Foreground Card (Gradient Dark Blue from Tentang Kami to Royal Blue) */}
          <div 
            className="relative rounded-[26px] sm:rounded-[36px] bg-gradient-to-br from-[#12243d] via-[#183459] to-[#2563eb] border border-blue-400/30 p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl text-white overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
              
              {/* Sisi Kiri: Carousel Foto Kegiatan (Sejajar Sempurna di Tengah) */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center my-auto">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-2xl md:rounded-[22px] bg-blue-950/25 border border-white/20 shadow-inner group">
                  
                  {/* Sliding Image Frame */}
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 130, damping: 24, mass: 0.9 },
                        opacity: { duration: 0.45, ease: 'easeInOut' },
                      }}
                      className="relative w-full h-full"
                    >
                      <img
                        src={currentItem.url}
                        alt={currentItem.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Gradient overlay on photo bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5 sm:p-4">
                        <Link
                          href={`/tentang-kami/${currentItem.id}`}
                          className="text-xs sm:text-sm font-medium text-white hover:text-sky-200 line-clamp-1 transition-colors drop-shadow-md"
                        >
                          {currentItem.title}
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Clean Minimalist Navigation Arrows (Hidden on Mobile, Hover on Desktop) */}
                  {items.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => paginate(-1)}
                        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-10"
                        aria-label="Foto sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => paginate(1)}
                        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-10"
                        aria-label="Foto berikutnya"
                      >
                        <ChevronRight className="w-4 h-4 stroke-[1.75]" />
                      </button>
                    </>
                  )}

                </div>

                {/* Pagination Dots (Di Luar / Bagian Bawah Foto Card) */}
                {items.length > 1 && (
                  <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 w-full">
                    {items.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          currentIndex === idx
                            ? 'w-6 h-1.5 bg-white shadow-sm'
                            : 'w-1.5 h-1.5 bg-blue-300/40 hover:bg-blue-200'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sisi Kanan: Teks Judul & Deskripsi Narasi */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left lg:py-2 lg:pl-2">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-white tracking-tight leading-[1.1]">
                  Kegiatan <span className="italic font-serif">Terkini</span>
                  <span className="text-sky-300 font-sans font-bold">.</span>
                </h2>

                <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-blue-50/95 leading-relaxed font-sans font-normal text-justify">
                  Beberapa agenda kegiatan rutin terlaksana dalam meningkatkan kebersamaan, solidaritas, dan kreativitas warga asrama mahasiswa Sambas di Yogyakarta.
                </p>

                {/* Link CTA */}
                <div className="mt-6 sm:mt-8 flex items-center">
                  <Link
                    href="/tentang-kami/galeri"
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-sky-200 hover:text-white border-b border-sky-300/40 hover:border-white pb-0.5 transition-colors group/link"
                  >
                    <span>Lihat Semua Galeri Kegiatan</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
