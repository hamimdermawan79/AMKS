'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, FileText, Search } from 'lucide-react';
import { WORK_TYPE_LABELS } from '@/lib/karya-ilmiah';
import ArchiveShell from '@/components/public/ArchiveShell';
import ArchiveDialog from '@/components/public/ArchiveDialog';
import styles from '@/components/public/archive.module.css';
import { submitAccessRequest } from './actions';

interface Work {
  id: string;
  title: string;
  authorName: string;
  authorInstitution: string | null;
  type: keyof typeof WORK_TYPE_LABELS;
  year: number;
  abstractFileUrl: string | null;
  titlePageFileUrl: string | null;
  tocFileUrl: string | null;
}

export default function KaryaIlmiahList({ worksByYear }: { worksByYear: { year: number; works: Work[] }[] }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [requestTarget, setRequestTarget] = useState<Work | null>(null);
  const allWorks = useMemo(() => worksByYear.flatMap(group => group.works), [worksByYear]);
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  const availableTypes = Object.entries(WORK_TYPE_LABELS).filter(([type]) => allWorks.some(work => work.type === type));
  const filteredGroups = worksByYear
    .filter(group => !selectedYear || String(group.year) === selectedYear)
    .map(group => ({
      ...group,
      works: group.works.filter(work =>
        (!selectedType || work.type === selectedType) &&
        (!normalizedQuery || [work.title, work.authorName, work.authorInstitution].some(value => value?.toLocaleLowerCase('id').includes(normalizedQuery)))),
    }))
    .filter(group => group.works.length > 0);
  const resultCount = filteredGroups.reduce((sum, group) => sum + group.works.length, 0);
  const isFiltered = Boolean(normalizedQuery || selectedType || selectedYear);

  function resetFilters() {
    setQuery('');
    setSelectedType('');
    setSelectedYear('');
  }

  return (
    <ArchiveShell title="Repositori Karya Ilmiah" patterned compactHeader
      subtitle={<>Warga Asrama Mahasiswa Kabupaten Sambas<br />Yogyakarta</>}>
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="work-search" className="sr-only">Cari karya ilmiah</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="work-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari judul atau penulis" className={styles.field + ' ' + styles.searchField} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:contents">
            <div className="relative min-w-0 sm:shrink-0">
              <label htmlFor="work-year" className="sr-only">Tahun publikasi</label>
              <span aria-hidden="true" className="invisible block min-h-11 whitespace-nowrap border border-transparent py-2.5 pl-3.5 pr-9 text-base sm:text-sm">{selectedYear || 'Semua'}</span>
              <select id="work-year" value={selectedYear} onChange={event => setSelectedYear(event.target.value)} className={styles.field + ' ' + styles.selectField + ' absolute inset-0'}>
                <option value="">Semua</option>
                {worksByYear.map(group => <option key={group.year} value={String(group.year)}>{group.year}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
            <div className="relative min-w-0 sm:shrink-0">
              <label htmlFor="work-type" className="sr-only">Jenis karya ilmiah</label>
              <span aria-hidden="true" className="invisible block min-h-11 whitespace-nowrap border border-transparent py-2.5 pl-3.5 pr-9 text-base sm:text-sm">{availableTypes.find(([type]) => type === selectedType)?.[1] || 'Semua'}</span>
              <select id="work-type" value={selectedType} onChange={event => setSelectedType(event.target.value)} className={styles.field + ' ' + styles.selectField + ' absolute inset-0'}>
                <option value="">Semua</option>
                {availableTypes.map(([type, label]) => <option key={type} value={type}>{label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
            </div>
          </div>
          <div className={isFiltered ? 'mb-5 flex min-h-6 items-center justify-end gap-3' : 'sr-only'}>
            <p role="status" className="sr-only">{resultCount} karya{isFiltered ? ' ditemukan' : ''}</p>
            {isFiltered && <button type="button" onClick={resetFilters} className="rounded-sm text-xs text-slate-600 underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400">Reset pencarian</button>}
          </div>

          {filteredGroups.length === 0 ? (
            <div className={styles.surface + ' rounded-3xl px-6 py-14 text-center sm:py-20'}>
              <div aria-hidden="true" className={styles.emptyArtwork}><FileText className="h-8 w-8" strokeWidth={1.25} /></div>
              <h2 className="font-serif text-2xl text-slate-900 sm:text-3xl">{allWorks.length === 0 ? 'Belum ada karya ilmiah' : 'Karya belum ditemukan'}</h2>
              {isFiltered && <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">Coba kata kunci atau filter lain.</p>}
              {isFiltered && <button type="button" onClick={resetFilters} className={styles.outlineButton + ' mt-6'}>Tampilkan semua karya</button>}
            </div>
          ) : (
            <div className="space-y-7">
              {filteredGroups.map(group => (
                <section key={group.year} aria-labelledby={'publication-' + group.year} className={styles.reveal}>
                  <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
                    <h2 id={'publication-' + group.year} className="font-serif text-2xl text-slate-900">{group.year}</h2>
                  </div>
                  <div className="space-y-4">
                    {group.works.map(work => (
                      <article key={work.id} className={styles.surface + ' rounded-2xl p-5 sm:p-6'}>
                          <div className="min-w-0">
                            <p className="mb-2 text-xs text-slate-500">{WORK_TYPE_LABELS[work.type]}</p>
                            <h3 className="break-words text-lg font-semibold leading-7 text-slate-900">{work.title}</h3>
                            <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
                              <p className="font-medium text-slate-700">{work.authorName}</p>
                              {work.authorInstitution && <p className="text-slate-500">{work.authorInstitution}</p>}
                            </div>
                          </div>
                        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div aria-label="Berkas pengantar" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm">
                            <FileLink url={work.abstractFileUrl} label="Abstrak" />
                            <FileLink url={work.titlePageFileUrl} label="Halaman judul" />
                            <FileLink url={work.tocFileUrl} label="Daftar isi" />
                          </div>
                          <button type="button" onClick={() => setRequestTarget(work)} className={styles.outlineButton + ' shrink-0 self-start'}>Ajukan akses</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      {requestTarget && <RequestAccessModal key={requestTarget.id} work={requestTarget} onClose={() => setRequestTarget(null)} />}
    </ArchiveShell>
  );
}

function RequestAccessModal({ work, onClose }: { work: Work; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <ArchiveDialog title="Permintaan akses karya" onClose={onClose} busy={isSubmitting}>
      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-sm font-semibold leading-6">{work.title}</h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">{work.authorName}, {work.year}</p>
      </div>
      <RequestForm workId={work.id} onCancel={onClose} isSubmitting={isSubmitting} onSubmittingChange={setIsSubmitting} />
    </ArchiveDialog>
  );
}

function RequestForm({ workId, onCancel, isSubmitting, onSubmittingChange }: {
  workId: string;
  onCancel: () => void;
  isSubmitting: boolean;
  onSubmittingChange: (value: boolean) => void;
}) {
  const [formData, setFormData] = useState({ name: '', whatsapp: '', email: '', purpose: '', institution: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    onSubmittingChange(true);
    try {
      await submitAccessRequest({ ...formData, workId });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal mengirim permintaan. Silakan coba kembali.');
    } finally {
      onSubmittingChange(false);
    }
  }

  if (success) {
    return (
      <div className="py-5 text-center" role="status">
        <h3 className="font-serif text-2xl text-slate-900">Permintaan terkirim</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">Pengurus akan meninjau permintaan Anda dan menghubungi nomor WhatsApp atau email yang dicantumkan.</p>
        <button type="button" onClick={onCancel} className={styles.outlineButton + ' mt-6 w-full'}>Tutup</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p role="alert" className="border-l-2 border-red-500 pl-3 text-sm leading-6 text-red-700">{error}</p>}
      <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
        <Field label="Nama lengkap"><input required minLength={2} name="name" autoComplete="name" className={styles.field} value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} /></Field>
        <Field label="Nomor WhatsApp"><input required type="tel" name="whatsapp" autoComplete="tel" className={styles.field} placeholder="62812xxxxxxxx" value={formData.whatsapp} onChange={event => setFormData({ ...formData, whatsapp: event.target.value })} /></Field>
        <Field label="Email"><input required type="email" name="email" autoComplete="email" className={styles.field} value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} /></Field>
        <Field label="Keperluan"><textarea required minLength={5} name="purpose" rows={3} className={styles.field + ' resize-y'} placeholder="Jelaskan keperluan akses naskah lengkap" value={formData.purpose} onChange={event => setFormData({ ...formData, purpose: event.target.value })} /></Field>
        <Field label="Institusi atau kampus"><input required minLength={2} name="institution" autoComplete="organization" className={styles.field} value={formData.institution} onChange={event => setFormData({ ...formData, institution: event.target.value })} /></Field>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 flex-1 rounded-xl border border-border px-4 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:opacity-50">Batal</button>
        <button type="submit" disabled={isSubmitting} className={styles.outlineButton + ' flex-1'}>{isSubmitting ? 'Mengirim...' : 'Kirim permintaan'}</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function FileLink({ url, label }: { url: string | null; label: string }) {
  return url ?
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400">{label}</a> :
    <span aria-disabled="true" title={label + ' belum tersedia'} className="inline-flex min-h-11 items-center text-slate-400">{label}</span>;
}
