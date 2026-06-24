'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Pin, 
  Clock, 
  X, 
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Division } from '@prisma/client';
import { 
  addAnnouncementAction, 
  deleteAnnouncementAction, 
  addActivityAction, 
  deleteActivityAction,
  toggleAnnouncementPinAction
} from './actions';

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string | null;
  endAt: string | null;
}

interface DivisionClientProps {
  division: Division;
  divisionLabel: string;
  description: string;
  themeColor: 'purple' | 'amber' | 'emerald';
  announcements: Announcement[];
  activities: Activity[];
  canManage: boolean;
}

export default function DivisionClient({
  division,
  divisionLabel,
  description,
  themeColor,
  announcements: initialAnnouncements,
  activities: initialActivities,
  canManage,
}: DivisionClientProps) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'activities'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  // Modal States
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // Form States
  const [newAnn, setNewAnn] = useState({ title: '', body: '', pinned: false });
  const [newAct, setNewAct] = useState({ title: '', description: '', location: '', startAt: '', endAt: '' });

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme styling configurations
  const theme = {
    purple: {
      gradient: 'from-purple-500/20 via-pink-500/5 to-transparent',
      border: 'border-purple-200/50',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
      tabActive: 'border-purple-600 text-purple-600',
      accent: 'text-purple-600',
      accentBg: 'bg-purple-50',
      pinBg: 'bg-pink-50 text-pink-700 border-pink-200',
      glow: 'shadow-purple-500/5',
    },
    amber: {
      gradient: 'from-amber-500/20 via-orange-500/5 to-transparent',
      border: 'border-amber-200/50',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
      tabActive: 'border-amber-600 text-amber-600',
      accent: 'text-amber-600',
      accentBg: 'bg-amber-50',
      pinBg: 'bg-orange-50 text-orange-700 border-orange-200',
      glow: 'shadow-amber-500/5',
    },
    emerald: {
      gradient: 'from-emerald-500/20 via-teal-500/5 to-transparent',
      border: 'border-emerald-200/50',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
      tabActive: 'border-emerald-600 text-emerald-600',
      accent: 'text-emerald-600',
      accentBg: 'bg-emerald-50',
      pinBg: 'bg-teal-50 text-teal-700 border-teal-200',
      glow: 'shadow-emerald-500/5',
    },
  }[themeColor];

  // Actions
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.body) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await addAnnouncementAction(division, newAnn);
      if (res.success) {
        const addedAnn: Announcement = {
          id: res.id!,
          title: newAnn.title,
          body: newAnn.body,
          pinned: newAnn.pinned,
          createdAt: new Date().toISOString(),
        };

        setAnnouncements((prev) => {
          const updated = [addedAnn, ...prev];
          // Sort so pinned is first, then by date desc
          return updated.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });

        setNewAnn({ title: '', body: '', pinned: false });
        setAnnouncementModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan pengumuman');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    try {
      const res = await deleteAnnouncementAction(division, id);
      if (res.success) {
        setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman');
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await toggleAnnouncementPinAction(division, id, !currentPinned);
      if (res.success) {
        setAnnouncements((prev) => {
          const updated = prev.map((ann) =>
            ann.id === id ? { ...ann, pinned: !currentPinned } : ann
          );
          return updated.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah pin pengumuman');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAct.title) return;

    if (newAct.startAt && newAct.endAt && new Date(newAct.endAt) < new Date(newAct.startAt)) {
      setError('Waktu selesai tidak boleh mendahului waktu mulai');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await addActivityAction(division, {
        ...newAct,
        startAt: newAct.startAt || null,
        endAt: newAct.endAt || null,
      });

      if (res.success) {
        const addedAct: Activity = {
          id: res.id!,
          title: newAct.title,
          description: newAct.description || null,
          location: newAct.location || null,
          startAt: newAct.startAt || null,
          endAt: newAct.endAt || null,
        };

        setActivities((prev) => [addedAct, ...prev]);
        setNewAct({ title: '', description: '', location: '', startAt: '', endAt: '' });
        setActivityModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;

    try {
      const res = await deleteActivityAction(division, id);
      if (res.success) {
        setActivities((prev) => prev.filter((act) => act.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kegiatan');
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Themed Hero Panel */}
      <div className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-b ${theme.gradient} p-8 md:p-12 shadow-sm ${theme.glow}`}>
        <div className="relative z-10 max-w-2xl space-y-4">
          <Link
            href={`/admin/${division.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke tampilan divisi
          </Link>
          <span className={`badge ${theme.badge} font-bold text-xs uppercase tracking-wider`}>
            Divisi {divisionLabel}
          </span>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight md:text-5xl">
            {divisionLabel}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border gap-4">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'announcements'
                ? `${theme.tabActive}`
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            Pengumuman ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'activities'
                ? `${theme.tabActive}`
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Jadwal Kegiatan ({activities.length})
          </button>
        </div>

        {/* Manager Actions button */}
        {canManage && (
          <div className="flex gap-3 pb-3 md:pb-0">
            {activeTab === 'announcements' ? (
              <button
                onClick={() => {
                  setError(null);
                  setAnnouncementModalOpen(true);
                }}
                className={`btn ${theme.primaryBtn} flex items-center gap-2 text-sm shadow-md hover:shadow-lg`}
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Buat Pengumuman
              </button>
            ) : (
              <button
                onClick={() => {
                  setError(null);
                  setActivityModalOpen(true);
                }}
                className={`btn ${theme.primaryBtn} flex items-center gap-2 text-sm shadow-md hover:shadow-lg`}
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Tambah Kegiatan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Render Panel */}
      <div className="min-h-[250px]">
        {activeTab === 'announcements' ? (
          // Announcements View
          announcements.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl border border-border/40">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground italic">Belum ada pengumuman untuk divisi ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {announcements.map((ann) => (
                <motion.div
                  key={ann.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-6 rounded-2xl border relative flex flex-col gap-3 ${
                    ann.pinned ? `border-pink-200 bg-pink-50/10` : 'border-border/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground leading-snug">
                          {ann.title}
                        </h3>
                        {ann.pinned && (
                          <span className={`badge ${theme.pinBg} flex items-center gap-1 text-[10px]`}>
                            <Pin className="h-3 w-3 rotate-45 stroke-[2.5]" />
                            Pinned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(ann.createdAt)}</span>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePin(ann.id, ann.pinned)}
                          className={`p-2 rounded-lg transition-colors ${ann.pinned ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'}`}
                          title={ann.pinned ? 'Lepas pin pengumuman' : 'Pin pengumuman'}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus pengumuman"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed mt-1">
                    {ann.body}
                  </p>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          // Activities View
          activities.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl border border-border/40">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground italic">Belum ada jadwal kegiatan untuk divisi ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.map((act) => (
                <motion.div
                  key={act.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl border border-border/40 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {act.title}
                      </h3>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus kegiatan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {act.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    {act.startAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        <span>Mulai: {formatDate(act.startAt)}</span>
                      </div>
                    )}
                    {act.endAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        <span>Selesai: {formatDate(act.endAt)}</span>
                      </div>
                    )}
                    {act.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{act.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal - Add Announcement */}
      <AnimatePresence>
        {announcementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setAnnouncementModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Buat Pengumuman Baru</h3>
                <button
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Judul</label>
                  <input
                    type="text"
                    required
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    placeholder="Masukkan judul pengumuman..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Isi Pengumuman</label>
                  <textarea
                    required
                    rows={4}
                    value={newAnn.body}
                    onChange={(e) => setNewAnn({ ...newAnn, body: e.target.value })}
                    placeholder="Masukkan konten atau informasi pengumuman..."
                    className="input text-sm resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={newAnn.pinned}
                    onChange={(e) => setNewAnn({ ...newAnn, pinned: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="pinned" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Sematkan di bagian atas (*Pin announcement*)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setAnnouncementModalOpen(false)}
                    className="btn btn-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn ${theme.primaryBtn} text-sm flex items-center gap-1.5`}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Terbitkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Add Activity */}
      <AnimatePresence>
        {activityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setActivityModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Tambah Kegiatan Baru</h3>
                <button
                  onClick={() => setActivityModalOpen(false)}
                  className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nama Kegiatan</label>
                  <input
                    type="text"
                    required
                    value={newAct.title}
                    onChange={(e) => setNewAct({ ...newAct, title: e.target.value })}
                    placeholder="Masukkan nama kegiatan divisi..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Deskripsi (Opsional)</label>
                  <textarea
                    rows={3}
                    value={newAct.description}
                    onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                    placeholder="Masukkan detail penjelasan kegiatan..."
                    className="input text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Lokasi (Opsional)</label>
                  <input
                    type="text"
                    value={newAct.location}
                    onChange={(e) => setNewAct({ ...newAct, location: e.target.value })}
                    placeholder="Contoh: Aula Utama, Lapangan, dll..."
                    className="input text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Waktu Mulai (Opsional)</label>
                    <input
                      type="datetime-local"
                      value={newAct.startAt}
                      onChange={(e) => setNewAct({ ...newAct, startAt: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Waktu Selesai (Opsional)</label>
                    <input
                      type="datetime-local"
                      value={newAct.endAt}
                      min={newAct.startAt || undefined}
                      onChange={(e) => setNewAct({ ...newAct, endAt: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(false)}
                    className="btn btn-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn ${theme.primaryBtn} text-sm flex items-center gap-1.5`}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Simpan Kegiatan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
