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
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateNextRohaniSchedule, deleteRohaniSchedule } from './actions';

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

  const nextSchedule = schedules[0] || null;
  const pastSchedules = schedules.slice(1);

  // Check if current user has any duty on the next schedule
  const isImamMaghrib = nextSchedule?.imamMaghrib?.id === currentUserId;
  const isImamIsha = nextSchedule?.imamIsha?.id === currentUserId;
  const isKultum = nextSchedule?.kultumBy?.id === currentUserId;
  const hasDutyNext = isImamMaghrib || isImamIsha || isKultum;

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

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
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
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              Tekan tombol di sebelah kanan untuk menggenerasi jadwal ibadah Kamis berikutnya secara otomatis. Sistem akan memutar imam & penceramah adil, serta menghitung 15 ayat Al-Qur'an berikutnya.
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
                    className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center gap-3 shadow-md border border-emerald-400/20"
                  >
                    <div className="bg-white/20 p-2 rounded-xl">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Tugas Anda Terdeteksi!</h4>
                      <p className="text-[11px] text-white/90">Anda bertugas sebagai {isImamMaghrib && 'Imam Maghrib'}{isImamIsha && `${isImamMaghrib ? ' & ' : ''}Imam Isya`}{isKultum && `${(isImamMaghrib || isImamIsha) ? ' & ' : ''}Pembawa Kultum`} pada kamis ini. Persiapkan diri Anda.</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{formatDate(nextSchedule.date)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Waktu: Setelah Maghrib & Isya Berjamaah</p>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6">
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
                    isImamMaghrib 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-sm ring-1 ring-emerald-500/10' 
                      : 'bg-slate-50 border-transparent'
                  }`}>
                    <div className={`p-2 rounded-xl ${isImamMaghrib ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Imam Maghrib</span>
                        {isImamMaghrib && <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">Anda</span>}
                      </div>
                      <span className={`text-sm font-semibold truncate block ${isImamMaghrib ? 'text-emerald-950 font-bold' : 'text-foreground'}`}>
                        {nextSchedule.imamMaghrib.fullName}
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
                    isImamIsha 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-sm ring-1 ring-emerald-500/10' 
                      : 'bg-slate-50 border-transparent'
                  }`}>
                    <div className={`p-2 rounded-xl ${isImamIsha ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Imam Isya</span>
                        {isImamIsha && <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">Anda</span>}
                      </div>
                      <span className={`text-sm font-semibold truncate block ${isImamIsha ? 'text-emerald-950 font-bold' : 'text-foreground'}`}>
                        {nextSchedule.imamIsha.fullName}
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
                    isKultum 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-sm ring-1 ring-emerald-500/10' 
                      : 'bg-slate-50 border-transparent'
                  }`}>
                    <div className={`p-2 rounded-xl ${isKultum ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Kultum Oleh</span>
                        {isKultum && <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">Anda</span>}
                      </div>
                      <span className={`text-sm font-semibold truncate block ${isKultum ? 'text-emerald-950 font-bold' : 'text-foreground'}`}>
                        {nextSchedule.kultumBy.fullName}
                      </span>
                    </div>
                  </div>
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
                const hasDutyPast = isMyMaghrib || isMyIsha || isMyKultum;

                return (
                  <div 
                    key={schedule.id} 
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      hasDutyPast 
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
                    className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                      isMe 
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
    </div>
  );
}
