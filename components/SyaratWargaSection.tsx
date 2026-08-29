'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

const REQUIREMENTS_TEXT = `Persyaratan yang diperlukan;

1. KTP Asli Kabupaten Sambas
2. Mahasiswa Aktif di Yogyakarta
3. Mentaati Tata Tertib dan AD/ART Asrama`;

export default function SyaratWargaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: '-60px' });

  // Typewriter effect state
  const [typedText, setTypedText] = useState('');
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (!inView) {
      setTypedText('');
      setIsSelected(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    const startTyping = () => {
      let currentIndex = 0;
      setTypedText('');
      setIsSelected(false);

      typingInterval = setInterval(() => {
        if (!isMounted) {
          clearInterval(typingInterval);
          return;
        }

        currentIndex++;
        setTypedText(REQUIREMENTS_TEXT.slice(0, currentIndex));

        if (currentIndex >= REQUIREMENTS_TEXT.length) {
          clearInterval(typingInterval);

          // 1. Jeda 6 detik setelah selesai mengetik agar nyaman dibaca
          timer = setTimeout(() => {
            if (!isMounted) return;

            // 2. Efek Select All (highlight seluruh teks seperti di macOS)
            setIsSelected(true);

            timer = setTimeout(() => {
              if (!isMounted) return;

              // 3. Hapus semua (delete)
              setTypedText('');
              setIsSelected(false);

              // 4. Jeda tenang 700ms lalu ketik lagi (looping)
              timer = setTimeout(() => {
                if (!isMounted) return;
                startTyping();
              }, 700);

            }, 700);

          }, 6000); // 6 Detik jeda idle
        }
      }, 60); // Typing speed yang tenang dan natural
    };

    startTyping();

    return () => {
      isMounted = false;
      clearInterval(typingInterval);
      clearTimeout(timer);
    };
  }, [inView]);

  return (
    <section 
      id="syarat-warga"
      ref={sectionRef} 
      className="relative z-10 w-full overflow-hidden bg-[#edf4fc] pt-48 pb-28 sm:pt-60 sm:pb-36 lg:pt-68 lg:pb-44 -mt-24 -mb-24 sm:-mt-32 sm:-mb-32 lg:-mt-40 lg:-mb-40"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-6 sm:py-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          
          {/* Sisi Kiri: Typography Besar Editorial (Full Hitam, No Italic) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center text-left lg:col-span-6 xl:col-span-6"
          >
            {/* Giant Title: Jadi bagian dari Keluarga AMKS */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal text-slate-900 tracking-tight leading-[1.06]">
              Jadi bagian dari<br />
              Keluarga AMKS
            </h2>

            {/* Narasi Deskripsi */}
            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-slate-700 leading-relaxed font-sans font-normal max-w-xl">
              Setiap perjalanan dimulai dari sebuah langkah. Kenali persyaratan dan mulailah menjadi bagian dari keluarga besar Asrama Mahasiswa Kabupaten Sambas Yogyakarta.
            </p>

            {/* CTA Button (Tanpa Panah, Tanpa Text Tambahan) */}
            <div className="mt-8 sm:mt-10 flex items-center">
              <Link
                href="/daftar-warga"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm sm:text-base font-medium text-white shadow-md transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-95"
              >
                <span>Daftar Calon Warga</span>
              </Link>
            </div>
          </motion.div>

          {/* Sisi Kanan: macOS Notepad App Window Besar (Ujung Bawah Terpotong Bersih Tanpa Memotong Teks) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-2xl rounded-t-[28px] sm:rounded-t-[36px] bg-[#faf9f6] border-t border-x border-slate-200/90 shadow-[0_25px_60px_rgba(15,23,42,0.12)] overflow-hidden translate-y-8 sm:translate-y-14 md:translate-y-20 -mb-8 sm:-mb-14 md:-mb-20">
              
              {/* macOS Window Top Bar: Bulatan Soft Blue, Tanpa Teks File */}
              <div className="flex items-center px-6 sm:px-8 py-4 sm:py-5 bg-[#f3f1ec]/80 border-b border-slate-200/70 select-none">
                {/* 3 Soft Blue Dots */}
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-300" />
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-300" />
                </div>
              </div>

              {/* Notepad Body Content: Teks Di Atas Luas & Utuh */}
              <div className="p-7 sm:p-9 md:p-11 min-h-[380px] sm:min-h-[440px] font-sans">
                <div className="whitespace-pre-line text-slate-900 text-lg sm:text-xl md:text-2xl lg:text-[25px] leading-[1.65] font-normal">
                  <span className={isSelected ? 'bg-[#b4d5fe] text-slate-900 rounded px-1 transition-colors' : ''}>
                    {typedText}
                  </span>
                  {/* Blinking Cursor */}
                  {!isSelected && (
                    <span className="inline-block w-2.5 h-5 sm:h-6 md:h-7 bg-blue-600 ml-1.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
