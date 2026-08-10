'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import ImageLightbox from '@/components/ImageLightbox';

interface Person {
  id: string;
  fullName: string;
  jabatan: string | null;
  photoUrl: string | null;
  divisionScope: string | null;
  roles: { role: { name: string; label: string } }[];
}

const divisiConfig: Record<string, { label: string }> = {
  KEBERSIHAN: { label: 'Divisi Kebersihan' },
  KESENIAN: { label: 'Divisi Kesenian' },
  KEOLAHRAGAAN: { label: 'Divisi Keolahragaan' },
  ROHANI: { label: 'Divisi Rohani' },
  KEAMANAN: { label: 'Divisi Keamanan' },
};

function getRole(u: Person) {
  const names = u.roles.map((r) => r.role.name);
  if (names.includes('SUPERADMIN')) return 'SUPERADMIN';
  if (names.includes('KETUA')) return 'KETUA';
  if (names.includes('SEKRETARIS')) return 'SEKRETARIS';
  if (names.includes('BENDAHARA')) return 'BENDAHARA';
  if (names.includes('DIVISION_HEAD')) return 'DIVISION_HEAD';
  return 'WARGA';
}

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
  }),
};

export default function StrukturBagan({ users }: { users: Person[] }) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Cari ketua — SUPERADMIN tidak ditampilkan di struktur
  const ketua = users.find((u) => getRole(u) === 'KETUA');
  const sekretaris = users.filter((u) => getRole(u) === 'SEKRETARIS');
  const bendahara = users.filter((u) => getRole(u) === 'BENDAHARA');
  const divHeads = users.filter((u) => getRole(u) === 'DIVISION_HEAD');
  const warga = users.filter((u) => getRole(u) === 'WARGA');
  const hasMiddle = sekretaris.length > 0 || bendahara.length > 0;

  if (!ketua && !hasMiddle && divHeads.length === 0 && warga.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="relative mx-auto max-w-4xl"
    >
      {/* ===== TOP: KETUA ===== */}
      {ketua && (
        <div className="flex flex-col items-center">
          <motion.div custom={0} variants={cardItem} className="relative z-10">
            <PersonCard user={ketua} label="Ketua Asrama" onPhotoClick={(url) => setLightboxImage(url)} />
          </motion.div>

          {/* Vertical connector down */}
          {hasMiddle && (
            <div className="relative z-0 -mb-1 mt-2">
              <div className="mx-auto h-10 w-0.5 bg-slate-200" />
              <div className="mx-auto h-3 w-3 rounded-full bg-slate-200" />
            </div>
          )}
        </div>
      )}

      {/* ===== MIDDLE: SEKRETARIS + BENDAHARA ===== */}
      {hasMiddle && (
        <div className="relative">
          {/* Horizontal connector */}
          <div className="relative z-0 mx-auto hidden h-0.5 max-w-sm bg-slate-200 md:block">
            <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
            <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-8">
            {/* Sekretaris column */}
            <div className="flex flex-col items-center">
              <div className="mb-3 hidden h-8 w-0.5 bg-slate-200 md:block" />
              {sekretaris.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Sekretaris
                  </h3>
                  {sekretaris.map((u, i) => (
                    <motion.div key={u.id} custom={i + 1} variants={cardItem}>
                      <PersonCard user={u} label="Sekretaris" onPhotoClick={(url) => setLightboxImage(url)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Bendahara column */}
            <div className="flex flex-col items-center">
              <div className="mb-3 hidden h-8 w-0.5 bg-slate-200 md:block" />
              {bendahara.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Bendahara
                  </h3>
                  {bendahara.map((u, i) => (
                    <motion.div key={u.id} custom={i + 1} variants={cardItem}>
                      <PersonCard user={u} label="Bendahara" onPhotoClick={(url) => setLightboxImage(url)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Connector down to divisi */}
          {divHeads.length > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="relative z-0 h-10 w-0.5 bg-slate-200" />
            </div>
          )}
        </div>
      )}

      {/* Connector from ketua direct to divisi (no middle) */}
      {!hasMiddle && divHeads.length > 0 && ketua && (
        <div className="flex justify-center">
          <div className="relative z-0 -mb-1 mt-2">
            <div className="mx-auto h-10 w-0.5 bg-slate-200" />
            <div className="mx-auto h-3 w-3 rounded-full bg-slate-200" />
          </div>
        </div>
      )}

      {/* ===== BOTTOM: KETUA DIVISI & ANGGOTA ===== */}
      {(divHeads.length > 0 || warga.length > 0) && (
        <div className="mt-4">
          <div className="relative z-0 mx-auto hidden max-w-3xl md:block">
            {/* Horizontal bar above divisi */}
            <div className="h-0.5 bg-slate-200">
              <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
              <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
              {Object.entries(divisiConfig).map(([divisiId, cfg], colIdx) => {
                const head = divHeads.find(h => h.divisionScope === divisiId);
                const anggota = warga.filter(w => w.divisionScope === divisiId);
                
                // Jika tidak ada ketua maupun anggota di divisi ini, lewati
                if (!head && anggota.length === 0) return null;

                return (
                  <div key={divisiId} className="flex flex-col items-center">
                    <div className="mb-3 h-6 w-0.5 bg-slate-200" />
                    
                    {/* Render Ketua Divisi if exists, otherwise a placeholder */}
                    <h3 className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {cfg.label}
                    </h3>
                    
                    {head && (
                      <motion.div custom={colIdx + 3} variants={cardItem} className="flex flex-col items-center w-full">
                        <PersonCard user={head} label="Ketua Divisi" onPhotoClick={(url) => setLightboxImage(url)} />
                      </motion.div>
                    )}

                    {/* Render Anggota Divisi */}
                    {anggota.length > 0 && (
                      <div className="mt-6 flex flex-col items-center w-full">
                        <div className="h-6 w-0.5 bg-slate-200 mb-4" />
                        <h4 className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Anggota
                        </h4>
                        <div className="flex flex-col gap-4 w-full">
                          {anggota.map((u, i) => (
                            <motion.div key={u.id} custom={colIdx + 6 + i} variants={cardItem} className="flex flex-col items-center">
                              <PersonCard user={u} label="Warga" small onPhotoClick={(url) => setLightboxImage(url)} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ImageLightbox
        src={lightboxImage || ''}
        alt="Preview Struktur"
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </motion.div>
  );
}

function PersonCard({
  user,
  label,
  small = false,
  onPhotoClick,
}: {
  user: { fullName: string; jabatan: string | null; photoUrl: string | null };
  label: string;
  small?: boolean;
  onPhotoClick?: (url: string) => void;
}) {
  const sizeClass = small ? "h-12 w-12 sm:h-16 sm:w-16" : "h-16 w-16 sm:h-24 sm:w-24";
  const textSizeClass = small ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl";
  const nameClass = small ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm";

  return (
    <div className="text-center group/card">
      <div 
        className={`relative mx-auto mb-3 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white shadow-sm transition-transform cursor-pointer ${sizeClass} ${user.photoUrl ? 'hover:scale-105 hover:shadow-md' : ''}`}
        onClick={() => { if (user.photoUrl && onPhotoClick) onPhotoClick(user.photoUrl) }}
      >
        {user.photoUrl ? (
          <>
            <Image
              src={user.photoUrl}
              alt={user.fullName}
              fill
              sizes="(max-width: 768px) 64px, 96px"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover/card:opacity-100 transition-opacity drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center font-bold text-muted-foreground ${textSizeClass}`}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className={`font-semibold leading-snug text-foreground ${nameClass}`}>
        {user.fullName}
      </p>
      {!small && <p className="mt-0.5 text-xs text-muted-foreground">{user.jabatan || label}</p>}
    </div>
  );
}
