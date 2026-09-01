'use client';

import { useState, useEffect, Fragment } from 'react';
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
  ChevronDown,
  Settings2,
  ChevronRight,
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
  BarChart,
} from 'recharts';
import { addTransaction, deleteTransaction, addBill, addBulkIuran, settleBill, cancelBill, extendBillDueDate, updateIuranConfig } from './actions';

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
  type: 'DENDA_PIKET' | 'IURAN' | 'LAINNYA' | 'IURAN_OLAHRAGA' | 'DENDA_OLAHRAGA';
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
  status: 'AKTIF' | 'ALUMNI';
  roles?: string[];
  roleLabels?: string[];
}

export type BulkBillTier = 'FULL' | 'BASE_ONLY' | 'WIFI_ONLY';

interface IuranConfig {
  id: string;
  baseAmount: number;
  wifiAddon: number;
}

interface KeuanganClientProps {
  iuranConfig: IuranConfig;
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
  currentUserId?: string;
}

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatRpHelper = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatThousand = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = val.toString().replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numStr));
};

const DebtorRow = ({ deb }: { deb: any }) => {
  const [selectedBillId, setSelectedBillId] = useState<string>(deb.bills[0]?.id || '');
  // make sure selectedBillId exists in bills, else fallback to first bill
  const selectedBill = deb.bills.find((b: any) => b.id === selectedBillId) || deb.bills[0];

  if (!selectedBill) return null;

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="py-2 px-3 font-semibold text-foreground">{deb.name}</td>
      <td className="py-2 px-3 font-bold text-slate-700">{formatRpHelper(deb.totalAmount)}</td>
      <td className="py-2 px-3">
        {deb.bills.length > 1 ? (
          <select
            value={selectedBill.id}
            onChange={e => setSelectedBillId(e.target.value)}
            className="text-xs p-1 border border-slate-200 rounded bg-white shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {deb.bills.map((b: any) => (
              <option key={b.id} value={b.id}>{b.type} - {formatRpHelper(b.amount)}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs">{deb.bills[0].type}</span>
        )}
      </td>
      <td className="py-2 px-3 font-bold text-foreground">{formatRpHelper(selectedBill.amount)}</td>
      <td className="py-2 px-3 text-slate-600 text-[11px]">{selectedBill.overdueLabel}</td>
      <td className="py-2 px-3 text-right">
        {selectedBill.urgency === '🟢' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">Lancar</span>
        )}
        {selectedBill.urgency === '🟡' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Overdue 1-30h</span>
        )}
        {selectedBill.urgency === '🟠' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">Overdue 31-90h</span>
        )}
        {selectedBill.urgency === '🔴' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">Overdue &gt;90h</span>
        )}
      </td>
    </tr>
  );
};

export default function KeuanganClient({
  iuranConfig: initialIuranConfig,
  transactions: initialTransactions,
  bills: initialBills,
  users,
  permissions,
  previousMonthTotals,
  monthlyAggregates,
  categoryBreakdown,
  agingData,
  monthlyData,
  currentUserId,
}: KeuanganClientProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [iuranConfig, setIuranConfig] = useState(initialIuranConfig);

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

  // States for Bills filtering (Tugas 3A)
  const [billSearch, setBillSearch] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'BELUM_LUNAS' | 'LUNAS' | 'DIBATALKAN'>('ALL');
  const [billTypeFilter, setBillTypeFilter] = useState<'ALL' | 'IURAN' | 'DENDA_PIKET' | 'LAINNYA' | 'IURAN_OLAHRAGA' | 'DENDA_OLAHRAGA'>('ALL');

  // State for Top 10 Debtor status filter
  const [debtorStatusFilter, setDebtorStatusFilter] = useState<'ALL' | 'AKTIF' | 'ALUMNI'>('ALL');

  // State for expanded ledger rows (Tugas 4B)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // States for Monthly Summary (Tugas 5)
  const [monthlyReportMonth, setMonthlyReportMonth] = useState<number>(new Date().getMonth());
  const [monthlyReportYear, setMonthlyReportYear] = useState<number>(new Date().getFullYear());

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [individualBillModalOpen, setIndividualBillModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // Selected Bill for settlement
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [settleNote, setSettleNote] = useState('');
  const [settleAmount, setSettleAmount] = useState<number>(0);

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
    type: 'IURAN' as 'DENDA_PIKET' | 'IURAN' | 'LAINNYA' | 'IURAN_OLAHRAGA' | 'DENDA_OLAHRAGA',
    title: '',
    amount: '',
    dueDate: '',
    note: '',
  });

  const [newIndividualBill, setNewIndividualBill] = useState({
    userId: '',
    type: 'IURAN' as 'DENDA_PIKET' | 'IURAN' | 'LAINNYA' | 'IURAN_OLAHRAGA' | 'DENDA_OLAHRAGA',
    title: '',
    amount: '',
    dueDate: '',
    createdAt: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [customTxCategory, setCustomTxCategory] = useState('');

  const [bulkBillData, setBulkBillData] = useState<Record<string, { selected: boolean; tier: BulkBillTier }>>({});
  const [bulkBillTitle, setBulkBillTitle] = useState('');
  const [bulkBillDueDate, setBulkBillDueDate] = useState('');
  const [bulkBillRoleFilter, setBulkBillRoleFilter] = useState<'ALL' | 'WARGA' | 'CALON_WARGA'>('ALL');

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

  const currentMonthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  // Pemasukan & Pengeluaran khusus bulan berjalan (reset setiap ganti bulan)
  const pemasukanBulanIni = transactions
    .filter((t) => t.type === 'PEMASUKAN' && new Date(t.occurredAt) >= currentMonthStart && new Date(t.occurredAt) <= currentMonthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const pengeluaranBulanIni = transactions
    .filter((t) => t.type === 'PENGELUARAN' && new Date(t.occurredAt) >= currentMonthStart && new Date(t.occurredAt) <= currentMonthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoBulanIni = pemasukanBulanIni - pengeluaranBulanIni;

  // Saldo kumulatif ditarik dari hasil bulan lalu (carry over)
  const previousTransactions = transactions.filter((t) => new Date(t.occurredAt) < currentMonthStart);
  const saldoKumulatifBulanLalu = previousTransactions
    .reduce((sum, t) => sum + (t.type === 'PEMASUKAN' ? t.amount : -t.amount), 0);

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
        dendaPiket: number;
        iuran: number;
        lainnya: number;
        billsList: Bill[];
      }
    > = {};

    // Initialize with all active users
    users.forEach((u) => {
      ledgers[u.id] = {
        fullName: u.fullName,
        unpaid: 0,
        paid: 0,
        dendaPiket: 0,
        iuran: 0,
        lainnya: 0,
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
          dendaPiket: 0,
          iuran: 0,
          lainnya: 0,
          billsList: [],
        };
      }

      ledgers[uId].billsList.push(b);
      if (b.status === 'BELUM_LUNAS') {
        ledgers[uId].unpaid += b.amount;
        if (b.type === 'DENDA_PIKET') {
          ledgers[uId].dendaPiket += b.amount;
        } else if (b.type === 'IURAN') {
          ledgers[uId].iuran += b.amount;
        } else {
          ledgers[uId].lainnya += b.amount;
        }
      } else if (b.status === 'LUNAS') {
        ledgers[uId].paid += b.amount;
      }
    });

    return Object.entries(ledgers)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.unpaid - a.unpaid); // Sort by highest debt first
  };

  // Filtered bills calculation (Tugas 3A)
  const filteredBills = bills.filter((b) => {
    if (billSearch.trim() !== '') {
      const name = b.user?.fullName?.toLowerCase() || '';
      if (!name.includes(billSearch.toLowerCase())) {
        return false;
      }
    }
    if (billStatusFilter !== 'ALL') {
      if (b.status !== billStatusFilter) {
        return false;
      }
    }
    if (billTypeFilter !== 'ALL') {
      if (b.type !== billTypeFilter) {
        return false;
      }
    }
    return true;
  });

  // Calculate aging summary cards (Tugas 3B)
  const getAgingSummary = () => {
    const today = new Date();
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

    let activeCount = 0;
    let activeAmount = 0;
    let overdue1_30Count = 0;
    let overdue1_30Amount = 0;
    let overdue31_90Count = 0;
    let overdue31_90Amount = 0;
    let overdueOver90Count = 0;
    let overdueOver90Amount = 0;

    bills.forEach((b) => {
      if (b.status !== 'BELUM_LUNAS') return;

      if (!b.dueDate) {
        activeCount++;
        activeAmount += b.amount;
        return;
      }

      const due = new Date(b.dueDate);
      const dueMs = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());

      const diffDays = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));

      const isLate = diffDays > 0 && b.type === 'IURAN';
      const actualAmount = isLate ? Math.floor(b.amount * 1.2) : b.amount;

      if (diffDays <= 0) {
        activeCount++;
        activeAmount += actualAmount;
      } else if (diffDays >= 1 && diffDays <= 30) {
        overdue1_30Count++;
        overdue1_30Amount += actualAmount;
      } else if (diffDays >= 31 && diffDays <= 90) {
        overdue31_90Count++;
        overdue31_90Amount += actualAmount;
      } else if (diffDays > 90) {
        overdueOver90Count++;
        overdueOver90Amount += actualAmount;
      }
    });

    return {
      active: { count: activeCount, amount: activeAmount },
      overdue1_30: { count: overdue1_30Count, amount: overdue1_30Amount },
      overdue31_90: { count: overdue31_90Count, amount: overdue31_90Amount },
      overdueOver90: { count: overdueOver90Count, amount: overdueOver90Amount },
    };
  };

  const agingSummary = getAgingSummary();

  // Top 10 Debtor calculation (Tugas 3C)
  const getTopDebtors = () => {
    // Build a set of user IDs matching the current status filter
    const allowedUserIds = debtorStatusFilter === 'ALL'
      ? null
      : new Set(users.filter((u) => u.status === debtorStatusFilter).map((u) => u.id));

    const debtorsMap: Record<string, { id: string; name: string; amount: number }> = {};

    bills.forEach((b) => {
      if (b.status !== 'BELUM_LUNAS') return;
      // Filter by user status if not ALL
      if (allowedUserIds && !allowedUserIds.has(b.user.id)) return;
      const uId = b.user.id;
      if (!debtorsMap[uId]) {
        debtorsMap[uId] = {
          id: uId,
          name: b.user.fullName,
          amount: 0,
        };
      }
      debtorsMap[uId].amount += b.amount;
    });

    return Object.values(debtorsMap)
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  const topDebtors = getTopDebtors();

  // Filtered data for Monthly Report (Tugas 5)
  const getMonthlyReportData = () => {
    const filteredTxs = transactions.filter((t) => {
      const d = new Date(t.occurredAt);
      return d.getFullYear() === monthlyReportYear && d.getMonth() === monthlyReportMonth;
    });

    const monthlyPemasukan = filteredTxs
      .filter((t) => t.type === 'PEMASUKAN')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyPengeluaran = filteredTxs
      .filter((t) => t.type === 'PENGELUARAN')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySaldo = monthlyPemasukan - monthlyPengeluaran;

    const monthlyBills = bills.filter((b) => {
      const d = new Date(b.createdAt);
      return d.getFullYear() === monthlyReportYear && d.getMonth() === monthlyReportMonth;
    });

    const billsLunas = monthlyBills.filter((b) => b.status === 'LUNAS');
    const billsBelumLunas = monthlyBills.filter((b) => b.status === 'BELUM_LUNAS');

    const totalBillsAmount = monthlyBills.reduce((sum, b) => sum + b.amount, 0);
    const lunasAmount = billsLunas.reduce((sum, b) => sum + b.amount, 0);
    const belumLunasAmount = billsBelumLunas.reduce((sum, b) => sum + b.amount, 0);

    const scarcityRate = totalBillsAmount > 0 ? (lunasAmount / totalBillsAmount) * 100 : 100;

    const categoryPemMap: Record<string, { category: string; count: number; amount: number }> = {};
    filteredTxs
      .filter((t) => t.type === 'PEMASUKAN')
      .forEach((t) => {
        const cat = t.category || 'Lain-lain';
        if (!categoryPemMap[cat]) {
          categoryPemMap[cat] = { category: cat, count: 0, amount: 0 };
        }
        categoryPemMap[cat].count++;
        categoryPemMap[cat].amount += t.amount;
      });
    const categoryPemList = Object.values(categoryPemMap).sort((a, b) => b.amount - a.amount);

    const categoryPengMap: Record<string, { category: string; count: number; amount: number }> = {};
    filteredTxs
      .filter((t) => t.type === 'PENGELUARAN')
      .forEach((t) => {
        const cat = t.category || 'Lain-lain';
        if (!categoryPengMap[cat]) {
          categoryPengMap[cat] = { category: cat, count: 0, amount: 0 };
        }
        categoryPengMap[cat].count++;
        categoryPengMap[cat].amount += t.amount;
      });
    const categoryPengList = Object.values(categoryPengMap).sort((a, b) => b.amount - a.amount);

    const debtorsMap: Record<string, {
      userId: string;
      name: string;
      bills: {
        id: string;
        type: string;
        amount: number;
        dueDate: string | null;
        overdueLabel: string;
        urgency: string;
        diffDays: number;
      }[];
      totalAmount: number;
    }> = {};

    billsBelumLunas.forEach((b) => {
      const uId = b.user?.id || (b as any).userId;
      if (!uId) return;

      if (!debtorsMap[uId]) {
        debtorsMap[uId] = {
          userId: uId,
          name: b.user.fullName,
          bills: [],
          totalAmount: 0
        };
      }

      const today = new Date();
      const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      let overdueLabel = 'Belum Jatuh Tempo';
      let urgency = '🟢';
      let diffDays = 0;

      if (b.dueDate) {
        const due = new Date(b.dueDate);
        const dueMs = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
        diffDays = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          overdueLabel = `${diffDays} hari`;
          urgency = '🔴';
          if (diffDays <= 30) urgency = '🟡';
          else if (diffDays <= 90) urgency = '🟠';
        }
      }

      debtorsMap[uId].bills.push({
        id: b.id,
        type: b.type === 'DENDA_PIKET' ? 'Denda Piket' : b.type === 'IURAN' ? 'Iuran Bulanan' : 'Lainnya',
        amount: b.amount,
        dueDate: b.dueDate,
        overdueLabel,
        urgency,
        diffDays
      });
      debtorsMap[uId].totalAmount += b.amount;
    });

    const overdueDebtors = Object.values(debtorsMap).sort((a, b) => b.totalAmount - a.totalAmount);

    const sortedTxs = [...filteredTxs].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    const reportMonthStart = new Date(monthlyReportYear, monthlyReportMonth, 1);
    const prevTxs = transactions.filter((t) => new Date(t.occurredAt) < reportMonthStart);
    const saldoAwalBulanLalu = prevTxs.reduce((sum, t) => sum + (t.type === 'PEMASUKAN' ? t.amount : -t.amount), 0);
    const saldoAkhirTotal = saldoAwalBulanLalu + monthlySaldo;

    return {
      txs: sortedTxs,
      pemasukan: monthlyPemasukan,
      pengeluaran: monthlyPengeluaran,
      saldo: monthlySaldo,
      saldoAwal: saldoAwalBulanLalu,
      saldoAkhirTotal,
      totalBillsAmount,
      lunasAmount,
      belumLunasAmount,
      totalBillsCount: monthlyBills.length,
      lunasCount: billsLunas.length,
      belumLunasCount: billsBelumLunas.length,
      kolektibilitas: scarcityRate,
      categoryPemList,
      categoryPengList,
      overdueDebtors,
    };
  };

  const monthlyReport = getMonthlyReportData();

  // Handlers
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newTx.amount);

    // Resolve category
    let finalCategory = newTx.category;
    if (finalCategory === 'Lain-lain') {
      finalCategory = customTxCategory;
    }

    if (isNaN(amountNum) || amountNum <= 0 || !finalCategory) return;

    if (newTx.type === 'PENGELUARAN' && amountNum > saldo) {
      setError('Saldo tidak mencukupi. Tersedia ' + formatRp(saldo));
      return;
    }

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
          category: finalCategory,
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
        setCustomTxCategory('');
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

  const handleAddIndividualBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newIndividualBill.amount);
    if (isNaN(amountNum) || amountNum <= 0 || !newIndividualBill.userId || !newIndividualBill.title) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await addBill({
        userId: newIndividualBill.userId,
        type: newIndividualBill.type,
        title: newIndividualBill.title,
        amount: amountNum,
        dueDate: newIndividualBill.dueDate || null,
        note: newIndividualBill.note,
        createdAt: newIndividualBill.createdAt || null,
      });

      if (res.success) {
        const selectedUser = users.find((u) => u.id === newIndividualBill.userId);
        const added: Bill = {
          id: res.id!,
          type: newIndividualBill.type,
          title: newIndividualBill.title,
          amount: amountNum,
          status: 'BELUM_LUNAS',
          dueDate: newIndividualBill.dueDate ? new Date(newIndividualBill.dueDate).toISOString() : null,
          note: newIndividualBill.note || null,
          createdAt: newIndividualBill.createdAt ? new Date(newIndividualBill.createdAt).toISOString() : new Date().toISOString(),
          user: {
            id: newIndividualBill.userId,
            fullName: selectedUser?.fullName || 'Warga/Alumni',
          },
        };

        setBills((prev) => [added, ...prev]);
        setNewIndividualBill({
          userId: '',
          type: 'IURAN',
          title: '',
          amount: '',
          dueDate: '',
          createdAt: new Date().toISOString().split('T')[0],
          note: '',
        });
        setIndividualBillModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBulkBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const usersToBill = Object.entries(bulkBillData)
      .filter(([_, data]) => data.selected)
      .map(([userId, data]) => {
        let amount = 0;
        if (data.tier === 'WIFI_ONLY') {
          amount = iuranConfig.wifiAddon;
        } else if (data.tier === 'BASE_ONLY') {
          amount = iuranConfig.baseAmount;
        } else {
          // Default 'FULL'
          amount = iuranConfig.baseAmount + iuranConfig.wifiAddon;
        }
        return {
          userId,
          amount,
        };
      });

    if (usersToBill.length === 0) {
      setError('Pilih minimal satu warga untuk ditagih.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await addBulkIuran({
        title: bulkBillTitle,
        dueDate: bulkBillDueDate || null,
        users: usersToBill,
      });

      if (res.success) {
        // Just reload the page to get the updated list of bills, it's safer and easier than manually assembling them
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat tagihan massal');
      setSubmitting(false);
    }
  };

  const handleSettleBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId) return;

    if (settleAmount <= 0) {
      setError('Nominal pelunasan harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await settleBill(selectedBillId, settleNote, settleAmount);
      if (res.success) {
        const billObj = bills.find((b) => b.id === selectedBillId);
        if (billObj) {
          const isLate = billObj.status === 'BELUM_LUNAS' && billObj.dueDate && new Date() > new Date(billObj.dueDate) && billObj.type === 'IURAN';
          const targetAmount = isLate ? Math.floor(billObj.amount * 1.2) : billObj.amount;
          const isPartial = settleAmount < targetAmount;
          const remainingAmount = targetAmount - settleAmount;

          setBills((prev) =>
            prev.map((b) =>
              b.id === selectedBillId
                ? {
                  ...b,
                  status: isPartial ? b.status : ('LUNAS' as const),
                  amount: isPartial ? remainingAmount : settleAmount,
                  note: settleNote
                    ? `${b.note || ''}\nPelunasan: ${settleNote} (${isPartial ? `Cicilan Rp${settleAmount.toLocaleString('id-ID')}, sisa Rp${remainingAmount.toLocaleString('id-ID')}` : 'Lunas Penuh'})`.trim()
                    : `${b.note || ''}\n(${isPartial ? `Cicilan Rp${settleAmount.toLocaleString('id-ID')}, sisa Rp${remainingAmount.toLocaleString('id-ID')}` : 'Lunas Penuh'})`.trim(),
                }
                : b
            )
          );

          // Add matching transaction locally too
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
            amount: settleAmount,
            description: isPartial 
              ? `Pembayaran cicilan tagihan: ${billObj.title}`
              : `Pelunasan tagihan: ${billObj.title}`,
            occurredAt: new Date().toISOString(),
          };
          setTransactions((prev) => [localTx, ...prev]);
        }

        setSettleNote('');
        setSelectedBillId(null);
        setSettleAmount(0);
        setSettleModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal melunasi tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendDueDate = async (id: string) => {
    if (!confirm('Berikan izin telat bayar (tanpa denda) hingga awal bulan depan?')) return;
    try {
      const res = await extendBillDueDate(id);
      if (res.success) {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperpanjang waktu tagihan');
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
        {/* Pemasukan Bulan Ini */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pemasukan ({currentMonthName})
            </span>
            <div className="text-lg sm:text-2xl font-bold text-emerald-600">{formatRp(pemasukanBulanIni)}</div>
            {renderTrendIndicator(pemasukanBulanIni, pemasukanBulanLalu)}
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pengeluaran ({currentMonthName})
            </span>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{formatRp(pengeluaranBulanIni)}</div>
            {renderTrendIndicator(pengeluaranBulanIni, pengeluaranBulanLalu)}
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Total Saldo Kas Asrama (Carry-Over Kumulatif) */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Saldo Kas Asrama</span>
            <div className={`text-lg sm:text-2xl font-bold ${saldo >= 0 ? 'text-primary' : 'text-red-700'}`}>
              {formatRp(saldo)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex flex-col">
              <span>Sisa Bulan Lalu: <strong className="text-slate-700">{formatRp(saldoKumulatifBulanLalu)}</strong></span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Belum Lunas */}
        <div className="glass-card p-6 flex items-center justify-between border border-border/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tagihan Tertunggak</span>
            <div className="text-lg sm:text-2xl font-bold text-amber-600">{formatRp(totalPiutang)}</div>
            {renderTrendIndicator(piutangBulanIni, piutangBulanLalu)}
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col border-b border-border gap-2">
        <div className="flex gap-3 sm:gap-6 overflow-x-auto w-full pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTab('chart')}
            className={`pb-3 sm:pb-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'chart' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Grafik Keuangan
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 sm:pb-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Arus Kas ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`pb-3 sm:pb-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'bills' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Tagihan Warga ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 sm:pb-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Buku Pembantu Warga
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 sm:pb-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'monthly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            📋 Rangkuman Bulanan
          </button>
        </div>

        {/* Buttons based on active tab */}
        <div className="flex gap-2 pb-2 w-full justify-end">
          {permissions.canCreateTx && activeTab === 'transactions' && (
            <button
              onClick={() => {
                setError(null);
                setTxModalOpen(true);
              }}
              className="btn btn-primary text-sm flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Catat Transaksi
            </button>
          )}

          {permissions.canUpdateBill && activeTab === 'bills' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setError(null);

                  // Initialize bulk bill data (active citizens only with role-based default tier)
                  const initData: Record<string, { selected: boolean; tier: BulkBillTier }> = {};
                  users.filter(u => u.status === 'AKTIF').forEach(u => {
                    const isCalonWarga = u.roles?.includes('CALON_WARGA');
                    initData[u.id] = {
                      selected: true,
                      tier: isCalonWarga ? 'WIFI_ONLY' : 'FULL',
                    };
                  });
                  setBulkBillData(initData);
                  setBulkBillRoleFilter('ALL');

                  // set default title
                  const now = new Date();
                  const monthName = now.toLocaleString('id-ID', { month: 'long' });
                  setBulkBillTitle(`Iuran Bulanan ${monthName} ${now.getFullYear()}`);

                  // set default due date to the 20th of the current month
                  const due = new Date(now.getFullYear(), now.getMonth(), 20);
                  setBulkBillDueDate(due.toISOString().split('T')[0]);

                  setBillModalOpen(true);
                }}
                className="btn btn-primary text-sm flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Buat Tagihan Bulanan
              </button>

              <button
                onClick={() => {
                  setError(null);
                  setNewIndividualBill({
                    userId: '',
                    type: 'IURAN',
                    title: '',
                    amount: '',
                    dueDate: '',
                    createdAt: new Date().toISOString().split('T')[0],
                    note: '',
                  });
                  setIndividualBillModalOpen(true);
                }}
                className="btn btn-secondary text-sm flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Catat Hutang Perorangan
              </button>
            </div>
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
                        className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${chartRange === range
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

              <div className="h-48 sm:h-64 md:h-80 w-full pt-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()}>
                      <defs>
                        <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`} />
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
              <div className="h-48 sm:h-64 md:h-80 w-full pt-4">
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
                            className={`badge ${tx.type === 'PEMASUKAN' ? 'badge-success' : 'badge-danger'
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
          <div className="space-y-6">
            {/* ── Atur Harga Tagihan Bulanan ── */}
            {permissions.canUpdateBill && (
              <IuranConfigCard
                config={iuranConfig}
                onSave={async (baseAmount, wifiAddon) => {
                  await updateIuranConfig({ baseAmount, wifiAddon });
                  setIuranConfig(prev => ({ ...prev, baseAmount, wifiAddon }));
                }}
              />
            )}

            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Filter Bar (Tugas 3A) */}
              <div className="p-4 bg-slate-50/50 border-b border-border flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <div className="w-full lg:w-72">
                  <input
                    type="text"
                    placeholder="Cari nama warga..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                    className="input text-sm w-full"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Filter Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      {(
                        [
                          { value: 'ALL', label: 'Semua' },
                          { value: 'BELUM_LUNAS', label: 'Belum Lunas' },
                          { value: 'LUNAS', label: 'Lunas' },
                          { value: 'DIBATALKAN', label: 'Dibatalkan' },
                        ] as const
                      ).map((statusOption) => (
                        <button
                          key={statusOption.value}
                          type="button"
                          onClick={() => setBillStatusFilter(statusOption.value)}
                          className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${billStatusFilter === statusOption.value
                              ? 'bg-white shadow-sm text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {statusOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Jenis */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Jenis:</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold overflow-x-auto max-w-[calc(100vw-2rem)] sm:max-w-none scrollbar-hide">
                      {(
                        [
                          { value: 'ALL', label: 'Semua' },
                          { value: 'IURAN', label: 'Iuran Warga' },
                          { value: 'DENDA_PIKET', label: 'Denda Piket' },
                          { value: 'IURAN_OLAHRAGA', label: 'Iuran Olahraga' },
                          { value: 'DENDA_OLAHRAGA', label: 'Denda Olahraga' },
                          { value: 'LAINNYA', label: 'Lainnya' },
                        ] as const
                      ).map((typeOption) => (
                        <button
                          key={typeOption.value}
                          type="button"
                          onClick={() => setBillTypeFilter(typeOption.value)}
                          className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${billTypeFilter === typeOption.value
                              ? 'bg-white shadow-sm text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {typeOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Aging Summary Cards (Tugas 3B) */}
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/10 border-b border-border">
                {/* Card 1: Belum Jatuh Tempo */}
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Belum Jatuh Tempo</span>
                  <div className="mt-1">
                    <div className="text-sm font-extrabold text-blue-900">{formatRp(agingSummary.active.amount)}</div>
                    <div className="text-[10px] font-medium text-blue-600/80 mt-0.5">{agingSummary.active.count} tagihan</div>
                  </div>
                </div>

                {/* Card 2: Overdue 1-30 Hari */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Overdue 1-30 hari</span>
                  <div className="mt-1">
                    <div className="text-sm font-extrabold text-amber-900">{formatRp(agingSummary.overdue1_30.amount)}</div>
                    <div className="text-[10px] font-medium text-amber-600/80 mt-0.5">{agingSummary.overdue1_30.count} tagihan</div>
                  </div>
                </div>

                {/* Card 3: Overdue 31-90 Hari */}
                <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Overdue 31-90 hari</span>
                  <div className="mt-1">
                    <div className="text-sm font-extrabold text-orange-900">{formatRp(agingSummary.overdue31_90.amount)}</div>
                    <div className="text-[10px] font-medium text-orange-600/80 mt-0.5">{agingSummary.overdue31_90.count} tagihan</div>
                  </div>
                </div>

                {/* Card 4: Overdue > 90 Hari */}
                <div className="p-3 bg-red-50/80 rounded-xl border border-red-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Overdue &gt; 90 hari</span>
                  <div className="mt-1">
                    <div className="text-sm font-extrabold text-red-900">{formatRp(agingSummary.overdueOver90.amount)}</div>
                    <div className="text-[10px] font-medium text-red-600/80 mt-0.5">{agingSummary.overdueOver90.count} tagihan</div>
                  </div>
                </div>
              </div>

              {/* Table */}
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
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 italic text-muted-foreground">
                          {bills.length === 0
                            ? 'Belum ada daftar tagihan warga.'
                            : 'Tidak ada tagihan yang cocok dengan filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((b) => {
                        const isLate = b.status === 'BELUM_LUNAS' && b.dueDate && new Date() > new Date(b.dueDate) && b.type === 'IURAN';
                        const displayAmount = isLate ? Math.floor(b.amount * 1.2) : b.amount;
                        const isMyRow = currentUserId && b.user.id === currentUserId;

                        return (
                          <tr key={b.id} className={isMyRow ? 'bg-amber-50 border-l-4 border-amber-400' : ''}>
                            <td className="font-semibold text-foreground">
                              <span className={isMyRow ? 'text-amber-700' : ''}>{b.user.fullName}</span>
                              {isMyRow && (
                                <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-white">Saya</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-slate-100 text-slate-800 border border-slate-200">
                                {b.type === 'DENDA_PIKET' ? 'Denda Piket' : b.type === 'IURAN' ? 'Iuran Bulanan' : 'Lainnya'}
                              </span>
                            </td>
                            <td>
                              <div className="font-medium text-foreground">{b.title}</div>
                              {b.note && <div className="text-[10px] text-muted-foreground line-clamp-1">{b.note}</div>}
                            </td>
                            <td className="font-bold text-foreground">
                              {formatRp(displayAmount)}
                              {isLate && <div className="text-[10px] text-red-600 font-semibold">+20% Bunga Telat</div>}
                            </td>
                            <td>{formatDate(b.dueDate)}</td>
                            <td>
                              <span
                                className={`badge ${b.status === 'LUNAS'
                                    ? 'badge-success'
                                    : b.status === 'DIBATALKAN'
                                      ? 'badge-danger'
                                      : isLate
                                        ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                                        : 'badge-warning'
                                  }`}
                              >
                                {b.status === 'BELUM_LUNAS' ? (isLate ? 'NUNGGAK (JATUH TEMPO)' : 'BELUM LUNAS') : b.status}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-1">
                                {b.status === 'BELUM_LUNAS' && permissions.canUpdateBill && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedBillId(b.id);
                                        setSettleAmount(displayAmount);
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
                                    {isLate && (
                                      <button
                                        onClick={() => handleExtendDueDate(b.id)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Beri Izin Telat (Perpanjang Awal Bulan Depan)"
                                      >
                                        <Clock className="h-4.5 w-4.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 10 Debtor Chart (Tugas 3C) */}
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-md">Top 10 Warga Penunggak Terbesar</h3>
                  <p className="text-xs text-muted-foreground">Warga dengan akumulasi tagihan belum lunas terbesar.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  {[
                    { value: 'ALL' as const, label: 'Semua' },
                    { value: 'AKTIF' as const, label: 'Warga Aktif' },
                    { value: 'ALUMNI' as const, label: 'Alumni' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDebtorStatusFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                        debtorStatusFilter === opt.value
                          ? 'bg-white text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {topDebtors.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-emerald-600 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <span>Tidak ada tunggakan — semua tagihan lunas!</span>
                </div>
              ) : (
                <div className="h-96 w-full pt-4">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={topDebtors}
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorDebtorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#475569"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatRp(Number(value)), 'Total Tunggakan']}
                          contentStyle={{
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="url(#colorDebtorGradient)"
                          radius={[0, 8, 8, 0]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-border font-semibold text-foreground text-sm">
                Rekap Pembayaran & Tunggakan Warga (Klik baris untuk melihat detail tagihan)
              </div>
              <div className="table-container">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="pl-6">Nama Warga</th>
                      <th>Denda Piket</th>
                      <th>Iuran</th>
                      <th>Lainnya</th>
                      <th>Total Tunggakan</th>
                      <th>Total Dibayar</th>
                      <th className="pr-6">Kolektibilitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUserLedgers().map((led) => {
                      const isExpanded = expandedUserId === led.id;
                      const totalBills = led.paid + led.unpaid;
                      const kolektibilitas = totalBills > 0 ? (led.paid / totalBills) * 100 : 100;

                      let barColor = 'bg-red-500';
                      if (kolektibilitas > 80) {
                        barColor = 'bg-emerald-500';
                      } else if (kolektibilitas >= 50) {
                        barColor = 'bg-amber-500';
                      }

                      const isMyLedger = currentUserId && led.id === currentUserId;
                      return (
                        <Fragment key={led.id}>
                          <tr
                            className={`cursor-pointer transition-colors ${isMyLedger ? 'bg-amber-50 border-l-4 border-amber-400 hover:bg-amber-100/60' : 'hover:bg-slate-50/50'}`}
                            onClick={() => setExpandedUserId(isExpanded ? null : led.id)}
                          >
                            <td className="font-semibold text-foreground flex items-center gap-2 pl-6 py-4">
                              <span className="p-1 hover:bg-slate-100 rounded transition-colors flex items-center justify-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </span>
                              <span className={isMyLedger ? 'text-amber-700' : ''}>{led.fullName}</span>
                              {isMyLedger && (
                                <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-white">Saya</span>
                              )}
                            </td>
                            <td className="text-slate-600">{formatRp(led.dendaPiket)}</td>
                            <td className="text-slate-600">{formatRp(led.iuran)}</td>
                            <td className="text-slate-600">{formatRp(led.lainnya)}</td>
                            <td className={`font-bold ${led.unpaid > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {formatRp(led.unpaid)}
                            </td>
                            <td className="font-semibold text-emerald-600">{formatRp(led.paid)}</td>
                            <td className="pr-6">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${barColor}`}
                                    style={{ width: `${kolektibilitas}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                  {kolektibilitas.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30">
                              <td colSpan={7} className="p-4 pl-6 pr-6">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border border-border/60 rounded-xl bg-white shadow-sm overflow-hidden mb-2">
                                    <div className="p-3 bg-slate-50 border-b border-border text-xs font-bold text-slate-700">
                                      Detail Tagihan {led.fullName} ({led.billsList.length} tagihan)
                                    </div>
                                    {led.billsList.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-muted-foreground italic">
                                        Tidak ada catatan tagihan untuk warga ini.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                          <thead className="bg-slate-50/70 border-b border-border/60 text-[10px] font-bold text-muted-foreground uppercase">
                                            <tr>
                                              <th className="p-3 pl-4">Judul Tagihan</th>
                                              <th className="p-3">Jenis</th>
                                              <th className="p-3">Nominal</th>
                                              <th className="p-3">Tenggat</th>
                                              <th className="p-3">Status</th>
                                              <th className="p-3">Dibuat</th>
                                              <th className="p-3 pr-4 text-right">Aksi</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/40">
                                            {led.billsList.map((b) => {
                                              const isLate = b.status === 'BELUM_LUNAS' && b.dueDate && new Date() > new Date(b.dueDate) && b.type === 'IURAN';
                                              const displayAmount = isLate ? Math.floor(b.amount * 1.2) : b.amount;
                                              return (
                                                <tr key={b.id} className="hover:bg-slate-50/30">
                                                  <td className="p-3 pl-4 font-medium text-foreground">
                                                    {b.title}
                                                    {b.note && (
                                                      <div className="text-[9px] text-muted-foreground mt-0.5 font-normal">
                                                        {b.note}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="p-3">
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                                      {b.type === 'DENDA_PIKET' ? 'Denda Piket' : b.type === 'IURAN' ? 'Iuran Bulanan' : 'Lainnya'}
                                                    </span>
                                                  </td>
                                                  <td className="p-3 font-semibold text-slate-700">
                                                    {formatRp(displayAmount)}
                                                    {isLate && <div className="text-[9px] text-red-600 font-semibold">+20% Telat</div>}
                                                  </td>
                                                  <td className="p-3 text-slate-500">{formatDate(b.dueDate)}</td>
                                                  <td className="p-3">
                                                    <span
                                                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${b.status === 'LUNAS'
                                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                          : b.status === 'DIBATALKAN'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : isLate
                                                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                                        }`}
                                                    >
                                                      {b.status === 'BELUM_LUNAS' ? (isLate ? 'NUNGGAK' : 'BELUM LUNAS') : b.status}
                                                    </span>
                                                  </td>
                                                  <td className="p-3 text-slate-400">{formatDate(b.createdAt)}</td>
                                                  <td className="p-3 pr-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                      {b.status === 'BELUM_LUNAS' && permissions.canUpdateBill && (
                                                        <>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setSelectedBillId(b.id);
                                                              setSettleAmount(displayAmount);
                                                              setSettleNote('');
                                                              setSettleModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Konfirmasi Lunas"
                                                          >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                          </button>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleCancelBill(b.id);
                                                            }}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Batalkan Tagihan"
                                                          >
                                                            <XCircle className="h-4 w-4" />
                                                          </button>
                                                          {isLate && (
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleExtendDueDate(b.id);
                                                              }}
                                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                              title="Beri Izin Telat (Perpanjang Awal Bulan Depan)"
                                                            >
                                                              <Clock className="h-4 w-4" />
                                                            </button>
                                                          )}
                                                        </>
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 print-content"
          >
            {/* Header Laporan (no-print controls) */}
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
              <div>
                <h3 className="font-bold text-foreground text-lg">Laporan Rangkuman Bulanan</h3>
                <p className="text-xs text-muted-foreground">Pilih bulan dan tahun untuk menghasilkan laporan periodik keuangan asrama.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Bulan:</span>
                  <select
                    value={monthlyReportMonth}
                    onChange={(e) => setMonthlyReportMonth(Number(e.target.value))}
                    className="input text-sm bg-white py-1 px-2.5 max-w-[150px] focus:ring-1 focus:ring-primary focus:border-transparent"
                  >
                    {INDO_MONTHS.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Tahun:</span>
                  <select
                    value={monthlyReportYear}
                    onChange={(e) => setMonthlyReportYear(Number(e.target.value))}
                    className="input text-sm bg-white py-1 px-2.5 max-w-[100px] focus:ring-1 focus:ring-primary focus:border-transparent"
                  >
                    {[2022, 2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary text-xs flex items-center gap-1.5 font-semibold py-2 px-4 shadow-sm"
                >
                  <span>🖨</span>
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            {/* Print Header (hanya muncul saat cetak) */}
            <div className="hidden print:block text-center space-y-2 pb-6 border-b border-slate-300">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-800">Laporan Rangkuman Bulanan Keuangan SIMAS-KS</h2>
              <p className="text-sm font-semibold text-slate-600">
                Periode: {INDO_MONTHS[monthlyReportMonth]} {monthlyReportYear}
              </p>
              <p className="text-[10px] text-slate-400">Dicetak otomatis oleh Sistem Keuangan Asrama pada {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Section 1: 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Saldo Awal (Bulan Lalu) */}
              <div className="glass-card p-5 border border-border/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Awal (Bulan Lalu)</span>
                  <div className={`text-base sm:text-xl font-bold ${monthlyReport.saldoAwal >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {formatRp(monthlyReport.saldoAwal)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Tarik saldo s/d akhir bulan lalu</div>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              {/* Pemasukan */}
              <div className="glass-card p-5 border border-border/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pemasukan Periode Ini</span>
                  <div className="text-base sm:text-xl font-bold text-emerald-600">{formatRp(monthlyReport.pemasukan)}</div>
                  <div className="text-[9px] text-muted-foreground">{monthlyReport.txs.filter(t => t.type === 'PEMASUKAN').length} transaksi masuk</div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              {/* Pengeluaran */}
              <div className="glass-card p-5 border border-border/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pengeluaran Periode Ini</span>
                  <div className="text-base sm:text-xl font-bold text-red-600">{formatRp(monthlyReport.pengeluaran)}</div>
                  <div className="text-[9px] text-muted-foreground">{monthlyReport.txs.filter(t => t.type === 'PENGELUARAN').length} transaksi keluar</div>
                </div>
                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>

              {/* Total Saldo Akhir */}
              <div className="glass-card p-5 border border-border/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Saldo Kas Akhir</span>
                  <div className={`text-base sm:text-xl font-bold ${monthlyReport.saldoAkhirTotal >= 0 ? 'text-primary' : 'text-red-700'}`}>
                    {formatRp(monthlyReport.saldoAkhirTotal)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Saldo Awal + Selisih Kas ({monthlyReport.saldo >= 0 ? '+' : ''}{formatRp(monthlyReport.saldo)})</div>
                </div>
                <div className="p-2.5 bg-blue-50 text-primary rounded-lg">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Section 2: Rincian per Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rincian Pemasukan */}
              <div className="glass p-5 rounded-2xl border border-border/40 shadow-sm space-y-4">
                <h4 className="font-bold text-foreground text-sm border-b border-border/50 pb-2 flex items-center justify-between">
                  <span>Rincian Kategori Pemasukan</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">PEMASUKAN</span>
                </h4>

                <div className="table-container">
                  <table className="table w-full text-xs">
                    <thead>
                      <tr>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-center">Jumlah Transaksi</th>
                        <th className="py-2 px-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.categoryPemList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-6 italic text-muted-foreground">Belum ada pemasukan di bulan ini.</td>
                        </tr>
                      ) : (
                        monthlyReport.categoryPemList.map((cat, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-foreground">{cat.category}</td>
                            <td className="py-2 px-3 text-center">{cat.count} tx</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">{formatRp(cat.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {monthlyReport.categoryPemList.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-border font-bold">
                          <td className="py-2 px-3">Total Pemasukan</td>
                          <td className="py-2 px-3 text-center">{monthlyReport.categoryPemList.reduce((sum, c) => sum + c.count, 0)} tx</td>
                          <td className="py-2 px-3 text-right text-emerald-600">{formatRp(monthlyReport.pemasukan)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Donut Chart Pemasukan */}
                {monthlyReport.categoryPemList.length > 0 && (
                  <div className="space-y-2">
                    <div className="h-72 w-full flex items-center justify-center relative">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={monthlyReport.categoryPemList.map(c => ({ name: c.category, value: c.amount }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              labelLine={{
                                stroke: '#94a3b8',
                                strokeWidth: 1.5,
                                strokeDasharray: '0',
                              }}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 28;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const pct = (percent * 100).toFixed(1);
                                const isLeft = x < cx;
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    textAnchor={isLeft ? 'end' : 'start'}
                                    dominantBaseline="central"
                                    style={{ fontSize: '10px', fill: '#475569', fontWeight: 600 }}
                                  >
                                    {`${name.length > 10 ? name.slice(0, 10) + '…' : name} ${pct}%`}
                                  </text>
                                );
                              }}
                            >
                              {monthlyReport.categoryPemList.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PEMASUKAN_COLORS[index % PEMASUKAN_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [formatRp(Number(value)), name]}
                              contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      )}
                    </div>
                    {/* Legend Teks Manual */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-2">
                      {monthlyReport.categoryPemList.map((cat, index) => {
                        const total = monthlyReport.pemasukan;
                        const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0';
                        return (
                          <div key={index} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PEMASUKAN_COLORS[index % PEMASUKAN_COLORS.length] }}
                            />
                            <span className="text-[10px] font-semibold text-slate-600">{cat.category}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rincian Pengeluaran */}
              <div className="glass p-5 rounded-2xl border border-border/40 shadow-sm space-y-4">
                <h4 className="font-bold text-foreground text-sm border-b border-border/50 pb-2 flex items-center justify-between">
                  <span>Rincian Kategori Pengeluaran</span>
                  <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded">PENGELUARAN</span>
                </h4>

                <div className="table-container">
                  <table className="table w-full text-xs">
                    <thead>
                      <tr>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-center">Jumlah Transaksi</th>
                        <th className="py-2 px-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.categoryPengList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-6 italic text-muted-foreground">Belum ada pengeluaran di bulan ini.</td>
                        </tr>
                      ) : (
                        monthlyReport.categoryPengList.map((cat, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-foreground">{cat.category}</td>
                            <td className="py-2 px-3 text-center">{cat.count} tx</td>
                            <td className="py-2 px-3 text-right font-bold text-red-600">{formatRp(cat.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {monthlyReport.categoryPengList.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-border font-bold">
                          <td className="py-2 px-3">Total Pengeluaran</td>
                          <td className="py-2 px-3 text-center">{monthlyReport.categoryPengList.reduce((sum, c) => sum + c.count, 0)} tx</td>
                          <td className="py-2 px-3 text-right text-red-600">{formatRp(monthlyReport.pengeluaran)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Donut Chart Pengeluaran */}
                {monthlyReport.categoryPengList.length > 0 && (
                  <div className="space-y-2">
                    <div className="h-72 w-full flex items-center justify-center relative">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={monthlyReport.categoryPengList.map(c => ({ name: c.category, value: c.amount }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              labelLine={{
                                stroke: '#94a3b8',
                                strokeWidth: 1.5,
                                strokeDasharray: '0',
                              }}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 28;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const pct = (percent * 100).toFixed(1);
                                const isLeft = x < cx;
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    textAnchor={isLeft ? 'end' : 'start'}
                                    dominantBaseline="central"
                                    style={{ fontSize: '10px', fill: '#475569', fontWeight: 600 }}
                                  >
                                    {`${name.length > 10 ? name.slice(0, 10) + '…' : name} ${pct}%`}
                                  </text>
                                );
                              }}
                            >
                              {monthlyReport.categoryPengList.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PENGELUARAN_COLORS[index % PENGELUARAN_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [formatRp(Number(value)), name]}
                              contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      )}
                    </div>
                    {/* Legend Teks Manual */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-2">
                      {monthlyReport.categoryPengList.map((cat, index) => {
                        const total = monthlyReport.pengeluaran;
                        const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0';
                        return (
                          <div key={index} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PENGELUARAN_COLORS[index % PENGELUARAN_COLORS.length] }}
                            />
                            <span className="text-[10px] font-semibold text-slate-600">{cat.category}</span>
                            <span className="text-[10px] text-red-600 font-bold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Rekap Tunggakan */}
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-6">
              <div>
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Rekap Tunggakan & Kolektibilitas Bulan {INDO_MONTHS[monthlyReportMonth]} {monthlyReportYear}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">Analisis status penagihan iuran dan denda yang diterbitkan pada bulan ini.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider mb-1">Total Tagihan Terbit</span>
                  <span className="text-base font-extrabold text-foreground">{formatRp(monthlyReport.totalBillsAmount)}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Jumlah: {monthlyReport.totalBillsCount} tagihan</span>
                </div>
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-wider mb-1">Sudah Lunas</span>
                  <span className="text-base font-extrabold text-emerald-600">{formatRp(monthlyReport.lunasAmount)}</span>
                  <span className="text-[10px] text-emerald-500/80 block mt-0.5">Jumlah: {monthlyReport.lunasCount} tagihan</span>
                </div>
                <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
                  <span className="text-[10px] text-amber-600 block font-bold uppercase tracking-wider mb-1">Masih Tunggak</span>
                  <span className="text-base font-extrabold text-amber-600">{formatRp(monthlyReport.belumLunasAmount)}</span>
                  <span className="text-[10px] text-amber-500/80 block mt-0.5">Jumlah: {monthlyReport.belumLunasCount} tagihan</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Tingkat Kolektibilitas Tagihan Terbit</span>
                  <span>{monthlyReport.kolektibilitas.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-amber-500"
                    style={{ width: `${monthlyReport.kolektibilitas}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                    {monthlyReport.kolektibilitas.toFixed(1)}% Kolektibilitas
                  </div>
                </div>
              </div>

              {/* Tabel warga yang masih menunggak iuran bulan itu */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-foreground">Daftar Warga yang Belum Melunasi Tagihan Terbit Periode Ini</h5>
                <div className="table-container">
                  <table className="table w-full text-xs">
                    <thead>
                      <tr>
                        <th className="py-2 px-3">Nama</th>
                        <th className="py-2 px-3">Total Tagihan</th>
                        <th className="py-2 px-3">Jenis Tagihan</th>
                        <th className="py-2 px-3">Nominal</th>
                        <th className="py-2 px-3">Durasi Waktu</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.overdueDebtors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 italic text-muted-foreground text-emerald-600 font-medium">
                            Semua tagihan terbit periode ini telah lunas! 🎉
                          </td>
                        </tr>
                      ) : (
                        monthlyReport.overdueDebtors.map((deb, idx) => (
                          <DebtorRow key={idx} deb={deb} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 4: Tabel Detail Transaksi Bulan */}
            <div className="glass p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Detail Seluruh Transaksi Bulan {INDO_MONTHS[monthlyReportMonth]} {monthlyReportYear}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">Daftar lengkap pemasukan dan pengeluaran kas yang dibukukan pada periode ini.</p>
              </div>

              <div className="table-container">
                <table className="table w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.txs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 italic text-muted-foreground">
                          Belum ada transaksi arus kas pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      monthlyReport.txs.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-3 px-4">{formatDate(tx.occurredAt)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`badge ${tx.type === 'PEMASUKAN' ? 'badge-success' : 'badge-danger'
                                }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{tx.category}</td>
                          <td className="py-3 px-4 text-right font-bold ${tx.type === 'PEMASUKAN' ? 'text-emerald-600' : 'text-red-600'}">
                            {tx.type === 'PEMASUKAN' ? '+' : '-'} {formatRp(tx.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthlyReport.txs.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-border font-semibold text-slate-700">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-4 text-right">Total Pemasukan</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600">{formatRp(monthlyReport.pemasukan)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="py-2.5 px-4 text-right">Total Pengeluaran</td>
                        <td className="py-2.5 px-4 text-right text-red-600">{formatRp(monthlyReport.pengeluaran)}</td>
                      </tr>
                      <tr className="border-t border-slate-300 font-extrabold text-sm text-foreground bg-slate-100/50">
                        <td colSpan={4} className="py-3 px-4 text-right">Saldo Bersih</td>
                        <td className={`py-3 px-4 text-right ${monthlyReport.saldo >= 0 ? 'text-primary' : 'text-red-700'}`}>
                          {formatRp(monthlyReport.saldo)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </motion.div>
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
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
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
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${newTx.type === 'PEMASUKAN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'
                      }`}
                  >
                    PEMASUKAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: 'PENGELUARAN' })}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${newTx.type === 'PENGELUARAN' ? 'bg-white text-red-600 shadow-sm' : 'text-muted-foreground'
                      }`}
                  >
                    PENGELUARAN
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
                  <select
                    required
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {newTx.type === 'PENGELUARAN' ? (
                      <>
                        <option value="Uang Sampah">Uang Sampah</option>
                        <option value="Uang WiFi">Uang WiFi</option>
                        <option value="Uang Divisi Kebersihan">Uang Divisi Kebersihan</option>
                        <option value="Uang Divisi Kesenian">Uang Divisi Kesenian</option>
                        <option value="Uang Divisi Olahraga">Uang Divisi Olahraga</option>
                        <option value="Uang Divisi Keamanan">Uang Divisi Keamanan</option>
                        <option value="Uang Kerja Bakti">Uang Kerja Bakti</option>
                        <option value="Uang Rapat RT">Uang Rapat RT</option>
                        <option value="Uang Rapat Bulanan">Uang Rapat Bulanan</option>
                        <option value="Uang Air Galon">Uang Air Galon</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </>
                    ) : (
                      <>
                        <option value="Kas">Kas</option>
                        <option value="WiFi">WiFi</option>
                        <option value="Hutang">Hutang</option>
                        <option value="Uang Sumbangan">Uang Sumbangan</option>
                        <option value="Denda">Denda</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </>
                    )}
                  </select>
                </div>

                {newTx.category === 'Lain-lain' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Tulis Kategori Secara Manual</label>
                    <input
                      type="text"
                      required
                      value={customTxCategory}
                      onChange={(e) => setCustomTxCategory(e.target.value)}
                      placeholder="Contoh: Beli Sapu, dll..."
                      className="input text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nominal (Rupiah)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                    <input
                      type="text"
                      required
                      value={formatThousand(newTx.amount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setNewTx({ ...newTx, amount: rawValue });
                      }}
                      placeholder="Masukkan jumlah nominal uang..."
                      className="input text-sm !pl-9 font-semibold"
                    />
                  </div>
                  {newTx.type === 'PENGELUARAN' && (
                    <p className="text-[11px] text-muted-foreground">
                      Saldo tersedia: {formatRp(saldo)}
                    </p>
                  )}
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
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
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

              <form onSubmit={handleAddBulkBill} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Judul Tagihan</label>
                  <input
                    type="text"
                    required
                    value={bulkBillTitle}
                    onChange={(e) => setBulkBillTitle(e.target.value)}
                    placeholder="Contoh: Iuran Bulanan Juni 2026"
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tenggat Waktu / Due Date</label>
                  <input
                    type="date"
                    required
                    value={bulkBillDueDate}
                    onChange={(e) => setBulkBillDueDate(e.target.value)}
                    className="input text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Lewat dari tanggal ini, nominal pelunasan akan berbunga 20% otomatis.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Pilih Warga & Opsi Tagihan</label>
                      <p className="text-[11px] text-slate-500">
                        Calon Warga otomatis diset <span className="font-semibold text-amber-700">Hanya WiFi (Rp {iuranConfig.wifiAddon.toLocaleString('id-ID')})</span>.
                      </p>
                    </div>

                    {/* Filter Tab */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setBulkBillRoleFilter('ALL')}
                        className={`px-2 py-1 rounded-md transition-all ${bulkBillRoleFilter === 'ALL' ? 'bg-white shadow-xs text-primary' : 'text-muted-foreground'}`}
                      >
                        Semua ({users.filter(u => u.status === 'AKTIF').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkBillRoleFilter('WARGA')}
                        className={`px-2 py-1 rounded-md transition-all ${bulkBillRoleFilter === 'WARGA' ? 'bg-white shadow-xs text-primary' : 'text-muted-foreground'}`}
                      >
                        Warga ({users.filter(u => u.status === 'AKTIF' && !u.roles?.includes('CALON_WARGA')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkBillRoleFilter('CALON_WARGA')}
                        className={`px-2 py-1 rounded-md transition-all ${bulkBillRoleFilter === 'CALON_WARGA' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-muted-foreground'}`}
                      >
                        Calon Warga ({users.filter(u => u.status === 'AKTIF' && u.roles?.includes('CALON_WARGA')).length})
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...bulkBillData };
                        Object.keys(updated).forEach(k => updated[k].selected = true);
                        setBulkBillData(updated);
                      }}
                      className="text-[10px] bg-slate-100 px-2 py-1 rounded font-semibold hover:bg-slate-200"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...bulkBillData };
                        Object.keys(updated).forEach(k => updated[k].selected = false);
                        setBulkBillData(updated);
                      }}
                      className="text-[10px] bg-slate-100 px-2 py-1 rounded font-semibold hover:bg-slate-200"
                    >
                      Batal Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...bulkBillData };
                        users.filter(u => u.status === 'AKTIF' && u.roles?.includes('CALON_WARGA')).forEach(u => {
                          if (updated[u.id]) {
                            updated[u.id].tier = 'WIFI_ONLY';
                            updated[u.id].selected = true;
                          }
                        });
                        setBulkBillData(updated);
                      }}
                      className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded font-semibold hover:bg-amber-100"
                    >
                      Reset Calon Warga (WiFi Saja)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...bulkBillData };
                        users.filter(u => u.status === 'AKTIF' && !u.roles?.includes('CALON_WARGA')).forEach(u => {
                          if (updated[u.id]) {
                            updated[u.id].tier = 'FULL';
                            updated[u.id].selected = true;
                          }
                        });
                        setBulkBillData(updated);
                      }}
                      className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-semibold hover:bg-emerald-100"
                    >
                      Set Warga Di Asrama (Full)
                    </button>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                    {users
                      .filter(u => u.status === 'AKTIF')
                      .filter(u => {
                        if (bulkBillRoleFilter === 'WARGA') return !u.roles?.includes('CALON_WARGA');
                        if (bulkBillRoleFilter === 'CALON_WARGA') return u.roles?.includes('CALON_WARGA');
                        return true;
                      })
                      .map(u => {
                        const isCalonWarga = u.roles?.includes('CALON_WARGA');
                        const isSelected = bulkBillData[u.id]?.selected || false;
                        const currentTier = bulkBillData[u.id]?.tier || (isCalonWarga ? 'WIFI_ONLY' : 'FULL');

                        // Hitung harga per tier
                        let userPrice = iuranConfig.baseAmount + iuranConfig.wifiAddon;
                        if (currentTier === 'WIFI_ONLY') userPrice = iuranConfig.wifiAddon;
                        else if (currentTier === 'BASE_ONLY') userPrice = iuranConfig.baseAmount;

                        return (
                          <div
                            key={u.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border transition-all ${
                              isSelected
                                ? isCalonWarga
                                  ? 'bg-amber-50/70 border-amber-200'
                                  : 'bg-white border-blue-100 shadow-2xs'
                                : 'bg-slate-100/60 border-transparent opacity-60'
                            }`}
                          >
                            {/* Checkbox & User Info */}
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  setBulkBillData(prev => ({
                                    ...prev,
                                    [u.id]: {
                                      selected: e.target.checked,
                                      tier: prev[u.id]?.tier || (isCalonWarga ? 'WIFI_ONLY' : 'FULL'),
                                    }
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-slate-800 truncate">{u.fullName}</span>
                                {isCalonWarga ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Calon Warga
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                    Warga
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tier Selector & Price Badge */}
                            {isSelected && (
                              <div className="flex items-center justify-between sm:justify-end gap-2 pl-6 sm:pl-0">
                                <span className="text-xs font-bold text-slate-700">
                                  Rp {userPrice.toLocaleString('id-ID')}
                                </span>

                                {/* Tier Buttons */}
                                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                                  {isCalonWarga ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBulkBillData(prev => ({
                                            ...prev,
                                            [u.id]: { ...prev[u.id], tier: 'WIFI_ONLY' }
                                          }));
                                        }}
                                        className={`px-2 py-1 rounded-md transition-all ${currentTier === 'WIFI_ONLY' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        WiFi Saja
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBulkBillData(prev => ({
                                            ...prev,
                                            [u.id]: { ...prev[u.id], tier: 'FULL' }
                                          }));
                                        }}
                                        className={`px-2 py-1 rounded-md transition-all ${currentTier === 'FULL' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        +Iuran Asrama
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBulkBillData(prev => ({
                                            ...prev,
                                            [u.id]: { ...prev[u.id], tier: 'FULL' }
                                          }));
                                        }}
                                        className={`px-2 py-1 rounded-md transition-all ${currentTier === 'FULL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        Di Asrama (+WiFi)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBulkBillData(prev => ({
                                            ...prev,
                                            [u.id]: { ...prev[u.id], tier: 'BASE_ONLY' }
                                          }));
                                        }}
                                        className={`px-2 py-1 rounded-md transition-all ${currentTier === 'BASE_ONLY' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        Luar Asrama (-WiFi)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBulkBillData(prev => ({
                                            ...prev,
                                            [u.id]: { ...prev[u.id], tier: 'WIFI_ONLY' }
                                          }));
                                        }}
                                        className={`px-2 py-1 rounded-md transition-all ${currentTier === 'WIFI_ONLY' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        WiFi Saja
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Summary Info */}
                {(() => {
                  const selectedList = Object.entries(bulkBillData).filter(([_, d]) => d.selected);
                  const countCalon = selectedList.filter(([id]) => users.find(u => u.id === id)?.roles?.includes('CALON_WARGA')).length;
                  const countWarga = selectedList.length - countCalon;
                  const totalEst = selectedList.reduce((sum, [id, d]) => {
                    if (d.tier === 'WIFI_ONLY') return sum + iuranConfig.wifiAddon;
                    if (d.tier === 'BASE_ONLY') return sum + iuranConfig.baseAmount;
                    return sum + iuranConfig.baseAmount + iuranConfig.wifiAddon;
                  }, 0);

                  return (
                    <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">Total Ditagih: </span>
                        <span className="font-bold text-primary">{selectedList.length} Orang</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          ({countWarga} Warga, {countCalon} Calon Warga)
                        </span>
                      </div>
                      <div className="font-bold text-sm text-foreground">
                        Rp {totalEst.toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })()}

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
                    Buat Tagihan Massal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Catat Hutang/Piutang Perorangan */}
      <AnimatePresence>
        {individualBillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIndividualBillModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Catat Hutang Perorangan</h3>
                <button
                  onClick={() => setIndividualBillModalOpen(false)}
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

              <form onSubmit={handleAddIndividualBill} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pilih Warga / Alumni</label>
                  <select
                    required
                    value={newIndividualBill.userId}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, userId: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="">-- Pilih Warga / Alumni --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.status === 'AKTIF' ? 'Warga Aktif' : 'Alumni'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Jenis Tagihan</label>
                  <select
                    required
                    value={newIndividualBill.type}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, type: e.target.value as any })}
                    className="input text-sm"
                  >
                    <option value="IURAN">Iuran Warga</option>
                    <option value="DENDA_PIKET">Denda Piket</option>
                    <option value="IURAN_OLAHRAGA">Iuran Olahraga</option>
                    <option value="DENDA_OLAHRAGA">Denda Olahraga</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Judul Hutang / Tagihan</label>
                  <input
                    type="text"
                    required
                    value={newIndividualBill.title}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, title: e.target.value })}
                    placeholder="Contoh: Hutang Iuran Semester Ganjil 2024"
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nominal (Rupiah)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                    <input
                      type="text"
                      required
                      value={formatThousand(newIndividualBill.amount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setNewIndividualBill({ ...newIndividualBill, amount: rawValue });
                      }}
                      placeholder="Masukkan nominal hutang..."
                      className="input text-sm !pl-9 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tanggal Mulai Hutang</label>
                  <input
                    type="date"
                    required
                    value={newIndividualBill.createdAt}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, createdAt: e.target.value })}
                    className="input text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Tanggal pencatatan asli (misalnya tanggal di masa lampau).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tenggat Waktu / Due Date (Opsional)</label>
                  <input
                    type="date"
                    value={newIndividualBill.dueDate}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, dueDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Catatan / Keterangan (Opsional)</label>
                  <textarea
                    value={newIndividualBill.note}
                    onChange={(e) => setNewIndividualBill({ ...newIndividualBill, note: e.target.value })}
                    placeholder="Tulis keterangan tambahan..."
                    className="input text-sm min-h-[80px] py-2"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIndividualBillModalOpen(false)}
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
                    Catat Hutang
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
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
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
                  <label className="text-xs font-semibold text-muted-foreground">Nominal Dibayarkan (Rupiah)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                    <input
                      type="text"
                      required
                      value={formatThousand(settleAmount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const val = rawValue ? parseInt(rawValue) : 0;
                        setSettleAmount(val);
                      }}
                      className="input text-sm font-bold text-foreground !pl-9"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Nominal ini otomatis menyertakan bunga 20% jika tagihan sudah lewat tenggat waktu.</p>
                </div>

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

{/* ── Sub Component: IuranConfigCard ── */}
function IuranConfigCard({
  config,
  onSave,
}: {
  config: { baseAmount: number; wifiAddon: number };
  onSave: (baseAmount: number, wifiAddon: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [baseAmt, setBaseAmt] = useState(config.baseAmount);
  const [wifiAmt, setWifiAmt] = useState(config.wifiAddon);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const handleSave = async () => {
    if (baseAmt < 0 || wifiAmt < 0) return;
    setSaving(true);
    try {
      await onSave(baseAmt, wifiAmt);
      setFeedback('success');
      setEditing(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setBaseAmt(config.baseAmount);
    setWifiAmt(config.wifiAddon);
    setEditing(false);
    setFeedback(null);
  };

  const baseWifi = config.baseAmount + config.wifiAddon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
          <Settings2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Atur Harga Tagihan Bulanan</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Harga berlaku untuk tagihan massal (Iuran + WiFi) warga asrama
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
          >
            Ubah Harga
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary text-xs !px-4 !py-2"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Iuran Dasar (Tanpa WiFi)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
              <input
                type="text"
                value={formatThousand(baseAmt)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setBaseAmt(rawValue ? parseInt(rawValue) : 0);
                }}
                className="input text-sm !pl-9"
                placeholder="50.000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Tambahan WiFi
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
              <input
                type="text"
                value={formatThousand(wifiAmt)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setWifiAmt(rawValue ? parseInt(rawValue) : 0);
                }}
                className="input text-sm !pl-9"
                placeholder="30.000"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PriceTag label="Iuran Pokok Warga" value={config.baseAmount} tone="slate" />
          <PriceTag label="WiFi / Calon Warga" value={config.wifiAddon} tone="blue" />
          <PriceTag label="Iuran + WiFi (Full)" value={baseWifi} tone="emerald" />
        </div>
      )}

      {feedback === 'success' && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          Harga tagihan berhasil diperbarui.
        </div>
      )}
    </motion.div>
  );
}

function PriceTag({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'blue' | 'emerald' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  };
  return (
    <div className={`rounded-xl ${colors[tone]} px-4 py-2.5`}>
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</span>
      <p className="mt-0.5 text-base font-bold">Rp {value.toLocaleString('id-ID')}</p>
    </div>
  );
}
