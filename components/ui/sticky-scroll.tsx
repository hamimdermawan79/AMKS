'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { ReactLenis } from 'lenis/react';

export interface ActivityItem {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startAt: Date | null;
  location: string | null;
  division: string | null;
}

interface StickyScrollGalleryProps {
  activities?: ActivityItem[];
}

const defaultImages = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
];

const StickyScrollGallery = forwardRef<HTMLElement, StickyScrollGalleryProps>(
  ({ activities = [] }, ref) => {
    // Extract photo URLs from activities or fallback to default high quality images
    const photos: { url: string; title: string; id?: string; date?: Date | null }[] =
      activities.length > 0
        ? activities
            .filter((a) => a.coverUrl)
            .map((a) => ({
              url: a.coverUrl!,
              title: a.title,
              id: a.id,
              date: a.startAt,
            }))
        : defaultImages.map((url, i) => ({
            url,
            title: `Kegiatan ${i + 1}`,
          }));

    // Split photos into 3 columns: Left (5 items), Center Sticky (3 items), Right (5 items)
    const leftColumn = photos.slice(0, 5);
    const centerColumn =
      photos.slice(5, 8).length === 3 ? photos.slice(5, 8) : photos.slice(0, 3);
    const rightColumn =
      photos.slice(8, 13).length > 0 ? photos.slice(8, 13) : photos.slice(3, 8);

    return (
      <ReactLenis root>
        <section ref={ref} className="relative w-full bg-white text-slate-900 py-14 md:py-20">
          {/* Header 2 Baris: Kegiatan Terkini */}
          <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-8 md:mb-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal tracking-tight text-slate-900 leading-[1.12]">
              Kegiatan<br />
              <span className="text-primary italic font-serif ml-4 sm:ml-8 inline-block">Terkini</span>
            </h2>
          </div>

          {/* 3-Column Sticky Gallery Layout — Konsisten 3 Kolom di Mobile & Desktop */}
          <div className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3.5 items-start">
              {/* Kolom Kiri (Scrolls naturally) */}
              <div className="grid gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1">
                {leftColumn.map((item, idx) => (
                  <div
                    key={`left-${idx}`}
                    className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] border border-slate-200/80 bg-slate-100 shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-32 sm:h-48 md:h-[280px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                      <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-white line-clamp-1 sm:line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kolom Tengah (Sticky grid-rows-3 saat di-scroll di Mobile & Desktop) */}
              <div className="grid gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1 sticky top-16 md:top-20 h-[calc(62vh)] sm:h-[calc(70vh)] md:h-[calc(78vh)] grid-rows-3 self-start">
                {centerColumn.map((item, idx) => (
                  <div
                    key={`center-${idx}`}
                    className="group relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] border border-blue-200/80 bg-slate-100 shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                      <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-white line-clamp-1 sm:line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kolom Kanan (Scrolls naturally) */}
              <div className="grid gap-1.5 sm:gap-2.5 md:gap-3.5 col-span-1">
                {rightColumn.map((item, idx) => (
                  <div
                    key={`right-${idx}`}
                    className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] border border-slate-200/80 bg-slate-100 shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-32 sm:h-48 md:h-[280px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                      <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-white line-clamp-1 sm:line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Garis Pembatas & CTA di bawah garis, rata kanan, link dengan garis putus-putus */}
          <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 sm:mt-12 pt-4 border-t border-slate-200 flex justify-end">
            <Link
              href="/tentang-kami/galeri"
              className="inline-block text-sm font-medium text-slate-900 border-b border-dashed border-slate-900 pb-0.5 hover:text-primary hover:border-primary transition-colors font-montserrat text-right"
            >
              Ikuti semua kegiatan kami
            </Link>
          </div>
        </section>
      </ReactLenis>
    );
  }
);

StickyScrollGallery.displayName = 'StickyScrollGallery';

export default StickyScrollGallery;
