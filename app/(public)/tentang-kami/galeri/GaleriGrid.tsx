'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  coverUrl: string | null;
  startAt: Date | null;
}

function ThumbImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);



  return (
    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-2xl">
      {!loaded && !error && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      {error ? (
        <div className="flex w-full h-full items-center justify-center bg-slate-100 text-sm text-slate-400 border border-dashed border-slate-300">
          Gambar Hilang (404)
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(true); setError(true); }}
          className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
      {/* Subtle bottom gradient for a modern feel */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function GaleriGrid({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-slate-50/60 p-12 text-center mt-8">
        <p className="text-muted-foreground italic">
          Belum ada dokumentasi kegiatan yang diunggah.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 sm:gap-8 mt-8 sm:mt-12"
    >
      {activities.map((activity, i) => (
        <motion.div
          key={activity.id}
          custom={i}
          variants={cardReveal}
          whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
          className="group relative flex flex-col rounded-2xl bg-white border border-border shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          <Link href={`/tentang-kami/${activity.id}`} className="absolute inset-0 z-10">
            <span className="sr-only">Lihat detail {activity.title}</span>
          </Link>
          
          <ThumbImage 
            src={activity.coverUrl || '/placeholder-image.jpg'} 
            alt={activity.title} 
          />

          <div className="p-3 sm:p-5 flex flex-col relative z-20">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">
                {activity.startAt ? new Date(activity.startAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'Waktu tidak ditentukan'}
              </span>
            </div>

            <h3 className="text-sm sm:text-lg font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
              {activity.title}
            </h3>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
