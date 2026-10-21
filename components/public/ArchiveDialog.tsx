'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './archive.module.css';

export default function ArchiveDialog({ title, children, onClose, busy = false }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} className={styles.modal}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Tutup dialog" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:opacity-50">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 pb-6 sm:px-6">{children}</div>
    </dialog>
  );
}
