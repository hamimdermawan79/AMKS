'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Search, Users } from 'lucide-react';
import ArchiveShell from '@/components/public/ArchiveShell';
import styles from '@/components/public/archive.module.css';

interface AlumniEntry {
  id: string;
  fullName: string;
  photoUrl: string | null;
  jurusan: string | null;
  namaKampus: string | null;
  tahunMasuk: number | null;
  asalDaerah: string | null;
  tahunKeluar: number | null;
}

interface AngkatanGroup {
  year: number;
  members: AlumniEntry[];
}

export default function BukuAlumniClient({ groupedAngkatan, totalAlumni }: {
  groupedAngkatan: AngkatanGroup[];
  totalAlumni: number;
}) {
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  const isFiltered = Boolean(normalizedQuery || selectedYear !== 'all');
  const filteredGroups = useMemo(() => groupedAngkatan
    .filter(group => selectedYear === 'all' || String(group.year) === selectedYear)
    .map(group => ({
      ...group,
      members: group.members.filter(member => !normalizedQuery ||
        [member.fullName, member.namaKampus, member.jurusan, member.asalDaerah]
          .some(value => value?.toLocaleLowerCase('id').includes(normalizedQuery))),
    }))
    .filter(group => group.members.length > 0), [groupedAngkatan, selectedYear, normalizedQuery]);
  const resultCount = filteredGroups.reduce((sum, group) => sum + group.members.length, 0);

  function resetFilters() {
    setQuery('');
    setSelectedYear('all');
  }

  return (
    <ArchiveShell title="Buku Alumni" patterned compactHeader
      subtitle={<>Asrama Mahasiswa Kabupaten Sambas<br />Yogyakarta</>}>
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="alumni-search" className="sr-only">Cari alumni</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="alumni-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nama atau kampus" className={styles.field + ' ' + styles.searchField} />
            </div>
            <div className="relative min-w-0 sm:shrink-0">
              <label htmlFor="alumni-year" className="sr-only">Angkatan alumni</label>
              <span aria-hidden="true" className="invisible block min-h-11 whitespace-nowrap border border-transparent py-2.5 pl-3.5 pr-9 text-base sm:text-sm">{selectedYear === 'all' ? 'Semua' : selectedYear === '0' ? 'Belum tercatat' : selectedYear}</span>
              <select id="alumni-year" value={selectedYear} onChange={event => setSelectedYear(event.target.value)} className={styles.field + ' ' + styles.selectField + ' absolute inset-0'}>
                <option value="all">Semua</option>
                {groupedAngkatan.map(group => <option key={group.year} value={String(group.year)}>{group.year || 'Belum tercatat'}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
          <div className={isFiltered ? 'mb-5 flex min-h-6 items-center justify-end gap-3' : 'sr-only'}>
            <p role="status" className="sr-only">{resultCount} alumni{isFiltered ? ' ditemukan' : ''}</p>
            {isFiltered && <button type="button" onClick={resetFilters} className="rounded-sm text-xs text-slate-600 underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400">Reset pencarian</button>}
          </div>

          {filteredGroups.length === 0 ? (
            <div className={styles.surface + ' rounded-3xl px-6 py-14 text-center sm:py-20'}>
              <div aria-hidden="true" className={styles.emptyArtwork}><Users className="h-8 w-8" strokeWidth={1.25} /></div>
              <h2 className="font-serif text-2xl text-slate-900 sm:text-3xl">{totalAlumni === 0 ? 'Setiap angkatan punya cerita' : 'Alumni belum ditemukan'}</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">{totalAlumni === 0 ? 'Profil alumni akan melengkapi halaman ini setelah pendataan selesai.' : 'Coba nama, kampus, atau angkatan lain untuk melanjutkan pencarian.'}</p>
              {isFiltered ? <button type="button" onClick={resetFilters} className={styles.outlineButton + ' mt-6'}>Tampilkan semua alumni</button> :
                <Link href="/tentang-kami" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Kenali keluarga AMKS</Link>}
            </div>
          ) : (
            <div className="space-y-10">
              {filteredGroups.map(group => (
                <section key={group.year} aria-labelledby={'angkatan-' + group.year} className={styles.reveal}>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                    <h2 id={'angkatan-' + group.year} className="font-serif text-2xl text-slate-900 sm:text-3xl">{group.year ? 'Angkatan ' + group.year : 'Angkatan belum tercatat'}</h2>
                    <span className="text-xs text-slate-500">{group.members.length} alumni</span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {group.members.map(alumni => <AlumniCard key={alumni.id} alumni={alumni} query={normalizedQuery} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
    </ArchiveShell>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLocaleLowerCase('id').indexOf(query) : -1;
  if (start < 0) return <>{text}</>;
  return <>{text.slice(0, start)}<mark className="rounded-sm bg-blue-100 text-blue-900">{text.slice(start, start + query.length)}</mark>{text.slice(start + query.length)}</>;
}

function AlumniCard({ alumni, query }: { alumni: AlumniEntry; query: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = alumni.fullName.trim().split(/\s+/).slice(0, 2).map(name => name.charAt(0)).join('');
  return (
    <article className={styles.surface + ' ' + styles.alumniCard + ' flex min-w-0 flex-col overflow-hidden rounded-2xl'}>
      <div className={styles.portrait + ' relative aspect-[4/3] overflow-hidden'}>
        {alumni.photoUrl && !imageFailed ?
          <Image src={alumni.photoUrl} alt={'Foto ' + alumni.fullName} fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 300px" onError={() => setImageFailed(true)} className="object-cover object-top" /> :
          <div className="absolute inset-0 flex items-center justify-center"><span aria-hidden="true" className="font-serif text-6xl text-slate-400/70">{initials}</span><span className="sr-only">Foto belum tersedia</span></div>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="break-words text-base font-semibold leading-6 text-slate-900"><HighlightText text={alumni.fullName} query={query} /></h3>
        {alumni.namaKampus && <p className="mt-2 text-sm leading-6 text-slate-600"><HighlightText text={alumni.namaKampus} query={query} /></p>}
        {alumni.jurusan && <p className="mt-1 text-xs leading-5 text-slate-500">{alumni.jurusan}</p>}
        {alumni.asalDaerah && <p className="mt-3 text-xs leading-5 text-slate-500">{alumni.asalDaerah}</p>}
        {(alumni.tahunMasuk || alumni.tahunKeluar) && <dl className="mt-auto flex flex-wrap justify-between gap-3 pt-5 text-xs">
          {alumni.tahunMasuk && <div><dt className="text-slate-500">Masuk</dt><dd className="mt-1 font-medium tabular-nums text-slate-800">{alumni.tahunMasuk}</dd></div>}
          {alumni.tahunKeluar && <div><dt className="text-slate-500">Keluar</dt><dd className="mt-1 font-medium tabular-nums text-slate-800">{alumni.tahunKeluar}</dd></div>}
        </dl>}
      </div>
    </article>
  );
}
