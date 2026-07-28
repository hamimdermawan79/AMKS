'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, X, Mail, Phone, MapPin } from 'lucide-react';

// SVG inline untuk sosial media (tidak tersedia di lucide-react versi proyek ini)
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.412A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.95 7.95 0 01-4.076-1.123l-.292-.174-3.014.854.882-2.935-.19-.302A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
    </svg>
  );
}

// ── Tipe navigasi ──────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Arsip & Dokumen',
    children: [
      { label: 'AD / ART', href: '/arsip-dokumen/ad-art' },
      { label: 'Buku Alumni', href: '/arsip-dokumen/buku-alumni' },
      { label: 'Karya Ilmiah', href: '/karya-ilmiah' },
    ],
  },
  {
    label: 'Tentang Kami',
    href: '/tentang-kami',
    children: [
      { label: 'Profil Asrama', href: '/tentang-kami' },
      { label: 'Galeri Kegiatan', href: '/tentang-kami/galeri' },
      { label: 'Struktur Organisasi', href: '/tentang-kami/struktur' },
    ],
  },
  { label: 'Hubungi Kami', href: '/hubungi-kami' },
];

// ── Mobile Menu ────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-[80vw] max-w-sm flex-col bg-white shadow-2xl"
          >
            {/* Header drawer — SIMAS branding */}
            <motion.div 
              className="flex items-center justify-between border-b border-slate-100 px-6 py-5"
              layoutId="brand-head"
            >
              <Link href="/" onClick={onClose} className="flex items-center gap-3">
                <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
                <div className="flex flex-col leading-none">
                  <span className="text-base font-semibold text-slate-800">SIMAS-KS</span>
                  <span className="text-[10px] font-medium text-slate-500">Sistem Informasi Manajemen Asrama Kabupaten Sambas</span>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              {navItems.map((item) => {
                if (item.children) {
                  const isOpen = openGroup === item.label;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setOpenGroup(isOpen ? null : item.label)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {item.label}
                        <motion.svg
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="h-4 w-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mb-1 ml-4 border-l-2 border-primary/20 pl-4">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={onClose}
                                  className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-primary"
                                >
                                  {child.label}

                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    onClick={onClose}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Action buttons */}
            <div className="border-t border-slate-100 px-6 py-4 space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90"
              >
                Akses Warga Asrama
              </Link>
              <Link
                href="/daftar-warga"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
              >
                Daftar Calon Warga
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile Menu */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Overlay layer: transparent, absolute (scrolls away with hero) */}
      <div className="absolute top-0 z-30 w-full pointer-events-none">
        <div className="relative w-full px-6 lg:px-10 py-6 flex justify-between items-start pointer-events-none">
          {/* Logo SIMAS */}
          <motion.div
            className="pointer-events-auto"
            layoutId="brand-head"
            animate={{ opacity: mobileOpen ? 0 : 1 }}
            transition={{ duration: 0.25 }}
          >
            <Link href="/" className="flex items-center gap-1.5 xl:gap-2 smooth-transition hover:opacity-80">
              <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="w-7 h-7 xl:w-8 2xl:w-10 xl:h-8 2xl:h-10 rounded-lg xl:rounded-xl object-contain shadow-sm" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 tracking-tight">SIMAS-KS</span>
                <span className="text-[8px] xl:text-[9px] 2xl:text-[10px] font-medium text-slate-500">Sistem Informasi Manajemen Asrama</span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Floating Navbar — fixed, stays on scroll, viewport-centered */}
          <nav className="pointer-events-auto hidden lg:flex items-center gap-2 xl:gap-4 2xl:gap-6 px-2.5 xl:px-4 2xl:px-6 py-1.5 xl:py-2 2xl:py-2.5 rounded-full bg-white/40 backdrop-blur-2xl border border-white/60 shadow-md shadow-blue-900/5 fixed top-4 xl:top-5 2xl:top-6 left-1/2 -translate-x-1/2 z-40">
            {/* Arsip & Dokumen Dropdown */}
            <div className="relative group">
              <span className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-700 cursor-pointer hover:text-primary smooth-transition flex items-center gap-0.5 xl:gap-1 whitespace-nowrap">
                Arsip & Dokumen
                <svg className="w-2.5 h-2.5 xl:w-3 xl:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible smooth-transition z-50">
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-md shadow-blue-900/5 min-w-[140px] py-1 rounded-lg">
                  <Link href="/arsip-dokumen/ad-art" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    AD / ART
                  </Link>
                  <Link href="/arsip-dokumen/buku-alumni" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    Buku Alumni
                  </Link>
                  <Link href="/karya-ilmiah" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    Karya Ilmiah
                  </Link>
                </div>
              </div>
            </div>

            {/* Tentang Kami Dropdown */}
            <div className="relative group">
              <Link href="/tentang-kami" className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-700 hover:text-primary smooth-transition flex items-center gap-0.5 xl:gap-1 whitespace-nowrap">
                Tentang Kami
                <svg className="w-2.5 h-2.5 xl:w-3 xl:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible smooth-transition z-50">
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-md shadow-blue-900/5 min-w-[140px] py-1 rounded-lg">
                  <Link href="/tentang-kami" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    Profil Asrama
                  </Link>
                  <Link href="/tentang-kami/galeri" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    Galeri Kegiatan
                  </Link>
                  <Link href="/tentang-kami/struktur" className="block px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:text-primary hover:bg-white/40 smooth-transition">
                    Struktur Organisasi
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/hubungi-kami" className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-700 hover:text-primary smooth-transition whitespace-nowrap">
              Hubungi Kami
            </Link>

            <Link href="/daftar-warga" className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-2 xl:px-2.5 2xl:px-3 py-1 xl:py-1.5 rounded-full smooth-transition shadow-sm shadow-primary/20 whitespace-nowrap">
              Daftar jadi Warga
            </Link>
          </nav>

          {/* Right side: AMKS branding + Hamburger */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 2xl:gap-3 text-right">
              <div className="flex flex-col leading-none justify-center h-7 xl:h-8 2xl:h-10">
                <span className="text-[9px] xl:text-[11px] 2xl:text-[13px] font-bold text-slate-800 tracking-tight leading-tight">Asrama Mahasiswa Kabupaten Sambas</span>
                <span className="text-[8px] xl:text-[9px] 2xl:text-[10px] font-medium text-slate-500 mt-0.5">Yogyakarta</span>
              </div>
              <img src="/images/3-amks-logo.webp" alt="AMKS Yogyakarta" className="w-7 h-7 xl:w-8 2xl:w-10 xl:h-8 2xl:h-10 rounded-full object-contain shadow-sm shrink-0" />
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-slate-700 transition hover:bg-white/90"
              aria-label="Toggle menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 mb-12">

            {/* Kolom 1 — Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
                <div className="flex flex-col leading-none">
                  <span className="text-base font-bold text-white">SIMAS-KS</span>
                  <span className="text-[11px] text-slate-500">Sistem Manajemen Asrama - Kabupaten Sambas</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                Platform digital resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta — wadah warga, pengurus, dan calon warga asrama.
              </p>
              {/* Sosmed */}
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/amks.yogyakarta?igsh=Mm03OHc5NWR4NWU2"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram AMKS"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-primary/20 hover:text-primary"
                >
                  <IconInstagram className="h-4 w-4" />
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp AMKS"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-green-500/20 hover:text-green-400"
                >
                  <IconWhatsApp className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Kolom 2 — Tautan Cepat */}
            <div>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-300">Tautan Cepat</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Tentang Kami', href: '/tentang-kami' },
                  { label: 'Galeri Kegiatan', href: '/tentang-kami/galeri' },
                  { label: 'Karya Ilmiah', href: '/karya-ilmiah' },
                  { label: 'Daftar Jadi Warga', href: '/daftar-warga' },
                  { label: 'Hubungi Kami', href: '/hubungi-kami' },
                  { label: 'Login Warga', href: '/login' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-400 transition hover:text-primary hover:pl-1">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolom 3 — Kontak */}
            <div>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-300">Kontak</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href="mailto:asramasambas20006@gmail.com" className="text-slate-400 transition hover:text-primary">
                    asramasambas20006@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {/* Ganti nomor ini dengan nomor resmi sebelum launch */}
                  <a href="tel:+6281234567890" className="text-slate-400 transition hover:text-primary">
                    +62 812‑3456‑7890
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-slate-400 leading-relaxed">
                    {/* Ganti dengan alamat lengkap sebelum launch */}
                    Jl. Garuda, Gang Beo No.328, Umbulharjo, Yogyakarta,<br />
                    Daerah Istimewa Yogyakarta
                  </span>
                </li>
              </ul>
              <Link
                href="/hubungi-kami"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
              >
                Kirim Pesan →
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Hak cipta dilindungi.</p>
            <p>Dibuat dengan ❤️ untuk warga Sambas di Yogyakarta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
