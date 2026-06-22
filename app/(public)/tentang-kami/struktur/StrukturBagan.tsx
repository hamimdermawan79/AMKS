'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
  const ketua = users.find((u) => getRole(u) === 'KETUA' || getRole(u) === 'SUPERADMIN');
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
            <PersonCard user={ketua} label="Ketua Asrama" />
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

          <div className="relative z-10 mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
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
                      <PersonCard user={u} label="Sekretaris" />
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
                      <PersonCard user={u} label="Bendahara" />
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

      {/* ===== BOTTOM: KETUA DIVISI ===== */}
      {divHeads.length > 0 && (
        <div className="mt-4">
          <div className="relative z-0 mx-auto hidden max-w-3xl md:block">
            {/* Horizontal bar above divisi */}
            <div className="h-0.5 bg-slate-200">
              <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
              <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <h3 className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ketua Divisi
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {divHeads.map((u, i) => {
                const cfg = u.divisionScope ? divisiConfig[String(u.divisionScope)] : null;
                return (
                  <motion.div key={u.id} custom={i + 3} variants={cardItem} className="flex flex-col items-center">
                    <div className="mb-3 h-6 w-0.5 bg-slate-200" />
                    <PersonCard user={u} label={cfg?.label || 'Ketua Divisi'} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM: WARGA ASRAMA ===== */}
      {warga.length > 0 && (
        <div className="mt-16 border-t border-slate-100 pt-10">
          <div className="relative z-10">
            <h3 className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Warga Asrama
            </h3>
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {warga.map((u, i) => (
                <motion.div key={u.id} custom={i + 6} variants={cardItem} className="flex flex-col items-center">
                  <PersonCard user={u} label="Warga" small />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PersonCard({
  user,
  label,
  small = false,
}: {
  user: { fullName: string; jabatan: string | null; photoUrl: string | null };
  label: string;
  small?: boolean;
}) {
  const sizeClass = small ? "h-16 w-16" : "h-24 w-24";
  const textSizeClass = small ? "text-xl" : "text-3xl";
  const nameClass = small ? "text-xs" : "text-sm";

  return (
    <div className="text-center">
      <div className={`mx-auto mb-3 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white shadow-sm ${sizeClass}`}>
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.fullName}
            className="h-full w-full object-cover"
          />
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
