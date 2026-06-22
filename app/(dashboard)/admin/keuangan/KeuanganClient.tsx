'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  DollarSign,
  User,
  Tag,
  Loader2,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
} from 'recharts';
import { addTransaction, deleteTransaction, addBill, settleBill, cancelBill } from './actions';

interface Transaction {
  id: string;
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string | null;
  amount: number;
  description: string | null;
  occurredAt: string;
}

interface Bill {
  id: string;
  type: 'DENDA_PIKET' | 'IURAN' | 'LAINNYA';
  title: string;
  amount: number;
  status: 'BELUM_LUNAS' | 'LUNAS' | 'DIBATALKAN';
  dueDate: string | null;
  note: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

interface UserSummary {
  id: string;
  fullName: string;
  username: string;
}

interface KeuanganClientProps {
  transactions: Transaction[];
  bills: Bill[];
  users: UserSummary[];
  permissions: {
    canCreateTx: boolean;
    canDeleteTx: boolean;
    canUpdateBill: boolean;
  };
  monthlyAggregates: { month: string; year: number; pemasukan: number; pengeluaran: number }[];
  categoryBreakdown: { category: string; amount: number; type: string }[];
  agingData: { label: string; count: number; amount: number }[];
  previousMonthTotals: { pemasukan: number; pengeluaran: number };
  monthlyData: { month: string; year: number; pemasukan: number; pengeluaran: number }[];
}

export default function KeuanganClient({
  transactions: initialTransactions,
  bills: initialBills,
  users,
  permissions,
  previousMonthTotals,
  monthlyAggregates,
  categoryBreakdown,
  agingData,
  monthlyData,
}: KeuanganClientProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  // Helper to compute trend label
  const calcTrend = (current: number, previous: number) => {
    if (!previous) return { label: '— Stabil', color: 'text-muted-foreground', icon: null };
    const diff = current - previous;
    const perc = (diff / previous) * 100;
    if (perc > 0) {
      return {
        label: `+${perc.toFixed(1)}% dari bulan lalu`,
        color: 'text-success flex items-center',
        icon: <TrendingUp className="h-3 w-3 mr-1" />, // green up
      };
    }
    if (perc < 0) {
      return {
        label: `-${Math.abs(perc).toFixed(1)}% dari bulan lalu`,
        color: 'text-destructive flex items-center',
        icon: <TrendingDown className="h-3 w-3 mr-1" />, // red down
      };
    }
    return { label: '— Stabil', color: 'text-muted-foreground', icon: null };
  };

  const [chartRange, setChartRange] = useState('15 Hari');
  
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [bills, setBills] = useState<Bill[]>(initialBills);

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  
  // Selected Bill for settlement
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [settleNote, setSettleNote] = useState('');

  // Form states
  const [newTx, setNewTx] = useState({
    type: 'PEMASUKAN' as 'PEMASUKAN' | 'PENGELUARAN',
    category: '',
    amount: '',
    description: '',
    occurredAt: new Date().toISOString().split('T')[0],
  });
  
  const [newBill, setNewBill] = useState({
    userId: '',
    type: 'IURAN' as 'DENDA_PIKET' | 'IURAN' | 'LAINNYA',
    title: '',
    amount: '',
    dueDate: '',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Summary statistics (add previous saldo for trend)
  const totalPemasukan = transactions
    .filter((t) => t.type === 'PEMASUKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === 'PENGELUARAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalPemasukan - totalPengeluaran;

  const totalPiutang = bills
    .filter((b) => b.status === 'BELUM_LUNAS')
    .reduce((sum, b) => sum + b.amount, 0);

  // previous month totals are passed via props
  const previousSaldo = previousMonthTotals.pemasukan - previousMonthTotals.pengeluaran;

  // Hitung data bulan ini & bulan lalu untuk tren stat cards
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const pemasukanBulanIni = transactions
    .filter((t) => t.type === 'PEMASUKAN' && new Date(t.occurredAt) >= currentMonthStart && new Date(t.occurredAt) <= currentMonthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const pengeluaranBulanIni = transactions
    .filter((t) => t.type === 'PENGELUARAN' && new Date(t.occurredAt) >= currentMonthStart && new Date(t.occurredAt) <= currentMonthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoBulanIni = pemasukanBulanIni - pengeluaranBulanIni;

  const pemasukanBulanLalu = previousMonthTotals.pemasukan;
  const pengeluaranBulanLalu = previousMonthTotals.pengeluaran;
  const saldoBulanLalu = pemasukanBulanLalu - pengeluaranBulanLalu;

  const piutangBulanIni = bills
    .filter((b) => b.status === 'BELUM_LUNAS' && new Date(b.createdAt) >= currentMonthStart && new Date(b.createdAt) <= currentMonthEnd)
    .reduce((sum, b) => sum + b.amount, 0);

  const piutangBulanLalu = bills
    .filter((b) => b.status === 'BELUM_LUNAS' && new Date(b.createdAt) >= prevMonthStart && new Date(b.createdAt) <= prevMonthEnd)
    .reduce((sum, b) => sum + b.amount, 0);

  const renderTrendIndicator = (bulanIni: number, bulanLalu: number) => {
    if (!bulanLalu || bulanLalu === 0) {
      return <div className="text-xs text-muted-foreground mt-1">— Stabil</div>;
    }
    const diff = bulanIni - bulanLalu;
    const pct = (diff / bulanLalu) * 100;
    if (pct > 0) {
      return (
        <div className="text-xs text-emerald-600 font-semibold mt-1">
          ▲ +{pct.toFixed(0)}% dari bulan lalu
        </div>
      );
    } else if (pct < 0) {
      return (
        <div className="text-xs text-red-600 font-semibold mt-1">
          ▼ {pct.toFixed(0)}% dari bulan lalu
        </div>
      );
    } else {
      return <div className="text-xs text-muted-foreground mt-1">— Stabil</div>;
    }
  };

  // Format currency helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate chart data based on selected range
  const getChartData = () => {
    const dataMap: Record<string, { date: string; Pemasukan: number; Pengeluaran: number }> = {};
    const today = new Date();

    // Map label to number of days
    const rangeDaysMap: Record<string, number> = {
      '7 Hari': 7,
      '15 Hari': 15,
      '30 Hari': 30,
      '3 Bulan': 90,
      '6 Bulan': 180,
      '1 Tahun': 365,
    };
    const days = rangeDaysMap[chartRange] ?? 15;

    // Initialise map for chosen range
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dataMap[key] = { date: formattedDate, Pemasukan: 0, Pengeluaran: 0 };
    }

    // Populate with real data
    transactions.forEach((tx) => {
      const key = tx.occurredAt.slice(0, 10);
      if (dataMap[key]) {
        if (tx.type === 'PEMASUKAN') {
          dataMap[key].Pemasukan += tx.amount;
        } else {
          dataMap[key].Pengeluaran += tx.amount;
        }
      }
    });

    return Object.values(dataMap);
  };

  // Prepare data for Pemasukan Donut Chart
  const getPemasukanDonutData = () => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'PEMASUKAN')
      .forEach((t) => {
        const cat = t.category || 'Lain-lain';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Prepare data for Pengeluaran Donut Chart
  const getPengeluaranDonutData = () => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'PENGELUARAN')
      .forEach((t) => {
        const cat = t.category || 'Lain-lain';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const PEMASUKAN_COLORS = ['#6ee7b7', '#10b981', '#047857', '#2dd4bf', '#0d9488'];
  const PENGELUARAN_COLORS = ['#fca5a5', '#ef4444', '#b91c1c', '#fb7185', '#e11d48'];

  // Ledger calculation per user
  const getUserLedgers = () => {
    const ledgers: Record<
      string,
      {
        fullName: string;
        unpaid: number;
        paid: number;
        billsList: Bill[];
      }
    > = {};

    // Initialize with all active users
    users.forEach((u) => {
      ledgers[u.id] = {
        fullName: u.fullName,
        unpaid: 0,
        paid: 0,
        billsList: [],
      };
    });

    // Populate from bills
    bills.forEach((b) => {
      const uId = b.user.id;
      if (!ledgers[uId]) {
        ledgers[uId] = {
          fullName: b.user.fullName,
          unpaid: 0,
          paid: 0,
          billsList: [],
        };
      }
      
      ledgers[uId].billsList.push(b);
      if (b.status === 'BELUM_LUNAS') {
        ledgers[uId].unpaid += b.amount;
      } else if (b.status === 'LUNAS') {
        ledgers[uId].paid += b.amount;
      }
    });

    return Object.entries(ledgers)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.unpaid - a.unpaid); // Sort by highest debt first
  };

  // Handlers
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newTx.amount);
    if (isNaN(amountNum) || amountNum <= 0 || !newTx.category) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await addTransaction({
        ...newTx,
        amount: amountNum,
      });

      if (res.success) {
        const added: Transaction = {
          id: res.id!,
          type: newTx.type,
          category: newTx.category,
          amount: amountNum,
          description: newTx.description || null,
          occurredAt: new Date(newTx.occurredAt).toISOString(),
        };

        setTransactions((prev) => [added, ...prev]);
        setNewTx({
          type: 'PEMASUKAN',
          category: '',
          amount: '',
          description: '',
          occurredAt: new Date().toISOString().split('T')[0],
        });
        setTxModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini? Jika transaksi ini terikat dengan pelunasan tagihan, status tagihan tersebut akan kembali menjadi Belum Lunas.')) return;

    try {
      const res = await deleteTransaction(id);
      if (res.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        // Reload page data to sync bill status back to UI
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi');
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newBill.amount);
    if (isNaN(amountNum) || amountNum <= 0 || !newBill.userId || !newBill.title) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await addBill({
        ...newBill,
        amount: amountNum,
        dueDate: newBill.dueDate || null,
      });

      if (res.success) {
        const selectedUser = users.find((u) => u.id === newBill.userId);
        const added: Bill = {
          id: res.id!,
          type: newBill.type,
          title: newBill.title,
          amount: amountNum,
          status: 'BELUM_LUNAS',
          dueDate: newBill.dueDate ? new Date(newBill.dueDate).toISOString() : null,
          note: newBill.note || null,
          createdAt: new Date().toISOString(),
          user: {
            id: newBill.userId,
            fullName: selectedUser?.fullName || 'Warga',
          },
        };

        setBills((prev) => [added, ...prev]);
        setNewBill({
          userId: '',
          type: 'IURAN',
          title: '',
          amount: '',
          dueDate: '',
          note: '',
        });
        setBillModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await settleBill(selectedBillId, settleNote);
      if (res.success) {
        setBills((prev) =>
          prev.map((b) =>
            b.id === selectedBillId
              ? {
                  ...b,
                  status: 'LUNAS' as const,
                  note: settleNote
                    ? `${b.note || ''}\nPelunasan: ${settleNote}`.trim()
                    : b.note,
                }
              : b
          )
        );

        // Add matching transaction locally too
        const billObj = bills.find((b) => b.id === selectedBillId);
        if (billObj) {
          const category =
            billObj.type === 'DENDA_PIKET'
              ? 'Denda Piket'
              : billObj.type === 'IURAN'
              ? 'Iuran Warga'
              : 'Lain-lain';

          const localTx: Transaction = {
            id: `temp-${Date.now()}`,
            type: 'PEMASUKAN',
            category,
            amount: billObj.amount,
            description: `Pelunasan tagihan: ${billObj.title}`,
            occurredAt: new Date().toISOString(),
          };
          setTransactions((prev) => [localTx, ...prev]);
        }

        setSettleNote('');
        setSelectedBillId(null);
        setSettleModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal melunasi tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBill = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan tagihan ini? Status tagihan akan berubah menjadi Dibatalkan.')) return;

    try {
      const res = await cancelBill(id);
      if (res.success) {
        setBills((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'DIBATALKAN' as const } : b))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan tagihan');
    }
  };

  return (
    <div className="space-y-8">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pemasukan */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pemasukan</span>
            <div className="text-2xl font-bold text-emerald-600">{formatRp(totalPemasukan)}</div>
            {renderTrendIndicator(pemasukanBulanIni, pemasukanBulanLalu)}
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pengeluaran</span>
            <div className="text-2xl font-bold text-red-600">{formatRp(totalPengeluaran)}</div>
            {renderTrendIndicator(pengeluaranBulanIni, pengeluaranBulanLalu)}
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Saldo Sisa */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Kas Asrama</span>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-primary' : 'text-red-700'}`}>
              {formatRp(saldo)}
            </div>
            {renderTrendIndicator(saldoBulanIni, saldoBulanLalu)}
          </div>
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Belum Lunas */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tagihan Tertunggak</span>
            <div className="text-2xl font-bold text-amber-600">{formatRp(totalPiutang)}</div>
            {renderTrendIndicator(piutangBulanIni, piutangBulanLalu)}
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border gap-4">
        <div className="flex gap-6 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('chart')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'chart' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Grafik Keuangan
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Arus Kas ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bills' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Tagihan Warga ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Buku Pembantu Warga
          </button>
        </div>

        {/* Buttons based on active tab */}
        <div className="flex gap-2 pb-3 md:pb-0 w-full md:w-auto justify-end">
          {permissions.canCreateTx && activeTab === 'transactions' && (
            <button
              onClick={() => {
                setError(null);
                setTxModalOpen(true);
              }}
              className="btn btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Catat Transaksi
            </button>
          )}

          {permissions.canUpdateBill && activeTab === 'bills' && (
            <button
              onClick={() => {
                setError(null);
                setBillModalOpen(true);
              }}
              className="btn btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Buat Tagihan
            </button>
          )}
        </div>
      </div>

      {/* Content Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Analisis Pemasukan vs Pengeluaran</h3>
                  <p className="text-xs text-muted-foreground">
                    Tren akumulasi transaksi kas asrama dalam {chartRange} terakhir.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Selector Rentang Waktu (Toggle Group Buttons) */}
                  <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto max-w-full">
                    {['7 Hari', '15 Hari', '30 Hari', '3 Bulan', '6 Bulan', '1 Tahun'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setChartRange(range)}
                        className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                          chartRange === range
                            ? 'bg-white shadow-sm text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="h-80 w-full pt-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()}>
                      <defs>
                        <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000).toLocaleString('id-ID')}k`} />
                      <Tooltip 
                        formatter={(value: any) => [formatRp(Number(value)), '']}
                        contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                      />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPemasukan)" />
                      <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPengeluaran)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* 2 Donut Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donut Chart Pemasukan */}
              <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-foreground text-md">Komposisi Pemasukan</h3>
                  <p className="text-xs text-muted-foreground">Arus kas masuk berdasarkan kategori transaksi.</p>
                </div>
                <div className="relative h-64 flex items-center justify-center pt-2">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPemasukanDonutData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {getPemasukanDonutData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PEMASUKAN_COLORS[index % PEMASUKAN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRp(Number(value))} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  )}
                  {mounted && (
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none pb-9">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Total</span>
                      <span className="text-xs font-extrabold text-emerald-600">{formatRp(totalPemasukan)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Donut Chart Pengeluaran */}
              <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-foreground text-md">Komposisi Pengeluaran</h3>
                  <p className="text-xs text-muted-foreground">Arus kas keluar berdasarkan kategori transaksi.</p>
                </div>
                <div className="relative h-64 flex items-center justify-center pt-2">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPengeluaranDonutData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {getPengeluaranDonutData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PENGELUARAN_COLORS[index % PENGELUARAN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRp(Number(value))} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  )}
                  {mounted && (
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none pb-9">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Total</span>
                      <span className="text-xs font-extrabold text-red-600">{formatRp(totalPengeluaran)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart Tren Bulanan */}
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-md">Tren Keuangan 12 Bulan Terakhir</h3>
                <p className="text-xs text-muted-foreground">Perbandingan bulanan pemasukan, pengeluaran, dan saldo bersih.</p>
              </div>
              <div className="h-80 w-full pt-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyData.map((d) => ({
                        date: `${d.month} ${d.year.toString().slice(-2)}`,
                        Pemasukan: d.pemasukan,
                        Pengeluaran: d.pengeluaran,
                        'Saldo Bersih': d.pemasukan - d.pengeluaran,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatRp(Number(value)), '']}
                        contentStyle={{
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="Pemasukan" stackId="a" fill="#10b981" />
                      <Bar dataKey="Pengeluaran" stackId="a" fill="#ef4444" />
                      <Line
                        type="monotone"
                        dataKey="Saldo Bersih"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kategori Breakdown */}
              <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-foreground text-md flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Analisis Kategori Transaksi
                  </h4>
                  <p className="text-xs text-muted-foreground">Persentase pengeluaran dan pemasukan per kategori.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pemasukan */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Pemasukan</h5>
                    <div className="space-y-3">
                      {categoryBreakdown.filter(c => c.type === 'PEMASUKAN').length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Belum ada kategori pemasukan.</p>
                      ) : (
                        categoryBreakdown
                          .filter(c => c.type === 'PEMASUKAN')
                          .sort((a, b) => b.amount - a.amount)
                          .map((cat, idx) => {
                            const pct = totalPemasukan > 0 ? (cat.amount / totalPemasukan) * 100 : 0;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium text-foreground">{cat.category}</span>
                                  <span className="font-bold text-slate-700">{formatRp(cat.amount)} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Pengeluaran */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Pengeluaran</h5>
                    <div className="space-y-3">
                      {categoryBreakdown.filter(c => c.type === 'PENGELUARAN').length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Belum ada kategori pengeluaran.</p>
                      ) : (
                        categoryBreakdown
                          .filter(c => c.type === 'PENGELUARAN')
                          .sort((a, b) => b.amount - a.amount)
                          .map((cat, idx) => {
                            const pct = totalPengeluaran > 0 ? (cat.amount / totalPengeluaran) * 100 : 0;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium text-foreground">{cat.category}</span>
                                  <span className="font-bold text-slate-700">{formatRp(cat.amount)} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analisis Umur Piutang */}
              <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-foreground text-md flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Analisis Umur Piutang Warga
                  </h4>
                  <p className="text-xs text-muted-foreground">Distribusi tagihan belum lunas berdasarkan keterlambatan tempo.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">
                    <div>Status</div>
                    <div>Tagihan</div>
                    <div className="col-span-2 text-right">Jumlah Tunggakan</div>
                    <div>Porsi</div>
                  </div>

                  <div className="space-y-3.5">
                    {agingData.map((bucket, idx) => {
                      const pct = totalPiutang > 0 ? (bucket.amount / totalPiutang) * 100 : 0;
                      
                      // Theme color depending on severity
                      let textColor = 'text-slate-700';
                      let barColor = 'bg-slate-400';
                      let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                      if (bucket.label === '1-30 hari') {
                        textColor = 'text-amber-700';
                        barColor = 'bg-amber-500';
                        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (bucket.label === '31-60 hari') {
                        textColor = 'text-orange-700';
                        barColor = 'bg-orange-500';
                        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
                      } else if (bucket.label === '61-90 hari') {
                        textColor = 'text-rose-700';
                        barColor = 'bg-rose-500';
                        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                      } else if (bucket.label === '> 90 hari') {
                        textColor = 'text-red-700';
                        barColor = 'bg-red-600';
                        badgeStyle = 'bg-red-50 text-red-700 border-red-200';
                      }

                      return (
                        <div key={idx} className="grid grid-cols-5 gap-2 items-center text-xs">
                          <div className="font-semibold">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] border font-medium ${badgeStyle}`}>
                              {bucket.label}
                            </span>
                          </div>
                          <div className="text-slate-500 pl-1">{bucket.count} tagihan</div>
                          <div className={`col-span-2 text-right font-bold ${textColor}`}>
                            {formatRp(bucket.amount)}
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-semibold text-slate-500 text-[10px]">{pct.toFixed(0)}%</span>
                            <div className="w-12 bg-slate-100 rounded-full h-1.5 hidden sm:block">
                              <div
                                className={`h-1.5 rounded-full ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border/60 flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">Total Tagihan Tertunggak</span>
                    <span className="font-extrabold text-amber-600 text-sm">{formatRp(totalPiutang)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="table-container">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tipe</th>
                    <th>Kategori</th>
                    <th>Deskripsi</th>
                    <th>Nominal</th>
                    {permissions.canDeleteTx && <th className="text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 italic text-muted-foreground">
                        Belum ada catatan transaksi arus kas.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{formatDate(tx.occurredAt)}</td>
                        <td>
                          <span
                            className={`badge ${
                              tx.type === 'PEMASUKAN' ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="font-semibold text-foreground">{tx.category}</td>
                        <td>{tx.description || '-'}</td>
                        <td className={`font-bold ${tx.type === 'PEMASUKAN' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'PEMASUKAN' ? '+' : '-'} {formatRp(tx.amount)}
                        </td>
                        {permissions.canDeleteTx && (
                          <td className="text-right">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="table-container">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Warga</th>
                    <th>Jenis</th>
                    <th>Judul Tagihan</th>
                    <th>Nominal</th>
                    <th>Tenggat</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 italic text-muted-foreground">
                        Belum ada daftar tagihan warga.
                      </td>
                    </tr>
                  ) : (
                    bills.map((b) => (
                      <tr key={b.id}>
                        <td className="font-semibold text-foreground">{b.user.fullName}</td>
                        <td>
                          <span className="badge bg-slate-100 text-slate-800 border border-slate-200">
                            {b.type === 'DENDA_PIKET' ? 'Denda Piket' : b.type === 'IURAN' ? 'Iuran Bulanan' : 'Lainnya'}
                          </span>
                        </td>
                        <td>
                          <div className="font-medium text-foreground">{b.title}</div>
                          {b.note && <div className="text-[10px] text-muted-foreground line-clamp-1">{b.note}</div>}
                        </td>
                        <td className="font-bold text-foreground">{formatRp(b.amount)}</td>
                        <td>{formatDate(b.dueDate)}</td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === 'LUNAS'
                                ? 'badge-success'
                                : b.status === 'DIBATALKAN'
                                ? 'badge-danger'
                                : 'badge-warning animate-pulse'
                            }`}
                          >
                            {b.status === 'BELUM_LUNAS' ? 'BELUM LUNAS' : b.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            {b.status === 'BELUM_LUNAS' && permissions.canUpdateBill && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedBillId(b.id);
                                    setSettleNote('');
                                    setSettleModalOpen(true);
                                  }}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Konfirmasi Lunas"
                                >
                                  <CheckCircle2 className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelBill(b.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Batalkan Tagihan"
                                >
                                  <XCircle className="h-4.5 w-4.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-border font-semibold text-foreground text-sm">
                Rekap Pembayaran & Tunggakan Warga
              </div>
              <div className="table-container">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Nama Warga</th>
                      <th>Total Tunggakan</th>
                      <th>Total Telah Dibayar</th>
                      <th>Jumlah Tagihan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUserLedgers().map((led) => (
                      <tr key={led.id} className="hover:bg-slate-50/50">
                        <td className="font-semibold text-foreground">{led.fullName}</td>
                        <td className={`font-bold ${led.unpaid > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {formatRp(led.unpaid)}
                        </td>
                        <td className="font-semibold text-emerald-600">{formatRp(led.paid)}</td>
                        <td className="text-xs text-muted-foreground">{led.billsList.length} tagihan terbit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Transaction */}
      <AnimatePresence>
        {txModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setTxModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Catat Transaksi Baru</h3>
                <button
                  onClick={() => setTxModalOpen(false)}
                  className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: 'PEMASUKAN' })}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                      newTx.type === 'PEMASUKAN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    PEMASUKAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: 'PENGELUARAN' })}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                      newTx.type === 'PENGELUARAN' ? 'bg-white text-red-600 shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    PENGELUARAN
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
                  <input
                    type="text"
                    required
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    placeholder="Contoh: Iuran Warga, Konsumsi, Listrik, dll..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nominal (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    placeholder="Masukkan jumlah nominal uang..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={newTx.occurredAt}
                    onChange={(e) => setNewTx({ ...newTx, occurredAt: e.target.value })}
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Keterangan / Detail (Opsional)</label>
                  <textarea
                    rows={2}
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    placeholder="Tulis rincian catatan transaksi..."
                    className="input text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setTxModalOpen(false)}
                    className="btn btn-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-sm flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Bill */}
      <AnimatePresence>
        {billModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setBillModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Buat Tagihan Baru</h3>
                <button
                  onClick={() => setBillModalOpen(false)}
                  className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddBill} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pilih Warga</label>
                  <select
                    required
                    value={newBill.userId}
                    onChange={(e) => setNewBill({ ...newBill, userId: e.target.value })}
                    className="input text-sm bg-white"
                  >
                    <option value="">-- Pilih Warga Asrama --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Jenis Tagihan</label>
                  <select
                    required
                    value={newBill.type}
                    onChange={(e) => setNewBill({ ...newBill, type: e.target.value as any })}
                    className="input text-sm bg-white"
                  >
                    <option value="IURAN">Iuran Bulanan / Wajib</option>
                    <option value="DENDA_PIKET">Denda Piket</option>
                    <option value="LAINNYA">Lain-lain / Sekali Bayar</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Judul Tagihan</label>
                  <input
                    type="text"
                    required
                    value={newBill.title}
                    onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                    placeholder="Contoh: Iuran Asrama Juni 2026..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nominal Tagihan (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    placeholder="Masukkan nominal tagihan..."
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tenggat Waktu / Due Date (Opsional)</label>
                  <input
                    type="date"
                    value={newBill.dueDate}
                    onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Catatan / Detail (Opsional)</label>
                  <textarea
                    rows={2}
                    value={newBill.note}
                    onChange={(e) => setNewBill({ ...newBill, note: e.target.value })}
                    placeholder="Detail tambahan mengenai tagihan..."
                    className="input text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setBillModalOpen(false)}
                    className="btn btn-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-sm flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Buat Tagihan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Settle Bill */}
      <AnimatePresence>
        {settleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setSettleModalOpen(false);
                setSelectedBillId(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Konfirmasi Pelunasan</h3>
                <button
                  onClick={() => {
                    setSettleModalOpen(false);
                    setSelectedBillId(null);
                  }}
                  className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSettleBill} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Konfirmasi bahwa tagihan ini telah dibayarkan secara manual (tunai/transfer) oleh warga ke kas asrama. Perubahan ini akan otomatis mencatat arus kas masuk (*Pemasukan*).
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    placeholder="Contoh: Diterima tunai / Transfer Bank BCA..."
                    className="input text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setSettleModalOpen(false);
                      setSelectedBillId(null);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-sm flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Konfirmasi Lunas
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
