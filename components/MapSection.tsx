'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const MapLeaflet = dynamic(() => import('./MapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 md:h-[600px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center border border-border shadow-lg">
      <span className="text-slate-400 font-medium">Memuat Peta...</span>
    </div>
  )
});

export default function MapSection() {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center mb-10 md:mb-12"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Temukan Kami
          </h2>
          <p className="mt-3 text-sm md:text-base lg:text-lg text-muted-foreground">
            Peta lokasi asrama di Yogyakarta
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-7xl"
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
