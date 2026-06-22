'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  createSportsActivity, 
  deleteSportsActivity, 
  saveSportsAttendance, 
  addSportsTransaction,
  deleteSportsTransaction 
} from './actions';

type Warga = {
  id: string;
  fullName: string;
  username: string;
};

type SportsActivityType = {
  id: string;
  title: string;
  date: Date;
  feeAmount: number;
  fineAmount: number;
  attendance: {
    userId: string;
    status: 'HADIR' | 'TIDAK_HADIR' | 'IZIN';
  }[];
};

type TransactionType = {
  id: string;
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string | null;
  amount: number;
  description: string | null;
  occurredAt: Date;
};

type Props = {
  wargaList: Warga[];
  activities: SportsActivityType[];
  transactions: TransactionType[];
  dendaList: {
    id: string;
    title: string;
    amount: number;
    status: 'BELUM_LUNAS' | 'LUNAS' | 'DIBATALKAN';
    createdAt: Date;
    note: string | null;
    user: {
      fullName: string;
      username: string;
    };
  }[];
  isAdmin: boolean;
  isKelolaMode?: boolean;
};

export default function SportsManager({ wargaList, activities, transactions, dendaList, isAdmin, isKelolaMode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'kegiatan' | 'kas' | 'denda'>('kegiatan');
  
  // Modals / Form states
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [selectedActivityForAttendance, setSelectedActivityForAttendance] = useState<SportsActivityType | null>(null);
  
  // Add activity form values
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actEndDate, setActEndDate] = useState('');
  const [actFee, setActFee] = useState(5000);
  const [actFine, setActFine] = useState(5000);
  
  // Add transaction form values
  const [txType, setTxType] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PENGELUARAN');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState(0);
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState('');

  // Attendance state inside modal
  const [tempAttendance, setTempAttendance] = useState<Record<string, 'HADIR' | 'TIDAK_HADIR'>>({});

  const [errorMsg, setErrorMsg] = useState('');

  // Financial calculations
  const totalPemasukan = transactions
    .filter(t => t.type === 'PEMASUKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter(t => t.type === 'PENGELUARAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    startTransition(async () => {
      try {
        // Extract start time & end time for display inside title
        const startDt = new Date(actDate);
        const endDt = new Date(actEndDate);
        
        const startTimeStr = startDt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endDt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const formattedTitle = `${actTitle} (${startTimeStr} - ${endTimeStr})`;

        await createSportsActivity({
          title: formattedTitle,
          date: actDate,
          feeAmount: Number(actFee),
          fineAmount: Number(actFine),
        });
        setShowAddActivity(false);
        setActTitle('');
        setActDate('');
        setActEndDate('');
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal membuat kegiatan');
      }
    });
  };

  const handleDeleteActivity = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini? Semua tagihan iuran/denda yang belum lunas terkait kegiatan ini juga akan dihapus.')) return;
    startTransition(async () => {
      try {
        await deleteSportsActivity(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleOpenAttendance = (act: SportsActivityType) => {
    setSelectedActivityForAttendance(act);
    const initialAttendance: Record<string, 'HADIR' | 'TIDAK_HADIR'> = {};
    wargaList.forEach(w => {
      const match = act.attendance.find(a => a.userId === w.id);
      initialAttendance[w.id] = (match?.status as 'HADIR' | 'TIDAK_HADIR') || 'HADIR';
    });
    setTempAttendance(initialAttendance);
  };

  const handleSaveAttendance = () => {
    if (!selectedActivityForAttendance) return;
    setErrorMsg('');
    const attendanceArray = Object.entries(tempAttendance).map(([userId, status]) => ({
      userId,
      status: status as any
    }));

    startTransition(async () => {
      try {
        await saveSportsAttendance(selectedActivityForAttendance.id, attendanceArray);
        setSelectedActivityForAttendance(null);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menyimpan absensi');
      }
    });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    startTransition(async () => {
      try {
        await addSportsTransaction({
          type: txType,
          category: txCategory,
          amount: Number(txAmount),
          description: txDesc,
          occurredAt: txDate,
        });
        setShowAddTx(false);
        setTxCategory('');
        setTxAmount(0);
        setTxDesc('');
        setTxDate('');
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menambahkan transaksi');
      }
    });
  };

  const handleDeleteTx = (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    startTransition(async () => {
      try {
        await deleteSportsTransaction(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500" />
            Divisi Keolahragaan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manajemen kegiatan olahraga mingguan, iuran & denda olahraga, serta pengelolaan uang kas mandiri.
          </p>
        </div>
        {isAdmin && !isKelolaMode && (
          <Link
            href="/admin/keolahragaan/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-600 shadow-sm transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Layanan Admin Keolahragaan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('kegiatan')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'kegiatan'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kegiatan & Absensi
          </span>
        </button>
        <button
          onClick={() => setActiveTab('kas')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'kas'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Kas Olahraga
          </span>
        </button>
        <button
          onClick={() => setActiveTab('denda')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'denda'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Daftar Denda
          </span>
        </button>
      </div>

      {/* TAB CONTENT: KEGIATAN & ABSENSI */}
      {activeTab === 'kegiatan' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Daftar Kegiatan Olahraga</h2>
            {isKelolaMode && (
              <button
                onClick={() => setShowAddActivity(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" /> Buat Kegiatan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => {
              const presentCount = act.attendance.filter(a => a.status === 'HADIR').length;
              const absentCount = wargaList.length - presentCount;
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base leading-tight">{act.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        {new Date(act.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {isKelolaMode && (
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="text-muted-foreground hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-muted-foreground block">Iuran Hadir</span>
                      <span className="font-semibold text-emerald-600">Rp{act.feeAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Denda Absen</span>
                      <span className="font-semibold text-rose-600">Rp{act.fineAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {act.attendance.length > 0 ? (
                        <span>Hadir: <b>{presentCount}</b> · Absen: <b>{absentCount}</b></span>
                      ) : (
                        <span className="text-rose-500 font-medium">Absensi Belum Diisi</span>
                      )}
                    </span>
                    {isKelolaMode && (
                      <button
                        onClick={() => handleOpenAttendance(act)}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {act.attendance.length > 0 ? 'Edit Absensi' : 'Isi Absensi'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {activities.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border bg-slate-50/50">
                <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Belum ada kegiatan olahraga dijadwalkan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: KAS OLAHRAGA */}
      {activeTab === 'kas' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Saldo Kas Olahraga</span>
                <h3 className="text-xl font-bold text-foreground mt-0.5">Rp{saldoKas.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Total Pemasukan</span>
                <h3 className="text-xl font-bold text-foreground mt-0.5">Rp{totalPemasukan.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Total Pengeluaran</span>
                <h3 className="text-xl font-bold text-foreground mt-0.5">Rp{totalPengeluaran.toLocaleString('id-ID')}</h3>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground">Histori Transaksi Kas</h2>
            {isKelolaMode && (
              <button
                onClick={() => setShowAddTx(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" /> Tambah Transaksi
              </button>
            )}
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Deskripsi</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  {isKelolaMode && <th className="px-5 py-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(tx.occurredAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{tx.category || 'Lain-lain'}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{tx.description || '—'}</td>
                    <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${
                      tx.type === 'PEMASUKAN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'PEMASUKAN' ? '+' : '-'} Rp{tx.amount.toLocaleString('id-ID')}
                    </td>
                    {isKelolaMode && (
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-muted-foreground hover:text-red-600 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={isKelolaMode ? 5 : 4} className="text-center py-10 text-muted-foreground text-sm">
                      Belum ada pencatatan kas olahraga.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB CONTENT: DAFTAR DENDA */}
      {activeTab === 'denda' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Daftar Denda Ketidakhadiran Olahraga</h2>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-5 py-3">Warga</th>
                  <th className="px-5 py-3">Kegiatan / Deskripsi</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3">Tanggal Denda</th>
                  <th className="px-5 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {dendaList.map((denda) => (
                  <tr key={denda.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{denda.user?.fullName || 'Warga'}</div>
                      <div className="text-xs text-muted-foreground">@{denda.user?.username || 'user'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{denda.title}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-rose-600">
                      Rp{denda.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        denda.status === 'LUNAS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : denda.status === 'DIBATALKAN'
                          ? 'bg-slate-50 text-slate-500'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {denda.status === 'LUNAS' ? 'Lunas' : denda.status === 'DIBATALKAN' ? 'Batal' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(denda.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate" title={denda.note || ''}>
                      {denda.note || '—'}
                    </td>
                  </tr>
                ))}

                {dendaList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      Tidak ada denda keolahragaan tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* MODAL: ABSENSI OLAHRAGA */}
      <AnimatePresence>
        {selectedActivityForAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Absensi: {selectedActivityForAttendance.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedActivityForAttendance.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedActivityForAttendance(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  Tutup
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/50 text-[11px] text-amber-700 flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>
                    Warga yang hadir otomatis terbit tagihan iuran <b>Rp{selectedActivityForAttendance.feeAmount.toLocaleString('id-ID')}</b>. Warga yang tidak hadir / absen otomatis dikenakan denda <b>Rp{selectedActivityForAttendance.fineAmount.toLocaleString('id-ID')}</b>.
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {wargaList.map((w) => (
                    <div key={w.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="font-medium text-sm text-foreground truncate">{w.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{w.username}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTempAttendance(prev => ({ ...prev, [w.id]: 'HADIR' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                            tempAttendance[w.id] === 'HADIR'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-muted-foreground hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Hadir
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempAttendance(prev => ({ ...prev, [w.id]: 'TIDAK_HADIR' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                            tempAttendance[w.id] === 'TIDAK_HADIR'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-slate-100 text-muted-foreground hover:bg-slate-200'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Absen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedActivityForAttendance(null)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-sm font-medium text-white shadow-sm transition-all disabled:opacity-60"
                >
                  Simpan Absensi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BUAT KEGIATAN */}
      <AnimatePresence>
        {showAddActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <form onSubmit={handleCreateActivity}>
                <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Buat Kegiatan Olahraga</h3>
                  <button 
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                  >
                    Batal
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex gap-2">
                      <AlertCircle className="h-4 w-4" /> <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Nama Kegiatan</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Futsal Mingguan, Badminton Bersama"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Waktu Mulai</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Waktu Selesai</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={actEndDate}
                        onChange={(e) => setActEndDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Iuran Kehadiran (Rp)</label>
                      <input 
                        type="number" 
                        required
                        value={actFee}
                        onChange={(e) => setActFee(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Denda Absen (Rp)</label>
                      <input 
                        type="number" 
                        required
                        value={actFine}
                        onChange={(e) => setActFine(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-sm font-medium text-white shadow-sm transition-all disabled:opacity-60"
                  >
                    Buat Kegiatan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH TRANSAKSI KAS */}
      <AnimatePresence>
        {showAddTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <form onSubmit={handleCreateTransaction}>
                <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Tambah Transaksi Kas</h3>
                  <button 
                    type="button"
                    onClick={() => setShowAddTx(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                  >
                    Batal
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex gap-2">
                      <AlertCircle className="h-4 w-4" /> <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Jenis Transaksi</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTxType('PEMASUKAN')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                          txType === 'PEMASUKAN'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'border-border text-muted-foreground bg-white hover:bg-slate-50'
                        }`}
                      >
                        Kas Masuk (Pemasukan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType('PENGELUARAN')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                          txType === 'PENGELUARAN'
                            ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                            : 'border-border text-muted-foreground bg-white hover:bg-slate-50'
                        }`}
                      >
                        Kas Keluar (Pengeluaran)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Kategori / Keperluan</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Sewa Lapangan Futsal, Pembelian Kok"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Nominal rupiah"
                      value={txAmount || ''}
                      onChange={(e) => setTxAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Tanggal Transaksi</label>
                    <input 
                      type="date" 
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Deskripsi Tambahan (Opsional)</label>
                    <textarea 
                      placeholder="Keterangan rinci transaksi..."
                      value={txDesc}
                      onChange={(e) => setTxDesc(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 h-20"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTx(false)}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-sm font-medium text-white shadow-sm transition-all disabled:opacity-60"
                  >
                    Tambah Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
