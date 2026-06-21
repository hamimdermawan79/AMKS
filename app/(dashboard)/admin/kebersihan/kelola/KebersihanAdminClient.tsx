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
import { createSchedule, addPemberitahuan, deletePemberitahuan } from "../actions";

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

export default function KebersihanAdminClient({
  warga,
  activePeriod,
  announcements,
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
          <p className="mt-2 text-xs text-blue-700/80">
            Membuat jadwal baru tidak menonaktifkan periode lama secara otomatis.
          </p>
        </div>
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
