/**
 * RESTORE SCRIPT: Keuangan Asrama AMKS
 * Dibuat dari screenshot data keuangan asli sebelum insiden TRUNCATE TABLE.
 * 
 * Verifikasi Data:
 * - Total Tagihan: 263 (191 Belum Lunas, 70 Lunas, 2 Dibatalkan)
 * - Total Piutang Warga: Rp 13.728.399
 * - Total Transaksi Arus Kas: 140 (89 Pemasukan Rp 4.827.000, 51 Pengeluaran Rp 3.996.000)
 * - Saldo Kas Asrama: Rp 831.000 (Sisa Bulan Lalu: Rp 996.000)
 * - Pemasukan November 2026: Rp 670.000 (15 tx)
 * - Pengeluaran November 2026: Rp 835.000 (13 tx)
 * 
 * Jalankan di VPS:
 *   npx tsx prisma/scripts/restore-keuangan.ts --force
 */

import { PrismaClient, BillType, BillStatus, TxType } from '@prisma/client';

const db = new PrismaClient();

// Helper untuk normalisasi teks pencocokan nama & judul
function normalize(s: string | null | undefined): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Map user ID dari DB
const USERS: Record<string, string> = {};
let ADMIN_ID = '';

function uid(name: string): string {
  if (USERS[name]) return USERS[name];
  // partial match
  const nKey = normalize(name);
  for (const [k, v] of Object.entries(USERS)) {
    const kNorm = normalize(k);
    if (kNorm.includes(nKey) || nKey.includes(kNorm) || (kNorm.slice(0, 5) === nKey.slice(0, 5))) {
      return v;
    }
  }
  throw new Error(`User tidak ditemukan di DB: "${name}"`);
}

// =====================================================================
// 1. DATA TAGIHAN WARGA (263 TAGIHAN)
// =====================================================================

type BillItem = {
  user: string;
  type: BillType;
  title: string;
  amount: number;
  status: BillStatus;
  dueDate?: string;
  createdAt?: string;
  note?: string;
};

const BILLS: BillItem[] = [
  { user: "Wira Yuda", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Sayid Shobari", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Ramadhan", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Muhammad Nuryl faisza", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 13333, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal (Bayar Rp60.000, sisa Rp16.000)" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Kenedy Wijaya", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Duta Perdana Putra", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 30000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Desta Iman Hadi", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Azhar Rizqullah", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal Catatan Pelunasan: Seabank kas dan wifi Azhar" },
  { user: "Afif Akbari", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Adji Nugroho", type: "IURAN", title: "Iuran Bulanan November 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-11-19", createdAt: "2026-11-19", note: "Dibuat secara massal" },
  { user: "Wira Yuda", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 46000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal (Bayar Rp50.000, sisa Rp46.000)" },
  { user: "Sayid Shobari", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Ramadhan", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Muhammad Nuryl faisza", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Kenedy Wijaya", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Duta Perdana Putra", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 30000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Desta Iman Hadi", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 50000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Azhar Rizqullah", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Afif Akbari", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 80000, status: "LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal" },
  { user: "Adji Nugroho", type: "IURAN", title: "Iuran Bulanan Oktober 2026", amount: 46000, status: "BELUM_LUNAS", dueDate: "2026-10-20", createdAt: "2026-10-20", note: "Dibuat secara massal (Bayar Rp50.000, sisa Rp46.000)" },
  { user: "Wira Yuda", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Sayid Shobari", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Ramadhan", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Muhammad Nuryl faisza", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Kenedy Wijaya", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Duta Perdana Putra", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 30000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Desta Iman Hadi", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Azhar Rizqullah", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Afif Akbari", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 80000, status: "LUNAS", dueDate: "2026-09-20", createdAt: "2026-09-20" },
  { user: "Adji Nugroho", type: "IURAN", title: "Iuran Bulanan September 2026", amount: 50000, status: "BELUM_LUNAS", dueDate: "2026-09-30", createdAt: "2026-09-30", note: "Dibuat secara massal (Izin telat; diperpanjang tanpa denda hingga awal bulan) Catatan admin" },
  { user: "Wira Yuda", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 80000, status: "LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 49000, status: "BELUM_LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) (Bayar Rp36.000, sisa Rp60.000)" },
  { user: "Afif Akbari", type: "IURAN", title: "Iuran Bulanan Agustus 2026", amount: 80000, status: "LUNAS", dueDate: "2026-08-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) (Bayar Rp6.000, sisa Rp80.000)" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "hutang dibulan juli2026", amount: 40000, status: "LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) Catatan Cicilan: Khalid 20k (Bayar Rp20.000, sisa Rp40.000)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang dibulan juli2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang dibulan juli2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Hamim Dermawan", type: "IURAN", title: "hutang dibulan juli2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Afif Akbari", type: "IURAN", title: "hutang dibulan juli2026", amount: 80000, status: "LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Adji Nugroho", type: "IURAN", title: "hutang dibulan juli 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang dibulan juli 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-07-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "hutang dibulan juni 2026", amount: 80000, status: "LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang dibulan juni 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Adji Nugroho", type: "IURAN", title: "hutang dibulan juni 2026", amount: 20000, status: "BELUM_LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "hutang dibulan juni 2026", amount: 80000, status: "LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) Catatan Pelunasan: Lunas Khalid" },
  { user: "Wira Yuda", type: "IURAN", title: "hutang dibulan juni 2026", amount: 50000, status: "BELUM_LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang dibulan juni 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang dibulan juni 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-06-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Adji Nugroho", type: "IURAN", title: "hutang dibulan mei 2026", amount: 50000, status: "BELUM_LUNAS", dueDate: "2026-05-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Wira Yuda", type: "IURAN", title: "hutang dibulan mei 2026", amount: 44000, status: "BELUM_LUNAS", dueDate: "2026-05-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) (Bayar Rp16.000, sisa Rp44.000)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang dibulan mei 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-05-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang dibulan mei 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-05-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "hutang dibulan mei 2026", amount: 50000, status: "LUNAS", dueDate: "2026-05-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Kholid Azzam", type: "IURAN", title: "hutang dibulan april 2026", amount: 70000, status: "LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) Catatan Pelunasan: Lunas Khalid" },
  { user: "Wira Yuda", type: "IURAN", title: "hutang dibulan april 2026", amount: 50000, status: "LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang dibulan april 2026", amount: 52000, status: "BELUM_LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) (Bayar Rp44.000, sisa Rp52.000)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang dibulan april 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang dibulan april 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "hutang dibulan april 2026", amount: 50000, status: "LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Adji Nugroho", type: "IURAN", title: "hutang dibulan april 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-04-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Wira Yuda", type: "IURAN", title: "hutang dibulan maret 2026", amount: 20000, status: "LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang dibulan maret 2026", amount: 80000, status: "LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang dibulan maret 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang dibulan maret 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "hutang dibulan maret 2026", amount: 50000, status: "LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Afif Akbari", type: "IURAN", title: "hutang di bulan maret", amount: 40000, status: "LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026) Catatan Pelunasan: seabank" },
  { user: "Adji Nugroho", type: "IURAN", title: "hutang di bulan maret 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-03-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang di bulan februari", amount: 30000, status: "BELUM_LUNAS", dueDate: "2026-02-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Sayid Shobari", type: "IURAN", title: "hutang di bulan februari", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-02-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Sayid Shobari", type: "IURAN", title: "hutang di bulan januari", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-01-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ramadhan", type: "IURAN", title: "hutang di bulan februari", amount: 50000, status: "LUNAS", dueDate: "2026-02-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang di bulan februari2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-02-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "hutang di bulan januari2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-01-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Adji Nugroho", type: "IURAN", title: "Hutang Iuran Asrama febuari 2026", amount: 80000, status: "BELUM_LUNAS", dueDate: "2026-02-20", createdAt: "2026-08-20", note: "Dipublikan (13/8/2026)" },
  { user: "Desta Iman Hadi", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 80000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Azhar Rizqullah", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 80000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Muhammad Nuryl faisza", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 80000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Al Haj Noor", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 130000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Al Haj Noor", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 100000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Kenedy Wijaya", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 80000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Adji Nugroho", type: "IURAN", title: "Konfirmasi Pembayaran Tagihan", amount: 80000, status: "LUNAS", dueDate: "2026-08-21", createdAt: "2026-08-21" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN", title: "hutang kas asrama 2025", amount: 260000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Hutang Iuran Tahun 2025", amount: 170000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Hutang Iuran Tahun 2024", amount: 360000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Hutang Iuran Tahun 2023", amount: 450000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Dandi Apriliady Putra", type: "IURAN", title: "Hutang Iuran Tahun 2021", amount: 330000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Hutang Iuran Tahun 2025", amount: 290000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Hutang Iuran Tahun 2024", amount: 340000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Ibnur Ramadhan", type: "IURAN", title: "Hutang Iuran Tahun 2023", amount: 465000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Adji Nugroho", type: "IURAN", title: "Hutang Iuran Tahun 2025", amount: 290000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Adji Nugroho", type: "IURAN", title: "Hutang Iuran Tahun 2024", amount: 550000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Riski Yulianto", type: "IURAN", title: "Hutang Iuran Tahun 2023", amount: 250000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Fikry zulfiandi", type: "IURAN", title: "Hutang Iuran Tahun 2021", amount: 180000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Muhammad Iqbal Abdillah", type: "IURAN", title: "Hutang Iuran kas Tahun 2024", amount: 200000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Muhammad Iqbal Abdillah", type: "IURAN", title: "Hutang Iuran kas Tahun 2023", amount: 250000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Muhammad Iqbal Abdillah", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 215000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Aldi Ramadan", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 180000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Djulianto", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 330000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Riski Yulianto", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 330000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Chery", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 330000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Faizal Ramadhan Harahap", type: "IURAN", title: "Hutang Iuran kas Tahun 2024", amount: 300000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Faizal Ramadhan Harahap", type: "IURAN", title: "Hutang Iuran kas Tahun 2023", amount: 600000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Barkah Imam Syahrifi", type: "IURAN", title: "Hutang Iuran kas Tahun 2024", amount: 250000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Barkah Imam Syahrifi", type: "IURAN", title: "Hutang Iuran kas Tahun 2023", amount: 500000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Barkah Imam Syahrifi", type: "IURAN", title: "Hutang Iuran kas Tahun 2021", amount: 330000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Hamim Dermawan", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 40000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 70000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Desta Iman Hadi", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 20000, status: "LUNAS", createdAt: "2026-08-13" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 110000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 80000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Piket Tahun 2025", amount: 140000, status: "BELUM_LUNAS", createdAt: "2026-08-13" },
  { user: "Desta Iman Hadi", type: "DENDA_PIKET", title: "Denda Piket (30/8/2026)", amount: 10000, status: "LUNAS", createdAt: "2026-08-30" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (31/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-31" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (30/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-30" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (31/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-31" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (29/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-29" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Piket (29/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-29" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Piket (28/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-28" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (28/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-28" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (28/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-28" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (27/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-27" },
  { user: "Desta Iman Hadi", type: "DENDA_PIKET", title: "Denda Piket (27/8/2026)", amount: 10000, status: "LUNAS", createdAt: "2026-08-27" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (26/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-26" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (26/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-26" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (25/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-25" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Piket (25/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-25" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (25/8/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-08-25" },
  { user: "Desta Iman Hadi", type: "DENDA_PIKET", title: "Denda Piket (24/8/2026)", amount: 10000, status: "LUNAS", createdAt: "2026-08-24" },
  { user: "Ramadhan", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (30/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-30" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (28/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-28" },
  { user: "Muhammad Kholid Azzam", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (23/9/2026)", amount: 10000, status: "LUNAS", createdAt: "2026-09-23" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Piket (22/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-22" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (20/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-20" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (19/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-19" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (19/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-19" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (17/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-17" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (16/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-16" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (16/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-16" },
  { user: "Wira Yuda", type: "DENDA_PIKET", title: "Denda Piket (13/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-13" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (12/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-12" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (12/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-12" },
  { user: "Desta Iman Hadi", type: "DENDA_PIKET", title: "Denda Piket (10/9/2026)", amount: 10000, status: "LUNAS", createdAt: "2026-09-10" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (9/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-09" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (9/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-09" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (7/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-07" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (6/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-06" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (5/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-05" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (5/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-05" },
  { user: "Wira Yuda", type: "DENDA_PIKET", title: "Denda Piket (4/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-04" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (4/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-04" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (3/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-03" },
  { user: "Kenedy Wijaya", type: "DENDA_PIKET", title: "Denda Piket (3/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-03" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (3/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-03" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (2/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-02" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (2/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-02" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (2/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-02" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Piket (2/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-02" },
  { user: "Ibnur Ramadhan", type: "DENDA_PIKET", title: "Denda Piket (1/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-01" },
  { user: "Dandi Apriliady Putra", type: "DENDA_PIKET", title: "Denda Piket (1/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-01" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Piket (1/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-01" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Piket (1/9/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-01" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (27/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-27" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (26/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-26" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (26/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-26" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (22/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-22" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (21/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-21" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (17/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-17" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (16/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-16" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (16/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-16" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (16/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-16" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (16/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-16" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (14/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-14" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (13/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-13" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (12/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-12" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (12/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-12" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (12/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-12" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (12/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-12" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (11/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-11" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (11/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-11" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (8/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-08" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (7/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-07" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (5/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-05" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (5/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-05" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (19/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-19" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (19/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-19" },
  { user: "Ramadhan", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (18/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-18" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (18/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-18" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (17/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-17" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (16/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-16" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (16/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-16" },
  { user: "Wira Yuda", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (15/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Ramadhan", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (14/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-14" },
  { user: "Ramadhan", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (14/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-14" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (12/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-12" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (12/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-12" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (11/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-11" },
  { user: "Wira Yuda", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (11/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-11" },
  { user: "Sayid Shobari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (11/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-11" },
  { user: "Duta Perdana Putra", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (11/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-11" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (10/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-10" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (4/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-04" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (3/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-03" },
  { user: "Afif Akbari", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (3/11/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-03" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (30/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-30" },
  { user: "Adji Nugroho", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (30/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-30" },
  { user: "Muhammad Nuryl faisza", type: "DENDA_PIKET", title: "Denda Keterlambatan Piket - Tahap 1 (28/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-28" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "DENDA_PIKET", title: "Denda Tidak Piket - Tahap 2 (27/10/2026)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-27" },
  { user: "Ramadhan", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Muhammad Nuryl faisza", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Muhammad Kholid Azzam", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Duta Perdana Putra", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Desta Iman Hadi", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Azhar Rizqullah", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Afif Akbari", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Adji Nugroho", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-10-09" },
  { user: "Sayid Shobari", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-11-15" },
  { user: "Ramadhan", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-11-15" },
  { user: "Muhammad Nuryl faisza", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Muhammad Kholid Azzam", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Duta Perdana Putra", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Desta Iman Hadi", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-11-15" },
  { user: "Azhar Rizqullah", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "LUNAS", createdAt: "2026-11-15" },
  { user: "Adji Nugroho", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Wira Yuda", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Hamim Dermawan", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: Badber(badminton bareng)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-11-15" },
  { user: "Afif Akbari", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Azhar Rizqullah", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Dandi Apriliady Putra", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Desta Iman Hadi", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Duta Perdana Putra", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Kenedy Wijaya", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Muhammad Kholid Azzam", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Ibnur Ramadhan", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-15" },
  { user: "Ramadhan", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Wira Yuda", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-09-15" },
  { user: "Muhammad Nuryl faisza", type: "IURAN_OLAHRAGA", title: "Iuran Olahraga: futsal", amount: 10000, status: "LUNAS", createdAt: "2026-09-15" },
  { user: "Adji Nugroho", type: "DENDA_OLAHRAGA", title: "Denda Olahraga: futsal (Tidak Ikut)", amount: 5000, status: "BELUM_LUNAS", createdAt: "2026-09-15" },
  { user: "Afif Akbari", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 5000, status: "DIBATALKAN", createdAt: "2026-10-02" },
  { user: "Adji Nugroho", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 12000, status: "BELUM_LUNAS", createdAt: "2026-10-02" },
  { user: "Sayid Shobari", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 5000, status: "BELUM_LUNAS", createdAt: "2026-10-02" },
  { user: "Ibnur Ramadhan", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-02" },
  { user: "Kenedy Wijaya", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 5000, status: "BELUM_LUNAS", createdAt: "2026-10-02" },
  { user: "Dandi Apriliady Putra", type: "DENDA_OLAHRAGA", title: "hutang denda olahraga bulan sebelumnya", amount: 5000, status: "BELUM_LUNAS", createdAt: "2026-10-02" },
  { user: "Wira Yuda", type: "LAINNYA", title: "Denda Olahraga: Badber(badminton bareng) (Tidak Ikut)", amount: 10000, status: "BELUM_LUNAS", createdAt: "2026-10-09" },
  { user: "Muhammad Iqbal Dwi Nazri", type: "LAINNYA", title: "hutang denda olahraga bulan sebelumnya", amount: 20000, status: "BELUM_LUNAS", createdAt: "2026-09-30" },
  { user: "Duta Perdana Putra", type: "LAINNYA", title: "Biaya Administrasi Masuk Asrama", amount: 50000, status: "BELUM_LUNAS", dueDate: "2026-11-30", createdAt: "2026-11-20" },
  { user: "Sayid Shobari", type: "LAINNYA", title: "Batminton", amount: 10000, status: "DIBATALKAN", createdAt: "2026-10-09" },
];

// =====================================================================
// 2. DATA TRANSAKSI ARUS KAS (140 TRANSAKSI)
// =====================================================================

type TxItem = {
  date: string;
  type: TxType;
  category: string;
  description?: string;
  amount: number;
  paidByName?: string;
};

const TRANSACTIONS: TxItem[] = [
  { date: "2026-11-19", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pembayaran cicilan tagihan: Iuran Bulanan November 2026" },
  { date: "2026-11-19", type: "PENGELUARAN", category: "Uang Gas Elpiji", amount: 22000, description: "Gas tabung" },
  { date: "2026-11-19", type: "PENGELUARAN", category: "Uang Divisi Kesenian", amount: 20000 },
  { date: "2026-11-18", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan November 2026", paidByName: "Azhar Rizqullah" },
  { date: "2026-11-18", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Azhar Rizqullah" },
  { date: "2026-11-17", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan November 2026", paidByName: "Sayid Shobari" },
  { date: "2026-11-17", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Desta Iman Hadi" },
  { date: "2026-11-17", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 202000, description: "Penyapu2,penyalap2,sekop sampah1,sendok,spon" },
  { date: "2026-11-16", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Ramadhan" },
  { date: "2026-11-16", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Sayid Shobari" },
  { date: "2026-11-16", type: "PENGELUARAN", category: "Uang Air Galon", amount: 66000, description: "11 galon" },
  { date: "2026-11-15", type: "PENGELUARAN", category: "Sewa lapangan badminton griya saba insani", amount: 50000 },
  { date: "2026-11-12", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 33000, description: "Tresbek sampah" },
  { date: "2026-11-12", type: "PENGELUARAN", category: "Uang Sampah", amount: 40000, description: "Angkut sampah" },
  { date: "2026-11-10", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan November 2026", paidByName: "Afif Akbari" },
  { date: "2026-11-09", type: "PEMASUKAN", category: "Denda Piket", amount: 10000, description: "Pelunasan tagihan: Denda Piket (24/8/2026)", paidByName: "Desta Iman Hadi" },
  { date: "2026-11-09", type: "PEMASUKAN", category: "Denda Piket", amount: 10000, description: "Pelunasan tagihan: Denda Piket (27/8/2026)", paidByName: "Desta Iman Hadi" },
  { date: "2026-11-09", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan November 2026", paidByName: "Desta Iman Hadi" },
  { date: "2026-11-09", type: "PENGELUARAN", category: "Lain-lain", amount: 210000, description: "Tinta printer" },
  { date: "2026-11-09", type: "PEMASUKAN", category: "Lain-lain", amount: 10000, description: "Dapat arisan rt" },
  { date: "2026-11-09", type: "PENGELUARAN", category: "Uang Rapat RT", amount: 20000 },
  { date: "2026-11-08", type: "PENGELUARAN", category: "Uang Kerja Bakti", amount: 70000, description: "Gorengan,air es" },
  { date: "2026-11-07", type: "PENGELUARAN", category: "Uang Air Galon", amount: 65000, description: "Galon 11 igek" },
  { date: "2026-11-07", type: "PENGELUARAN", category: "Beli bola pingpong", amount: 15000 },
  { date: "2026-11-06", type: "PEMASUKAN", category: "Iuran Warga", amount: 44000, description: "Pembayaran cicilan tagihan: hutang dibulan april 2026" },
  { date: "2026-11-06", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: hutang dibulan maret 2026", paidByName: "Ramadhan" },
  { date: "2026-11-06", type: "PEMASUKAN", category: "Iuran Warga", amount: 60000, description: "Pelunasan tagihan: hutang di bulan februari", paidByName: "Ramadhan" },
  { date: "2026-11-03", type: "PENGELUARAN", category: "Lain-lain", amount: 22000, description: "Gas tabung" },
  { date: "2026-10-31", type: "PEMASUKAN", category: "Iuran Warga", amount: 16000, description: "Pembayaran cicilan tagihan: hutang dibulan mei 2026" },
  { date: "2026-10-31", type: "PEMASUKAN", category: "Iuran Warga", amount: 24000, description: "Pelunasan tagihan: hutang dibulan maret 2026", paidByName: "Wira Yuda" },
  { date: "2026-10-31", type: "PEMASUKAN", category: "Iuran Warga", amount: 60000, description: "Pelunasan tagihan: hutang dibulan april 2026", paidByName: "Wira Yuda" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Lain-lain", amount: 300000, description: "Pembayaran cicilan tagihan: Biaya Administrasi Masuk Asrama" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 23000, description: "Pembayaran cicilan tagihan: Iuran Bulanan Agustus 2026" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: hutang dibulan juni 2026", paidByName: "Dandi Apriliady Putra" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 60000, description: "Pelunasan tagihan: hutang dibulan mei 2026", paidByName: "Dandi Apriliady Putra" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 60000, description: "Pelunasan tagihan: hutang dibulan april 2026", paidByName: "Dandi Apriliady Putra" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 60000, description: "Pelunasan tagihan: hutang dibulan maret 2026", paidByName: "Dandi Apriliady Putra" },
  { date: "2026-10-29", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Afif Akbari" },
  { date: "2026-10-29", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000 },
  { date: "2026-10-29", type: "PENGELUARAN", category: "Lain-lain", amount: 60000, description: "Bayar websed simas" },
  { date: "2026-10-25", type: "PENGELUARAN", category: "Uang WiFi", amount: 333000 },
  { date: "2026-10-23", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000 },
  { date: "2026-10-23", type: "PEMASUKAN", category: "Lain-lain", amount: 20000, description: "Duit nyewa proyektor" },
  { date: "2026-10-23", type: "PENGELUARAN", category: "Lain-lain", amount: 20000, description: "Perbaikan spiker" },
  { date: "2026-10-20", type: "PEMASUKAN", category: "Iuran Warga", amount: 50000, description: "Pembayaran cicilan tagihan: Iuran Bulanan Oktober 2026" },
  { date: "2026-10-20", type: "PEMASUKAN", category: "Iuran Warga", amount: 50000, description: "Pembayaran cicilan tagihan: Iuran Bulanan Oktober 2026" },
  { date: "2026-10-20", type: "PENGELUARAN", category: "Lain-lain", amount: 39000, description: "rapat bulanan" },
  { date: "2026-10-19", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Kenedy Wijaya" },
  { date: "2026-10-19", type: "PEMASUKAN", category: "Denda Piket", amount: 10000, description: "Pelunasan tagihan: Denda Piket (30/8/2026)", paidByName: "Desta Iman Hadi" },
  { date: "2026-10-19", type: "PEMASUKAN", category: "Denda Piket", amount: 10000, description: "Pelunasan tagihan: Denda Piket (10/9/2026)", paidByName: "Desta Iman Hadi" },
  { date: "2026-10-19", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Desta Iman Hadi" },
  { date: "2026-10-18", type: "PENGELUARAN", category: "Uang Sampah", amount: 40000 },
  { date: "2026-10-17", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Muhammad Nuryl faisza" },
  { date: "2026-10-16", type: "PENGELUARAN", category: "Lain-lain", amount: 22000 },
  { date: "2026-10-13", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Sayid Shobari" },
  { date: "2026-10-13", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000 },
  { date: "2026-10-11", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 33000, description: "Tresbek" },
  { date: "2026-10-10", type: "PENGELUARAN", category: "Lain-lain", amount: 3000 },
  { date: "2026-10-10", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Azhar Rizqullah" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Adji Nugroho" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Afif Akbari" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Desta Iman Hadi" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Duta Perdana Putra" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Muhammad Iqbal Dwi Nazri" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Muhammad Nuryl faisza" },
  { date: "2026-10-09", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)", paidByName: "Ramadhan" },
  { date: "2026-10-06", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000 },
  { date: "2026-10-06", type: "PEMASUKAN", category: "Lain-lain", amount: 60000 },
  { date: "2026-10-06", type: "PEMASUKAN", category: "Lain-lain", amount: 100000, description: "Uang jual barang bekas" },
  { date: "2026-10-05", type: "PENGELUARAN", category: "Sewa lap badminton (griya saba insani)", amount: 50000 },
  { date: "2026-10-04", type: "PENGELUARAN", category: "Uang Kerja Bakti", amount: 59000, description: "Kawat,esbatu,saset es" },
  { date: "2026-10-03", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Azhar Rizqullah" },
  { date: "2026-10-03", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan Oktober 2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-10-03", type: "PEMASUKAN", category: "Denda Piket", amount: 10000, description: "Pelunasan tagihan: Denda Keterlambatan Piket - Tahap 1 (23/9/2026)", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-10-02", type: "PEMASUKAN", category: "Denda Olahraga", amount: 5000, description: "Pelunasan tagihan: hutang denda olahraga bulan sebelumnya", paidByName: "Afif Akbari" },
  { date: "2026-10-02", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: Iuran Bulanan Agustus 2026", paidByName: "Afif Akbari" },
  { date: "2026-09-28", type: "PENGELUARAN", category: "Lain-lain", amount: 60000 },
  { date: "2026-09-26", type: "PENGELUARAN", category: "Lain-lain", amount: 23000 },
  { date: "2026-09-26", type: "PENGELUARAN", category: "Lain-lain", amount: 22000, description: "Gas" },
  { date: "2026-09-25", type: "PEMASUKAN", category: "Iuran Warga", amount: 30000, description: "Pembayaran cicilan tagihan: Wifi Bulan September" },
  { date: "2026-09-25", type: "PENGELUARAN", category: "Uang WiFi", amount: 333000 },
  { date: "2026-09-24", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Muhammad Nuryl faisza" },
  { date: "2026-09-24", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 84000, description: "Alat kebersihan" },
  { date: "2026-09-23", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000 },
  { date: "2026-09-21", type: "PENGELUARAN", category: "Lain-lain", amount: 308000 },
  { date: "2026-09-21", type: "PENGELUARAN", category: "Uang Rapat Bulanan", amount: 63000 },
  { date: "2026-09-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 30000, description: "Pembayaran cicilan tagihan: Iuran Bulanan September 2026" },
  { date: "2026-09-19", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Kenedy Wijaya" },
  { date: "2026-09-17", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-09-17", type: "PEMASUKAN", category: "Iuran Warga", amount: 30000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Duta Perdana Putra" },
  { date: "2026-09-17", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Azhar Rizqullah" },
  { date: "2026-09-17", type: "PENGELUARAN", category: "Uang Sampah", amount: 40000, description: "uang sampah om gepeng" },
  { date: "2026-09-17", type: "PENGELUARAN", category: "Lain-lain", amount: 21000, description: "tabung gas" },
  { date: "2026-09-17", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000, description: "10 galon" },
  { date: "2026-09-16", type: "PENGELUARAN", category: "Lain-lain", amount: 33000 },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Afif Akbari" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Azhar Rizqullah" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Dandi Apriliady Putra" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Desta Iman Hadi" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Duta Perdana Putra" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Kenedy Wijaya" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Muhammad Iqbal Dwi Nazri" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Muhammad Nuryl faisza" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Olahraga", amount: 10000, description: "Pelunasan tagihan: Iuran Olahraga: futsal", paidByName: "Ramadhan" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "uang bulan 4,5,6,7", amount: 89000, description: "konfirugasi total saldo awal di sistem" },
  { date: "2026-09-15", type: "PENGELUARAN", category: "Pelunasan lapangan futsal", amount: 120000, description: "Lapangan futsal bardosono" },
  { date: "2026-09-15", type: "PEMASUKAN", category: "Iuran Futsal biak RO 1 (4 orng)", amount: 40000, description: "Iuran per orang Rp.10.000" },
  { date: "2026-09-14", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Sayid Shobari" },
  { date: "2026-09-14", type: "PENGELUARAN", category: "dp lapangan futsal bardosono", amount: 100000, description: "dp lapangan futsal bardosono" },
  { date: "2026-09-13", type: "PEMASUKAN", category: "Denda Piket", amount: 20000, description: "Pelunasan tagihan: Denda Piket Tahun 2025", paidByName: "Desta Iman Hadi" },
  { date: "2026-09-13", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Desta Iman Hadi" },
  { date: "2026-09-12", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Iuran Bulanan September 2026", paidByName: "Afif Akbari" },
  { date: "2026-09-09", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000, description: "10 galon" },
  { date: "2026-09-06", type: "PENGELUARAN", category: "Lain-lain", amount: 22000 },
  { date: "2026-09-02", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: Iuran Bulanan Agustus 2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-09-02", type: "PEMASUKAN", category: "Iuran Warga", amount: 48000, description: "Pelunasan tagihan: hutang dibulan juli2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-09-01", type: "PENGELUARAN", category: "Uang Air Galon", amount: 54000, description: "9 galon" },
  { date: "2026-08-29", type: "PENGELUARAN", category: "Lain-lain", amount: 60000, description: "Perpanjang system website" },
  { date: "2026-08-26", type: "PEMASUKAN", category: "Iuran Warga", amount: 16000, description: "Pembayaran cicilan tagihan: Iuran Bulanan Agustus 2026" },
  { date: "2026-08-26", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: hutang dibulan juli2026", paidByName: "Afif Akbari" },
  { date: "2026-08-26", type: "PEMASUKAN", category: "Iuran Warga", amount: 48000, description: "Pelunasan tagihan: hutang di bulan maret", paidByName: "Afif Akbari" },
  { date: "2026-08-24", type: "PENGELUARAN", category: "Uang WiFi", amount: 333000, description: "wifi republik" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 20000, description: "Pembayaran cicilan tagihan: hutang dibulan juli2026" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 96000, description: "Pelunasan tagihan: hutang dibulan juni 2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 84000, description: "Pelunasan tagihan: hutang dibulan april 2026", paidByName: "Muhammad Kholid Azzam" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Desta Iman Hadi" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Azhar Rizqullah" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Muhammad Nuryl faisza" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 130000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Al Haj Noor" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 100000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Al Haj Noor" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Kenedy Wijaya" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Iuran Warga", amount: 80000, description: "Pelunasan tagihan: Konfirmasi Pembayaran Tagihan", paidByName: "Adji Nugroho" },
  { date: "2026-08-21", type: "PEMASUKAN", category: "Lain-lain", amount: 332000 },
  { date: "2026-08-20", type: "PENGELUARAN", category: "Lain-lain", amount: 34000, description: "uang konfigurasi system" },
  { date: "2026-08-19", type: "PENGELUARAN", category: "Uang Air Galon", amount: 60000, description: "10 galon" },
  { date: "2026-08-16", type: "PENGELUARAN", category: "Lain-lain", amount: 100000, description: "agustusan tirakattan" },
  { date: "2026-08-15", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 40000, description: "sampah" },
  { date: "2026-08-10", type: "PENGELUARAN", category: "Uang Divisi Kebersihan", amount: 172000, description: "Alat kebersihan asrama" },
];

// =====================================================================
// MAIN EXECUTION
// =====================================================================

async function main() {
  console.log('🚀 Memulai proses restore data keuangan AMKS...');

  // 1. Load users dari DB
  const users = await db.user.findMany({
    select: {
      id: true,
      fullName: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  });

  if (users.length === 0) {
    throw new Error('Tidak ada data user di database! Pastikan database user aman.');
  }

  for (const u of users) {
    USERS[u.fullName] = u.id;
  }
  console.log(`✅ Berhasil membaca ${users.length} users dari database.`);

  // Cari admin untuk createdById transaksi
  const admin = users.find(u => u.roles.some(r => r.role.name.includes('ADMIN') || r.role.name === 'BENDAHARA')) || users[0];
  ADMIN_ID = admin.id;
  console.log(`✅ Admin ID: ${admin.fullName} (${ADMIN_ID})`);

  // 2. Cek apakah ada data lama
  const existingBills = await db.bill.count();
  const existingTx = await db.transaction.count();
  const isForce = process.argv.includes('--force');

  if (existingBills > 0 || existingTx > 0) {
    if (isForce) {
      console.log(`⚠️  --force aktif: Membersihkan data lama (${existingBills} bills, ${existingTx} transactions)...`);
      await db.transaction.deleteMany();
      await db.bill.deleteMany();
      console.log('✅ Data lama berhasil dibersihkan.');
    } else {
      console.log(`⚠️  Data sudah ada di DB: ${existingBills} bills, ${existingTx} transactions`);
      console.log('⚠️  Gunakan flag --force untuk membersihkan dan menjalankan restore ulang:');
      console.log('    npx tsx prisma/scripts/restore-keuangan.ts --force\n');
      return;
    }
  }

  // 3. Insert 263 Bills dan simpan map untuk LUNAS
  console.log(`📋 Menginsert ${BILLS.length} tagihan ke database...`);
  let billsInserted = 0;
  // Map untuk menghubungkan pelunasan transaksi ke bill yang lunas
  // Key: user_title, Value: billId[]
  const lunasBillMap: Record<string, string[]> = {};

  for (const b of BILLS) {
    try {
      const userId = uid(b.user);
      const createdBill = await db.bill.create({
        data: {
          userId,
          type: b.type,
          title: b.title,
          amount: b.amount,
          status: b.status,
          dueDate: b.dueDate ? new Date(b.dueDate + 'T23:59:59.000Z') : null,
          createdAt: b.createdAt ? new Date(b.createdAt + 'T00:00:00.000Z') : new Date(),
          note: b.note ?? null,
        },
      });
      billsInserted++;

      if (b.status === 'LUNAS') {
        const key = normalize(b.user) + '|' + normalize(b.title);
        if (!lunasBillMap[key]) lunasBillMap[key] = [];
        lunasBillMap[key].push(createdBill.id);
      }
    } catch (err) {
      console.error(`  ❌ Gagal insert bill: ${b.user} - ${b.title}: ${(err as Error).message}`);
    }
  }
  console.log(`✅ Berhasil menginsert ${billsInserted}/${BILLS.length} bills.\n`);

  // 4. Insert 140 Transactions
  console.log(`💰 Menginsert ${TRANSACTIONS.length} transaksi ke database...`);
  let txInserted = 0;
  let linkedBillsCount = 0;

  for (const t of TRANSACTIONS) {
    try {
      let relatedBillId: string | null = null;

      // Hubungkan jika ini transaksi pelunasan
      if (t.type === 'PEMASUKAN' && t.description && t.description.startsWith('Pelunasan tagihan:')) {
        const billTitle = t.description.replace(/^Pelunasan tagihan:\s*/i, '');
        const targetUserNorm = normalize(t.paidByName);
        const targetTitleNorm = normalize(billTitle);

        // Cari di lunasBillMap
        for (const [key, idList] of Object.entries(lunasBillMap)) {
          if (idList.length === 0) continue;
          const [uPart, tPart] = key.split('|');

          const userMatches = uPart.includes(targetUserNorm) || targetUserNorm.includes(uPart) ||
                              (uPart.slice(0, 5) === targetUserNorm.slice(0, 5));
          if (!userMatches) continue;

          const titleMatches = tPart.includes(targetTitleNorm) || targetTitleNorm.includes(tPart) ||
                               (tPart.slice(0, 10) === targetTitleNorm.slice(0, 10));
          if (titleMatches) {
            relatedBillId = idList.shift()!;
            linkedBillsCount++;
            break;
          }
        }
      }

      await db.transaction.create({
        data: {
          type: t.type,
          category: t.category,
          description: t.description ?? null,
          amount: t.amount,
          occurredAt: new Date(t.date + 'T12:00:00.000Z'),
          createdById: ADMIN_ID,
          relatedBillId: relatedBillId,
          paidByName: t.paidByName ?? null,
        },
      });
      txInserted++;
    } catch (err) {
      console.error(`  ❌ Gagal insert tx: ${t.date} ${t.category}: ${(err as Error).message}`);
    }
  }
  console.log(`✅ Berhasil menginsert ${txInserted}/${TRANSACTIONS.length} transaksi (Linked to bills: ${linkedBillsCount}).\n`);

  // 5. Verifikasi Final
  const finalBills = await db.bill.count();
  const finalTx = await db.transaction.count();
  const pemTxs = await db.transaction.findMany({ where: { type: 'PEMASUKAN' } });
  const pengTxs = await db.transaction.findMany({ where: { type: 'PENGELUARAN' } });
  const totalPem = pemTxs.reduce((a, b) => a + b.amount, 0);
  const totalPeng = pengTxs.reduce((a, b) => a + b.amount, 0);
  const totalSaldo = totalPem - totalPeng;

  console.log('================ HASIL RESTORE KEUANGAN ================');
  console.log(`  Tagihan Warga : ${finalBills} (Target: 263)`);
  console.log(`  Arus Kas      : ${finalTx} (Target: 140)`);
  console.log(`  Total Pemasukan : Rp ${totalPem.toLocaleString('id-ID')} (Target: Rp 4.827.000)`);
  console.log(`  Total Pengeluaran: Rp ${totalPeng.toLocaleString('id-ID')} (Target: Rp 3.996.000)`);
  console.log(`  Total Saldo Kas : Rp ${totalSaldo.toLocaleString('id-ID')} (Target: Rp 831.000)`);
  console.log('========================================================');

  if (finalBills === 263 && finalTx === 140 && totalSaldo === 831000) {
    console.log('🎉 RESTORE SELESAI DAN 100% SESUAI DENGAN SCREENSHOT!');
  } else {
    console.warn('⚠️  Perhatian: Ada angka yang belum persis cocok, periksa output di atas.');
  }
}

main()
  .catch((e) => {
    console.error('Fatal Error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
