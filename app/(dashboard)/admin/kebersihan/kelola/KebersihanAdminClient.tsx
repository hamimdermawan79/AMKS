"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarRange,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { createSchedule, addPemberitahuan, deletePemberitahuan, deletePiketPeriod } from "../actions";

type Warga = { id: string; fullName: string; username: string };

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
    sectors: { sector: number; fullName: string }[];
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return {
    dayLabel: dayNames[d.getDay()],
    dateStr: `${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`,
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
): { label: string; days: string[]; cellMap: Record<string, string> }[] {
  const buckets: string[][] = [];
  let cur: string[] = [];
  let lastWs = -1;

  for (const item of data) {
    const d = new Date(item.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const ws = monday.getTime();
    if (ws !== lastWs && cur.length > 0) { buckets.push(cur); cur = []; }
    lastWs = ws;
    cur.push(item.date);
  }
  if (cur.length > 0) buckets.push(cur);

  const cellMap: Record<string, string> = {};
  for (const item of data) {
    for (const s of item.sectors) {
      cellMap[`${item.date}|${s.sector}`] = s.fullName;
    }
  }

  const dateSet = new Set(data.map((x) => x.date));

  return buckets.map((bucket) => {
    const first = new Date(bucket[0]);
    const monday = new Date(first);
    monday.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
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
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");

  // ----- Pemberitahuan form state -----
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annError, setAnnError] = useState("");

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
      {/* ===== SCHEDULE TABLE ===== */}
      {activePeriod && scheduleData.length > 0 && (
        <ScheduleTable data={scheduleData} sectorCount={sectorCount} />
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
                  type="number"
                  min={0}
                  step={1000}
                  value={finePerDay}
                  onChange={(e) => setFinePerDay(Number(e.target.value))}
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
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
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
}: {
  data: { date: string; sectors: { sector: number; fullName: string }[] }[];
  sectorCount: number;
}) {
  const weeks = useMemo(() => groupScheduleWeeks(data), [data]);
  const sectorIndexes = useMemo(() => Array.from({ length: sectorCount }, (_, i) => i), [sectorCount]);

  return (
    <div className="space-y-6">
      {weeks.map((week, wi) => (
        <div key={wi}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {week.label}
          </p>

          {/* Grid: 1 col for labels + 7 cols for days */}
          <div
            className="grid rounded-2xl border border-border bg-white overflow-hidden"
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
                <div className="border-b border-r border-border bg-white px-2 py-2 text-center text-xs font-bold text-muted-foreground">
                  {SECTOR_LABELS[si] ?? si + 1}
                </div>
                {week.days.map((date) => {
                  const name = week.cellMap[`${date}|${si}`];
                  return (
                    <div
                      key={`${date}|${si}`}
                      className="border-b border-r border-border bg-white px-1 py-2 text-center text-xs text-foreground last:border-r-0"
                    >
                      {name ? shortName(name) : <span className="text-muted-foreground/30">—</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
