'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Download, ImageOff, Search, X } from 'lucide-react';
import { submitLoanRequest } from '@/app/(dashboard)/admin/sekretaris/inventaris/actions';
import styles from './inventory.module.css';

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  condition: string | null;
  location: string | null;
  description: string | null;
  photoUrl: string | null;
  loans: { status: string; quantity: number }[];
}

interface LetterTemplate {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
}

const fieldClass = 'min-h-11 w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm';
const filterClass = 'min-h-11 w-full rounded-lg border border-slate-300/70 bg-transparent px-3.5 py-2.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-400/30 sm:text-sm';
const buttonClass = `${styles.loanButton} inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50`;

function availableQuantity(item: InventoryItem) {
  const borrowed = item.loans.filter(loan => loan.status === 'APPROVED').reduce((sum, loan) => sum + loan.quantity, 0);
  return Math.max(0, item.quantity - borrowed);
}

function InventoryDialog({ title, onClose, children, busy = false }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="inventory-dialog-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}
      className={`${styles.modal} m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto p-0 text-slate-900`}>
      <div className={`${styles.modalHeader} sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5`}>
        <h2 id="inventory-dialog-title" className="text-lg font-semibold leading-7 sm:text-xl">{title}</h2>
        <button type="button" aria-label="Tutup dialog" onClick={onClose} disabled={busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function InventoryPhoto({ item }: { item: InventoryItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!item.photoUrl || failedUrl === item.photoUrl) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <ImageOff aria-hidden="true" className="h-7 w-7 text-slate-400" strokeWidth={1.25} />
          <span className="text-xs">Foto belum tersedia</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100">
      <Image src={item.photoUrl} alt={item.name} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" onError={() => setFailedUrl(item.photoUrl)} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
    </div>
  );
}

function LoanForm({ item, templates, onClose, onSuccess }: {
  item: InventoryItem;
  templates: LetterTemplate[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const formData = new FormData(event.currentTarget);
    formData.append('inventoryId', item.id);
    setIsSubmitting(true);
    setError('');
    try {
      await submitLoanRequest(formData);
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pengajuan belum terkirim. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  }

  return (
    <InventoryDialog title="Ajukan peminjaman" onClose={onClose} busy={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-6 sm:px-6 sm:pb-7">
        <div className="rounded-xl border border-slate-200/80 px-4 py-4">
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{availableQuantity(item)} dari {item.quantity} unit tersedia</p>
        </div>
        {templates.length > 0 && (
          <section aria-label="Surat peminjaman" className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm font-semibold">Siapkan surat peminjaman</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Unduh format surat, lengkapi dan tandatangani, lalu unggah pada formulir ini.</p>
            <div className="mt-3 space-y-1">
              {templates.map(template => (
                <a key={template.id} href={template.fileUrl} download={template.fileName} className="inline-flex min-h-11 w-full items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <Download aria-hidden="true" className="h-4 w-4 shrink-0" />{template.name}
                </a>
              ))}
            </div>
          </section>
        )}
        <p className="text-xs text-slate-500">Semua kolom wajib diisi kecuali yang ditandai opsional.</p>
        <div>
          <label htmlFor="borrower-name" className="mb-2 block text-sm font-medium">Nama peminjam</label>
          <input id="borrower-name" required name="borrowerName" autoComplete="name" className={fieldClass} placeholder="Nama lengkap Anda" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="borrower-phone" className="mb-2 block text-sm font-medium">Nomor WhatsApp</label>
            <input id="borrower-phone" required name="phone" type="tel" autoComplete="tel" className={fieldClass} placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label htmlFor="borrower-institution" className="mb-2 block text-sm font-medium">Instansi <span className="font-normal text-slate-500">(opsional)</span></label>
            <input id="borrower-institution" name="institution" autoComplete="organization" className={fieldClass} placeholder="Sekolah, kampus, atau organisasi" />
          </div>
        </div>
        <div>
          <label htmlFor="loan-purpose" className="mb-2 block text-sm font-medium">Keperluan <span className="font-normal text-slate-500">(opsional)</span></label>
          <textarea id="loan-purpose" name="purpose" rows={3} className={fieldClass} placeholder="Ceritakan keperluan peminjaman Anda" />
        </div>
        <div>
          <label htmlFor="loan-quantity" className="mb-2 block text-sm font-medium">Jumlah barang</label>
          <input id="loan-quantity" required name="quantity" type="number" min={1} max={availableQuantity(item)} defaultValue={1} className={fieldClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="loan-start" className="mb-2 block text-sm font-medium">Tanggal pinjam</label>
            <input id="loan-start" required name="startDate" type="date" onInput={event => setStartDate(event.currentTarget.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="loan-end" className="mb-2 block text-sm font-medium">Tanggal kembali</label>
            <input id="loan-end" required name="endDate" type="date" min={startDate || undefined} className={fieldClass} />
          </div>
        </div>
        <div>
          <label htmlFor="loan-letter" className="mb-2 block text-sm font-medium">Surat peminjaman</label>
          <input id="loan-letter" required name="letterFile" type="file" aria-describedby="loan-letter-help" className={`${fieldClass} p-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200`} />
          <p id="loan-letter-help" className="mt-2 text-xs leading-5 text-slate-500">Unggah surat yang sudah diisi dan ditandatangani.</p>
        </div>
        {error && <p role="alert" className="border-l-2 border-destructive pl-3 text-sm leading-6 text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="min-h-11 rounded-lg border border-border px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">Batal</button>
          <button type="submit" disabled={isSubmitting} className={buttonClass}>{isSubmitting ? 'Mengirim pengajuan...' : 'Kirim pengajuan'}</button>
        </div>
      </form>
    </InventoryDialog>
  );
}

export default function InventarisPublicClient({ items, templates }: { items: InventoryItem[]; templates: LetterTemplate[] }) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);

  const categories = Array.from(new Set(items.map(item => item.category || 'Lainnya'))).sort((a, b) => a.localeCompare(b, 'id'));
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  const filteredItems = items.filter(item =>
    (!activeCategory || (item.category || 'Lainnya') === activeCategory) &&
    (!onlyAvailable || availableQuantity(item) > 0) &&
    (!normalizedQuery || [item.name, item.category, item.location].some(value => value?.toLocaleLowerCase('id').includes(normalizedQuery)))
  );
  const isFiltered = Boolean(activeCategory || query || onlyAvailable);

  function resetFilters() {
    setActiveCategory('');
    setQuery('');
    setOnlyAvailable(false);
  }

  return (
    <section aria-labelledby="inventory-catalog-title">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="inventory-catalog-title" className="text-base font-semibold text-slate-900">Daftar inventaris</h2>
        <p role="status" className="text-sm text-slate-500">{isFiltered ? `${filteredItems.length} dari ${items.length} barang` : `${items.length} barang`}</p>
      </div>
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start lg:gap-5">
        <div className="relative min-w-0 flex-1 sm:min-w-48">
          <label htmlFor="inventory-search" className="sr-only">Cari inventaris</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="inventory-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari barang atau lokasi..." className={`${filterClass} pl-10`} />
        </div>
        <div className="flex flex-col sm:shrink-0">
        <div className="flex items-center gap-4">
        <div className="relative min-w-0 flex-1 sm:w-44">
          <label htmlFor="inventory-category" className="sr-only">Kategori inventaris</label>
          <select id="inventory-category" value={activeCategory} onChange={event => setActiveCategory(event.target.value)} className={`${filterClass} cursor-pointer appearance-none pr-10`}>
            <option value="">Semua kategori</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={onlyAvailable} onChange={event => setOnlyAvailable(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
          Tersedia saja
        </label>
        </div>
        <Link href="/fasilitas/format-surat" className="mt-2 self-end rounded-sm text-xs leading-5 text-primary underline underline-offset-4 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400">
          Unduh format surat peminjaman
        </Link>
        </div>
      </div>
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => {
            const available = availableQuantity(item);
            return (
              <article key={item.id} className={`${styles.glassCard} flex min-w-0 flex-col overflow-hidden rounded-2xl`}>
                <button type="button" onClick={() => setPreviewItem(item)} aria-label={`Lihat detail ${item.name}`} className="group flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary">
                  <InventoryPhoto item={item} />
                  <div className="flex w-full items-baseline justify-between gap-3 px-5 pb-4 pt-5">
                    <h3 className="min-w-0 break-words text-base font-semibold leading-6 text-slate-900">{item.name}</h3>
                    <span className="shrink-0 text-xs text-slate-600">{item.category || 'Lainnya'}</span>
                  </div>
                </button>
                <div className="px-5 pb-5">
                  <button type="button" onClick={() => setSelectedItem(item)} disabled={available === 0} className={`${styles.loanButton} min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed`}>
                    {available > 0 ? 'Pinjam barang' : 'Tidak tersedia'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{items.length === 0 ? 'Inventaris sedang didata' : 'Barang tidak ditemukan'}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{items.length === 0 ? 'Daftar barang akan ditampilkan setelah pengurus melengkapi pendataan inventaris.' : 'Coba kata kunci lain atau ubah filter untuk melihat barang yang tersedia.'}</p>
          {isFiltered && <button type="button" onClick={resetFilters} className={`${buttonClass} mt-5`}>Reset pencarian</button>}
        </div>
      )}
      {selectedItem && <LoanForm item={selectedItem} templates={templates} onClose={() => setSelectedItem(null)} onSuccess={() => { setSelectedItem(null); setShowSuccess(true); }} />}
      {showSuccess && (
        <InventoryDialog title="Pengajuan terkirim" onClose={() => setShowSuccess(false)}>
          <div className="p-6 sm:p-7">
            <p className="text-sm leading-7 text-slate-600">Pengurus akan meninjau pengajuan peminjaman Anda. Informasi selanjutnya akan disampaikan melalui nomor WhatsApp yang telah Anda cantumkan.</p>
            <button type="button" onClick={() => setShowSuccess(false)} className={`${buttonClass} mt-6 w-full`}>Kembali ke inventaris</button>
          </div>
        </InventoryDialog>
      )}
      {previewItem && (
        <InventoryDialog title={previewItem.name} onClose={() => setPreviewItem(null)}>
          <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="overflow-hidden rounded-xl">
              <InventoryPhoto item={previewItem} />
            </div>
            <div className="flex flex-col">
            <p className="mb-4 text-sm text-slate-600">{previewItem.category || 'Lainnya'}</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Tersedia</dt>
                <dd className="text-right font-medium tabular-nums text-slate-900">{availableQuantity(previewItem)} dari {previewItem.quantity} unit</dd>
              </div>
              <div className="flex justify-between gap-5 border-t border-slate-200/60 pt-2.5">
                <dt className="text-slate-500">Kondisi</dt>
                <dd className="min-w-0 break-words text-right capitalize text-slate-900">{previewItem.condition?.toLocaleLowerCase('id') || 'Belum dicatat'}</dd>
              </div>
              <div className="flex justify-between gap-5 border-t border-slate-200/60 pt-2.5">
                <dt className="text-slate-500">Lokasi</dt>
                <dd className="min-w-0 break-words text-right text-slate-900">{previewItem.location || 'Belum dicatat'}</dd>
              </div>
            </dl>
            <button type="button" disabled={availableQuantity(previewItem) === 0} onClick={() => { setSelectedItem(previewItem); setPreviewItem(null); }} className={`${styles.loanButton} mt-4 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed`}>
              {availableQuantity(previewItem) > 0 ? 'Pinjam barang' : 'Tidak tersedia'}
            </button>
            </div>
          </div>
        </InventoryDialog>
      )}
    </section>
  );
}
