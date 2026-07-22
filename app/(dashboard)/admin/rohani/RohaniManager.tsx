'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  User,
  Plus,
  Trash2,
  AlertCircle,
  Users,
  Check,
  Clock,
  BookMarked,
  ShieldCheck,
  Edit2,
  X,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateNextRohaniSchedule, deleteRohaniSchedule, replaceRohaniDuty, activateBackup } from './actions';

type WargaQueue = {
  id: string;
  fullName: string;
  lastMaghribTime: number;
  lastIshaTime: number;
  lastKultumTime: number;
};

type RohaniScheduleType = {
  id: string;
  date: Date;
  startVerse: number;
  endVerse: number;
  currentSurah: string;
  imamMaghrib: { id: string; fullName: string };
  imamIsha: { id: string; fullName: string };
  kultumBy: { id: string; fullName: string };
  cadanganImam: { id: string; fullName: string } | null;
  cadanganKultum: { id: string; fullName: string } | null;
};

type Props = {
  schedules: RohaniScheduleType[];
  queues: WargaQueue[];
  isAdmin: boolean;
  isKelolaMode?: boolean;
  currentUserId?: string;
};

export default function RohaniManager({ schedules, queues, isAdmin, isKelolaMode, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [replaceModal, setReplaceModal] = useState<{
    scheduleId: string;
    role: 'imamMaghrib' | 'imamIsha' | 'kultum' | 'cadanganImam' | 'cadanganKultum';
    currentName: string;
    backupName?: string;
    backupId?: string;
  } | null>(null);
  const [replaceUserId, setReplaceUserId] = useState('');
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState<string | null>(null);

  const nextSchedule = schedules[0] || null;
  const pastSchedules = schedules.slice(1);

  // Check if current user has any duty on the next schedule
  const isImamMaghrib = nextSchedule?.imamMaghrib?.id === currentUserId;
  const isImamIsha = nextSchedule?.imamIsha?.id === currentUserId;
  const isKultum = nextSchedule?.kultumBy?.id === currentUserId;
  const isCadanganImam = nextSchedule?.cadanganImam?.id === currentUserId;
  const isCadanganKultum = nextSchedule?.cadanganKultum?.id === currentUserId;
  const hasDutyNext = isImamMaghrib || isImamIsha || isKultum || isCadanganImam || isCadanganKultum;

  const handleGenerate = () => {
    setErrorMsg('');
    startTransition(async () => {
      try {
        await generateNextRohaniSchedule();
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menggenerasi jadwal');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus jadwal ibadah ini?')) return;
    startTransition(async () => {
      try {
        await deleteRohaniSchedule(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleReplace = async () => {
    if (!replaceModal || !replaceUserId) return;
    setReplaceLoading(true);
    try {
      await replaceRohaniDuty(replaceModal.scheduleId, replaceModal.role, replaceUserId);
      setReplaceModal(null);
      setReplaceUserId('');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mengganti petugas');
    } finally {
      setReplaceLoading(false);
    }
  };

  const handleActivateBackup = async (scheduleId: string, mainRole: 'imamMaghrib' | 'imamIsha' | 'kultum') => {
    if (!confirm('Aktifkan cadangan untuk menggantikan petugas yang izin?')) return;
    setBackupLoading(mainRole);
    try {
      await activateBackup(scheduleId, mainRole);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mengaktifkan cadangan');
    } finally {
      setBackupLoading(null);
    }
  };

  // Helper to format date nicely
  const formatDate = (d: Date) => {
    return new Date(d).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper to format last active date text
  const formatLastActive = (time: number) => {
    if (time === 0) return 'Belum pernah';
    return new Date(time).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  // Helper to get duty text for notification banner
  const getDutyText = () => {
    const parts: string[] = [];
    if (isImamMaghrib) parts.push('Imam Maghrib');
    if (isImamIsha) parts.push('Imam Isya');
    if (isKultum) parts.push('Pembawa Kultum');
    if (isCadanganImam) parts.push('Cadangan Imam');
    if (isCadanganKultum) parts.push('Cadangan Kultum');
    return parts.join(' & ');
  };

  // Render a petugas card (main petugas)
  const renderPetugasCard = (
    label: string,
    user: { id: string; fullName: string },
    isMe: boolean,
    role: 'imamMaghrib' | 'imamIsha' | 'kultum',
    schedule: RohaniScheduleType,
    backupUser: { id: string; fullName: string } | null,
    backupRole: 'cadanganImam' | 'cadanganKultum'
  ) => (
    <div className={`p-4 rounded-2xl flex flex-col gap-2 border transition-all ${isMe
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-sm ring-1 ring-emerald-500/10'
        : 'bg-slate-50 border-transparent'
      }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isMe ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-muted-foreground'}`}>
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
            {isMe && <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">Anda</span>}
          </div>
          <span className={`text-sm font-semibold truncate block ${isMe ? 'text-emerald-950 font-bold' : 'text-foreground'}`}>
            {user.fullName}
          </span>
        </div>
        {isKelolaMode && (
          <button onClick={() => { setReplaceModal({ scheduleId: schedule.id, role, currentName: user.fullName, backupName: backupUser?.fullName, backupId: backupUser?.id }); setReplaceUserId(''); }} className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ganti petugas (izin)"><Edit2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
      {/* Activate Backup button */}
      {isKelolaMode && backupUser && (
        <button
          onClick={() => handleActivateBackup(schedule.id, role)}
          disabled={backupLoading === role}
          className="mt-1 w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold px-2 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-all disabled:opacity-50"
          title={`Ganti dengan ${backupUser.fullName}`}
        >
          <RefreshCw className={`h-3 w-3 ${backupLoading === role ? 'animate-spin' : ''}`} />
          {backupLoading === role ? 'Mengganti...' : `Ganti dgn Cadangan (${backupUser.fullName})`}
        </button>
      )}
    </div>
  );

  // Render cadangan card
  const renderCadanganCard = (
    label: string,
    user: { id: string; fullName: string } | null,
    isMe: boolean,
    role: 'cadanganImam' | 'cadanganKultum',
    schedule: RohaniScheduleType
  ) => (
    <div className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all ${isMe
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400 shadow-sm ring-1 ring-amber-500/10'
        : 'bg-amber-50/30 border-amber-200/50'
      }`}>
      <div className={`p-2 rounded-xl ${isMe ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
        <UserCheck className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">{label}</span>
          {isMe && <span className="bg-amber-600 text-white text-[8px] font-bold px-1 rounded">Anda</span>}
        </div>
        <span className={`text-xs font-semibold truncate block ${isMe ? 'text-amber-950 font-bold' : 'text-amber-800'}`}>
          {user ? user.fullName : '- Belum ditunjuk -'}
        </span>
      </div>
      {isKelolaMode && (
        <button onClick={() => { setReplaceModal({ scheduleId: schedule.id, role, currentName: user?.fullName || 'Kosong' }); setReplaceUserId(''); }} className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Ganti cadangan"><Edit2 className="h-3 w-3" /></button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {isKelolaMode && (
            <Link
              href="/admin/rohani"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Kembali ke tampilan divisi
            </Link>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-emerald-600 animate-pulse" />
            Divisi Keagamaan (Rohani)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengelolaan kegiatan sholat berjamaah 2 mingguan (Kamis malam), Kultum, pembacaan 15 ayat Al-Qur'an teratur, dan giliran petugas.
          </p>
        </div>
        {isAdmin && !isKelolaMode && (
          <Link
            href="/admin/rohani/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-600 shadow-sm transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Layanan Admin Rohani
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-200 flex gap-2.5 items-start">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* GENERATE CONTROLS */}
      {isKelolaMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-800 text-base">Otomatisasi Jadwal Ibadah</h3>
            <p className="text-xs text-emerald-700 max-w-xl leading-relaxed">
              Tekan tombol di sebelah kanan untuk menggenerasi jadwal ibadah Kamis berikutnya secara otomatis. Sistem akan memutar imam, penceramah, &amp; petugas cadangan secara adil, serta menghitung 15 ayat Al-Qur'an berikutnya.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 text-sm whitespace-nowrap"
          >
            <Plus className="h-4.5 w-4.5" /> Generasi Jadwal Kamis Berikutnya
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: ACTIVE SCHEDULE & HISTORY */}
        <div className="lg:col-span-2 space-y-6">

          {/* ACTIVE / NEXT SCHEDULE */}
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-emerald-600/5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <Clock className="h-4 w-4" /> Jadwal Terdekat (Kamis Malam)
              </span>
              {nextSchedule && isKelolaMode && (
                <button
                  onClick={() => handleDelete(nextSchedule.id)}
                  className="text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {nextSchedule ? (
              <div className="p-6 space-y-6">
                {hasDutyNext && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 text-white rounded-2xl flex items-center gap-3 shadow-md border ${
                      (isCadanganImam || isCadanganKultum) && !isImamMaghrib && !isImamIsha && !isKultum
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400/20'
                    }`}
                  >
                    <div className="bg-white/20 p-2 rounded-xl">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Tugas Anda Terdeteksi!</h4>
                      <p className="text-[11px] text-white/90">Anda bertugas sebagai {getDutyText()} pada kamis ini. Persiapkan diri Anda.</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{formatDate(nextSchedule.date)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Waktu: Setelah Maghrib &amp; Isya Berjamaah</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-3 flex items-center gap-3">
                    <BookMarked className="h-6 w-6 text-emerald-600" />
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold block">Target Tadarus</span>
                      <span className="text-xs font-semibold text-emerald-800">
                        QS. {nextSchedule.currentSurah}: {nextSchedule.startVerse} - {nextSchedule.endVerse}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main petugas - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6">
                  {renderPetugasCard('Imam Maghrib', nextSchedule.imamMaghrib, isImamMaghrib, 'imamMaghrib', nextSchedule, nextSchedule.cadanganImam, 'cadanganImam')}
                  {renderPetugasCard('Imam Isya', nextSchedule.imamIsha, isImamIsha, 'imamIsha', nextSchedule, nextSchedule.cadanganImam, 'cadanganImam')}
                  {renderPetugasCard('Kultum Oleh', nextSchedule.kultumBy, isKultum, 'kultum', nextSchedule, nextSchedule.cadanganKultum, 'cadanganKultum')}
                </div>

                {/* Cadangan petugas - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-amber-300/50 pt-4">
                  <div className="flex items-center gap-2 col-span-full">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Petugas Cadangan</span>
                  </div>
                  {renderCadanganCard('Cadangan Imam', nextSchedule.cadanganImam, isCadanganImam, 'cadanganImam', nextSchedule)}
                  {renderCadanganCard('Cadangan Kultum', nextSchedule.cadanganKultum, isCadanganKultum, 'cadanganKultum', nextSchedule)}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">Belum ada jadwal keagamaan terbit.</p>
              </div>
            )}
          </div>

          {/* PAST SCHEDULES */}
          <div className="bg-card border border-border rounded-3xl shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-foreground text-base">Riwayat Kegiatan Rohani</h3>

            <div className="space-y-4">
              {pastSchedules.map((schedule) => {
                const isMyMaghrib = schedule.imamMaghrib?.id === currentUserId;
                const isMyIsha = schedule.imamIsha?.id === currentUserId;
                const isMyKultum = schedule.kultumBy?.id === currentUserId;
                const isMyCadanganImam = schedule.cadanganImam?.id === currentUserId;
                const isMyCadanganKultum = schedule.cadanganKultum?.id === currentUserId;
                const hasDutyPast = isMyMaghrib || isMyIsha || isMyKultum || isMyCadanganImam || isMyCadanganKultum;

                return (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${hasDutyPast
                        ? 'border-emerald-500/40 bg-emerald-50/30 shadow-sm'
                        : 'border-border/80 bg-slate-50/30'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{formatDate(schedule.date)}</p>
                          {hasDutyPast && (
                            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              <Check className="h-3 w-3" /> Tugas Anda
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target Tadarus: <b className="text-emerald-700 font-semibold">QS. {schedule.currentSurah} {schedule.startVerse}-{schedule.endVerse}</b>
                        </p>
                      </div>

                      {isKelolaMode && (
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="self-end sm:self-auto text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Main petugas row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-dashed border-border/80">
                      <div className={`p-2 rounded-xl text-xs flex items-center gap-2 min-w-0 ${isMyMaghrib ? 'bg-emerald-100/80 text-emerald-800 font-medium border border-emerald-300/30' : 'bg-white border border-border/60 text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isMyMaghrib ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="truncate">Maghrib: <strong className={isMyMaghrib ? 'text-emerald-900 font-bold' : 'text-foreground font-semibold'}>{schedule.imamMaghrib.fullName}</strong></span>
                      </div>

                      <div className={`p-2 rounded-xl text-xs flex items-center gap-2 min-w-0 ${isMyIsha ? 'bg-emerald-100/80 text-emerald-800 font-medium border border-emerald-300/30' : 'bg-white border border-border/60 text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isMyIsha ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="truncate">Isya: <strong className={isMyIsha ? 'text-emerald-900 font-bold' : 'text-foreground font-semibold'}>{schedule.imamIsha.fullName}</strong></span>
                      </div>

                      <div className={`p-2 rounded-xl text-xs flex items-center gap-2 min-w-0 ${isMyKultum ? 'bg-emerald-100/80 text-emerald-800 font-medium border border-emerald-300/30' : 'bg-white border border-border/60 text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isMyKultum ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="truncate">Kultum: <strong className={isMyKultum ? 'text-emerald-900 font-bold' : 'text-foreground font-semibold'}>{schedule.kultumBy.fullName}</strong></span>
                      </div>
                    </div>

                    {/* Cadangan row */}
                    {(schedule.cadanganImam || schedule.cadanganKultum) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                        {schedule.cadanganImam && (
                          <div className={`p-2 rounded-xl text-xs flex items-center gap-2 min-w-0 ${isMyCadanganImam ? 'bg-amber-100/80 text-amber-800 font-medium border border-amber-300/30' : 'bg-amber-50/50 border border-amber-200/40 text-amber-700/70'}`}>
                            <UserCheck className="h-3 w-3 flex-shrink-0 text-amber-500" />
                            <span className="truncate">Cad. Imam: <strong className={isMyCadanganImam ? 'text-amber-900 font-bold' : 'text-amber-800 font-semibold'}>{schedule.cadanganImam.fullName}</strong></span>
                          </div>
                        )}
                        {schedule.cadanganKultum && (
                          <div className={`p-2 rounded-xl text-xs flex items-center gap-2 min-w-0 ${isMyCadanganKultum ? 'bg-amber-100/80 text-amber-800 font-medium border border-amber-300/30' : 'bg-amber-50/50 border border-amber-200/40 text-amber-700/70'}`}>
                            <UserCheck className="h-3 w-3 flex-shrink-0 text-amber-500" />
                            <span className="truncate">Cad. Kultum: <strong className={isMyCadanganKultum ? 'text-amber-900 font-bold' : 'text-amber-800 font-semibold'}>{schedule.cadanganKultum.fullName}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {pastSchedules.length === 0 && (
                <p className="text-center py-6 text-xs text-muted-foreground">Belum ada riwayat kegiatan ibadah.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUEUES */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl shadow-sm p-6 space-y-5">
            <div>
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Antrean Petugas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Urutan warga aktif yang paling lama tidak bertugas berada di antrean teratas.
              </p>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {queues.map((item, idx) => {
                const isMe = item.id === currentUserId;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 ${isMe
                        ? 'border-emerald-500/50 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/20'
                        : 'border-border bg-slate-50/50'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className={`text-xs font-semibold truncate flex-1 ${isMe ? 'text-emerald-800 font-bold' : 'text-foreground'}`}>
                        {item.fullName} {isMe && '(Anda)'}
                      </span>
                      <span className={`text-[10px] flex-shrink-0 ${isMe ? 'text-emerald-700 font-bold' : 'text-muted-foreground'}`}># {idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground mt-2">
                      <div className={`p-1 rounded border min-w-0 ${isMe ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-border'}`}>
                        <span className="block font-bold">Imam M</span>
                        <span className="truncate block">{formatLastActive(item.lastMaghribTime)}</span>
                      </div>
                      <div className={`p-1 rounded border min-w-0 ${isMe ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-border'}`}>
                        <span className="block font-bold">Imam I</span>
                        <span className="truncate block">{formatLastActive(item.lastIshaTime)}</span>
                      </div>
                      <div className={`p-1 rounded border min-w-0 ${isMe ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-border'}`}>
                        <span className="block font-bold">Kultum</span>
                        <span className="truncate block">{formatLastActive(item.lastKultumTime)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {queues.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">Belum ada warga aktif.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replace Duty Modal */}
      {replaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Ganti Petugas Izin</h3>
              <button onClick={() => setReplaceModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">
              Mengganti <strong>{replaceModal.currentName}</strong> yang izin sebagai{' '}
              <strong>{
                replaceModal.role === 'imamMaghrib' ? 'Imam Maghrib' :
                replaceModal.role === 'imamIsha' ? 'Imam Isya' :
                replaceModal.role === 'kultum' ? 'Pembawa Kultum' :
                replaceModal.role === 'cadanganImam' ? 'Cadangan Imam' :
                'Cadangan Kultum'
              }</strong>.
            </p>

            {/* Quick backup button if available */}
            {replaceModal.backupId && replaceModal.backupName && (replaceModal.role === 'imamMaghrib' || replaceModal.role === 'imamIsha' || replaceModal.role === 'kultum') && (
              <button
                onClick={() => setReplaceUserId(replaceModal.backupId!)}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  replaceUserId === replaceModal.backupId
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Gunakan Cadangan: <strong>{replaceModal.backupName}</strong></span>
                {replaceUserId === replaceModal.backupId && <Check className="h-4 w-4 ml-auto text-emerald-600" />}
              </button>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pilih Pengganti {replaceModal.backupId ? '(Manual)' : ''}</label>
              <select
                value={replaceUserId}
                onChange={(e) => setReplaceUserId(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- Pilih Warga --</option>
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>{q.fullName}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setReplaceModal(null)} className="flex-1 px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-slate-50">Batal</button>
              <button
                onClick={handleReplace}
                disabled={!replaceUserId || replaceLoading}
                className="flex-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {replaceLoading ? 'Menyimpan...' : 'Konfirmasi Ganti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
