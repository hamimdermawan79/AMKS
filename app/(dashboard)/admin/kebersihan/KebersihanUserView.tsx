"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { selfPresensi } from "./actions";

type Props = {
  canManage: boolean;
  hasPeriod: boolean;
  sectorCount: number;
  sectorLabels: string[];
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

function isPresensiOpen(isoDate: string): boolean {
  const now = new Date();
  // Jakarta = UTC+7; equivalent to getting current time in WIB
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const piketDate = new Date(isoDate + "T00:00:00+07:00");

  const todayWib = new Date(wib.toDateString() + " 00:00:00+07:00");
  if (piketDate.getTime() !== todayWib.getTime()) return false;

  const hour = wib.getHours();
  return hour >= 1 && hour < 11;
}

function presensiStatus(isoDate: string, present: boolean): string {
  if (present) return "hadir";
  if (!isPresensiOpen(isoDate)) {
    const now = new Date();
    const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const hour = wib.getHours();
    if (hour < 1) return "belum";
    return "tutup";
  }
  return "buka";
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

  const handlePresensi = (assignmentId: string) => {
    setError("");
    startTransition(async () => {
      try {
        await selfPresensi(assignmentId);
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Gagal melakukan presensi");
      }
    });
  };

  const weeks = useMemo(() => splitWeeks(scheduledDates, kerjaBaktiDates), [scheduledDates, kerjaBaktiDates]);
  const sectorIndexes = useMemo(() => Array.from({ length: sectorCount }, (_, i) => i), [sectorCount]);
  const kerjaBaktiSet = useMemo(() => new Set(kerjaBaktiDates), [kerjaBaktiDates]);

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
          <Link
            href="/admin/kebersihan/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
          >
            <ShieldCheck className="h-4 w-4" />
            Akses Layanan Admin
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
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
                {myNextPiket.present ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sudah presensi
                  </span>
                ) : isPresensiOpen(myNextPiket.date) ? (
                  <button
                    onClick={() => handlePresensi(myNextPiket.assignmentId)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Presensi Piket di sini
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Presensi dibuka pukul 01:00–11:00 WIB pada hari piket
                  </span>
                )}
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
                                    onClick={() => handlePresensi(cell.assignmentId)}
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

      {/* ===== PRESENSI PIKET SAYA (horizontal) ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-semibold text-foreground">Presensi Piket Saya</h2>
        {myAssignments.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {myAssignments.map((a) => {
              const status = presensiStatus(a.date, a.present);
              return (
                <div
                  key={a.assignmentId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-muted-foreground">
                    {new Date(a.date).getDate()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {fmtDate(a.date, { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sectorLabels[a.sector] ?? a.sector + 1}
                    </p>
                  </div>
                  {status === "hadir" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Hadir
                    </span>
                  ) : status === "buka" ? (
                    <button
                      onClick={() => handlePresensi(a.assignmentId)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Presensi
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {status === "belum" ? "Belum" : "Tutup"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Anda tidak memiliki jadwal piket pada periode ini.
          </p>
        )}
      </div>
    </div>
  );
}
