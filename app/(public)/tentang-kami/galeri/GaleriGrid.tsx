'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  images: string[] | null;
  startAt: Date | null;
}

function ThumbImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-100">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: 'easeOut' },
  }),
};

export default function GaleriGrid({ activities }: { activities: Activity[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {activities.map((activity, i) => (
        <motion.div key={activity.id} custom={i} variants={cardItem}>
          <Link
            href={`/tentang-kami/${activity.id}`}
            className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {activity.coverUrl ? (
                <>
                  <ThumbImage src={activity.coverUrl} alt={activity.title} />
                  {activity.images && activity.images.length > 0 && (
                    <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                      {activity.images.length + 1} foto
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-muted-foreground">
                  No cover
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {activity.title}
              </h3>
              {activity.startAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(activity.startAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {activity.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
