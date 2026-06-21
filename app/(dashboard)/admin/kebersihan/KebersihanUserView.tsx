"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { selfPresensi } from "./actions";

const SECTOR_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

type Cell = {
  assignmentId: string;
  userId: string;
  fullName: string;
  isMe: boolean;
  present: boolean;
};

type Props = {
  canManage: boolean;
  hasPeriod: boolean;
  sectorCount: number;
  dateKeys: string[];
  cells: Record<string, Cell>;
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

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("id-ID", opts ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDayShort(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("id-ID", { weekday: "short" }),
    date: d.getDate().toString(),
    month: d.toLocaleDateString("id-ID", { month: "short" }),
  };
}

export default function KebersihanUserView({
  canManage,
  hasPeriod,
  sectorCount,
  dateKeys,
  cells,
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

  const sectors = Array.from({ length: sectorCount }, (_, i) => i);

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
                    Sektor {SECTOR_LABELS[myNextPiket.sector] ?? myNextPiket.sector + 1}
                  </span>
                  .
                </p>
                {myNextPiket.present ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sudah presensi
                  </span>
                ) : (
                  <button
                    onClick={() => handlePresensi(myNextPiket.assignmentId)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Presensi Piket di sini
                  </button>
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

      {/* ===== JADWAL PIKET TABLE ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-semibold text-foreground">Jadwal Piket</h2>
        {hasPeriod && dateKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-border bg-slate-50 px-3 py-2.5 text-left font-semibold text-muted-foreground">
                    Sektor
                  </th>
                  {dateKeys.map((dk) => {
                    const f = fmtDayShort(dk);
                    return (
                      <th
                        key={dk}
                        className="border-b border-border bg-slate-50 px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap"
                      >
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                          {f.day}
                        </div>
                        <div className="text-foreground">{f.date}</div>
                        <div className="text-[11px] text-muted-foreground/70">{f.month}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sectors.map((s) => (
                  <tr key={s} className="group">
                    <td className="sticky left-0 z-10 border-b border-border bg-white px-3 py-2.5 font-semibold text-foreground group-hover:bg-slate-50/60">
                      Sektor {SECTOR_LABELS[s] ?? s + 1}
                    </td>
                    {dateKeys.map((dk) => {
                      const cell = cells[`${dk}|${s}`];
                      return (
                        <td
                          key={`${dk}|${s}`}
                          className="border-b border-border px-3 py-2.5 text-center group-hover:bg-slate-50/60"
                        >
                          {cell ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                                cell.isMe
                                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/20"
                                  : "text-foreground"
                              }`}
                            >
                              {cell.present && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              )}
                              {cell.fullName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* ===== PRESENSI + PEMBERITAHUAN ===== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* My presensi list */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 font-semibold text-foreground">Presensi Piket Saya</h2>
          {myAssignments.length > 0 ? (
            <div className="space-y-2">
              {myAssignments.map((a) => (
                <div
                  key={a.assignmentId}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {fmtDate(a.date, { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sektor {SECTOR_LABELS[a.sector] ?? a.sector + 1}
                    </p>
                  </div>
                  {a.present ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Hadir
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePresensi(a.assignmentId)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Presensi
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Anda tidak memiliki jadwal piket pada periode ini.
            </p>
          )}
        </div>

        {/* Pemberitahuan */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-foreground">Pemberitahuan</h2>
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    {a.pinned && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
      </div>
    </div>
  );
}
