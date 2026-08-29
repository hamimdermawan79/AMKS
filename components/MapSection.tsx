'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const MapLeaflet = dynamic(() => import('./MapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] sm:h-[320px] md:h-[380px] w-full rounded-2xl md:rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200 shadow-md">
      <span className="text-slate-400 font-medium text-sm">Memuat Peta...</span>
    </div>
  )
});

export default function MapSection() {
  return (
    <section className="relative z-20 w-full overflow-hidden bg-white text-slate-900 pt-28 pb-16 md:pt-36 md:pb-24 rounded-t-[48px] sm:rounded-t-[72px] md:rounded-t-[96px] shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.12)]">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-8 md:mb-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-slate-900 leading-[1.1]">
            Lokasi <span className="text-primary italic font-serif">Asrama</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Peta lokasi Asrama Mahasiswa Kabupaten Sambas di Yogyakarta
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-3xl lg:max-w-4xl"
        >
          <MapLeaflet />
          
          <div className="mt-6 md:mt-8 flex justify-center">
            <a 
              href="https://maps.app.goo.gl/CavYAr6gwS6oHUp18" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-100 hover:shadow-md border border-blue-100 min-h-[44px]"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Buka Lokasi Kami di Google Maps
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
