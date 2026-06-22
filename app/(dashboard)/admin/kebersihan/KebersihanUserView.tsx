"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useTransition, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ImagePlus,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { selfPresensi } from "./actions";

type Props = {
  canManage: boolean;
  hasPeriod: boolean;
  sectorCount: number;
  sectorLabels: string[];
  finePerDay: number;
  scheduledDates: {
    date: string;
    sectors: {
      sector: number;
      assignmentId: string;
      userId: string;
      fullName: string;
      isMe: boolean;
      present: boolean;
    }[];
  }[];
  kerjaBaktiDates: string[];
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: string;
  }[];
  myNextPiket: {
    date: string;
    sector: number;
    assignmentId: string;
    present: boolean;
  } | null;
  nextKerjaBakti: string | null;
  myAssignments: {
    assignmentId: string;
    date: string;
    sector: number;
    present: boolean;
  }[];
};

/* ─── Helpers ─── */

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("id-ID", opts ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDayMonth(iso: string) {
  const d = new Date(iso);
  return {
    dayName: d.toLocaleDateString("id-ID", { weekday: "long" }),
    dayNum: d.getDate(),
    monthName: d.toLocaleDateString("id-ID", { month: "long" }),
    year: d.getFullYear(),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Current Jakarta (WIB, UTC+7) wall-clock as a Date whose local fields are WIB. */
function nowWib(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

/** YYYY-MM-DD key from WIB calendar fields (avoid toISOString date drift). */
function wibDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type PresensiStatus = "hadir" | "buka" | "tutup" | "belum";

/**
 * Presensi status for a piket date.
 * Accepts either a full ISO string or a YYYY-MM-DD key (we slice to date-only).
 * Window mirrors `selfPresensi` in actions.ts: only on the piket day, 01:00–11:00 WIB.
 *  - hadir : sudah presensi
 *  - buka  : hari piket, dalam jam 01:00–11:00 WIB
 *  - tutup : hari piket terlewat / jam sudah lewat (tidak presensi)
 *  - belum : hari piket belum tiba (atau belum jam buka di hari-H)
 */
function presensiStatus(iso: string, present: boolean): PresensiStatus {
  if (present) return "hadir";

  const wib = nowWib();
  const todayKey = wibDateKey(wib);
  const dateKey = iso.slice(0, 10);

  if (dateKey > todayKey) return "belum";
  if (dateKey < todayKey) return "tutup";

  // Same WIB day: gate by the 01:00–11:00 window.
  const hour = wib.getHours();
  if (hour < 1) return "belum";
  if (hour >= 11) return "tutup";
  return "buka";
}

function isPresensiOpen(iso: string): boolean {
  return presensiStatus(iso, false) === "buka";
}

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

/* ─── Week stripes ─── */
const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && parts[0].toLowerCase() === "muhammad") {
    return parts[1];
  }
  return parts[0];
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return {
    dayLabel: dayNames[d.getDay()],
    dateStr: `${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`,
  };
}

/* Split into Mon–Sun week blocks (always 7 cols, padded) */
function splitWeeks(
  dates: Props["scheduledDates"],
  kerjaBaktiDates: string[]
): { label: string; days: string[]; cellMap: Record<string, any>; hasData: Set<string> }[] {
  // Bucket from the union of piket dates + kerja bakti dates, so a week that
  // contains only a kerja bakti day (no individual piket) still renders.
  const allDates = Array.from(
    new Set([...dates.map((d) => d.date), ...kerjaBaktiDates])
  ).sort();

  const buckets: string[][] = [];
  let current: string[] = [];
  let lastWeekStart = -1;

  for (const date of allDates) {
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

  const cellLookup: Record<string, any> = {};
  for (const item of dates) {
    for (const s of item.sectors) {
      cellLookup[`${item.date}|${s.sector}`] = s;
    }
  }

  // A date "has data" when it carries piket assignments or is a kerja bakti day.
  const dataDates = new Set([...dates.map((d) => d.date), ...kerjaBaktiDates]);

  const weeks: { label: string; days: string[]; cellMap: Record<string, any>; hasData: Set<string> }[] = [];

  for (const bucket of buckets) {
    const firstDate = new Date(bucket[0]);
    const wd = firstDate.getDay();
    const monday = new Date(firstDate);
    monday.setDate(firstDate.getDate() - ((wd + 6) % 7));

    const fullDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const iso = day.toISOString().slice(0, 10);
      fullDays.push(iso);
    }

    const first = fmtShortDate(fullDays[0]);
    const last = fmtShortDate(fullDays[6]);
    weeks.push({ label: `Sen, ${first.dateStr}  –  Min, ${last.dateStr}`, days: fullDays, cellMap: cellLookup, hasData: dataDates });
  }

  return weeks;
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function KebersihanUserView({
  canManage,
  hasPeriod,
  sectorCount,
  sectorLabels,
  finePerDay,
  scheduledDates,
  kerjaBaktiDates,
  announcements,
  myNextPiket,
  nextKerjaBakti,
  myAssignments,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Presensi modal state: which assignment is being checked in.
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [modalError, setModalError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const openPresensiModal = (assignmentId: string) => {
    setModalAssignmentId(assignmentId);
    setPhotoName("");
    setAgreement(false);
    setComplaint("");
    setModalError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const closePresensiModal = () => {
    setModalAssignmentId(null);
  };

  const photoSelected = photoName.length > 0;
  const canSubmitPresensi =
    photoSelected && agreement && complaint.trim().length > 0 && !isPending;

  const handleSubmitPresensi = () => {
    setModalError("");
    const file = photoInputRef.current?.files?.[0];
    if (!file) {
      setModalError("Foto bukti piket wajib diunggah");
      return;
    }
    if (!agreement) {
      setModalError("Centang pernyataan kejujuran terlebih dahulu");
      return;
    }
    if (!complaint.trim()) {
      setModalError("Keluhan wajib diisi");
      return;
    }
    if (!modalAssignmentId) return;

    const fd = new FormData();
    fd.set("assignmentId", modalAssignmentId);
    fd.set("photo", file);
    fd.set("complaint", complaint.trim());
    fd.set("agreement", "true");

    startTransition(async () => {
      try {
        await selfPresensi(fd);
        closePresensiModal();
        router.refresh();
      } catch (e: any) {
        setModalError(e?.message ?? "Gagal melakukan presensi");
      }
    });
  };

  const weeks = useMemo(() => splitWeeks(scheduledDates, kerjaBaktiDates), [scheduledDates, kerjaBaktiDates]);
  const sectorIndexes = useMemo(() => Array.from({ length: sectorCount }, (_, i) => i), [sectorCount]);
  const kerjaBaktiSet = useMemo(() => new Set(kerjaBaktiDates), [kerjaBaktiDates]);

  // Riwayat piket: newest first, with a final status per assignment.
  const history = useMemo(() => {
    return [...myAssignments]
      .map((a) => ({ ...a, status: presensiStatus(a.date, a.present) }))
      .sort((x, y) => y.date.localeCompare(x.date));
  }, [myAssignments]);

  // Statistik: only finalized days count toward Piket / Tidak Piket.
  // "belum" & "buka" are still pending and shown separately.
  const stats = useMemo(() => {
    let piket = 0;
    let tidakPiket = 0;
    let pending = 0;
    for (const h of history) {
      if (h.status === "hadir") piket++;
      else if (h.status === "tutup") tidakPiket++;
      else pending++;
    }
    return {
      piket,
      tidakPiket,
      pending,
      total: history.length,
      estimasiDenda: tidakPiket * finePerDay,
    };
  }, [history, finePerDay]);

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Divisi Kebersihan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jadwal piket, presensi, dan pemberitahuan kebersihan lingkungan asrama.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/kebersihan/kelola"
              className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
            >
              <ShieldCheck className="h-4 w-4" />
              Akses Layanan Admin
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/admin/kebersihan/laporan"
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
            >
              <ClipboardCheck className="h-4 w-4" />
              Laporan & Denda
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===== EVENT TERDEKAT ===== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <CalendarClock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Piket Saya Terdekat</h3>
            </div>
            {myNextPiket ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Anda bertugas pada{" "}
                  <span className="font-semibold text-foreground">
                    {fmtDate(myNextPiket.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>{" "}
                  di{" "}
                  <span className="font-semibold text-foreground">
                    {sectorLabels[myNextPiket.sector] ?? myNextPiket.sector + 1}
                  </span>
                  .
                </p>
                {(() => {
                  const status = presensiStatus(myNextPiket.date, myNextPiket.present);
                  if (status === "hadir") {
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sudah presensi
                      </span>
                    );
                  }
                  if (status === "buka") {
                    return (
                      <button
                        onClick={() => openPresensiModal(myNextPiket.assignmentId)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Presensi di sini
                      </button>
                    );
                  }
                  // status === "belum" | "tutup": window not open
                  return (
                    <div className="space-y-1.5">
                      <button
                        disabled
                        className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-muted-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        Presensi Tutup
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {status === "belum"
                          ? "Presensi dibuka pukul 01:00–11:00 WIB pada hari piket Anda."
                          : "Batas waktu presensi (01:00–11:00 WIB) sudah terlewat."}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada jadwal piket terdekat untuk Anda.
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Kerja Bakti Terdekat</h3>
            </div>
            {nextKerjaBakti ? (
              <p className="text-sm text-muted-foreground">
                Kerja bakti seluruh anggota asrama dijadwalkan pada{" "}
                <span className="font-semibold text-foreground">
                  {fmtDate(nextKerjaBakti, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada jadwal kerja bakti mendatang.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== PEMBERITAHUAN (full width) ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-foreground">Pemberitahuan</h2>
        </div>
        {announcements.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="min-w-[280px] flex-1 rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  {a.pinned && (
                    <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {a.body}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground/60">
                  {fmtDate(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada pemberitahuan dari divisi kebersihan.
          </p>
        )}
      </div>

      {/* ===== JADWAL PIKET — CALENDAR TABLE ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-semibold text-foreground">Jadwal Piket</h2>
        {hasPeriod && scheduledDates.length > 0 ? (
          <div className="space-y-6">
            {weeks.map((week, wi) => (
              <div key={wi}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {week.label}
                </p>

                <div
                  className="grid rounded-2xl border border-border bg-white overflow-hidden"
                  style={{ gridTemplateColumns: `50px repeat(7, 1fr)` }}
                >
                  {/* Header */}
                  <div className="border-b border-r border-border bg-slate-50 px-1 py-2.5 text-center text-[10px] font-semibold text-muted-foreground">
                    St
                  </div>
                  {week.days.map((date) => {
                    const s = fmtShortDate(date);
                    const isToday = new Date().toISOString().slice(0, 10) === date;
                    const isKb = kerjaBaktiSet.has(date);
                    const hasData = week.hasData.has(date);
                    return (
                      <div
                        key={date}
                        className={`border-b border-r border-border px-1 py-2.5 text-center text-[10px] font-semibold last:border-r-0 ${
                          isKb
                            ? "bg-amber-50 text-amber-700"
                            : isToday
                            ? "bg-blue-50/70 text-primary"
                            : hasData
                            ? "bg-slate-50 text-muted-foreground"
                            : "bg-slate-100/50 text-muted-foreground/40"
                        }`}
                      >
                        <div>{isKb ? "KB" : s.dayLabel}</div>
                        <div className="mt-0.5 text-[9px] font-normal opacity-75">{s.dateStr}</div>
                      </div>
                    );
                  })}

                  {/* Data rows */}
                  {sectorIndexes.map((si) => (
                    <div key={si} className="contents">
                      <div className="border-b border-r border-border bg-white py-2 text-center text-xs font-bold text-muted-foreground">
                        {sectorLabels[si] ?? si + 1}
                      </div>
                      {week.days.map((date) => {
                        const cell = week.cellMap[`${date}|${si}`];
                        const isToday = new Date().toISOString().slice(0, 10) === date;
                        const isKb = kerjaBaktiSet.has(date);
                        const hasData = week.hasData.has(date);

                        if (isKb) {
                          const isLastSector = si === sectorCount - 1;
                          return (
                            <div
                              key={`${date}|${si}`}
                              className={`border-r border-border bg-amber-50/60 py-2 text-center text-xs last:border-r-0 ${
                                isLastSector ? "border-b" : ""
                              }`}
                            >
                              {si === 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">
                                  Kerja Bakti
                                </span>
                              ) : (
                                <span className="opacity-0">-</span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${date}|${si}`}
                            className={`flex flex-col items-center justify-center gap-0.5 border-b border-r border-border py-1.5 text-center text-xs last:border-r-0 ${
                              isToday ? "bg-blue-50/40" : ""
                            } ${!hasData ? "bg-slate-50/30" : ""}`}
                          >
                            {cell ? (
                              <>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                                    cell.isMe
                                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                      : "text-foreground"
                                  }`}
                                >
                                  {cell.present && (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  )}
                                  {shortName(cell.fullName)}
                                </span>
                                {cell.isMe && !cell.present && isPresensiOpen(date) && (
                                  <button
                                    onClick={() => openPresensiModal(cell.assignmentId)}
                                    disabled={isPending}
                                    className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                                  >
                                    Hadir
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/60 py-10 text-center">
            <ClipboardCheck className="mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Belum ada jadwal piket aktif.
            </p>
          </div>
        )}
      </div>

      {/* ===== RIWAYAT & STATISTIK PIKET SAYA ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-semibold text-foreground">Riwayat Piket Saya</h2>

        {myAssignments.length > 0 ? (
          <>
            {/* Statistik */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Piket
                </div>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.piket}</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <XCircle className="h-3.5 w-3.5" /> Tidak Piket
                </div>
                <p className="mt-1 text-2xl font-bold text-red-700">{stats.tidakPiket}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Belum Terlaksana
                </div>
                <p className="mt-1 text-2xl font-bold text-muted-foreground">{stats.pending}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Wallet className="h-3.5 w-3.5" /> Estimasi Denda
                </div>
                <p className="mt-1 text-lg font-bold text-amber-700">
                  {formatRupiah(stats.estimasiDenda)}
                </p>
              </div>
            </div>

            {stats.tidakPiket > 0 && (
              <p className="mb-5 text-xs text-muted-foreground">
                Estimasi denda dihitung dari {stats.tidakPiket} hari tidak piket ×{" "}
                {formatRupiah(finePerDay)}/hari. Angka final ditetapkan saat periode ditutup oleh
                pengurus.
              </p>
            )}

            {/* Log riwayat */}
            <div className="flex flex-wrap gap-3">
              {history.map((a) => {
                const d = fmtDayMonth(a.date);
                // Hijau = Piket, Merah = Tidak Piket, Abu = belum waktunya / sedang buka.
                const tone =
                  a.status === "hadir"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : a.status === "tutup"
                    ? "border-red-200 bg-red-50/60"
                    : "border-slate-200 bg-slate-50";
                return (
                  <div
                    key={a.assignmentId}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm ${tone}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {d.dayName}, {d.dayNum} {d.monthName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sectorLabels[a.sector] ?? a.sector + 1}
                      </p>
                    </div>
                    {a.status === "hadir" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Piket
                      </span>
                    ) : a.status === "tutup" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                        <XCircle className="h-3 w-3" /> Tidak Piket
                      </span>
                    ) : a.status === "buka" ? (
                      <button
                        onClick={() => openPresensiModal(a.assignmentId)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Presensi
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" /> Belum
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Anda tidak memiliki jadwal piket pada periode ini.
          </p>
        )}
      </div>

      {/* ===== MODAL PRESENSI (bukti + pernyataan + keluhan) ===== */}
      {modalAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && closePresensiModal()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Presensi Piket</h3>
              </div>
              <button
                onClick={() => !isPending && closePresensiModal()}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {/* Foto bukti */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tambahkan Bukti Anda Telah Piket
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
                  className="hidden"
                  id="piket-photo-input"
                />
                <label
                  htmlFor="piket-photo-input"
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors ${
                    photoSelected
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-700"
                      : "border-border bg-slate-50/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <ImagePlus className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {photoSelected ? photoName : "Pilih foto (JPG/PNG/WEBP, maks 10 MB)"}
                  </span>
                </label>
              </div>

              {/* Keluhan */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Sampaikan Keluhan Anda disini
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan keluhan/komplain selama piket..."
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* Pernyataan kejujuran */}
              <label className="flex items-start gap-2.5 rounded-lg border border-border bg-slate-50/60 p-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-border"
                />
                <span>
                  Saya Telah Melakukan Piket, dan Saya Mengisi Form Ini Dengan Kejujuran
                  Penuh
                </span>
              </label>

              {modalError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {modalError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => !isPending && closePresensiModal()}
                disabled={isPending}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPresensi}
                disabled={!canSubmitPresensi}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardCheck className="h-4 w-4" />
                {isPending ? "Memproses..." : "Presensi"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
