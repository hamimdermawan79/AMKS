'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Power,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Megaphone,
  Smartphone,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  ClipboardCopy,
  Moon,
  BookUser,
} from 'lucide-react';
import { updateCctvStatus, confirmCctvMemoryCleaned } from '../security-actions';
import DivisionClient from '../../division-shared/DivisionClient';
import SecurityDutyTab from '../SecurityDutyTab';
import GuestBookTab from '../GuestBookTab';
import { Division } from '@prisma/client';

export type CctvStatusData = {
  id: string;
  isActive: boolean;
  lastVerifiedAt: string;
  daysSinceVerified: number;
  lastMemoryCleanedAt: string | null;
  daysSinceMemoryCleaned: number | null;
  verifiedBy: { id: string; fullName: string } | null;
  note: string | null;
};

type UserBasic = { id: string; fullName: string };

type AssignmentWithAttendance = {
  id: string;
  date: string;
  userId: string;
  user: UserBasic;
  attendance: {
    id: string;
    status: string;
    doorsLocked: boolean;
    garagesClosed: boolean;
    bikesSecured: boolean;
    note: string | null;
    markedAt: string;
  } | null;
};

type SecurityPeriod = {
  id: string;
  month: number;
  year: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  assignments: AssignmentWithAttendance[];
};

type GuestEntry = {
  id: string;
  visitorName: string;
  originCity: string;
  institution: string | null;
  purpose: string;
  knownById: string | null;
  knownByOther: string | null;
  entryTime: string;
  exitTime: string | null;
  isStaying?: boolean;
  stayDuration?: number | null;
  note: string | null;
  month: number;
  year: number;
  createdBy: UserBasic | null;
  knownBy: UserBasic | null;
};

type Props = {
  currentUserId: string;
  cctvStatus: CctvStatusData;
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: string;
  }[];
  activities: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: string | null;
    endAt: string | null;
  }[];
  securityPeriods: SecurityPeriod[];
  guestEntries: GuestEntry[];
  allUsers: UserBasic[];
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

export default function KeamananAdminClient({
  currentUserId,
  cctvStatus,
  announcements,
  activities,
  securityPeriods,
  guestEntries,
  allUsers,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cctv' | 'piket_malam' | 'buku_tamu' | 'pengumuman'>('cctv');
  const [isPending, startTransition] = useTransition();
  const [cctvNote, setCctvNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/admin/keamanan"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Tampilan Warga (Preview)
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Layanan Admin — Keamanan
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pusat kelola status CCTV, pembuatan jadwal piket malam, pencatatan buku tamu, dan agenda divisi.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Preview */}
        <Link
          href="/admin/keamanan"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-slate-50 transition-all self-start md:self-auto"
        >
          Lihat Tampilan Warga
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('cctv')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'cctv'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Kelola Status CCTV
          </span>
        </button>
        <button
          onClick={() => setActiveTab('piket_malam')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'piket_malam'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Kelola Piket Malam
          </span>
        </button>
        <button
          onClick={() => setActiveTab('buku_tamu')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'buku_tamu'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookUser className="h-4 w-4" />
            Kelola Buku Tamu
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pengumuman')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pengumuman'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Pengumuman & Agenda
          </span>
        </button>
      </div>

      {/* TAB CONTENT: CCTV */}
      {activeTab === 'cctv' && (
        <div className="space-y-6">
          {/* Main Status & Toggle Card */}
          <div
            className={`rounded-3xl border p-6 shadow-sm space-y-5 ${
              cctvStatus.isActive
                ? 'border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/30'
                : 'border-red-200 bg-gradient-to-br from-red-50/80 to-rose-50/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    cctvStatus.isActive
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                      : 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  }`}
                >
                  <Power className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        cctvStatus.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <h3 className="text-lg font-bold text-foreground">
                      Status CCTV: {cctvStatus.isActive ? 'AKTIF (Merekam)' : 'NONAKTIF'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Terakhir diverifikasi:{' '}
                    <span className="font-semibold text-foreground">
                      {cctvStatus.daysSinceVerified === 0
                        ? 'Hari ini'
                        : `${cctvStatus.daysSinceVerified} hari yang lalu`}
                    </span>
                    {cctvStatus.verifiedBy && ` oleh ${cctvStatus.verifiedBy.fullName}`}
                  </p>
                </div>
              </div>

              {/* Action Toggle Button */}
              <button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await updateCctvStatus({
                        isActive: !cctvStatus.isActive,
                        note: cctvNote || undefined,
                      });
                      setCctvNote('');
                      router.refresh();
                    } catch (e) {
                      alert((e as Error).message);
                    }
                  });
                }}
                className={`px-6 py-3 text-sm font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  cctvStatus.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                } disabled:opacity-50`}
              >
                {isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : cctvStatus.isActive ? (
                  <>
                    <Power className="h-4 w-4" /> Ubah ke Nonaktif
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Verifikasi & Aktifkan CCTV
                  </>
                )}
              </button>
            </div>

            {/* Input Note */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200/60">
              <input
                type="text"
                value={cctvNote}
                onChange={(e) => setCctvNote(e.target.value)}
                placeholder="Tulis catatan status (opsional, misal: 'Kamera depan normal, listrik stabil')..."
                className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {cctvNote && (
                <button
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await updateCctvStatus({
                          isActive: cctvStatus.isActive,
                          note: cctvNote,
                        });
                        setCctvNote('');
                        router.refresh();
                      } catch (e) {
                        alert((e as Error).message);
                      }
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  Simpan Catatan
                </button>
              )}
            </div>

            {/* Warning if approaching auto-deactivation */}
            {cctvStatus.isActive && cctvStatus.daysSinceVerified >= 3 && (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-100/90 border border-amber-300 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-amber-900 font-semibold">
                    Peringatan: Status CCTV akan Otomatis Nonaktif
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Sistem akan mengubah status menjadi <strong>Nonaktif</strong> dalam{' '}
                    <strong>{5 - cctvStatus.daysSinceVerified} hari lagi</strong> jika tidak diverifikasi ulang.
                    Klik tombol verifikasi di atas jika CCTV telah dipastikan aktif merekam.
                  </p>
                </div>
              </div>
            )}

            {/* Last Note */}
            {cctvStatus.note && (
              <p className="text-xs text-muted-foreground bg-white/70 rounded-xl px-4 py-3 border border-border/50">
                📝 <strong>Catatan Terakhir:</strong> {cctvStatus.note}
              </p>
            )}
          </div>

          {/* Memory Cleaning Card */}
          <div
            className={`rounded-3xl border p-6 shadow-sm space-y-4 ${
              cctvStatus.daysSinceMemoryCleaned !== null && cctvStatus.daysSinceMemoryCleaned < 30
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-200 bg-amber-50/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    cctvStatus.daysSinceMemoryCleaned !== null && cctvStatus.daysSinceMemoryCleaned < 30
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Pembersihan & Maintenance Memori CCTV
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {cctvStatus.lastMemoryCleanedAt
                      ? `Terakhir dibersihkan: ${new Date(cctvStatus.lastMemoryCleanedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} (${cctvStatus.daysSinceMemoryCleaned} hari lalu)`
                      : 'Belum pernah ada riwayat pencatatan pembersihan memori.'}
                  </p>
                </div>
              </div>

              <button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await confirmCctvMemoryCleaned(cctvNote || undefined);
                      setCctvNote('');
                      router.refresh();
                    } catch (e) {
                      alert((e as Error).message);
                    }
                  });
                }}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 whitespace-nowrap"
              >
                {isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  '✓ Konfirmasi Memori Sudah Dibersihkan'
                )}
              </button>
            </div>

            {cctvStatus.daysSinceMemoryCleaned !== null && cctvStatus.daysSinceMemoryCleaned >= 30 && (
              <div className="flex items-center gap-2 rounded-2xl bg-amber-100 border border-amber-300 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-amber-900 font-medium">
                  💾 Sudah lebih dari 30 hari sejak pembersihan memori terakhir. Segera cek dan format memori DVR untuk mencegah rekaman terputus.
                </p>
              </div>
            )}
          </div>

          {/* System Rules & Info Banner */}
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-900 font-semibold text-sm">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Sistem Otomatisasi & Broadcast CCTV
            </div>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>
                <strong>Verifikasi 5 Hari:</strong> Jika status tidak diverifikasi dalam 5 hari, sistem otomatis mengubah status menjadi <strong>Nonaktif</strong>.
              </li>
              <li>
                <strong>Broadcast Per Jam:</strong> Saat status CCTV Nonaktif, sistem akan mengirim broadcast WhatsApp ke seluruh petugas Keamanan dan Ketua <strong>setiap 1 jam sekali</strong> sampai status diaktifkan kembali.
              </li>
              <li>
                <strong>Reminder Memori Bulanan:</strong> Notifikasi pengingat otomatis dikirim setiap 30 hari untuk memastikan penyimpanan rekaman tetap optimal.
              </li>
            </ul>
          </div>

          {/* CCTV Info Cards (Credentials) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Kredensial & Akun Sistem CCTV</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* App Card */}
              <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-md">
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
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                  <span className="text-xs font-medium">Download di App Store / Play Store</span>
                </div>
              </div>

              {/* Credentials Card */}
              <div className="rounded-3xl border border-border bg-card shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PIKET MALAM */}
      {activeTab === 'piket_malam' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <p className="text-xs sm:text-sm text-blue-900 font-medium">
              ℹ️ <strong>Layanan Admin Piket Malam:</strong> Anda dapat membuat jadwal baru dengan rentang tanggal dan filter peserta, menghapus jadwal periode ini, atau mengganti giliran petugas piket langsung dari tabel.
            </p>
          </div>
          <SecurityDutyTab
            periods={securityPeriods}
            currentUserId={currentUserId}
            canManage={true}
            allUsers={allUsers}
          />
        </div>
      )}

      {/* TAB CONTENT: BUKU TAMU */}
      {activeTab === 'buku_tamu' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
            <p className="text-xs sm:text-sm text-indigo-900 font-medium">
              ℹ️ <strong>Layanan Admin Buku Tamu:</strong> Anda dapat mencatat tamu baru asrama (termasuk status menginap dan durasi), menandai waktu tamu keluar, serta mengelola data buku tamu.
            </p>
          </div>
          <GuestBookTab
            entries={guestEntries}
            canInput={true}
            allUsers={allUsers}
          />
        </div>
      )}

      {/* TAB CONTENT: PENGUMUMAN & KEGIATAN */}
      {activeTab === 'pengumuman' && (
        <DivisionClient
          division={'KEAMANAN' as Division}
          divisionLabel="Keamanan"
          description="Mengelola keamanan asrama, jadwal maintenance CCTV bulanan, serta penyelenggaraan kegiatan keamanan lingkungan asrama."
          themeColor="blue"
          announcements={announcements}
          activities={activities}
          canManage={true}
        />
      )}
    </div>
  );
}
