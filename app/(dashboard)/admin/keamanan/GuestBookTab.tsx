'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookUser, Plus, Trash2, Clock, MapPin, Target,
  Users, X, AlertTriangle, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, PenLine, LogOut, Moon,
} from 'lucide-react';
import { createGuestBookEntry, deleteGuestBookEntry, updateGuestBookEntry } from './security-actions';

// ---------- Types ----------

type UserBasic = { id: string; fullName: string };

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
  entries: GuestEntry[];
  canInput: boolean;
  allUsers: UserBasic[];
};

// ---------- Helpers ----------

const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ---------- Add Guest Modal ----------

function AddGuestModal({
  onClose,
  onSuccess,
  allUsers,
}: {
  onClose: () => void;
  onSuccess?: () => void;
  allUsers: UserBasic[];
}) {
  const [form, setForm] = useState({
    visitorName: '',
    originCity: '',
    institution: '',
    purpose: '',
    knownById: '',
    knownByOther: '',
    entryTime: new Date().toISOString().slice(0, 16),
    isStaying: false,
    stayDuration: '1',
    note: '',
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.visitorName.trim() || !form.originCity.trim() || !form.purpose.trim()) {
      setError('Nama tamu, asal daerah, dan tujuan wajib diisi.');
      return;
    }
    if (!form.knownById && !form.knownByOther.trim()) {
      setError('Isi "kenal dengan siapa" — pilih dari daftar warga atau tulis nama manual.');
      return;
    }
    if (form.isStaying && (!form.stayDuration || Number(form.stayDuration) < 1)) {
      setError('Masukkan durasi menginap minimal 1 hari.');
      return;
    }
    setError('');

    startTransition(async () => {
      try {
        await createGuestBookEntry({
          visitorName: form.visitorName.trim(),
          originCity: form.originCity.trim(),
          institution: form.institution.trim() || undefined,
          purpose: form.purpose.trim(),
          knownById: form.knownById || undefined,
          knownByOther: form.knownByOther.trim() || undefined,
          entryTime: new Date(form.entryTime).toISOString(),
          isStaying: form.isStaying,
          stayDuration: form.isStaying ? Number(form.stayDuration) : undefined,
          note: form.note.trim() || undefined,
        });
        onSuccess?.();
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal menyimpan data tamu.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl my-4"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-5 text-white rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BookUser className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah Data Tamu</h3>
              <p className="text-xs text-indigo-200 mt-0.5">Catat identitas tamu yang berkunjung</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tamu *</label>
              <input
                value={form.visitorName}
                onChange={(e) => set('visitorName', e.target.value)}
                placeholder="Nama lengkap"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Asal Daerah *</label>
              <input
                value={form.originCity}
                onChange={(e) => set('originCity', e.target.value)}
                placeholder="Kota / kabupaten"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Institusi / Asal Kampus</label>
            <input
              value={form.institution}
              onChange={(e) => set('institution', e.target.value)}
              placeholder="Opsional — universitas, organisasi, dsb."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tujuan Berkunjung *</label>
            <input
              value={form.purpose}
              onChange={(e) => set('purpose', e.target.value)}
              placeholder="Silaturahmi, urusan akademik, kunjungan keluarga, dsb."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kenal Dengan *</label>
            <select
              value={form.knownById}
              onChange={(e) => { set('knownById', e.target.value); if (e.target.value) set('knownByOther', ''); }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Pilih warga asrama...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
            {!form.knownById && (
              <input
                value={form.knownByOther}
                onChange={(e) => set('knownByOther', e.target.value)}
                placeholder="atau tulis nama lain (bukan warga asrama)"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Masuk *</label>
            <input
              type="datetime-local"
              value={form.entryTime}
              onChange={(e) => set('entryTime', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Opsi Menginap */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Moon className="h-4 w-4 text-indigo-600" />
                Tamu Menginap di Asrama?
              </span>
              <input
                type="checkbox"
                checked={form.isStaying}
                onChange={(e) => setForm((f) => ({ ...f, isStaying: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {form.isStaying && (
              <div className="pt-1.5 border-t border-slate-200/80">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Berapa hari menginap? *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.stayDuration}
                    onChange={(e) => setForm((f) => ({ ...f, stayDuration: e.target.value }))}
                    className="w-24 rounded-xl border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-slate-500 font-medium">Hari</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Tambahan</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Catatan khusus, keperluan lebih detail, dsb. (opsional)"
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {pending ? 'Menyimpan...' : 'Simpan Data Tamu'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- Guest Card ----------

function GuestCard({
  entry,
  canInput,
  onRefresh,
}: {
  entry: GuestEntry;
  canInput: boolean;
  onRefresh?: () => void;
}) {
  const [deleting, startDelete] = useTransition();
  const [closing, startClose] = useTransition();

  const handleDelete = () => {
    if (!confirm('Hapus data tamu ini?')) return;
    startDelete(async () => {
      try {
        await deleteGuestBookEntry(entry.id);
        onRefresh?.();
      } catch {}
    });
  };

  const handleSetExit = () => {
    startClose(async () => {
      try {
        await updateGuestBookEntry(entry.id, { exitTime: new Date().toISOString() });
        onRefresh?.();
      } catch {}
    });
  };

  const knownByName = entry.knownBy?.fullName ?? entry.knownByOther ?? '—';
  const isStillInside = !entry.exitTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 truncate">{entry.visitorName}</h4>
          {entry.institution && (
            <p className="text-xs text-slate-400 truncate">{entry.institution}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {entry.isStaying ? (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Moon className="h-3 w-3" /> Menginap ({entry.stayDuration || 1} Hari)
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
              Tidak Menginap
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isStillInside ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isStillInside ? '🟢 Di Dalam' : '⬜ Sudah Keluar'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{entry.originCity}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{entry.purpose}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Kenal: {knownByName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{formatDateTime(entry.entryTime)}</span>
        </div>
        {entry.exitTime && (
          <div className="col-span-2 flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Keluar: {formatDateTime(entry.exitTime)}</span>
          </div>
        )}
      </div>

      {entry.note && (
        <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl px-3 py-2">
          "{entry.note}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400">
          Dicatat: {entry.createdBy?.fullName ?? '—'}
        </span>
        {canInput && (
          <div className="flex gap-2">
            {isStillInside && (
              <button
                onClick={handleSetExit}
                disabled={closing}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Tandai Keluar
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Hapus
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Main ----------

export default function GuestBookTab({ entries, canInput, allUsers }: Props) {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);

  const goMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const filtered = entries.filter(
    (e) => e.month === selectedMonth && e.year === selectedYear
  );

  const stillInside = filtered.filter((e) => !e.exitTime).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => goMonth(-1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 text-sm">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
          </div>
          <button onClick={() => goMonth(1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {canInput && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tambah Tamu
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-center">
          <BookUser className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-indigo-700">{filtered.length}</div>
          <div className="text-xs text-indigo-500">Total Tamu</div>
        </div>
        <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center">
          <Moon className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-purple-700">
            {filtered.filter((e) => e.isStaying).length}
          </div>
          <div className="text-xs text-purple-500">Tamu Menginap</div>
        </div>
        <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
          <Users className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">{stillInside}</div>
          <div className="text-xs text-green-500">Masih Di Dalam</div>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
          <PenLine className="h-5 w-5 text-slate-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-slate-700">{filtered.length - stillInside}</div>
          <div className="text-xs text-slate-500">Sudah Keluar</div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <BookUser className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm font-medium">Belum ada tamu bulan ini</p>
          <p className="text-xs mt-1">
            {canInput ? 'Klik "Tambah Tamu" untuk mencatat kunjungan.' : 'Tidak ada data tamu untuk bulan ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((e) => (
            <GuestCard key={e.id} entry={e} canInput={canInput} onRefresh={() => router.refresh()} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddGuestModal
            onClose={() => setShowAdd(false)}
            onSuccess={() => router.refresh()}
            allUsers={allUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
