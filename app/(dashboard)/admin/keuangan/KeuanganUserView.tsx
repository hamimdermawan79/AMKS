"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Receipt,
  XCircle,
} from "lucide-react";

type Bill = {
  id: string;
  type: string;
  title: string;
  amount: number;
  status: string;
  dueDate: string | null;
  note: string | null;
  createdAt: string;
};

type Props = {
  canManage: boolean;
  bills: Bill[];
  totalUtang: number;
  totalLunas: number;
};

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function billTypeLabel(type: string) {
  switch (type) {
    case "DENDA_PIKET":
      return "Denda Piket";
    case "IURAN":
      return "Iuran";
    case "IURAN_OLAHRAGA":
      return "Iuran Olahraga";
    case "DENDA_OLAHRAGA":
      return "Denda Olahraga";
    default:
      return "Lainnya";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "LUNAS":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <XCircle className="h-3 w-3" /> Dibatalkan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
          <Clock className="h-3 w-3" /> Belum Lunas
        </span>
      );
  }
}

export default function KeuanganUserView({
  canManage,
  bills,
  totalUtang,
  totalLunas,
}: Props) {
  const pendingBills = bills.filter((b) => b.status === "BELUM_LUNAS");
  const paidBills = bills.filter((b) => b.status === "LUNAS");
  const cancelledBills = bills.filter((b) => b.status === "DIBATALKAN");

  // Check for overdue bills
  const now = new Date();
  const overdueBills = pendingBills.filter(
    (b) => b.dueDate && new Date(b.dueDate) < now
  );

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Keuangan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lihat tagihan, denda, dan status pembayaran Anda.
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/keuangan/kelola"
            className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
          >
            <ShieldCheck className="h-4 w-4" />
            Akses Layanan Admin
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-red-50 via-white to-white p-6 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-100/50 blur-2xl" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="rounded-xl bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Total Tagihan</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {fmtCurrency(totalUtang)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingBills.length} tagihan belum lunas
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Sudah Dibayar</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {fmtCurrency(totalLunas)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {paidBills.length} tagihan lunas
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Jatuh Tempo</h3>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {overdueBills.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              tagihan melewati tenggat
            </p>
          </div>
        </motion.div>
      </div>

      {/* ===== TAGIHAN BELUM LUNAS ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="rounded-xl bg-red-50 p-2 text-red-600">
            <Receipt className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-foreground">
            Tagihan Belum Lunas
          </h2>
          {pendingBills.length > 0 && (
            <span className="ml-auto rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
              {pendingBills.length}
            </span>
          )}
        </div>
        {pendingBills.length > 0 ? (
          <div className="space-y-3">
            {pendingBills.map((bill) => {
              const isOverdue =
                bill.dueDate && new Date(bill.dueDate) < now;
              return (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isOverdue
                      ? "border-red-200 bg-red-50/50"
                      : "border-border bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {bill.title}
                      </p>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {billTypeLabel(bill.type)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Dibuat: {fmtDate(bill.createdAt)}</span>
                      {bill.dueDate && (
                        <span
                          className={
                            isOverdue ? "font-medium text-red-600" : ""
                          }
                        >
                          Jatuh tempo: {fmtDate(bill.dueDate)}
                          {isOverdue && " (terlambat)"}
                        </span>
                      )}
                    </div>
                    {bill.note && (
                      <p className="mt-1 text-xs text-muted-foreground/70 italic">
                        {bill.note}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">
                      {fmtCurrency(bill.amount)}
                    </p>
                    {statusBadge(bill.status)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/60 py-10 text-center">
            <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Tidak ada tagihan yang belum lunas. 
            </p>
          </div>
        )}
      </div>

      {/* ===== RIWAYAT PEMBAYARAN ===== */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <Banknote className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-foreground">
            Riwayat Pembayaran
          </h2>
        </div>
        {paidBills.length > 0 || cancelledBills.length > 0 ? (
          <div className="space-y-2">
            {[...paidBills, ...cancelledBills].map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {bill.title}
                    </p>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {billTypeLabel(bill.type)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtDate(bill.createdAt)}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3 flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">
                    {fmtCurrency(bill.amount)}
                  </p>
                  {statusBadge(bill.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada riwayat pembayaran.
          </p>
        )}
      </div>
    </div>
  );
}
