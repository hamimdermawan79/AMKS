'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Image, 
  Plus, 
  Trash2, 
  Calendar, 
  Tv, 
  BarChart, 
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PostType = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  coverUrl: string | null;
};

type ActivityType = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date | null;
  location: string | null;
};

type Props = {
  posts: PostType[];
  activities: ActivityType[];
  announcements: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
  }[];
  canManage: boolean;
};

export default function KesenianManager({ posts, activities, announcements, canManage }: Props) {
  const [activeTab, setActiveTab] = useState<'posting' | 'kegiatan'>('posting');

  // Find next monthly entertainment event
  const now = new Date();
  const nextEvent = activities
    .filter(a => a.startAt && new Date(a.startAt) >= now)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())[0] || null;

  // Calculate countdown days
  const getCountdown = () => {
    if (!nextEvent || !nextEvent.startAt) return null;
    const diff = new Date(nextEvent.startAt).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const countdownDays = getCountdown();

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
            Divisi Kesenian & Publikasi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mengelola publikasi kegiatan asrama, serta merencanakan event hiburan dan kreasi seni warga asrama sebulan sekali.
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/kesenian/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-50 px-5 py-3 text-sm font-medium text-purple-600 shadow-sm transition-all duration-300 hover:border-purple-500 hover:bg-purple-500 hover:text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Layanan Admin Kesenian
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* QUICK SUMMARY WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Post Activity Stat */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-purple-50/50 via-white to-white p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
            <BarChart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Post Publikasi Aktif</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{posts.length} Postingan</h3>
          </div>
        </div>

        {/* Entertainment Activity Stat */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-pink-50/50 via-white to-white p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Event Seni/Hiburan</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{activities.length} Event</h3>
          </div>
        </div>

        {/* Target Event Countdown */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 shadow-sm">
          {nextEvent ? (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Event Hiburan Terdekat</span>
              <h4 className="font-bold text-foreground text-sm truncate">{nextEvent.title}</h4>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                {countdownDays === 0 ? 'Hari ini!' : `${countdownDays} Hari Lagi`}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 h-full">
              <Compass className="h-6 w-6 text-indigo-400" />
              <div>
                <span className="text-xs text-muted-foreground font-medium">Event Bulan Ini</span>
                <p className="text-xs text-slate-500 font-semibold">Belum direncanakan</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('posting')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'posting'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Publikasi & Post Warga
          </span>
        </button>
        <button
          onClick={() => setActiveTab('kegiatan')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'kegiatan'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Tv className="h-4 w-4" />
            Event Hiburan Bulanan
          </span>
        </button>
      </div>

      {/* TAB CONTENT: POSTING & PUBLIKASI */}
      {activeTab === 'posting' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Postingan Kegiatan Asrama</h2>
            <Link
              href="/admin/kesenian/kelola"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Buat Postingan Baru
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col md:flex-row"
              >
                {post.coverUrl ? (
                  <div className="md:w-1/3 h-40 md:h-auto relative bg-slate-100 flex-shrink-0">
                    <img 
                      src={post.coverUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="md:w-1/3 h-40 md:h-auto bg-purple-50 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <Image className="h-10 w-10" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {new Date(post.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <h3 className="font-bold text-foreground text-base leading-snug">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.body}</p>
                  </div>
                  <div className="border-t border-border mt-4 pt-3 flex items-center justify-end">
                    <Link
                      href={`/tentang-kami`}
                      className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
                    >
                      Lihat Detail <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}

            {posts.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border bg-slate-50/50">
                <Image className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Belum ada postingan publikasi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EVENT HIBURAN BULANAN */}
      {activeTab === 'kegiatan' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Daftar Event Kesenian & Hiburan</h2>
            <Link
              href="/admin/kesenian/kelola"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Rencanakan Event
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground text-base leading-tight">{act.title}</h3>
                  {act.startAt ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" />
                      {new Date(act.startAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-500 font-medium">Tanggal belum ditentukan</p>
                  )}
                  {act.location && (
                    <p className="text-xs text-muted-foreground">Lokasi: <b>{act.location}</b></p>
                  )}
                </div>

                {act.description && (
                  <p className="text-xs text-muted-foreground bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                    {act.description}
                  </p>
                )}
              </motion.div>
            ))}

            {activities.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border bg-slate-50/50">
                <Tv className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Belum ada event seni/hiburan bulan ini.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
