'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileDown,
  Plus,
  BookOpen,
  UserCheck,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Users,
} from 'lucide-react';
import EditTadarusModal from '../EditTadarusModal';
import {
  updateRohaniAdditionalActivities,
  createManualRohaniActivity,
  deleteRohaniSchedule
} from '../actions';
import { QURAN_SURAHS, getSurah, searchSurahs } from '@/lib/rohani/quran';

type SerializedRohaniSchedule = {
  id: string;
  date: string;
  startVerse: number;
  endVerse: number;
  currentSurah: string;
  additionalActivities?: string | null;
  imamMaghrib: { id: string; fullName: string };
  imamIsha: { id: string; fullName: string };
  kultumBy: { id: string; fullName: string };
  cadanganImam: { id: string; fullName: string } | null;
  cadanganKultum: { id: string; fullName: string } | null;
};

type ActiveUser = {
  id: string;
  fullName: string;
};

type Props = {
  schedules: SerializedRohaniSchedule[];
  activeUsers: ActiveUser[];
  selectedMonth: number;
  selectedYear: number;
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

export default function RohaniLaporanClient({
  schedules,
  activeUsers,
  selectedMonth,
  selectedYear,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit Tadarus & Surah Modal state
  const [editTadarusSchedule, setEditTadarusSchedule] = useState<SerializedRohaniSchedule | null>(null);

  // Quick edit for "Tambahan Kegiatan" (isi manual)
  const [editActivitiesModal, setEditActivitiesModal] = useState<{
    scheduleId: string;
    dateStr: string;
    currentText: string;
  } | null>(null);
  const [activitiesInput, setActivitiesInput] = useState('');

  // Add manual activity modal state
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualMaghribId, setManualMaghribId] = useState('');
  const [manualIshaId, setManualIshaId] = useState('');
  const [manualKultumId, setManualKultumId] = useState('');
  const [manualSurah, setManualSurah] = useState('Al-Baqarah');
  const [manualStartVerse, setManualStartVerse] = useState(1);
  const [manualEndVerse, setManualEndVerse] = useState(15);
  const [manualActivities, setManualActivities] = useState('');
  const [manualError, setManualError] = useState('');
  const [surahSearchQuery, setSurahSearchQuery] = useState('');

  // Navigate month
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

    router.push(`/admin/rohani/laporan?month=${targetMonth}&year=${targetYear}`);
  };

  // Format date helper
  const formatDateFull = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal Pelaksanaan',
      'Imam Maghrib',
      'Imam Isya',
      'Kultum',
      'Surah Tadarus',
      'Ayat Mulai',
      'Ayat Sampai',
      'Total Ayat',
      'Tambahan Kegiatan (Manual)',
    ];

    const rows = schedules.map((s, idx) => [
      idx + 1,
      formatDateShort(s.date),
      `"${s.imamMaghrib.fullName}"`,
      `"${s.imamIsha.fullName}"`,
      `"${s.kultumBy.fullName}"`,
      `"${s.currentSurah}"`,
      s.startVerse,
      s.endVerse,
      s.endVerse - s.startVerse + 1,
      `"${(s.additionalActivities || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `laporan_rohani_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save additional manual activities
  const handleSaveActivities = () => {
    if (!editActivitiesModal) return;
    startTransition(async () => {
      try {
        await updateRohaniAdditionalActivities(
          editActivitiesModal.scheduleId,
          activitiesInput
        );
        setEditActivitiesModal(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Gagal menyimpan kegiatan tambahan');
      }
    });
  };

  // Delete activity
  const handleDeleteSchedule = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data kegiatan ibadah ini?')) return;
    startTransition(async () => {
      try {
        await deleteRohaniSchedule(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus jadwal');
      }
    });
  };

  // Create manual activity submit
  const handleCreateManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    if (!manualDate) {
      setManualError('Tanggal pelaksanaan harus diisi.');
      return;
    }
    if (!manualMaghribId || !manualIshaId || !manualKultumId) {
      setManualError('Petugas Imam Maghrib, Imam Isya, dan Kultum wajib dipilih.');
      return;
    }

    startTransition(async () => {
      try {
        await createManualRohaniActivity({
          date: manualDate,
          imamMaghribId: manualMaghribId,
          imamIshaId: manualIshaId,
          kultumById: manualKultumId,
          currentSurah: manualSurah,
          startVerse: manualStartVerse,
          endVerse: manualEndVerse,
          additionalActivities: manualActivities,
        });
        setShowAddManualModal(false);
        // reset form
        setManualActivities('');
        router.refresh();
      } catch (err: any) {
        setManualError(err.message || 'Gagal menambahkan kegiatan');
      }
    });
  };

  // Calculate statistics
  const totalMeetings = schedules.length;
  const totalVerses = schedules.reduce(
    (acc, curr) => acc + (curr.endVerse - curr.startVerse + 1),
    0
  );
  const officersSet = new Set<string>();
  schedules.forEach((s) => {
    officersSet.add(s.imamMaghrib.id);
    officersSet.add(s.imamIsha.id);
    officersSet.add(s.kultumBy.id);
  });
  const totalUniqueOfficers = officersSet.size;
  const totalWithNotes = schedules.filter((s) => s.additionalActivities?.trim()).length;

  const filteredSurahs = searchSurahs(surahSearchQuery);

  return (
    <div className="space-y-6">
      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider">
          ASRAMA MAHASISWA KABUPATEN SAMBAS (AMKS)
        </h2>
        <p className="text-xs text-gray-700 mt-0.5">
          Jl. Asrama Sambas, Pontianak · Divisi Kerohanian &amp; Keagamaan
        </p>
        <div className="mt-4">
          <h3 className="text-base font-bold underline uppercase">
            LAPORAN BULANAN KEGIATAN IBADAH &amp; TADARUS AL-QUR'AN
          </h3>
          <p className="text-xs font-semibold text-gray-800 mt-1">
            Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
      </div>

      {/* WEB VIEW: TOP NAVIGATION & ACTION BAR */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/rohani"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Rohani
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-emerald-600" />
            Laporan Bulanan Divisi Rohani
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rekapitulasi pelaksanaan sholat berjamaah, imam Maghrib &amp; Isya, target tadarus Al-Qur'an, dan kegiatan tambahan.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              // Pre-fill date with current selected month/year
              const padMonth = String(selectedMonth).padStart(2, '0');
              setManualDate(`${selectedYear}-${padMonth}-15T18:00`);
              setShowAddManualModal(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="h-4 w-4" /> Tambah Kegiatan Manual
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-border text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
            title="Download CSV"
          >
            <FileDown className="h-4 w-4 text-emerald-600" /> Unduh CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* MONTH / YEAR PICKER CONTROLLER */}
      <div className="print:hidden p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous / Next buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => handleMonthChange(selectedMonth - 1, selectedYear)}
            className="p-2 rounded-xl hover:bg-slate-100 text-foreground border border-border transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bulan Lalu</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value, 10), selectedYear)}
              className="px-3.5 py-2 text-sm font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              className="px-3.5 py-2 text-sm font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            title="Bulan Berikutnya"
          >
            <span className="hidden sm:inline">Bulan Depan</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Current status display */}
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span>
            Menampilkan laporan periode: <strong className="text-foreground">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
          </span>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kegiatan Ibadah
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {totalMeetings} <span className="text-xs font-semibold text-muted-foreground">Kali</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-100 text-teal-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Ayat Ditadaruskan
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {totalVerses} <span className="text-xs font-semibold text-muted-foreground">Ayat</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-100 text-sky-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Petugas Bertugas
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {totalUniqueOfficers} <span className="text-xs font-semibold text-muted-foreground">Warga</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-card border border-border rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kegiatan Tambahan
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {totalWithNotes} <span className="text-xs font-semibold text-muted-foreground">Tercatat</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ACTIVITIES TABLE */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-emerald-600/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              Rincian Kegiatan Ibadah &amp; Sholat Berjamaah Bulanan
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {schedules.length} Catatan Kegiatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-48">Tanggal Pelaksanaan</th>
                <th className="py-3.5 px-4 min-w-[200px]">Sholat Berjamaah &amp; Petugas</th>
                <th className="py-3.5 px-4 min-w-[180px]">Tadarus Al-Qur'an</th>
                <th className="py-3.5 px-4 min-w-[240px]">Tambahan Kegiatan (Isi Manual)</th>
                <th className="py-3.5 px-4 w-24 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {schedules.length > 0 ? (
                schedules.map((schedule, idx) => {
                  const verseCount = schedule.endVerse - schedule.startVerse + 1;
                  return (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center font-bold text-muted-foreground">
                        {idx + 1}
                      </td>

                      {/* Tanggal Pelaksanaan */}
                      <td className="py-4 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{formatDateFull(schedule.date)}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 ml-5">
                          Kamis Malam / Ba'da Maghrib &amp; Isya
                        </span>
                      </td>

                      {/* Sholat Berjamaah & Petugas */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Maghrib
                            </span>
                            <span className="font-semibold text-foreground">
                              {schedule.imamMaghrib.fullName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                              Isya
                            </span>
                            <span className="font-semibold text-foreground">
                              {schedule.imamIsha.fullName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                              Kultum
                            </span>
                            <span className="text-muted-foreground">
                              {schedule.kultumBy.fullName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tadarus Al-Qur'an */}
                      <td className="py-4 px-4">
                        <div className="bg-emerald-50/80 border border-emerald-200/60 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-emerald-950 text-xs">
                              QS. {schedule.currentSurah}
                            </span>
                            <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {verseCount} Ayat
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Ayat {schedule.startVerse} s/d {schedule.endVerse}
                          </p>
                          <div className="print:hidden pt-1">
                            <button
                              onClick={() => setEditTadarusSchedule(schedule)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <Edit2 className="h-2.5 w-2.5" /> Ubah Target Surah
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Tambahan Kegiatan (Isi Manual) */}
                      <td className="py-4 px-4">
                        <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border/80 bg-slate-50/50 min-h-[52px]">
                          <div className="flex-1">
                            {schedule.additionalActivities?.trim() ? (
                              <p className="text-xs text-foreground font-medium whitespace-pre-line">
                                {schedule.additionalActivities}
                              </p>
                            ) : (
                              <span className="text-muted-foreground/60 italic text-[11px]">
                                — Tidak ada kegiatan tambahan —
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditActivitiesModal({
                                scheduleId: schedule.id,
                                dateStr: formatDateShort(schedule.date),
                                currentText: schedule.additionalActivities || '',
                              });
                              setActivitiesInput(schedule.additionalActivities || '');
                            }}
                            className="print:hidden flex-shrink-0 p-1 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Tambahan Kegiatan Manual"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditTadarusSchedule(schedule)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit Jadwal & Surah"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada data kegiatan ibadah pada bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klik tombol "+ Tambah Kegiatan Manual" atau buka halaman utama Rohani untuk menggenerasi jadwal.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE BLOCK */}
      <div className="hidden print:block mt-12 pt-8 border-t border-gray-300 text-xs">
        <div className="flex justify-between items-start px-8">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold mt-0.5">Pengurus Divisi Kerohanian</p>
            <div className="h-20" />
            <p className="font-bold underline">( ................................................. )</p>
            <p className="text-[10px] text-gray-600">Koordinator Divisi Rohani</p>
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

      {/* QUICK MODAL: EDIT TAMBAHAN KEGIATAN (ISI MANUAL) */}
      {editActivitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-foreground">Isi Tambahan Kegiatan Manual</h3>
              </div>
              <button
                onClick={() => setEditActivitiesModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Kegiatan tanggal: <strong>{editActivitiesModal.dateStr}</strong>. Masukkan agenda tambahan seperti kajian khusus, doa bersama, atau evaluasi tajwid.
            </p>

            <textarea
              rows={4}
              value={activitiesInput}
              onChange={(e) => setActivitiesInput(e.target.value)}
              placeholder="Tuliskan detail tambahan kegiatan di sini..."
              className="w-full p-3 text-xs border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditActivitiesModal(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveActivities}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-60"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TADARUS SURAH & AYAT */}
      {editTadarusSchedule && (
        <EditTadarusModal
          isOpen={!!editTadarusSchedule}
          onClose={() => setEditTadarusSchedule(null)}
          scheduleId={editTadarusSchedule.id}
          initialSurah={editTadarusSchedule.currentSurah}
          initialStartVerse={editTadarusSchedule.startVerse}
          initialEndVerse={editTadarusSchedule.endVerse}
          initialAdditionalActivities={editTadarusSchedule.additionalActivities}
          onSuccess={() => {
            setEditTadarusSchedule(null);
            router.refresh();
          }}
        />
      )}

      {/* MODAL: TAMBAH KEGIATAN MANUAL */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-border flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Tambah Kegiatan Ibadah Manual</h3>
                  <p className="text-xs text-white/80">Catat agenda ibadah khusus di bulan ini</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddManualModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {manualError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{manualError}</span>
                </div>
              )}

              {/* Tanggal & Waktu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Tanggal &amp; Waktu Pelaksanaan
                </label>
                <input
                  type="datetime-local"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
                  required
                />
              </div>

              {/* Petugas Sholat Berjamaah */}
              <div className="space-y-3 pt-2 border-t border-border">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Petugas Sholat &amp; Kultum
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Imam Maghrib:
                    </label>
                    <select
                      value={manualMaghribId}
                      onChange={(e) => setManualMaghribId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                      required
                    >
                      <option value="">-- Pilih Warga --</option>
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Imam Isya:
                    </label>
                    <select
                      value={manualIshaId}
                      onChange={(e) => setManualIshaId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                      required
                    >
                      <option value="">-- Pilih Warga --</option>
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Pembawa Kultum:
                    </label>
                    <select
                      value={manualKultumId}
                      onChange={(e) => setManualKultumId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                      required
                    >
                      <option value="">-- Pilih Warga --</option>
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Surah & Ayat Tadarus */}
              <div className="space-y-3 pt-2 border-t border-border">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Tadarus Al-Qur'an
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Pilih Surah:
                  </label>
                  <select
                    value={manualSurah}
                    onChange={(e) => {
                      const sName = e.target.value;
                      setManualSurah(sName);
                      const sObj = getSurah(sName);
                      if (sObj) {
                        setManualStartVerse(1);
                        setManualEndVerse(Math.min(15, sObj.verses));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                  >
                    {QURAN_SURAHS.map((s) => (
                      <option key={s.number} value={s.name}>
                        {s.number}. {s.name} ({s.verses} Ayat)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Ayat Mulai:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={manualStartVerse}
                      onChange={(e) => setManualStartVerse(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Ayat Sampai:
                    </label>
                    <input
                      type="number"
                      min={manualStartVerse}
                      value={manualEndVerse}
                      onChange={(e) => setManualEndVerse(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tambahan Kegiatan (Isi Manual) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tambahan Kegiatan (Isi Manual)
                </label>
                <textarea
                  rows={2}
                  value={manualActivities}
                  onChange={(e) => setManualActivities(e.target.value)}
                  placeholder="Contoh: Pengajian kitab Fiqih Sunnah, Doa Bersama menjelang wisuda..."
                  className="w-full p-2.5 text-xs border border-border rounded-xl bg-background"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md disabled:opacity-60"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
