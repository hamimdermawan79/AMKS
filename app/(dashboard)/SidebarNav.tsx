'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { handleLogout } from './logout-action';
import NotificationBell from '@/components/ui/notification-bell';

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface SidebarNavProps {
  navItems: NavLinkItem[];
  /**
   * Renders dividers in the mobile drawer. Each element in `navGroups` is a
   * slice of navItems (matched by href) that should be visually separated.
   * Order matters.
   */
  dividerHrefs: string[];
  user: {
    fullName: string;
    jabatan?: string | null;
    id: string;
  };
}

export default function SidebarNav({ navItems, dividerHrefs, user }: SidebarNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileOpen]);

  const renderNavLinks = (onNavigate?: () => void) =>
    navItems.map((item, idx) => (
      <div key={item.href}>
        {idx > 0 && dividerHrefs.includes(item.href) && (
          <div className="border-t border-border/60 my-2" />
        )}
        <Link href={item.href} onClick={onNavigate} className="nav-item">
          {item.label}
        </Link>
      </div>
    ));

  return (
    <>
      {/* ===== Desktop persistent sidebar ===== */}
      <aside className="hidden md:flex w-64 glass border-r border-border flex-shrink-0 flex-col">
        <div className="p-6 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 smooth-transition">
            <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="w-10 h-10 rounded-lg object-contain shadow-sm" />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold text-foreground">SIMAS-KS</span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Sistem Manajemen Asrama</span>
            </div>
          </Link>

          <div className="space-y-6 flex-1">
            <nav className="space-y-2">{renderNavLinks()}</nav>

            <form action={handleLogout}>
              <button type="submit" className="w-full nav-item text-red-600 hover:bg-red-50">
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ===== Mobile header bar (with hamburger) ===== */}
      <header className="md:hidden glass border-b border-border/80 py-3 px-4 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="w-8 h-8 rounded-lg object-contain shadow-sm" />
          <span className="text-base font-semibold text-foreground">SIMAS-KS</span>
        </Link>

        <NotificationBell userId={user.id} />
      </header>

      {/* ===== Mobile drawer ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[80vw] max-w-xs flex-col bg-white shadow-2xl md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                  <img src="/images/2-simas-logo.webp" alt="SIMAS-KS" className="h-9 w-9 rounded-xl object-contain shadow-sm" />
                  <div className="flex flex-col leading-none">
                    <span className="text-base font-semibold text-slate-800">SIMAS-KS</span>
                    <span className="text-[10px] font-medium text-slate-500">Sistem Manajemen Asrama</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                  aria-label="Tutup menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User chip */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-foreground">{user.fullName}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase font-bold tracking-wider">
                  {user.jabatan || 'Warga'}
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {renderNavLinks(() => setMobileOpen(false))}
              </nav>

              {/* Logout */}
              <div className="border-t border-slate-100 px-4 py-4">
                <form action={handleLogout}>
                  <button type="submit" className="w-full nav-item text-red-600 hover:bg-red-50">
                    Logout
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
