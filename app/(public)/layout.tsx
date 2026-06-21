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
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass border-b border-border"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 smooth-transition hover:opacity-80">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-semibold text-foreground tracking-tight">AMKS</span>
                <span className="text-[11px] text-muted-foreground">Asrama Mahasiswa Kab. Sambas</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/karya-ilmiah" className="text-muted-foreground hover:text-primary smooth-transition font-medium">
                Karya Ilmiah
              </Link>
              <Link href="/dokumentasi" className="text-muted-foreground hover:text-primary smooth-transition font-medium">
                Dokumentasi
              </Link>

              {/* Tentang Kami - Dropdown */}
              <div className="relative group">
                <Link href="/tentang-kami" className="text-muted-foreground hover:text-primary smooth-transition font-medium flex items-center gap-1">
                  Tentang Kami
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible smooth-transition z-50">
                  <div className="glass border border-border shadow-lg min-w-[200px] py-2">
                    <Link href="/tentang-kami" className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-blue-50/50 smooth-transition">
                      Profil Asrama
                    </Link>
                    <Link href="/tentang-kami/galeri" className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-blue-50/50 smooth-transition">
                      Galeri Kegiatan
                    </Link>
                    <Link href="/tentang-kami/struktur" className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-blue-50/50 smooth-transition">
                      Struktur Organisasi
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/hubungi-kami" className="text-muted-foreground hover:text-primary smooth-transition font-medium">
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

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
            <p>&copy; {new Date().getFullYear()} AMKS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
