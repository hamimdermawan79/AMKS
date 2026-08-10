'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox from '@/components/ImageLightbox';

interface Props {
  allPhotos: string[];
}

export default function DetailGalleryClient({ allPhotos }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (allPhotos.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Dokumentasi Foto
      </h2>

      {/* First photo — large hero */}
      <div 
        className="relative overflow-hidden mb-4 aspect-[16/9] rounded-xl cursor-pointer group"
        onClick={() => setSelectedImage(allPhotos[0])}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102"
          style={{ backgroundImage: `url(${allPhotos[0]})` }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/10 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Remaining photos — masonry grid */}
      {allPhotos.length > 1 && (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {allPhotos.slice(1).map((url, i) => (
            <div
              key={i}
              className="group relative overflow-hidden bg-slate-100 rounded-xl break-inside-avoid border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(url)}
            >
              <Image 
                src={url} 
                alt={`Dokumentasi tambahan ${i+1}`} 
                width={800}
                height={600}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      <ImageLightbox
        src={selectedImage || ''}
        alt="Dokumentasi Kegiatan"
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
