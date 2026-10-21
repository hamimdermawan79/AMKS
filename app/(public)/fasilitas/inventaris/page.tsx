import { Metadata } from 'next';
import { db } from '@/lib/db';
import InventarisPublicClient from './InventarisPublicClient';
import styles from './inventory.module.css';

export const metadata: Metadata = {
  title: 'Inventaris Asrama Mahasiswa Kabupaten Sambas',
  description: 'Daftar fasilitas dan inventaris yang tersedia di Asrama Mahasiswa Kabupaten Sambas.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function InventarisPublicPage() {
  const items = await db.inventory.findMany({
    include: {
      loans: {
        where: { status: 'APPROVED' },
      }
    },
    orderBy: { name: 'asc' },
  });

  const templates = await db.letterTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={`${styles.page} min-h-screen pb-20 pt-28 sm:pt-32 lg:pt-36`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="mb-10 text-center sm:mb-14">
          <h1 className="text-balance font-serif text-3xl font-normal tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Fasilitas dan Inventaris Asrama
          </h1>
        </header>

        <InventarisPublicClient items={items} templates={templates} />

      </div>
    </div>
  );
}
