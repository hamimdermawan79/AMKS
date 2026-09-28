"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarRange,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Wand2,
  X,
  Dices,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Loader2,
  Info,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import {
  createSchedule,
  addPemberitahuan,
  deletePemberitahuan,
  deletePiketPeriod,
  getSwapCandidates,
  swapPiketAssignment,
} from "../actions";

type Warga = { id: string; fullName: string; username: string; isCalonWarga?: boolean };

export type ScheduleSectorItem = {
  sector: number;
  assignmentId: string;
  userId: string;
  fullName: string;
  hasAttendance?: boolean;
  attendanceStatus?: string | null;
};

type Props = {
  warga: Warga[];
  activePeriod: {
    id: string;
    startDate: string;
    endDate: string;
    peoplePerDay: number;
    finePerDay: number;
    assignmentCount: number;
    kerjaBaktiCount: number;
  } | null;
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: string;
  }[];
  scheduleData: {
    date: string;
    sectors: ScheduleSectorItem[];
  }[];
  sectorCount: number;
};

const WEEKDAYS = [
  { value: 0, label: "Minggu" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseLocalDate(dateStr: string): { year: number; month: number; day: number } {
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split("-").map(Number);
  return { year: y || 2026, month: m || 1, day: d || 1 };
}

function formatLocalDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  const { year, month, day } = parseLocalDate(iso);
  return `${day} ${MONTH_NAMES[month - 1] || ""} ${year}`;
}

function fmtShortDate(iso: string) {
  const { year, month, day } = parseLocalDate(iso);
  const d = new Date(year, month - 1, day);
  return {
    dayLabel: DAY_NAMES[d.getDay()] || "",
    dateStr: `${day} ${MONTH_NAMES[month - 1] || ""}`,
  };
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && parts[0].toLowerCase() === "muhammad") {
    return parts[1];
  }
  return parts[0];
}

function groupScheduleWeeks(
  data: Props["scheduleData"],
): { label: string; days: string[]; cellMap: Record<string, ScheduleSectorItem> }[] {
  const buckets: string[][] = [];
  let cur: string[] = [];
  let lastWs = -1;

  for (const item of data) {
    const { year, month, day } = parseLocalDate(item.date);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(year, month - 1, day - dayOfWeek);
    const ws = monday.getTime();
    if (ws !== lastWs && cur.length > 0) {
      buckets.push(cur);
      cur = [];
    }
    lastWs = ws;
    cur.push(item.date);
  }
  if (cur.length > 0) buckets.push(cur);

  const cellMap: Record<string, ScheduleSectorItem> = {};
  for (const item of data) {
    const cleanDate = item.date.slice(0, 10);
    for (const s of item.sectors) {
      cellMap[`${cleanDate}|${s.sector}`] = s;
    }
  }

  return buckets.map((bucket) => {
    const { year, month, day } = parseLocalDate(bucket[0]);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(year, month - 1, day - dayOfWeek);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      days.push(formatLocalDate(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
    }
    const fd = fmtShortDate(days[0]);
    const ld = fmtShortDate(days[6]);
    return { label: `Sen, ${fd.dateStr}  –  Min, ${ld.dateStr}`, days, cellMap };
  });
}

export default function KebersihanAdminClient({
  warga,
  activePeriod,
  announcements,
  scheduleData,
  sectorCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ----- Schedule form state -----
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kerjaBaktiCount, setKerjaBaktiCount] = useState(1);
  const [kerjaBaktiWeekday, setKerjaBaktiWeekday] = useState(0);
  const [peoplePerDay, setPeoplePerDay] = useState(3);
  const [finePerDay, setFinePerDay] = useState(10000);
  const [finePerDayStr, setFinePerDayStr] = useState("10.000");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");

  // ----- Pemberitahuan form state -----
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annError, setAnnError] = useState("");

  // ----- Swap piket modal state -----
  const [mounted, setMounted] = useState(false);
  const [localSchedule, setLocalSchedule] = useState(scheduleData);
  const [selectedSlot, setSelectedSlot] = useState<{
    assignmentId: string;
    date: string;
    sector: number;
    fullName: string;
    userId: string;
  } | null>(null);
  const [swapSuccessMsg, setSwapSuccessMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalSchedule(scheduleData);
  }, [scheduleData]);

  const handleSwapSuccess = (
    assignmentId: string,
    newUserId: string,
    newUserName: string,
    msg: string
  ) => {
    setLocalSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        sectors: day.sectors.map((s) =>
          s.assignmentId === assignmentId
            ? { ...s, userId: newUserId, fullName: newUserName }
            : s
        ),
      }))
    );
    setSelectedSlot(null);
    setSwapSuccessMsg(msg);
    router.refresh();
  };

  // ----- Delete active period state -----
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeletePeriod = () => {
    if (!activePeriod) return;
    setDeleteError("");
    startTransition(async () => {
      try {
        await deletePiketPeriod(activePeriod.id);
        setConfirmDelete(false);
        router.refresh();
      } catch (e: any) {
        setDeleteError(e?.message ?? "Gagal menghapus jadwal");
      }
    });
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const available = useMemo(
    () => warga.filter((w) => !selectedSet.has(w.id)),
    [warga, selectedSet]
  );
  const selectedWarga = useMemo(
    () => selectedIds.map((id) => warga.find((w) => w.id === id)).filter(Boolean) as Warga[],
    [selectedIds, warga]
  );

  const addOne = (id: string) => {
    if (!id || selectedSet.has(id)) return;
    setSelectedIds((prev) => [...prev, id]);
    setPickerValue("");
  };
  const removeOne = (id: string) =>
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  const selectAll = () => setSelectedIds(warga.map((w) => w.id));
  const clearAll = () => setSelectedIds([]);

  const handleGenerate = () => {
    setScheduleError("");
    setScheduleMsg("");
    if (!startDate || !endDate) {
      setScheduleError("Tanggal mulai dan selesai wajib diisi");
      return;
    }
    if (selectedIds.length === 0) {
      setScheduleError("Pilih minimal 1 warga");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createSchedule({
          startDate,
          endDate,
          kerjaBaktiCount,
          kerjaBaktiWeekday,
          peoplePerDay,
          finePerDay,
          participantIds: selectedIds,
        });
        setScheduleMsg(
          `Jadwal dibuat: ${res.totalAssignments} penugasan, ${res.kerjaBaktiDates} hari kerja bakti, ${res.piketDates} hari piket.`
        );
        router.refresh();
      } catch (e: any) {
        setScheduleError(e?.message ?? "Gagal membuat jadwal");
      }
    });
  };

  const handleAddAnnouncement = () => {
    setAnnError("");
    if (!annTitle.trim() || !annBody.trim()) {
      setAnnError("Judul dan isi pemberitahuan wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        await addPemberitahuan({ title: annTitle, body: annBody, pinned: annPinned });
        setAnnTitle("");
        setAnnBody("");
        setAnnPinned(false);
        router.refresh();
      } catch (e: any) {
        setAnnError(e?.message ?? "Gagal menambah pemberitahuan");
      }
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    startTransition(async () => {
      try {
        await deletePemberitahuan(id);
        router.refresh();
      } catch (e: any) {
        setAnnError(e?.message ?? "Gagal menghapus pemberitahuan");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/admin/kebersihan"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke tampilan divisi
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Layanan Admin — Kebersihan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat jadwal piket, kelola peserta, dan kirim pemberitahuan.
          </p>
        </div>
        <Link
          href="/admin/kebersihan/laporan"
          className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
        >
          <BarChart3 className="h-4 w-4" />
          Laporan & Denda
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Active period summary */}
      {activePeriod && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-blue-900">Periode aktif:</span>
              <span className="text-blue-800">
                {fmtDate(activePeriod.startDate)} – {fmtDate(activePeriod.endDate)}
              </span>
              <span className="text-blue-800">{activePeriod.peoplePerDay} sektor/hari</span>
              <span className="text-blue-800">{activePeriod.assignmentCount} penugasan</span>
              <span className="text-blue-800">{activePeriod.kerjaBaktiCount} kerja bakti</span>
              <span className="text-blue-800">
                Denda Rp{activePeriod.finePerDay.toLocaleString("id-ID")}/hari
              </span>
            </div>
            {!confirmDelete && (
              <button
                onClick={() => {
                  setDeleteError("");
                  setConfirmDelete(true);
                }}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Jadwal
              </button>
            )}
          </div>

          {/* Inline confirmation */}
          {confirmDelete && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                Hapus jadwal piket aktif ini?
              </p>
              <p className="mt-1 text-xs text-red-700/80">
                Seluruh penugasan ({activePeriod.assignmentCount}), presensi, dan{" "}
                {activePeriod.kerjaBaktiCount} hari kerja bakti pada periode ini akan
                dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              {deleteError && (
                <p className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-red-700">
                  {deleteError}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDeletePeriod}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-blue-700/80">
            Membuat jadwal baru tidak menonaktifkan periode lama secara otomatis.
          </p>
        </div>
      )}
      {/* Swap success banner */}
      {swapSuccessMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{swapSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSwapSuccessMsg("")}
            className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== SCHEDULE TABLE ===== */}
      {activePeriod && localSchedule.length > 0 && (
        <ScheduleTable
          data={localSchedule}
          sectorCount={sectorCount}
          onSelectSlot={(slot) => {
            setSwapSuccessMsg("");
            setSelectedSlot(slot);
          }}
        />
      )}

      {/* ===== SWAP MODAL ===== */}
      {mounted && selectedSlot && (
        <SwapPiketModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleSwapSuccess}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== GENERATE SCHEDULE ===== */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Wand2 className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-foreground">Buat Jadwal Piket Baru</h2>
            </div>

            {/* Participant picker */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4" /> Peserta Piket ({selectedIds.length})
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:bg-slate-50"
                  >
                    Pilih semua
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:bg-slate-50"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <select
                value={pickerValue}
                onChange={(e) => addOne(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">
                  {available.length > 0
                    ? "— Tambah warga —"
                    : "Semua warga sudah dipilih"}
                </option>
                {available.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.fullName} (@{w.username})
                  </option>
                ))}
              </select>

              {/* Selected chips */}
              {selectedWarga.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedWarga.map((w) => (
                    <span
                      key={w.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {w.fullName}
                      <button
                        type="button"
                        onClick={() => removeOne(w.id)}
                        className="rounded-full p-0.5 hover:bg-primary/20"
                        aria-label={`Hapus ${w.fullName}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date range + params */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tanggal Mulai">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Tanggal Selesai">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Jumlah Kerja Bakti (sepanjang periode)">
                <input
                  type="number"
                  min={0}
                  value={kerjaBaktiCount}
                  onChange={(e) => setKerjaBaktiCount(Number(e.target.value))}
                  className="form-input"
                />
              </Field>
              <Field label="Hari Kerja Bakti">
                <select
                  value={kerjaBaktiWeekday}
                  onChange={(e) => setKerjaBaktiWeekday(Number(e.target.value))}
                  className="form-input"
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Jumlah Sektor / Hari (A, B, C, ...)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={peoplePerDay}
                  onChange={(e) => setPeoplePerDay(Number(e.target.value))}
                  className="form-input"
                />
              </Field>
              <Field label="Tarif Denda / Hari (Rp)">
                <input
                  type="text"
                  value={finePerDayStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (!raw) {
                      setFinePerDayStr("");
                      setFinePerDay(0);
                      return;
                    }
                    const num = parseInt(raw, 10);
                    setFinePerDayStr(new Intl.NumberFormat("id-ID").format(num));
                    setFinePerDay(num);
                  }}
                  className="form-input"
                />
              </Field>
            </div>

            {scheduleError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {scheduleError}
              </p>
            )}
            {scheduleMsg && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                {scheduleMsg}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 min-h-[44px]"
            >
              <CalendarRange className="h-4 w-4" />
              {isPending ? "Memproses..." : "Generate Jadwal"}
            </button>
          </div>
        </div>

        {/* ===== PEMBERITAHUAN MANAGER ===== */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-foreground">Pemberitahuan</h2>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Judul pemberitahuan"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="form-input"
              />
              <textarea
                placeholder="Isi pemberitahuan..."
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                rows={3}
                className="form-input resize-none"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Pin pemberitahuan
              </label>
              {annError && (
                <p className="text-sm text-red-600">{annError}</p>
              )}
              <button
                onClick={handleAddAnnouncement}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

            {/* Existing list */}
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">
                          {a.title}
                        </p>
                        {a.pinned && (
                          <Sparkles className="h-3 w-3 flex-shrink-0 text-amber-500" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {a.body}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      disabled={isPending}
                      className="flex-shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-60"
                      aria-label="Hapus pemberitahuan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada pemberitahuan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const SECTOR_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

function ScheduleTable({
  data,
  sectorCount,
  onSelectSlot,
}: {
  data: Props["scheduleData"];
  sectorCount: number;
  onSelectSlot: (slot: {
    assignmentId: string;
    date: string;
    sector: number;
    fullName: string;
    userId: string;
  }) => void;
}) {
  const weeks = useMemo(() => groupScheduleWeeks(data), [data]);
  const sectorIndexes = useMemo(() => Array.from({ length: sectorCount }, (_, i) => i), [sectorCount]);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          Tabel Jadwal Piket Aktif
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100 px-3 py-1 rounded-full w-fit">
          <Edit3 className="h-3 w-3 text-emerald-600" />
          Klik nama petugas untuk mengganti / acak pengganti piket
        </span>
      </div>

      {weeks.map((week, wi) => (
        <div key={wi}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {week.label}
          </p>

          {/* overflow-x-auto agar tidak overflow di mobile */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            {/* Grid: 1 col for labels + 7 cols for days */}
            <div
              className="grid bg-white min-w-[520px]"
              style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}
            >
              {/* Header row */}
              <div className="border-b border-r border-border bg-slate-50 px-2 py-2.5 text-[10px] font-semibold text-muted-foreground">
                Sektor
              </div>
              {week.days.map((date) => {
                const s = fmtShortDate(date);
                return (
                  <div
                    key={date}
                    className="border-b border-r border-border bg-slate-50 px-1 py-2.5 text-center text-[10px] font-semibold text-muted-foreground last:border-r-0"
                  >
                    <div>{s.dayLabel}</div>
                    <div className="mt-0.5 text-[9px] font-normal opacity-75">{s.dateStr}</div>
                  </div>
                );
              })}

              {/* Data rows */}
              {sectorIndexes.map((si) => (
                <div key={si} className="contents">
                  <div className="border-b border-r border-border bg-white px-2 py-2 text-center text-xs font-bold text-muted-foreground flex items-center justify-center">
                    {SECTOR_LABELS[si] ?? si + 1}
                  </div>
                  {week.days.map((date) => {
                    const cell = week.cellMap[`${date}|${si}`];
                    if (!cell) {
                      return (
                        <div
                          key={`${date}|${si}`}
                          className="border-b border-r border-border bg-white px-1 py-2 text-center text-xs text-muted-foreground/30 last:border-r-0 flex items-center justify-center min-h-[52px]"
                        >
                          —
                        </div>
                      );
                    }

                    if (cell.hasAttendance) {
                      const isHadir = cell.attendanceStatus === "HADIR";
                      return (
                        <div
                          key={`${date}|${si}`}
                          className="border-b border-r border-border bg-slate-50/50 px-1 py-1.5 text-center text-xs text-foreground last:border-r-0 flex flex-col items-center justify-center min-h-[52px]"
                          title={`${cell.fullName} — Sudah tercatat kehadiran (${isHadir ? "Hadir" : "Tidak Hadir"})`}
                        >
                          <span className="font-medium text-slate-600 line-through opacity-80 text-[11px]">
                            {shortName(cell.fullName)}
                          </span>
                          {isHadir ? (
                            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Hadir
                            </span>
                          ) : (
                            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-full">
                              <AlertCircle className="h-2.5 w-2.5" /> Alpha
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${date}|${si}`}
                        className="border-b border-r border-border bg-white p-1 text-center last:border-r-0 flex items-center justify-center min-h-[52px]"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectSlot({
                              assignmentId: cell.assignmentId,
                              date,
                              sector: si,
                              fullName: cell.fullName,
                              userId: cell.userId,
                            });
                          }}
                          className="group relative flex w-full flex-col items-center justify-center rounded-lg p-1.5 transition-all hover:bg-emerald-50 hover:border-emerald-300 border border-transparent active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
                          title={`Klik untuk ganti / acak petugas piket: ${cell.fullName}`}
                        >
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 pointer-events-none">
                            {shortName(cell.fullName)}
                          </span>
                          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors pointer-events-none">
                            <Edit3 className="h-2.5 w-2.5" /> Ganti
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type Candidate = {
  id: string;
  fullName: string;
  username: string;
  isCalonWarga: boolean;
  dutyCountInPeriod: number;
};

function SwapPiketModal({
  slot,
  onClose,
  onSuccess,
}: {
  slot: {
    assignmentId: string;
    date: string;
    sector: number;
    fullName: string;
    userId: string;
  };
  onClose: () => void;
  onSuccess: (
    assignmentId: string,
    newUserId: string,
    newUserName: string,
    msg: string
  ) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [randomNotice, setRandomNotice] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;
    setLoadingCandidates(true);
    setError("");
    getSwapCandidates(slot.assignmentId)
      .then((res) => {
        if (!active) return;
        setCandidates(res.candidates);
        setLoadingCandidates(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Gagal memuat daftar warga pengganti");
        setLoadingCandidates(false);
      });
    return () => {
      active = false;
    };
  }, [slot.assignmentId]);

  const calonWargaCount = candidates.filter((c) => c.isCalonWarga).length;
  const wargaCount = candidates.filter((c) => !c.isCalonWarga).length;

  const handleRandomize = () => {
    if (candidates.length === 0) return;
    setError("");
    const calonWargaList = candidates.filter((c) => c.isCalonWarga);
    if (calonWargaList.length > 0) {
      const idx = Math.floor(Math.random() * calonWargaList.length);
      const picked = calonWargaList[idx];
      setSelectedUserId(picked.id);
      setRandomNotice(`⭐ Terpilih secara acak dari Calon Warga: ${picked.fullName}`);
    } else {
      const idx = Math.floor(Math.random() * candidates.length);
      const picked = candidates[idx];
      setSelectedUserId(picked.id);
      setRandomNotice(`🎲 Calon warga tidak tersedia. Terpilih secara acak dari Warga Asrama: ${picked.fullName}`);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId) {
      setError("Silakan pilih warga pengganti terlebih dahulu");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await swapPiketAssignment({
          assignmentId: slot.assignmentId,
          newUserId: selectedUserId,
        });
        onSuccess(
          slot.assignmentId,
          selectedUserId,
          res.newUserName,
          `Jadwal berhasil ditukar! ${res.oldUserName} digantikan oleh ${res.newUserName} pada ${res.date} (Sektor ${res.sector}).`
        );
      } catch (err: any) {
        setError(err?.message || "Gagal menukar jadwal piket");
      }
    });
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedUserId);
  const formattedDate = useMemo(() => {
    const { year, month, day } = parseLocalDate(slot.date);
    const d = new Date(year, month - 1, day);
    const FULL_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const FULL_MONTHS = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${FULL_DAYS[d.getDay()] || ""}, ${day} ${FULL_MONTHS[month - 1] || ""} ${year}`;
  }, [slot.date]);
  const sectorLabel = SECTOR_LABELS[slot.sector] ?? slot.sector + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Ganti Petugas Piket
              </h3>
              <p className="text-xs text-muted-foreground">
                Pilih atau acak pengganti piket jika warga berhalangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current info box */}
        <div className="my-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-muted-foreground">Tanggal Piket:</span>
            <span className="font-semibold text-slate-800">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-muted-foreground">Sektor Tugas:</span>
            <span className="font-semibold text-primary">Sektor {sectorLabel}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Petugas Saat Ini:</span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              {slot.fullName}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loadingCandidates ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">Memeriksa ketersediaan warga & calon warga...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick stats & Random button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="text-xs text-indigo-900">
                <span className="font-semibold">{calonWargaCount}</span> Calon Warga &{" "}
                <span className="font-semibold">{wargaCount}</span> Warga Asrama siap piket.
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={isPending || candidates.length === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
              >
                <Dices className="h-3.5 w-3.5" />
                Acak Pengganti
              </button>
            </div>

            {/* Random Notice message */}
            {randomNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 animate-in fade-in">
                {randomNotice}
              </div>
            )}

            {/* Selection Dropdown */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Pilih Warga Pengganti:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setRandomNotice("");
                }}
                disabled={isPending}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
              >
                <option value="">-- Pilih Warga Pengganti --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.isCalonWarga ? "⭐ [CALON WARGA] " : ""}{c.fullName} (@{c.username}) — {c.dutyCountInPeriod}x tugas
                  </option>
                ))}
              </select>
            </div>

            {/* Selected preview card */}
            {selectedCandidate && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-200/70 text-emerald-800 font-bold text-sm">
                    {selectedCandidate.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800">
                        {selectedCandidate.fullName}
                      </span>
                      {selectedCandidate.isCalonWarga ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                          Calon Warga
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 border border-blue-200">
                          Warga
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      @{selectedCandidate.username} • Sudah {selectedCandidate.dutyCountInPeriod}x piket di periode ini
                    </span>
                  </div>
                </div>
                <UserCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              </div>
            )}

            {/* Note alert */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-muted-foreground flex gap-2 items-start">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Warga lama (<strong>{slot.fullName}</strong>) akan dibebaskan dari denda piket pada tanggal ini. Jika denda keterlambatan sempat terbit hari ini, denda akan dibatalkan otomatis. Petugas pengganti akan menerima notifikasi penugasan baru.
              </span>
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || loadingCandidates || !selectedUserId}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                Konfirmasi Penggantian
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

