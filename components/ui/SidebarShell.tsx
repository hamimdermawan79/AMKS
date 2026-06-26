'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface SidebarShellProps {
  children: React.ReactNode;
  navContent: React.ReactNode;
  userName: string;
  userJabatan: string | null;
  notificationBell: React.ReactNode;
}

export default function SidebarShell({
  children,
  navContent,
  userName,
  userJabatan,
  notificationBell,
}: SidebarShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tutup sidebar saat resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cegah scroll body saat sidebar mobile terbuka
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {/* ── SIDEBAR DESKTOP (md ke atas) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-border flex-shrink-0">
        {navContent}
      </aside>

      {/* ── SIDEBAR MOBILE (overlay) ──────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.aside
              key="sidebar"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 glass border-r border-border flex flex-col md:hidden overflow-y-auto"
            >
              {/* Tombol tutup */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Tutup sidebar"
              >
                <X className="h-5 w-5" />
              </button>

              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col bg-slate-50/20">
        {/* Header bar */}
        <header className="glass border-b border-border/80 py-3 px-4 md:py-4 md:px-8 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — hanya di mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
                {userName}
              </span>
              <span className="hidden sm:inline-flex text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase font-bold tracking-wider flex-shrink-0">
                {userJabatan || 'Warga'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {notificationBell}
          </div>
        </header>

        {/* Page content */}
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
