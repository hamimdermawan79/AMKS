'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Camera,
  Smartphone,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Calendar,
  Megaphone,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  ClipboardCopy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

type ActivityType = {
  id: string;
  title: string;
  description: string | null;
  startAt: string | null;
  location: string | null;
};

type AnnouncementType = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
};

type Props = {
  activities: ActivityType[];
  announcements: AnnouncementType[];
  canManage: boolean;
  canViewCctv: boolean;
};

const CCTV_INFO = {
  email: 'asramasambas20006@gmail.com',
  password: 'Sambas2006',
  app: 'iCSee',
  platform: 'Mobile (Android & iOS)',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
      title="Salin"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function KeamananManager({ activities, announcements, canManage, canViewCctv }: Props) {
  const [activeTab, setActiveTab] = useState<'cctv' | 'kegiatan'>('cctv');
  const [showPassword, setShowPassword] = useState(false);

  const now = new Date();
  const nextEvent = activities
    .filter(a => a.startAt && new Date(a.startAt) >= now)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())[0] || null;

  const getCountdown = () => {
    if (!nextEvent?.startAt) return null;
    const diff = new Date(nextEvent.startAt).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const countdownDays = getCountdown();

  // Hitung bulan sejak terakhir maintenance (asumsi berdasarkan kegiatan terakhir)
  const lastMaintenance = activities
    .filter(a => a.title.toLowerCase().includes('maintenance') || a.title.toLowerCase().includes('cctv'))
    .sort((a, b) => {
      if (!a.startAt) return 1;
      if (!b.startAt) return -1;
      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
    })[0];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Divisi Keamanan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mengelola keamanan asrama, maintenance CCTV bulanan, serta pengawasan dan penyelenggaraan kegiatan keamanan lingkungan asrama.
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/keamanan/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-600 shadow-sm transition-all duration-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Layanan Admin Keamanan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CCTV Status */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50/60 via-white to-white p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Status CCTV</span>
            <h3 className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
              Aktif & Terpantau
            </h3>
          </div>
        </div>

        {/* Pengumuman Count */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Pengumuman Aktif</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{announcements.length} Pengumuman</h3>
          </div>
        </div>

        {/* Next Event */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-sky-50/50 via-white to-white p-6 shadow-sm">
          {nextEvent ? (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Kegiatan/Maintenance Terdekat</span>
              <h4 className="font-bold text-foreground text-sm truncate">{nextEvent.title}</h4>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">
                {countdownDays === 0 ? 'Hari ini!' : `${countdownDays} Hari Lagi`}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 h-full">
              <Calendar className="h-6 w-6 text-sky-400" />
              <div>
                <span className="text-xs text-muted-foreground font-medium">Jadwal Berikutnya</span>
                <p className="text-xs text-slate-500 font-semibold">Belum direncanakan</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAINTENANCE REMINDER BANNER */}
      {canViewCctv && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Jadwal Maintenance CCTV Bulanan</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Lakukan maintenance sistem CCTV setiap 1 bulan sekali — cek kondisi kamera, pembersihan lensa, dan verifikasi rekaman.
              {lastMaintenance?.startAt && (
                <span className="ml-1 font-medium">
                  Terakhir: {new Date(lastMaintenance.startAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('cctv')}
          className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cctv'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Info CCTV
          </span>
        </button>
        <button
          onClick={() => setActiveTab('kegiatan')}
          className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'kegiatan'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pengumuman & Kegiatan
          </span>
        </button>
      </div>

      {/* TAB: INFO CCTV */}
      {activeTab === 'cctv' && (
        <div className="space-y-6">
          {canViewCctv ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Akses Sistem CCTV Asrama</h2>
              </div>

              {/* CCTV Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* App Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-md"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-100">Aplikasi CCTV</p>
                      <h3 className="text-xl font-bold">{CCTV_INFO.app}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100">{CCTV_INFO.platform}</p>
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span className="text-xs font-medium">Download di App Store / Play Store</span>
                  </div>
                </motion.div>

                {/* Credentials Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-foreground">Kredensial Akun CCTV</span>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email Akun
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-4 py-3">
                      <span className="flex-1 text-sm font-mono text-foreground select-all">
                        {CCTV_INFO.email}
                      </span>
                      <CopyButton text={CCTV_INFO.email} />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      Password
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-4 py-3">
                      <span className="flex-1 text-sm font-mono text-foreground select-all">
                        {showPassword ? CCTV_INFO.password : '•'.repeat(CCTV_INFO.password.length)}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      {showPassword && <CopyButton text={CCTV_INFO.password} />}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Informasi Rahasia</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Kredensial ini hanya boleh diakses oleh Ketua Divisi Keamanan, Ketua Asrama, dan Super Admin.
                    Jangan bagikan ke pihak lain. Hubungi pengurus jika ada dugaan kebocoran akses.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Unauthorized View */
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-border bg-slate-50/50"
            >
              <div className="p-4 bg-slate-100 rounded-3xl mb-4">
                <Lock className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">Akses Terbatas</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Informasi akun CCTV hanya dapat dilihat oleh Ketua Divisi Keamanan, Ketua Asrama, dan Super Admin.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* TAB: PENGUMUMAN & KEGIATAN */}
      {activeTab === 'kegiatan' && (
        <div className="space-y-8">
          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Pengumuman Divisi</h2>
              {canManage && (
                <Link
                  href="/admin/keamanan/kelola"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Kelola Pengumuman
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{ann.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{ann.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                      {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {announcements.length === 0 && (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-slate-50/50">
                  <Megaphone className="h-9 w-9 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Belum ada pengumuman divisi keamanan.</p>
                </div>
              )}
            </div>
          </div>

          {/* Activities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Jadwal Kegiatan & Maintenance</h2>
              {canManage && (
                <Link
                  href="/admin/keamanan/kelola"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Tambah Jadwal
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map((act) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                      {act.title.toLowerCase().includes('maintenance') || act.title.toLowerCase().includes('cctv')
                        ? <Camera className="h-4 w-4" />
                        : <Calendar className="h-4 w-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm leading-tight truncate">{act.title}</h3>
                      {act.startAt ? (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          {new Date(act.startAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      ) : (
                        <p className="text-xs text-rose-500 font-medium mt-1">Tanggal belum ditentukan</p>
                      )}
                      {act.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {act.location}</p>
                      )}
                    </div>
                  </div>
                  {act.description && (
                    <p className="text-xs text-muted-foreground bg-slate-50 p-2.5 rounded-xl leading-relaxed">{act.description}</p>
                  )}
                </motion.div>
              ))}

              {activities.length === 0 && (
                <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border bg-slate-50/50">
                  <Camera className="h-9 w-9 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Belum ada jadwal kegiatan atau maintenance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
