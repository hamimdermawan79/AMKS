'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 z-50 w-full pointer-events-none"
      >
        <header className="relative w-full px-6 lg:px-10 py-6 flex justify-between items-start pointer-events-none">
          {/* Logo */}
          <div className="pointer-events-auto">
            <Link href="/" className="flex items-center gap-3 smooth-transition hover:opacity-80">
              <div className="w-10 h-10 rounded-xl bg-primary shadow-sm flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-semibold text-slate-800 tracking-tight">AMKS</span>
                <span className="text-[11px] font-medium text-slate-500">Asrama Mahasiswa Kab. Sambas</span>
              </div>
            </Link>
          </div>

          {/* Floating Headbar */}
          <nav className="pointer-events-auto hidden md:flex items-center gap-8 px-8 py-3.5 rounded-full bg-white/40 backdrop-blur-2xl border border-white/60 shadow-lg shadow-blue-900/5 absolute left-1/2 -translate-x-1/2 top-6">
            <Link href="/karya-ilmiah" className="text-sm font-semibold text-slate-700 hover:text-primary smooth-transition">
              Karya Ilmiah
            </Link>
            <Link href="/dokumentasi" className="text-sm font-semibold text-slate-700 hover:text-primary smooth-transition">
              Dokumentasi
            </Link>

            {/* Tentang Kami - Dropdown */}
            <div className="relative group">
              <Link href="/tentang-kami" className="text-sm font-semibold text-slate-700 hover:text-primary smooth-transition flex items-center gap-1.5">
                Tentang Kami
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible smooth-transition z-50">
                <div className="bg-white/95 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/10 min-w-[200px] py-2 rounded-2xl">
                  <Link href="/tentang-kami" className="block px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-white/50 smooth-transition">
                    Profil Asrama
                  </Link>
                  <Link href="/tentang-kami/galeri" className="block px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-white/50 smooth-transition">
                    Galeri Kegiatan
                  </Link>
                  <Link href="/tentang-kami/struktur" className="block px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-white/50 smooth-transition">
                    Struktur Organisasi
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/hubungi-kami" className="text-sm font-semibold text-slate-700 hover:text-primary smooth-transition">
              Hubungi Kami
            </Link>
          </nav>

          {/* Pemda Sambas Logo & Text (Right) */}
          <div className="pointer-events-auto hidden lg:flex items-center gap-3 text-right">
            <div className="flex flex-col leading-none justify-center h-10">
              <span className="text-[13px] font-bold text-slate-800 tracking-tight leading-tight">Pemerintah Daerah</span>
              <span className="text-[13px] font-bold text-slate-800 tracking-tight leading-tight">Kabupaten Sambas</span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">Kalimantan Barat</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-slate-400 text-xs font-medium border border-white overflow-hidden shadow-sm shrink-0">
              {/* Nanti diubah menjadi image logo Pemda Sambas sebelum deploy */}
              <span className="text-[10px] font-bold text-slate-300">Logo</span>
            </div>
          </div>
        </header>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="text-lg font-semibold text-foreground">AMKS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistem pengelolaan asrama digital untuk manajemen warga, kegiatan, dan keuangan.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Tautan Cepat</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dokumentasi" className="text-muted-foreground hover:text-primary smooth-transition">
                    Dokumentasi
                  </Link>
                </li>
                <li>
                  <Link href="/tentang-kami" className="text-muted-foreground hover:text-primary smooth-transition">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="/hubungi-kami" className="text-muted-foreground hover:text-primary smooth-transition">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Kontak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: info@amks.id</li>
                <li>Telepon: +62 xxx xxxx xxxx</li>
                <li>Alamat: [Alamat Asrama]</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} AMKS. Hak Cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
