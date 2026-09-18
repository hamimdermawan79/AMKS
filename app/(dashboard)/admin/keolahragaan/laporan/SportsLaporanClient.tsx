'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileDown,
  Trophy,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';

type AttendanceItem = {
  userId: string;
  status: 'HADIR' | 'TIDAK_HADIR' | 'IZIN';
  user: { id: string; fullName: string };
};

type SerializedActivity = {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  location: string | null;
  locationUrl: string | null;
  feeAmount: number;
  fineAmount: number;
  attendance: AttendanceItem[];
};

type SerializedTransaction = {
  id: string;
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string | null;
  amount: number;
  description: string | null;
  occurredAt: string;
  createdBy: { id: string; fullName: string };
};

type Props = {
  activities: SerializedActivity[];
  transactions: SerializedTransaction[];
  selectedMonth: number;
  selectedYear: number;
  endingMonthBalance: number;
  totalBalanceOverall: number;
};

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function SportsLaporanClient({
  activities,
  transactions,
  selectedMonth,
  selectedYear,
  endingMonthBalance,
  totalBalanceOverall,
}: Props) {
  const router = useRouter();
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<SerializedActivity | null>(null);

  // Month navigation
  const handleMonthChange = (month: number, year: number) => {
    let targetMonth = month;
    let targetYear = year;

    if (targetMonth < 1) {
      targetMonth = 12;
      targetYear -= 1;
    } else if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }

    router.push(`/admin/keolahragaan/laporan?month=${targetMonth}&year=${targetYear}`);
  };

  // Format helpers
  const formatRupiah = (val: number) => {
    return `Rp${val.toLocaleString('id-ID')}`;
  };

  const formatDateFull = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculations for transactions
  const totalPemasukan = transactions
    .filter((t) => t.type === 'PEMASUKAN')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === 'PENGELUARAN')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netCashFlow = totalPemasukan - totalPengeluaran;

  // Attendance metrics
  let totalHadirAll = 0;
  let totalTidakHadirAll = 0;
  activities.forEach((act) => {
    act.attendance.forEach((att) => {
      if (att.status === 'HADIR') totalHadirAll++;
      else if (att.status === 'TIDAK_HADIR') totalTidakHadirAll++;
    });
  });

  // Print
  const handlePrint = () => {
    window.print();
  };

  // CSV Export: Activities
  const handleExportActivitiesCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'Kegiatan',
      'Lokasi',
      'Iuran',
      'Denda',
      'Hadir',
      'Tidak Hadir',
      'Izin',
      'Total Peserta',
    ];

    const rows = activities.map((act, idx) => {
      const hadirCount = act.attendance.filter((a) => a.status === 'HADIR').length;
      const tidakHadirCount = act.attendance.filter((a) => a.status === 'TIDAK_HADIR').length;
      const izinCount = act.attendance.filter((a) => a.status === 'IZIN').length;

      return [
        idx + 1,
        formatDateShort(act.date),
        formatTime(act.date),
        `"${act.title.replace(/"/g, '""')}"`,
        `"${(act.location || '').replace(/"/g, '""')}"`,
        act.feeAmount,
        act.fineAmount,
        hadirCount,
        tidakHadirCount,
        izinCount,
        act.attendance.length,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `kegiatan_olahraga_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export: Transactions
  const handleExportKasCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Tipe',
      'Kategori',
      'Keterangan',
      'Nominal',
      'Dicatat Oleh',
    ];

    const rows = transactions.map((tx, idx) => [
      idx + 1,
      formatDateShort(tx.occurredAt),
      tx.type,
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.createdBy.fullName.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `kas_olahraga_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* PRINT-ONLY OFFICIAL LETTERHEAD */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider">
          ASRAMA MAHASISWA KABUPATEN SAMBAS (AMKS)
        </h2>
        <p className="text-xs text-gray-700 mt-0.5">
          Jl. Asrama Sambas, Pontianak · Divisi Keolahragaan &amp; Kebugaran
        </p>
        <div className="mt-4">
          <h3 className="text-base font-bold underline uppercase">
            LAPORAN BULANAN KEGIATAN &amp; KAS DIVISI KEOLAHRAGAAN
          </h3>
          <p className="text-xs font-semibold text-gray-800 mt-1">
            Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
      </div>

      {/* WEB VIEW: TOP NAVIGATION */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/keolahragaan/kelola"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Layanan Admin Olahraga
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-amber-500" />
            Laporan Bulanan Divisi Keolahragaan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rekapitulasi agenda kegiatan olahraga bulanan dan laporan mutasi kas keuangan divisi olahraga.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportActivitiesCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-border text-foreground text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-sm"
            title="Download CSV Kegiatan"
          >
            <FileDown className="h-4 w-4 text-amber-600" /> CSV Kegiatan
          </button>
          <button
            onClick={handleExportKasCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-border text-foreground text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-sm"
            title="Download CSV Kas"
          >
            <FileDown className="h-4 w-4 text-emerald-600" /> CSV Kas
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* MONTH / YEAR PICKER */}
      <div className="print:hidden p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => handleMonthChange(selectedMonth - 1, selectedYear)}
            className="p-2 rounded-xl hover:bg-slate-100 text-foreground border border-border transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bulan Lalu</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value, 10), selectedYear)}
              className="px-3.5 py-2 text-sm font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value, 10))}
              className="px-3.5 py-2 text-sm font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleMonthChange(selectedMonth + 1, selectedYear)}
            className="p-2 rounded-xl hover:bg-slate-100 text-foreground border border-border transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <span className="hidden sm:inline">Bulan Depan</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-600" />
          <span>
            Laporan Keolahragaan Periode: <strong className="text-foreground">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
          </span>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kegiatan Olahraga
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {activities.length} <span className="text-xs font-semibold text-muted-foreground">Agenda</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kas Masuk Bulan Ini
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-600">
              {formatRupiah(totalPemasukan)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kas Keluar Bulan Ini
            </span>
            <span className="text-base sm:text-xl font-black text-rose-600">
              {formatRupiah(totalPengeluaran)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Saldo Kas per Akhir Bulan
            </span>
            <span className={`text-base sm:text-xl font-black ${endingMonthBalance >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
              {formatRupiah(endingMonthBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: KEGIATAN BULAN INI */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              1. Rekapitulasi Kegiatan Olahraga Bulan Ini
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {activities.length} Kegiatan Terjadwal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-48">Tanggal &amp; Waktu</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Kegiatan</th>
                <th className="py-3.5 px-4 min-w-[180px]">Lokasi</th>
                <th className="py-3.5 px-4 min-w-[140px]">Biaya / Iuran</th>
                <th className="py-3.5 px-4 min-w-[160px]">Kehadiran</th>
                <th className="py-3.5 px-4 w-28 text-center print:hidden">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {activities.length > 0 ? (
                activities.map((act, idx) => {
                  const hadirCount = act.attendance.filter((a) => a.status === 'HADIR').length;
                  const tidakHadirCount = act.attendance.filter((a) => a.status === 'TIDAK_HADIR').length;
                  const izinCount = act.attendance.filter((a) => a.status === 'IZIN').length;
                  const totalCount = act.attendance.length;

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <span>{formatDateFull(act.date)}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 ml-5">
                          Pukul {formatTime(act.date)} WIB
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-foreground">
                        {act.title}
                      </td>

                      <td className="py-4 px-4">
                        {act.location ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                            <span className="truncate">{act.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-700">
                            Iuran: <strong>{formatRupiah(act.feeAmount)}</strong>
                          </div>
                          {act.fineAmount > 0 && (
                            <div className="text-[10px] text-rose-600 font-semibold">
                              Denda: {formatRupiah(act.fineAmount)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {hadirCount} Hadir
                          </span>
                          {tidakHadirCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              {tidakHadirCount} Absen
                            </span>
                          )}
                          {izinCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {izinCount} Izin
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center print:hidden">
                        <button
                          onClick={() => setSelectedActivityDetail(act)}
                          className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Lihat Peserta
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada kegiatan olahraga pada bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: KAS OLAHRAGA BULAN INI */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              2. Rekapitulasi Mutasi Kas Olahraga Bulan Ini
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {transactions.length} Transaksi Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-36">Tanggal</th>
                <th className="py-3.5 px-4 w-28">Tipe</th>
                <th className="py-3.5 px-4 min-w-[150px]">Kategori</th>
                <th className="py-3.5 px-4 min-w-[220px]">Keterangan</th>
                <th className="py-3.5 px-4 min-w-[140px] text-right">Nominal</th>
                <th className="py-3.5 px-4 min-w-[140px]">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.length > 0 ? (
                transactions.map((tx, idx) => {
                  const isPemasukan = tx.type === 'PEMASUKAN';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {formatDateShort(tx.occurredAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPemasukan
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPemasukan ? '+' : '-'} {tx.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {tx.category || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {tx.description || '—'}
                      </td>

                      <td
                        className={`py-3.5 px-4 font-bold text-right ${
                          isPemasukan ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPemasukan ? '+' : '-'} {formatRupiah(tx.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {tx.createdBy.fullName}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada transaksi kas olahraga pada bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CASH FLOW FOOTER SUMMARY */}
        <div className="p-5 bg-slate-50/80 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground">Ringkasan Arus Kas Bulan Ini:</span>
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-semibold">
              <span className="text-emerald-700">
                Pemasukan: {formatRupiah(totalPemasukan)}
              </span>
              <span className="text-rose-700">
                Pengeluaran: {formatRupiah(totalPengeluaran)}
              </span>
              <span className={netCashFlow >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                Surplus/Defisit: {netCashFlow >= 0 ? '+' : ''}{formatRupiah(netCashFlow)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-border rounded-2xl shadow-sm text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Saldo Akhir Kas Olahraga
            </span>
            <span className="text-base font-black text-foreground">
              {formatRupiah(endingMonthBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE BLOCK */}
      <div className="hidden print:block mt-12 pt-8 border-t border-gray-300 text-xs">
        <div className="flex justify-between items-start px-8">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold mt-0.5">Pengurus Divisi Keolahragaan</p>
            <div className="h-20" />
            <p className="font-bold underline">( ................................................. )</p>
            <p className="text-[10px] text-gray-600">Koordinator Divisi Keolahragaan</p>
          </div>

          <div className="text-center w-64">
            <p>Pontianak, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold mt-0.5">Ketua Asrama AMKS</p>
            <div className="h-20" />
            <p className="font-bold underline">( ................................................. )</p>
            <p className="text-[10px] text-gray-600">Ketua Asrama AMKS</p>
          </div>
        </div>
      </div>

      {/* ATTENDANCE DETAIL MODAL */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-border flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-border bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedActivityDetail.title}</h3>
                <p className="text-xs text-white/80">{formatDateFull(selectedActivityDetail.date)}</p>
              </div>
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block">
                Daftar Presensi Peserta ({selectedActivityDetail.attendance.length} Warga)
              </span>

              <div className="divide-y divide-border/60 border border-border rounded-2xl overflow-hidden">
                {selectedActivityDetail.attendance.length > 0 ? (
                  selectedActivityDetail.attendance.map((att, i) => (
                    <div
                      key={att.userId}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50"
                    >
                      <span className="font-semibold text-foreground">
                        {i + 1}. {att.user.fullName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'HADIR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'TIDAK_HADIR'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground">Belum ada absensi peserta.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
