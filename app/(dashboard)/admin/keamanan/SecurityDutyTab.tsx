'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Shield, CheckCircle2, Clock, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, ClipboardList,
  DoorOpen, Car, Bike, UserCheck, Loader2, Plus, Trash2,
  Table as TableIcon, List, Search, CheckSquare, Square,
  Check, ArrowRight, X, Users,
} from 'lucide-react';
import {
  generateSecurityDutyPeriod,
  submitSecurityAttendance,
  deleteSecurityDutyPeriod,
  updateSecurityDutyAssignee,
} from './security-actions';

// ---------- Types ----------

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

type Props = {
  periods: SecurityPeriod[];
  currentUserId: string;
  canManage: boolean;
  allUsers: UserBasic[];
};

// ---------- Helpers ----------

const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && parts[0].toLowerCase() === 'muhammad') {
    return parts[1];
  }
  return parts[0];
}

function fmtDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return {
    dayLabel: WEEKDAY_NAMES[d.getDay()],
    dateStr: `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`,
  };
}

function isPastDay(dateIsoOrStr: string): boolean {
  const d = new Date(dateIsoOrStr);
  const now = new Date();
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return targetDate < todayDate;
}

// Split assignments into Mon-Sun week blocks (like Kebersihan)
function splitWeeks(assignments: AssignmentWithAttendance[]) {
  if (assignments.length === 0) return [];

  const dateMap = new Map<string, AssignmentWithAttendance>();
  for (const a of assignments) {
    const key = a.date.slice(0, 10);
    dateMap.set(key, a);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();
  const buckets: string[][] = [];
  let current: string[] = [];
  let lastWeekStart = -1;

  for (const date of sortedDates) {
    const d = new Date(date);
    const wd = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((wd + 6) % 7));
    const ws = monday.getTime();

    if (ws !== lastWeekStart && current.length > 0) {
      buckets.push(current);
      current = [];
    }
    lastWeekStart = ws;
    current.push(date);
  }
  if (current.length > 0) buckets.push(current);

  return buckets.map((bucket) => {
    const firstDate = new Date(bucket[0]);
    const wd = firstDate.getDay();
    const monday = new Date(firstDate);
    monday.setDate(firstDate.getDate() - ((wd + 6) % 7));

    const fullDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      fullDays.push(fmtDateKey(day));
    }

    const firstFmt = fmtShortDate(fullDays[0]);
    const lastFmt = fmtShortDate(fullDays[6]);

    return {
      label: `Minggu: ${firstFmt.dateStr} – ${lastFmt.dateStr}`,
      days: fullDays,
      dateMap,
    };
  });
}

// ============================================================
// MODAL: GENERATE JADWAL (KEK KEBERSIHAN)
// ============================================================

function GenerateScheduleModal({
  selectedMonth,
  selectedYear,
  allUsers,
  onClose,
  onSuccess,
}: {
  selectedMonth: number;
  selectedYear: number;
  allUsers: UserBasic[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const defaultStart = `${selectedYear}-${pad2(selectedMonth)}-01`;
  const defaultEnd = `${selectedYear}-${pad2(selectedMonth)}-${pad2(daysInMonth)}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    allUsers.map((u) => u.id)
  );
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Calculate day difference
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) return 0;
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    return allUsers.filter((u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase())
    );
  }, [allUsers, search]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => setSelectedUserIds(allUsers.map((u) => u.id));
  const deselectAll = () => setSelectedUserIds([]);

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      setError('Tanggal mulai dan selesai wajib diisi.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Pilih minimal satu warga sebagai peserta piket.');
      return;
    }
    setError('');

    startTransition(async () => {
      try {
        await generateSecurityDutyPeriod({
          startDate,
          endDate,
          selectedUserIds,
        });
        onSuccess();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal membuat jadwal.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Buat Jadwal Piket Malam Keamanan</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Atur rentang tanggal dan pilih warga yang bergiliran piket
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Rentang Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Rentang Tanggal Piket
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {totalDays > 0 && (
              <p className="mt-2 text-xs text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Durasi piket: <strong>{totalDays} hari</strong> (akan dibagi rata giliran piket 1 orang per hari).
              </p>
            )}
          </div>

          {/* Form Peserta Piket */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Form Peserta Piket ({selectedUserIds.length} dari {allUsers.length} Warga Dipilih)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Kecualikan warga yang sedang berhalangan/pulang kampung dengan tidak mencentangnya.
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama warga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Checklist Warga */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
              {filteredUsers.map((u) => {
                const checked = selectedUserIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors border ${
                      checked
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-0.5 rounded ${checked ? 'text-blue-600' : 'text-slate-300'}`}>
                      {checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </div>
                    <span className="truncate flex-1">{u.fullName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending || totalDays === 0 || selectedUserIds.length === 0}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            {pending ? 'Membuat Jadwal...' : 'Generate Jadwal'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// MODAL: PRESENSI
// ============================================================

function PresensiModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: AssignmentWithAttendance;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [doors, setDoors] = useState(false);
  const [garage, setGarage] = useState(false);
  const [bikes, setBikes] = useState(false);
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    startTransition(async () => {
      try {
        await submitSecurityAttendance({
          assignmentId: assignment.id,
          doorsLocked: doors,
          garagesClosed: garage,
          bikesSecured: bikes,
          note: note || undefined,
        });
        onSuccess();
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal presensi.');
      }
    });
  };

  const dateStr = new Date(assignment.date).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Moon className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Presensi Piket Malam</h3>
              <p className="text-xs text-slate-300 mt-0.5">{dateStr}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Pastikan Anda telah melakukan pengecekan keamanan asrama sebelum mengisi presensi ini.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={doors}
                onChange={(e) => setDoors(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <DoorOpen className="h-4 w-4 text-slate-600" /> Pintu Luar Terkunci
                </div>
                <div className="text-slate-400 mt-0.5">Pintu utama dan pintu samping luar sudah tertutup rapat dan terkunci.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={garage}
                onChange={(e) => setGarage(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-slate-600" /> Garasi Tertutup & Terkunci
                </div>
                <div className="text-slate-400 mt-0.5">Pintu garasi sudah ditutup dan digembok dengan aman.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bikes}
                onChange={(e) => setBikes(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-slate-600" /> Motor Luar Terkunci Stang
                </div>
                <div className="text-slate-400 mt-0.5">Motor yang terparkir di area luar sudah dipastikan terkunci stang.</div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Kondisi / Warga Keluar Malam (Opsional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kondisi aman terkendali, ada 2 warga izin keluar beli makan..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            {pending ? 'Menyimpan...' : 'Kirim Presensi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SecurityDutyTab({
  periods,
  currentUserId,
  canManage,
  allUsers,
}: Props) {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activePresent, setActivePresent] = useState<AssignmentWithAttendance | null>(null);
  const [deleting, startDelete] = useTransition();
  const [swapping, startSwap] = useTransition();
  const [swapError, setSwapError] = useState('');

  const currentPeriod = periods.find(
    (p) => p.month === selectedMonth && p.year === selectedYear
  );

  const goMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleDelete = (periodId: string) => {
    if (!confirm('Hapus seluruh jadwal piket keamanan periode ini?')) return;
    startDelete(async () => {
      try {
        await deleteSecurityDutyPeriod(periodId);
        router.refresh();
      } catch {}
    });
  };

  const assignments = currentPeriod?.assignments ?? [];
  const weeks = useMemo(() => splitWeeks(assignments), [assignments]);

  const totalDays = assignments.length;
  const doneCount = assignments.filter((a) => a.attendance).length;
  const todayAssignment = assignments.find((a) => {
    return new Date(a.date).toDateString() === now.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Month Navigation & Admin Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => goMonth(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div className="text-center min-w-[130px]">
            <h3 className="font-bold text-slate-800 text-sm">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
          </div>
          <button
            onClick={() => goMonth(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Toggle Button */}
          {assignments.length > 0 && (
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" /> Tabel
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Daftar
              </button>
            </div>
          )}

          {/* Admin Actions */}
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {currentPeriod ? 'Buat Ulang Jadwal' : 'Buat Jadwal Piket'}
              </button>
              {currentPeriod && (
                <button
                  onClick={() => handleDelete(currentPeriod.id)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-60 transition-colors"
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Hapus
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats summary */}
      {currentPeriod && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-3.5 text-center">
            <Calendar className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-800">{totalDays}</div>
            <div className="text-[11px] text-blue-600">Total Hari Piket</div>
          </div>
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-800">{doneCount}</div>
            <div className="text-[11px] text-emerald-600">Sudah Presensi</div>
          </div>
          <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-3.5 text-center">
            <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-800">{totalDays - doneCount}</div>
            <div className="text-[11px] text-amber-600">Belum / Terjadwal</div>
          </div>
        </div>
      )}

      {/* Piket Kamu Hari Ini (Banner Prominen) */}
      {todayAssignment && todayAssignment.userId === currentUserId && !todayAssignment.attendance && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 mb-1">
                  Piket Malam Ini
                </span>
                <h4 className="font-bold text-slate-800 text-sm">
                  Hari Ini Jadwal Piket Kamu! (21:00 – 00:00 WIB)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Harap cek pintu luar, garasi, dan kunci stang motor, lalu lakukan presensi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePresent(todayAssignment)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm shrink-0"
            >
              <UserCheck className="h-4 w-4" /> Presensi Sekarang
            </button>
          </div>
        </motion.div>
      )}

      {/* CONTENT: JADWAL PIKET */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <Shield className="h-12 w-12 mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Belum Ada Jadwal Piket Keamanan</p>
          <p className="text-xs mt-1 text-slate-400 max-w-sm">
            {canManage
              ? 'Klik tombol "Buat Jadwal Piket" di atas untuk generate jadwal piket malam.'
              : 'Admin belum membuat jadwal piket malam untuk bulan ini.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ===== TAMPILAN TABEL KALENDER MINGGUAN (KEK KEBERSIHAN) ===== */
        <div className="space-y-6">
          {weeks.map((week, wi) => (
            <div key={wi} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              {/* Header Label Minggu */}
              <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {week.label}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Piket Malam (21:00 - 00:00)
                </span>
              </div>

              {/* Grid 7 Kolom (Mon - Sun) */}
              <div className="grid grid-cols-7 divide-x divide-slate-100 overflow-x-auto min-w-[650px]">
                {week.days.map((dateStr) => {
                  const s = fmtShortDate(dateStr);
                  const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                  const item = week.dateMap.get(dateStr);
                  const hasAttendance = !!item?.attendance;
                  const isMe = item?.userId === currentUserId;

                  return (
                    <div key={dateStr} className="flex flex-col min-h-[110px]">
                      {/* Day Header */}
                      <div
                        className={`py-2 px-1 text-center border-b border-slate-100 text-[11px] font-semibold ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-50/50 text-slate-600'
                        }`}
                      >
                        <div className="font-bold">{s.dayLabel}</div>
                        <div className={`text-[10px] ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                          {s.dateStr}
                        </div>
                      </div>

                      {/* Cell Content */}
                      <div
                        className={`flex-1 p-2 flex flex-col justify-between text-center transition-colors ${
                          isToday ? 'bg-blue-50/30' : ''
                        } ${isMe ? 'bg-amber-50/20' : ''}`}
                      >
                        {item ? (
                          <>
                            {/* Petugas name & checkmark */}
                            <div className="my-auto py-1">
                              <div
                                className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold max-w-full ${
                                  hasAttendance
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isMe
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200 ring-1 ring-blue-300'
                                    : 'text-slate-700 bg-slate-50'
                                }`}
                                title={item.user.fullName}
                              >
                                {hasAttendance && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                                <span className="truncate">{shortName(item.user.fullName)}</span>
                              </div>

                              {/* Status Subtitle */}
                              <div className="mt-1">
                                {hasAttendance ? (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    ✓ Sudah Piket
                                  </span>
                                ) : isToday ? (
                                  isMe || canManage ? (
                                    <button
                                      onClick={() => setActivePresent(item)}
                                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-medium hover:bg-slate-800 transition-colors"
                                    >
                                      <UserCheck className="h-3 w-3" /> Presensi
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-amber-600 font-medium">
                                      Belum Presensi
                                    </span>
                                  )
                                ) : new Date(dateStr) < new Date() ? (
                                  <span className="text-[10px] text-red-500 font-medium">
                                    Tidak Hadir
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    Terjadwal
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Admin Swap selector */}
                            {canManage && !hasAttendance && !isPastDay(dateStr) && (
                              <div className="mt-1 pt-1 border-t border-slate-100">
                                <select
                                  className="w-full text-[10px] text-slate-500 bg-transparent border-0 focus:ring-0 cursor-pointer text-center"
                                  value={item.userId}
                                  disabled={swapping}
                                  onChange={(e) => {
                                    const newUserId = e.target.value;
                                    if (newUserId === item.userId) return;
                                    startSwap(async () => {
                                      try {
                                        await updateSecurityDutyAssignee(item.id, newUserId);
                                        router.refresh();
                                      } catch {}
                                    });
                                  }}
                                >
                                  {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      Ganti: {shortName(u.fullName)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="my-auto text-slate-300 text-xs">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== TAMPILAN DAFTAR HARI (LIST VIEW) ===== */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
          <div className="bg-slate-50/80 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Petugas Piket ({assignments.length} Hari)
            </span>
            <span className="text-xs text-slate-400">
              {doneCount} Hadir
            </span>
          </div>

          {assignments.map((a) => {
            const dateObj = new Date(a.date);
            const dayNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const hasAttendance = !!a.attendance;
            const isMe = a.userId === currentUserId;

            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isToday ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Tanggal */}
                <div className="w-10 text-center shrink-0">
                  <div className={`text-base font-bold ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                    {dayNum}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {dayName}
                  </div>
                </div>

                {/* Nama Petugas */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-blue-700' : 'text-slate-800'}`}>
                      {a.user.fullName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Kamu
                      </span>
                    )}
                  </div>
                  {a.attendance?.note && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Catatan: "{a.attendance.note}"
                    </p>
                  )}
                </div>

                {/* Status Centang / Tombol Presensi */}
                <div className="flex items-center gap-2 shrink-0">
                  {hasAttendance ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sudah Presensi
                    </span>
                  ) : isToday && (isMe || canManage) ? (
                    <button
                      onClick={() => setActivePresent(a)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Presensi
                    </button>
                  ) : isToday ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                      <Clock className="h-3 w-3" /> Belum Presensi
                    </span>
                  ) : dateObj < new Date() ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                      Tidak Hadir
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">
                      Terjadwal
                    </span>
                  )}

                  {/* Admin swap */}
                  {canManage && !hasAttendance && !isPastDay(a.date) && (
                    <select
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      value={a.userId}
                      disabled={swapping}
                      onChange={(e) => {
                        const newUserId = e.target.value;
                        if (newUserId === a.userId) return;
                        startSwap(async () => {
                          try {
                            await updateSecurityDutyAssignee(a.id, newUserId);
                            router.refresh();
                          } catch {}
                        });
                      }}
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          Ganti: {u.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Generate Jadwal */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateScheduleModal
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            allUsers={allUsers}
            onClose={() => setShowGenerateModal(false)}
            onSuccess={() => router.refresh()}
          />
        )}
      </AnimatePresence>

      {/* Modal: Presensi */}
      <AnimatePresence>
        {activePresent && (
          <PresensiModal
            assignment={activePresent}
            onClose={() => setActivePresent(null)}
            onSuccess={() => {
              setActivePresent(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
