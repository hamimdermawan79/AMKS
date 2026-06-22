"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useMemo } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 14 },
  },
};

export default function UserDashboard({
  session,
  showAdminButton,
  divisionManageHref,
}: {
  session: any;
  showAdminButton: boolean;
  divisionManageHref?: string;
}) {
  const greeting = useMemo(() => getGreeting(), []);
  const name = session?.user?.fullName ?? "Pengguna";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ===== HERO GREETING ===== */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-50 via-blue-50/40 to-white p-8 md:p-10"
      >
        {/* Decorative shapes */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-indigo-100/40 blur-2xl" />
        <div className="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-sky-100/40 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase font-bold tracking-wider mb-3 inline-flex items-center gap-2 shadow-sm backdrop-blur-sm">
              {roleNames.find((r: string) => r !== 'WARGA') || 'Warga'}
            </span>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{greeting}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Halo, <span className="text-primary">{name}</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Selamat datang di dashboard AMKS. Kelola aktivitas, tagihan, dan
              jadwal piket Anda dengan mudah dan transparan.
            </p>
          </div>

          {showAdminButton && (
            <Link
              href="/admin/warga"
              className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md"
            >
              <ShieldCheck className="h-4 w-4" />
              Akses Admin Panel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          
        </div>
      </motion.div>

      {/* ===== QUICK STATS ===== */}
      <motion.div variants={item} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={<User className="h-5 w-5 text-emerald-600" />}
          label="Status Keanggotaan"
          value={session?.user?.status || "AKTIF"}
          badgeTone="emerald"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
          label="Jabatan"
          value={roleNames.find((r: string) => r !== 'WARGA') || 'Warga'}
          badgeTone="blue"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-amber-600" />}
          label="Total Tagihan"
          value="Rp 0"
          badgeTone="amber"
        />
      </motion.div>

      {/* ===== CONTENT GRID ===== */}
      <motion.div variants={item} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard
            icon={<CreditCard className="h-5 w-5" />}
            title="Tagihan Saya"
            description="Tidak ada tagihan saat ini"
            empty
          />
          <SectionCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="Kegiatan Terdekat"
            description="Belum ada kegiatan terjadwal"
            empty
          />
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <SectionCard
            icon={<Clock className="h-5 w-5" />}
            title="Jadwal Piket Saya"
            description="Belum ada jadwal piket"
            empty
          />

          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/40 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Pengumuman</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Saat ini tidak ada pengumuman baru. Pantau terus dashboard ini
                untuk informasi terkini dari pengurus AMKS.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ===================== Subcomponents ===================== */

function StatCard({
  icon,
  label,
  value,
  badgeTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badgeTone: "emerald" | "blue" | "amber";
}) {
  const toneMap = {
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber:
      "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl border p-2.5 ${toneMap[badgeTone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </motion.div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  empty?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.003 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/60 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}
