"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  Coins,
  FileDown,
  Image as ImageIcon,
  Lock,
  Printer,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { recordFinePayment, closePeriodAction } from "../actions";

/* ─── Types (mirror page.tsx) ─── */
type Period = {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  finePerDay: number;
};
type SelectedPeriod = Period & { peoplePerDay: number };
type DaySector = {
  sector: number;
  sectorLabel: string;
  userId: string;
  fullName: string;
  status: "piket" | "tidakPiket" | "pending";
  complaint: string | null;
  photoUrl: string | null;
};
type DayReport = { date: string; isKerjaBakti: boolean; sectors: DaySector[] };
type PersonStat = {
  userId: string;
  fullName: string;
  piket: number;
  tidakPiket: number;
  pending: number;
  estimasiDenda: number;
};
type Payment = { id: string; amount: number; note: string | null; paidAt: string };
type FineDetail = {
  fineId: string;
  periodStart: string;
  periodEnd: string;
  daysMissed: number;
  amount: number;
  paid: number;
  remaining: number;
  payments: Payment[];
};
type UserDenda = {
  userId: string;
  fullName: string;
  totalFined: number;
  totalPaid: number;
  remaining: number;
  fines: FineDetail[];
};
type Props = {
  periods: Period[];
  selectedPeriod: SelectedPeriod | null;
  dayReport: DayReport[];
  personStats: PersonStat[];
  dendaAllTime: UserDenda[];
  totals: {
    totalFinedAllTime: number;
    totalPaidAllTime: number;
    totalUnpaidAllTime: number;
  };
};

/* ─── Helpers ─── */
function rupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString(
    "id-ID",
    opts ?? { day: "numeric", month: "short", year: "numeric" }
  );
}
function fmtDayFull(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { weekday: "long" })}, ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}
function shortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && parts[0].toLowerCase() === "muhammad") return parts[1];
  return parts[0];
}

export default function LaporanClient({
  periods,
  selectedPeriod,
  dayReport,
  personStats,
  dendaAllTime,
  totals,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const reportRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState("");
  const [photoView, setPhotoView] = useState<{ url: string; name: string } | null>(null);
  const [payTarget, setPayTarget] = useState<{ fine: FineDetail; userName: string } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [printing, setPrinting] = useState(false);

  const onSelectPeriod = (id: string) => {
    router.push(`/admin/kebersihan/laporan?period=${id}`);
  };

  const handleClosePeriod = () => {
    if (!selectedPeriod) return;
    setError("");
    startTransition(async () => {
      try {
        await closePeriodAction(selectedPeriod.id);
        setConfirmClose(false);
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Gagal menutup periode");
      }
    });
  };

  const openPay = (fine: FineDetail, userName: string) => {
    const remaining = Math.max(0, fine.remaining);
    if (remaining <= 0) return;
    setPayTarget({ fine: { ...fine, remaining }, userName });
    setPayAmount(String(remaining));
    setPayNote("");
    setPayError("");
  };

  const handlePay = () => {
    if (!payTarget) return;
    const amount = Number(payAmount);
    setPayError("");
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError("Nominal pembayaran tidak valid");
      return;
    }
    if (amount > payTarget.fine.remaining) {
      setPayError(`Maksimal ${rupiah(payTarget.fine.remaining)} (sisa denda)`);
      return;
    }
    startTransition(async () => {
      try {
        await recordFinePayment({
          fineId: payTarget.fine.fineId,
          amount,
          note: payNote.trim() || undefined,
        });
        setPayTarget(null);
        router.refresh();
      } catch (e: any) {
        setPayError(e?.message ?? "Gagal mencatat pembayaran");
      }
    });
  };

  const handlePrint = async () => {
    if (!reportRef.current) return;
    setPrinting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      const label = selectedPeriod
        ? `${fmtDate(selectedPeriod.startDate)}_${fmtDate(selectedPeriod.endDate)}`
        : "kebersihan";
      pdf.save(`Laporan_Piket_${label}.pdf`.replace(/\s+/g, ""));
    } catch (e: any) {
      setError("Gagal membuat PDF: " + (e?.message ?? "tidak diketahui"));
    } finally {
      setPrinting(false);
    }
  };

  const chartData = useMemo(
    () =>
      personStats.map((p) => ({
        name: shortName(p.fullName),
        Piket: p.piket,
        "Tidak Piket": p.tidakPiket,
      })),
    [personStats]
  );

  const periodSummary = useMemo(() => {
    let piket = 0,
      tidakPiket = 0,
      pending = 0;
    for (const p of personStats) {
      piket += p.piket;
      tidakPiket += p.tidakPiket;
      pending += p.pending;
    }
    return { piket, tidakPiket, pending };
  }, [personStats]);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/admin/kebersihan"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke tampilan divisi
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Laporan & Denda Piket
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performa piket per periode, rekap keluhan, dan denda warga sepanjang masa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {printing ? <FileDown className="h-4 w-4 animate-pulse" /> : <Printer className="h-4 w-4" />}
            {printing ? "Menyusun PDF..." : "Cetak Presentasi"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PERIOD SELECTOR */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <CalendarRange className="h-4 w-4" /> Periode:
        </span>
        {periods.length > 0 ? (
          <select
            value={selectedPeriod?.id ?? ""}
            onChange={(e) => onSelectPeriod(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                {p.isActive ? " (aktif)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-muted-foreground">Belum ada periode piket.</span>
        )}
        {selectedPeriod?.isActive && (
          <div className="ml-auto">
            {!confirmClose ? (
              <button
                onClick={() => setConfirmClose(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" /> Tutup Periode & Finalisasi Denda
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                <span className="text-xs text-amber-800">
                  Terbitkan denda final & nonaktifkan periode?
                </span>
                <button
                  onClick={handleClosePeriod}
                  disabled={isPending}
                  className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {isPending ? "Memproses..." : "Ya, Tutup"}
                </button>
                <button
                  onClick={() => setConfirmClose(false)}
                  disabled={isPending}
                  className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRINTABLE REPORT REGION */}
      <div ref={reportRef} className="space-y-8 bg-white">
        {/* Report title for the PDF */}
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-bold text-foreground">
            Laporan Performa Piket Kebersihan
          </h2>
          {selectedPeriod && (
            <p className="text-sm text-muted-foreground">
              Periode {fmtDate(selectedPeriod.startDate)} – {fmtDate(selectedPeriod.endDate)} ·
              Tarif denda {rupiah(selectedPeriod.finePerDay)}/hari ·{" "}
              {selectedPeriod.isActive ? "Berjalan" : "Sudah ditutup"}
            </p>
          )}
        </div>

        {/* GLOBAL TOTALS */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            tone="slate"
            icon={<Coins className="h-4 w-4" />}
            label="Total Denda Sepanjang Masa"
            value={rupiah(totals.totalFinedAllTime)}
          />
          <StatCard
            tone="emerald"
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Total Terbayar"
            value={rupiah(totals.totalPaidAllTime)}
          />
          <StatCard
            tone="red"
            icon={<Wallet className="h-4 w-4" />}
            label="Belum Terbayar (Sepanjang Masa)"
            value={rupiah(totals.totalUnpaidAllTime)}
          />
        </div>

        {/* PER-PERSON STATISTICS + CHART */}
        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-foreground">
            Statistik Piket per Warga (periode terpilih)
          </h3>
          <p className="mb-5 text-xs text-muted-foreground">
            Piket {periodSummary.piket} · Tidak piket {periodSummary.tidakPiket} · Belum{" "}
            {periodSummary.pending}. Superadmin dikecualikan dari statistik.
          </p>

          {personStats.length > 0 ? (
            <>
              <div className="mb-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Piket" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tidak Piket" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Warga</th>
                      <th className="px-3 py-2 text-center">Piket</th>
                      <th className="px-3 py-2 text-center">Tidak Piket</th>
                      <th className="px-3 py-2 text-center">Belum</th>
                      <th className="px-3 py-2 text-right">Estimasi Denda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personStats.map((p) => (
                      <tr key={p.userId} className="border-b border-border/60">
                        <td className="px-3 py-2 font-medium text-foreground">{p.fullName}</td>
                        <td className="px-3 py-2 text-center text-emerald-700">{p.piket}</td>
                        <td className="px-3 py-2 text-center text-red-600">{p.tidakPiket}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{p.pending}</td>
                        <td className="px-3 py-2 text-right font-medium text-amber-700">
                          {rupiah(p.estimasiDenda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tidak ada data penugasan pada periode ini.
            </p>
          )}
        </section>

        {/* PER-DAY REPORT */}
        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-foreground">Rekap Harian</h3>
          <p className="mb-5 text-xs text-muted-foreground">
            Siapa piket / tidak piket per hari beserta keluhan dan bukti foto.
          </p>
          {dayReport.length > 0 ? (
            <div className="space-y-4">
              {dayReport.map((day) => (
                <div key={day.date} className="rounded-xl border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-slate-50 px-4 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{fmtDayFull(day.date)}</p>
                    {day.isKerjaBakti && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                        Kerja Bakti
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-border/60">
                    {day.sectors.map((s) => (
                      <div
                        key={`${day.date}-${s.sector}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                      >
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-bold text-muted-foreground">
                          {s.sectorLabel}
                        </span>
                        <span className="min-w-[140px] flex-1 text-sm font-medium text-foreground">
                          {s.fullName}
                        </span>
                        {s.status === "piket" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Piket
                          </span>
                        ) : s.status === "tidakPiket" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            <XCircle className="h-3 w-3" /> Tidak Piket
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            Belum
                          </span>
                        )}
                        {s.complaint && (
                          <span className="min-w-[160px] flex-1 text-xs italic text-muted-foreground">
                            “{s.complaint}”
                          </span>
                        )}
                        {s.photoUrl && (
                          <button
                            onClick={() =>
                              setPhotoView({ url: s.photoUrl!, name: s.fullName })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-blue-50"
                          >
                            <ImageIcon className="h-3 w-3" /> Lihat Foto
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data piket pada periode ini.</p>
          )}
        </section>

        {/* ALL-TIME DENDA PER USER */}
        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-foreground">Denda per Warga (Sepanjang Masa)</h3>
          <p className="mb-5 text-xs text-muted-foreground">
            Akumulasi denda final dari seluruh periode. Sinkron otomatis dengan Keuangan — jika dibayar di Keuangan, status di sini ikut berubah. Tidak hilang saat jadwal baru dibuat.
          </p>
          {dendaAllTime.length > 0 ? (
            <div className="space-y-3">
              {dendaAllTime.map((u) => (
                <div key={u.userId} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{u.fullName}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">
                        Total: <b className="text-foreground">{rupiah(u.totalFined)}</b>
                      </span>
                      <span className="text-emerald-700">Bayar: {rupiah(u.totalPaid)}</span>
                      <span className={u.remaining > 0 ? "text-red-600" : "text-emerald-700"}>
                        Sisa: <b>{rupiah(u.remaining)}</b>
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {u.fines.map((f) => (
                      <div
                        key={f.fineId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground">
                          {fmtDate(f.periodStart)}–{fmtDate(f.periodEnd)} · {f.daysMissed} hari ·{" "}
                          {rupiah(f.amount)}
                          {f.paid > 0 && (
                            <span className="ml-1 text-emerald-700">
                              (dibayar {rupiah(f.paid)})
                            </span>
                          )}
                        </span>
                        {f.remaining > 0 ? (
                          <button
                            onClick={() => openPay(f, u.fullName)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                          >
                            <Coins className="h-3 w-3" /> Cicil / Bayar
                          </button>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Lunas ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700 mt-0.5">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Belum Ada Denda yang Diterbitkan</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Denda piket hanya diterbitkan saat <b>periode ditutup</b>. Setelah periode ditutup, sistem akan menghitung semua warga yang tidak piket, lalu otomatis membuat tagihan Denda Piket di modul <b>Keuangan</b> dan menampilkan detailnya di sini.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    💡 Klik tombol <b>"Tutup Periode & Finalisasi Denda"</b> di atas untuk memulai proses.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* PHOTO VIEWER MODAL */}
      {photoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPhotoView(null)} />
          <div className="relative z-10 max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Bukti Piket — {photoView.name}</p>
              <button
                onClick={() => setPhotoView(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoView.url}
              alt={`Bukti piket ${photoView.name}`}
              className="max-h-[75vh] w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setPayTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Cicil / Bayar Denda</h3>
              </div>
              <button
                onClick={() => !isPending && setPayTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{payTarget.userName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Denda {rupiah(payTarget.fine.amount)} · Terbayar{" "}
                  {rupiah(payTarget.fine.paid)} · Sisa{" "}
                  <b className="text-red-600">{rupiah(payTarget.fine.remaining)}</b>
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  max={payTarget.fine.remaining}
                  step={1000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="mis. cicilan ke-1"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              {payError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {payError}
                </p>
              )}
              {payTarget.fine.payments.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Riwayat Pembayaran</p>
                  <div className="space-y-1">
                    {payTarget.fine.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {fmtDate(p.paidAt)}
                          {p.note ? ` · ${p.note}` : ""}
                        </span>
                        <span className="font-medium text-emerald-700">{rupiah(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => !isPending && setPayTarget(null)}
                disabled={isPending}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={handlePay}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                <Coins className="h-4 w-4" />
                {isPending ? "Menyimpan..." : "Catat Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
}: {
  tone: "slate" | "emerald" | "red";
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    red: "border-red-100 bg-red-50/60 text-red-700",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium">
        {icon} {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
