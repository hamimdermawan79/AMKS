'use client';

import { useState } from 'react';
import { ChevronDown, FileText, Search } from 'lucide-react';
import styles from '@/components/public/archive.module.css';

interface Doc {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  coverUrl: string | null;
  category: string | null;
  createdAt: Date;
}

const categoryOf = (doc: Doc) => doc.category?.trim() || 'Lainnya';

export default function PeraturanClient({ documents }: { documents: Doc[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const query = searchQuery.trim().toLocaleLowerCase('id');
  const isFiltered = Boolean(query || selectedCategory);
  const sortCategories = (a: string, b: string) => {
    if (a === b) return 0;
    if (a === 'Lainnya') return 1;
    if (b === 'Lainnya') return -1;
    return a.localeCompare(b, 'id');
  };
  const categories = Array.from(new Set(documents.map(categoryOf))).sort(sortCategories);
  const filteredDocs = documents.filter(doc =>
    (!selectedCategory || categoryOf(doc) === selectedCategory) &&
    (!query || [doc.title, doc.description, categoryOf(doc)]
      .some(value => value?.toLocaleLowerCase('id').includes(query))));
  const groupedDocs = new Map<string, Doc[]>();
  for (const doc of filteredDocs) {
    const category = categoryOf(doc);
    const group = groupedDocs.get(category) || [];
    group.push(doc);
    groupedDocs.set(category, group);
  }

  function resetFilters() {
    setSearchQuery('');
    setSelectedCategory('');
  }

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="document-search" className="sr-only">Cari peraturan</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="document-search" type="search" placeholder="Cari peraturan atau dokumen" value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)} className={styles.field + ' ' + styles.searchField} />
        </div>
        <div className="relative min-w-0 sm:max-w-[50%] sm:shrink-0">
          <label htmlFor="document-category" className="sr-only">Kategori dokumen</label>
          <span aria-hidden="true" className="invisible block min-h-11 truncate border border-transparent py-2.5 pl-3.5 pr-9 text-base sm:text-sm">{selectedCategory || 'Semua'}</span>
          <select id="document-category" value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}
            className={styles.field + ' ' + styles.selectField + ' absolute inset-0'}>
            <option value="">Semua</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>
      <p role="status" className="sr-only">{filteredDocs.length} dokumen{isFiltered ? ' ditemukan' : ''}</p>
      {isFiltered && filteredDocs.length > 0 && <div className="mb-4 flex justify-end">
        <button type="button" onClick={resetFilters} className="min-h-11 text-xs text-slate-600 underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400">Reset pencarian</button>
      </div>}

      {filteredDocs.length === 0 ? (
        <div className={styles.surface + ' rounded-2xl px-6 py-14 text-center sm:py-16'}>
          <FileText aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-slate-400" strokeWidth={1.25} />
          <h2 className="font-serif text-2xl text-slate-900 sm:text-3xl">{documents.length === 0 ? 'Belum ada dokumen' : 'Dokumen tidak ditemukan'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{documents.length === 0 ? 'Peraturan akan tersedia setelah diterbitkan pengurus.' : 'Coba kata kunci atau kategori lain.'}</p>
          {isFiltered && <button type="button" onClick={resetFilters} className={styles.outlineButton + ' mt-5'}>Reset pencarian</button>}
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedDocs.keys()).sort(sortCategories).map((category, index) => (
            <section key={category} aria-labelledby={'document-group-' + index} className={styles.reveal}>
              <h2 id={'document-group-' + index} className="mb-4 font-serif text-2xl text-slate-900 sm:text-3xl">{category}</h2>
              <ul className={styles.surface + ' overflow-hidden rounded-2xl divide-y divide-slate-200/60'}>
                {groupedDocs.get(category)!.map(doc => <li key={doc.id}>
                  <DocumentRow doc={doc} />
                </li>)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: Doc }) {
  const [imageFailed, setImageFailed] = useState(false);
  const extension = doc.fileUrl.split(/[?#]/)[0].split('/').pop()?.match(/\.([a-z0-9]{1,8})$/i)?.[1].toUpperCase();
  const date = new Date(doc.createdAt);
  const validDate = !Number.isNaN(date.getTime());

  return (
    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={'Buka dokumen ' + doc.title + ' (tab baru)'}
      className="group flex items-start gap-4 p-4 transition-colors duration-200 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-400 sm:items-center sm:gap-5 sm:p-5">
      <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/70 bg-white/20 sm:h-24 sm:w-[4.5rem]">
        {doc.coverUrl && !imageFailed ?
          <img src={doc.coverUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-cover object-top" /> :
          <FileText aria-hidden="true" className="h-6 w-6 text-slate-400" strokeWidth={1.25} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-base font-semibold leading-6 text-slate-900 transition-colors group-hover:text-primary">{doc.title}</h3>
        {doc.description && <p className="mt-1.5 line-clamp-2 break-words text-sm leading-6 text-slate-600">{doc.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-slate-500">
          {extension && <span>{extension}</span>}
          {validDate && <time dateTime={date.toISOString()}>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</time>}
        </div>
        <span className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 group-hover:underline sm:hidden">Buka dokumen</span>
      </div>
      <span className="hidden shrink-0 text-sm font-medium text-primary underline-offset-4 group-hover:underline sm:inline">Buka dokumen</span>
    </a>
  );
}
