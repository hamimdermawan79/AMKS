import type { ReactNode } from 'react';
import styles from './archive.module.css';

interface Props {
  title: string;
  subtitle?: ReactNode;
  description?: string;
  statistics?: { value: number; label: string }[];
  patterned?: boolean;
  compactHeader?: boolean;
  children: ReactNode;
}

export default function ArchiveShell({ title, subtitle, description, statistics = [], patterned = false, compactHeader = false, children }: Props) {
  return (
    <div className={`${styles.page} ${patterned ? styles.patterned : ''} min-h-screen pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pt-36`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className={`border-b border-slate-200/90 ${compactHeader ? 'mb-4 pb-4' : 'mb-7 pb-7 sm:mb-9 sm:pb-9'}`}>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end lg:gap-12">
            <div className="max-w-2xl">
              <h1 className="text-balance font-serif text-4xl font-normal leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">{title}</h1>
              {subtitle && <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{subtitle}</p>}
              {description && <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{description}</p>}
            </div>
            {statistics.length > 0 && <dl className="flex shrink-0 gap-6 lg:gap-10">
              {statistics.map(stat => (
                <div key={stat.label} className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0">
                  <dt className="order-2 text-xs text-slate-500 sm:mt-2">{stat.label}</dt>
                  <dd className="order-1 font-serif text-2xl tabular-nums leading-none text-slate-800 sm:text-4xl">{stat.value.toLocaleString('id-ID')}</dd>
                </div>
              ))}
            </dl>}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
