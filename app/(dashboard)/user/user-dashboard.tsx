"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  MapPin,
  ExternalLink,
  BookOpen,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";
import { submitMeetingSelfAttendance } from "@/app/(dashboard)/admin/kesekretariatan/actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 14 },
  },
};

export default function UserDashboard({
  session,
  showAdminButton,
  divisionManageHref,
  myUpcomingPiket,
  upcomingKerjaBakti,
  upcomingSports,
  upcomingGeneralActivity,
  myUpcomingRohani,
  pendingBills,
  announcements,
  monthlyMeeting,
}: {
  session: any;
  showAdminButton: boolean;
  divisionManageHref?: string;
  myUpcomingPiket?: { date: string; sector: number } | null;
  upcomingKerjaBakti?: string | null;
  upcomingSports?: { 
    id: string; 
    title: string; 
    date: string; 
    endDate?: string | null; 
    location?: string | null; 
    locationUrl?: string | null; 
  } | null;
  upcomingGeneralActivity?: { id: string; title: string; date: string | null; division: string | null } | null;
  myUpcomingRohani?: { date: string; message: string | null } | null;
  pendingBills?: { id: string; title: string; amount: number; type: string; dueDate: string | null }[];
  announcements?: { id: string; title: string; message: string; createdAt: string }[];
  monthlyMeeting?: {
    id: string;
    title: string;
    scheduledAt: string;
    leaderName?: string | null;
    isOpen: boolean;
    isPast: boolean;
    myAttendance: {
      id: string;
      status?: string | null;
      attendAs?: string | null;
      ideas?: string | null;
      evaluation?: string | null;
      submittedAt?: string | null;
      isApproved?: boolean | null;
      approvedAt?: string | null;
    } | null;
  } | null;
}) {
  const router = useRouter();
  const greeting = useMemo(() => getGreeting(), []);
  const name = session?.user?.fullName ?? "Pengguna";
  const jabatan = (session?.user?.jabatan && session.user.jabatan !== 'WARGA') ? session.user.jabatan : 'Warga';

  // Presensi Mandiri Rapat Bulanan State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [attendAs, setAttendAs] = useState(
    monthlyMeeting?.myAttendance?.attendAs || 
    (jabatan.toLowerCase().includes('calon') ? 'Calon Warga' : 'Warga Asrama')
  );
  const [ideas, setIdeas] = useState(monthlyMeeting?.myAttendance?.ideas || '');
  const [evaluation, setEvaluation] = useState(monthlyMeeting?.myAttendance?.evaluation || '');
  const [isAttending, setIsAttending] = useState(true);
  const [submittingMeeting, startSubmitMeeting] = useTransition();
  const [meetingError, setMeetingError] = useState('');
  const [meetingSuccess, setMeetingSuccess] = useState('');

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyMeeting) return;
    if (!isAttending) {
      setMeetingError('Harap centang konfirmasi kehadiran rapat.');
      return;
    }
    setMeetingError('');
    startSubmitMeeting(async () => {
      try {
        const res = await submitMeetingSelfAttendance({
          meetingId: monthlyMeeting.id,
          attendAs,
          ideas,
          evaluation,
        });
        setMeetingSuccess(res.message || 'Presensi berhasil dikirim! Menunggu verifikasi Sekretaris.');
        setShowMeetingModal(false);
        router.refresh();
      } catch (err: any) {
        setMeetingError(err.message || 'Gagal mengirim presensi rapat.');
      }
    });
  };

  const totalTagihan = pendingBills?.reduce((sum, b) => {
    const isLate = b.dueDate && new Date() > new Date(b.dueDate) && b.type === 'IURAN';
    const amt = isLate ? Math.floor(b.amount * 1.2) : b.amount;
    return sum + amt;
  }, 0) || 0;
  
  const hasKegiatan = upcomingKerjaBakti || upcomingSports || upcomingGeneralActivity || myUpcomingRohani;

  const now = new Date();
  let isPiketToday = false;
  let isPiketValidTime = false;

  if (myUpcomingPiket) {
    const piketDate = new Date(myUpcomingPiket.date);
    if (
      piketDate.getFullYear() === now.getFullYear() &&
      piketDate.getMonth() === now.getMonth() &&
      piketDate.getDate() === now.getDate()
    ) {
      isPiketToday = true;
      const hour = now.getHours();
      if (hour >= 1 && hour < 17) {
        isPiketValidTime = true;
      }
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ===== HERO GREETING ===== */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-50 via-blue-50/40 to-white p-5 sm:p-8 md:p-10"
      >
        {/* Decorative shapes */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-indigo-100/40 blur-2xl" />
        <div className="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-sky-100/40 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase font-bold tracking-wider mb-3 inline-flex items-center gap-2 shadow-sm backdrop-blur-sm">
              {jabatan}
            </span>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{greeting}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Halo, {name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Selamat Datang di Dashboard SIMAS-KS
            </p>
          </div>

          {showAdminButton && (
            <Link
              href="/admin/warga"
              className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
            >
              <ShieldCheck className="h-4 w-4" />
              Akses Admin Panel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          
        </div>
      </motion.div>

      {/* ===== QUICK STATS ===== */}
      <motion.div variants={item} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={<User className="h-5 w-5 text-emerald-600" />}
          label="Status Keanggotaan"
          value={session?.user?.status || "AKTIF"}
          badgeTone="emerald"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
          label="Jabatan"
          value={jabatan}
          badgeTone="blue"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-amber-600" />}
          label="Total Tagihan"
          value={fmtCurrency(totalTagihan)}
          badgeTone="amber"
          action={<Link href="/admin/keuangan" className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline px-2 py-1 bg-amber-100/50 rounded-md transition-colors">Details →</Link>}
        />
      </motion.div>

      {/* ===== CONTENT GRID ===== */}
      <motion.div variants={item} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* ===== RAPAT BULANAN ASRAMA (PRESENSI MANDIRI) ===== */}
          {monthlyMeeting && (
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-sm transition-all ${
                monthlyMeeting.isOpen && !monthlyMeeting.myAttendance
                  ? "border-indigo-400 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 shadow-md"
                  : monthlyMeeting.myAttendance?.isApproved === true
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50"
                  : monthlyMeeting.myAttendance?.isApproved === false
                  ? "border-rose-200 bg-gradient-to-br from-rose-50/60 via-white to-slate-50"
                  : monthlyMeeting.myAttendance
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-slate-50"
                  : "border-border bg-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    monthlyMeeting.isOpen && !monthlyMeeting.myAttendance
                      ? "bg-indigo-600 text-white shadow-xs"
                      : monthlyMeeting.myAttendance?.isApproved === true
                      ? "bg-emerald-100 text-emerald-700"
                      : monthlyMeeting.myAttendance?.isApproved === false
                      ? "bg-rose-100 text-rose-700"
                      : monthlyMeeting.myAttendance
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Rapat Bulanan Asrama
                      </span>
                      {monthlyMeeting.isOpen && !monthlyMeeting.myAttendance && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                          Presensi Dibuka (s.d 23:59 WIB)
                        </span>
                      )}
                      {monthlyMeeting.myAttendance && (
                        monthlyMeeting.myAttendance.isApproved === null ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Menunggu Verifikasi Sekretaris
                          </span>
                        ) : monthlyMeeting.myAttendance.isApproved === true ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Presensi Terverifikasi Hadir
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            ✕ Presensi Ditolak
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="font-bold text-foreground text-base sm:text-lg">
                      {monthlyMeeting.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {fmtDate(monthlyMeeting.scheduledAt)} • Pukul {fmtTime(monthlyMeeting.scheduledAt)} WIB
                      {monthlyMeeting.leaderName && ` • Pemimpin: ${monthlyMeeting.leaderName}`}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="self-end sm:self-center shrink-0">
                  {monthlyMeeting.myAttendance ? (
                    monthlyMeeting.isOpen ? (
                      <button
                        onClick={() => setShowMeetingModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        <UserCheck className="h-4 w-4 text-indigo-600" />
                        Edit Presensi
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-xl">
                        Presensi Tersimpan
                      </span>
                    )
                  ) : monthlyMeeting.isOpen ? (
                    <button
                      onClick={() => setShowMeetingModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <UserCheck className="h-4 w-4" />
                      Isi Presensi Sekarang
                    </button>
                  ) : monthlyMeeting.isPast ? (
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-xl">
                      Presensi Ditutup (23:59 WIB)
                    </span>
                  ) : (
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                      Presensi Dibuka {fmtTime(monthlyMeeting.scheduledAt)} WIB
                    </span>
                  )}
                </div>
              </div>

              {/* Attendance Details Preview if already submitted */}
              {monthlyMeeting.myAttendance && (
                <div className="mt-4 pt-3.5 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Sebagai</span>
                    <span className="font-bold text-slate-800">{monthlyMeeting.myAttendance.attendAs || '-'}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Ide / Usulan Rapat</span>
                    <span className="text-slate-700 italic line-clamp-2">{monthlyMeeting.myAttendance.ideas || 'Tidak ada ide tambahan.'}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Evaluasi Asrama</span>
                    <span className="text-slate-700 italic line-clamp-2">{monthlyMeeting.myAttendance.evaluation || 'Tidak ada evaluasi tambahan.'}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/40 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Pengumuman</h3>
                {announcements && announcements.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {announcements.length} baru
                  </span>
                )}
              </div>

              {announcements && announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="border border-indigo-100 bg-white rounded-xl p-3">
                      <p className="text-xs font-bold text-foreground mb-1">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Saat ini tidak ada pengumuman baru. Pantau terus dashboard ini
                  untuk informasi terkini dari pengurus SIMAS-KS.
                </p>
              )}
            </div>
          </motion.div>

          {hasKegiatan ? (
            <motion.div
              whileHover={{ scale: 1.003 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
                <h2 className="font-semibold text-foreground">Kegiatan Terdekat</h2>
              </div>
              <div className="space-y-3">
                {upcomingKerjaBakti && (
                  <div className="p-3 border border-border rounded-lg bg-amber-50/50 flex gap-3 items-center">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-lg"><Sparkles className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{fmtDate(upcomingKerjaBakti)}</p>
                      <p className="font-medium text-sm text-foreground">Kerja Bakti Asrama</p>
                    </div>
                  </div>
                )}
                {upcomingSports && (
                  <div className="p-3 border border-border rounded-lg bg-emerald-50/50 flex gap-3 items-start">
                    <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg shrink-0 mt-0.5"><Trophy className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {fmtDate(upcomingSports.date)} · {fmtTime(upcomingSports.date)}{upcomingSports.endDate ? ` – ${fmtTime(upcomingSports.endDate)}` : ''} WIB
                      </p>
                      <p className="font-medium text-sm text-foreground">{upcomingSports.title}</p>
                      {upcomingSports.location && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span className="truncate">{upcomingSports.location}</span>
                        </p>
                      )}
                      {upcomingSports.locationUrl && (
                        <div className="mt-2">
                          <a
                            href={upcomingSports.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" /> Buka di Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {upcomingGeneralActivity && (
                  <div className="p-3 border border-border rounded-lg bg-indigo-50/50 flex gap-3 items-center">
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg"><Sparkles className="h-4 w-4" /></div>
                    <div>
                      {upcomingGeneralActivity.date && <p className="text-xs font-semibold text-muted-foreground mb-1">{fmtDate(upcomingGeneralActivity.date)}</p>}
                      <p className="font-medium text-sm text-foreground">{upcomingGeneralActivity.title}</p>
                    </div>
                  </div>
                )}
                {myUpcomingRohani && (
                  <div className="p-3 border border-border rounded-lg bg-sky-50/50 flex gap-3 items-center">
                    <div className="bg-sky-100 text-sky-700 p-2 rounded-lg"><User className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{fmtDate(myUpcomingRohani.date)}</p>
                      <p className="font-medium text-sm text-foreground">Kegiatan Rohani Rutin</p>
                      {myUpcomingRohani.message && (
                        <p className="text-xs font-medium text-sky-700 mt-1">{myUpcomingRohani.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <SectionCard
              icon={<CalendarDays className="h-5 w-5" />}
              title="Kegiatan Terdekat"
              description="Belum ada kegiatan terjadwal"
              empty
            />
          )}
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {myUpcomingPiket ? (
            <motion.div
              whileHover={{ scale: 1.003 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className={`rounded-2xl border ${isPiketToday && isPiketValidTime ? 'border-primary bg-primary/5' : 'border-border bg-white'} p-6 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary"><Clock className="h-5 w-5" /></div>
                <h2 className="font-semibold text-foreground">Jadwal Piket Saya</h2>
              </div>
              <div className={`p-4 ${isPiketToday && isPiketValidTime ? 'bg-primary/10 border-primary/30' : 'bg-primary/5 border-primary/20'} border rounded-xl text-center`}>
                {isPiketToday && isPiketValidTime ? (
                  <>
                    <p className="text-sm font-bold text-primary">Anda Piket Hari Ini</p>
                    <p className="text-xs text-muted-foreground mt-1">di Sektor {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'][myUpcomingPiket.sector] || myUpcomingPiket.sector + 1}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">{fmtDate(myUpcomingPiket.date)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Sektor {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'][myUpcomingPiket.sector] || myUpcomingPiket.sector + 1}</p>
                  </>
                )}
              </div>
              <div className="mt-4 text-center">
                {isPiketToday && isPiketValidTime ? (
                  <Link href="/admin/kebersihan" className="text-xs text-primary font-bold hover:underline">Silahkan Presensi di Sini →</Link>
                ) : (
                  <Link href="/admin/kebersihan" className="text-xs text-primary font-medium hover:underline">Lihat Jadwal Lengkap →</Link>
                )}
              </div>
            </motion.div>
          ) : (
            <SectionCard
              icon={<Clock className="h-5 w-5" />}
              title="Jadwal Piket Saya"
              description="Belum ada jadwal piket"
              empty
            />
          )}
        </div>
      </motion.div>

      {/* ===== MODAL PRESENSI MANDIRI RAPAT BULANAN ===== */}
      <AnimatePresence>
        {showMeetingModal && monthlyMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <BookOpen className="h-5 w-5 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Presensi Rapat Bulanan Asrama</h3>
                    <p className="text-xs text-indigo-200 mt-0.5">{monthlyMeeting.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAttendance} className="p-6 space-y-4 overflow-y-auto">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Presensi mandiri dibuka mulai pukul {fmtTime(monthlyMeeting.scheduledAt)} WIB dan ditutup pukul 23:59 WIB.
                  Presensi akan diverifikasi oleh Sekretaris.
                </p>

                {/* Konfirmasi Kehadiran */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isAttending}
                    onChange={(e) => setIsAttending(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      Konfirmasi Kehadiran Rapat
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Saya menyatakan hadir mengikuti agenda rapat bulanan asrama hari ini.
                    </div>
                  </div>
                </label>

                {/* Sebagai Apa */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hadir Sebagai Apa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={attendAs}
                    onChange={(e) => setAttendAs(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    <option value="Warga Asrama">Warga Asrama</option>
                    <option value="Calon Warga">Calon Warga</option>
                    <option value="Pengurus Asrama">Pengurus Asrama</option>
                    <option value="Pemimpin Rapat">Pemimpin Rapat</option>
                    <option value="Notulis">Notulis</option>
                    <option value="Tamu Undangan">Tamu Undangan</option>
                  </select>
                </div>

                {/* Ide / Usulan */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Ide / Usulan untuk Rapat Bulanan Ini
                    </label>
                    <span className="text-[10px] text-slate-400">Free text</span>
                  </div>
                  <textarea
                    value={ideas}
                    onChange={(e) => setIdeas(e.target.value)}
                    placeholder="Tuliskan gagasan, ide kegiatan, atau usulan solusi untuk asrama..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Evaluasi */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Evaluasi untuk Rapat / Asrama
                    </label>
                    <span className="text-[10px] text-slate-400">Free text</span>
                  </div>
                  <textarea
                    value={evaluation}
                    onChange={(e) => setEvaluation(e.target.value)}
                    placeholder="Tuliskan evaluasi mengenai lingkungan, fasilitas, kedisiplinan, atau kegiatan asrama..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {meetingError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 rounded-xl p-3 border border-rose-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{meetingError}</span>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMeetingModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMeeting}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    {submittingMeeting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    {submittingMeeting ? "Menyimpan..." : "Kirim Presensi"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ===================== Subcomponents ===================== */

function StatCard({
  icon,
  label,
  value,
  badgeTone,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badgeTone: "emerald" | "blue" | "amber";
  action?: React.ReactNode;
}) {
  const toneMap = {
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber:
      "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className={`rounded-xl border p-2.5 ${toneMap[badgeTone]}`}>
            {icon}
          </div>
          {action && <div>{action}</div>}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  empty?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.003 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/60 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}
