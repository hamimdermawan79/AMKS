/**
 * RESTORE SCRIPT: Keuangan Asrama
 * Dibuat dari screenshot data keuangan sebelum TRUNCATE TABLE
 * Jalankan: npx tsx prisma/scripts/restore-keuangan.ts
 *
 * PENTING: Jalankan sekali saja! Script ini idempotent (cek duplikat dulu)
 * Data per: 20 November 2026
 */

import { PrismaClient, BillType, BillStatus, TxType } from '@prisma/client';

const db = new PrismaClient();

// =====================================================================
// USER ID MAP (diisi dari: npx tsx -e "db.user.findMany(...)..." di VPS)
// Key = fullName persis seperti di DB, Value = CUID dari DB
// =====================================================================
const USERS: Record<string, string> = {
  // Akan diisi setelah dapat output dari VPS
  // Format: 'Nama Lengkap': 'cuid_dari_db',
  'PLACEHOLDER': 'PLACEHOLDER',
};

// Admin ID untuk createdById pada transaksi
let ADMIN_ID = 'PLACEHOLDER_ADMIN_ID';

// Helper: resolve user ID by fullName (partial match fallback)
function uid(name: string): string {
  if (USERS[name]) return USERS[name];
  // partial match
  const key = Object.keys(USERS).find(k => k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
  if (key) return USERS[key];
  throw new Error(`User not found: "${name}" — cek nama di DB`);
}

// =====================================================================
// DATA TAGIHAN WARGA (dari screenshot Tagihan Warga - 263 tagihan)
// =====================================================================

type BillData = {
  user: string;
  type: BillType;
  title: string;
  amount: number;
  status: BillStatus;
  dueDate?: Date;
  createdAt?: Date;
  note?: string;
};

const BILLS: BillData[] = [
  // ===== IURAN BULANAN NOVEMBER 2026 (dueDate: 19 Nov 2026) =====
  { user: 'Wira Yuda',              type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Sayid Shobari',          type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 15999, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal (Bayar Rp60.000, sisa Rp16.000)' },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Kenedy Wijaya',          type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Duta Perdana Putra',     type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 30000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Desta Iman Hadi',        type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Azhar Rizqullah',        type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal Catatan Pelunasan: Seabank kas dan wifi Azhar' },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Iuran Bulanan November 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-19'), createdAt: new Date('2026-11-19'), note: 'Dibuat secara massal' },

  // ===== IURAN BULANAN OKTOBER 2026 (dueDate: 20 Okt 2026) =====
  { user: 'Wira Yuda',              type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 48000,  status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal (Bayar Rp50.000, sisa Rp48.000)' },
  { user: 'Sayid Shobari',          type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Kenedy Wijaya',          type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Duta Perdana Putra',     type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 30000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Desta Iman Hadi',        type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 50000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Azhar Rizqullah',        type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Iuran Bulanan Oktober 2026', amount: 46000, status: 'BELUM_LUNAS', dueDate: new Date('2026-10-20'), createdAt: new Date('2026-10-20'), note: 'Dibuat secara massal (Bayar Rp50.000, sisa Rp46.000)' },

  // ===== IURAN BULANAN SEPTEMBER 2026 (dueDate: 20 Sep 2026) =====
  { user: 'Wira Yuda',              type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Sayid Shobari',          type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Ramadhan',               type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Kenedy Wijaya',          type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Duta Perdana Putra',     type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 30000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Desta Iman Hadi',        type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Azhar Rizqullah',        type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-09-20'), createdAt: new Date('2026-09-20') },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Iuran Bulanan September 2026', amount: 50000, status: 'BELUM_LUNAS', dueDate: new Date('2026-09-30'), createdAt: new Date('2026-09-30'), note: 'Dibuat secara massal (Izin telat; diperpanjang tanpa denda hingga awal bulan) Catatan admin' },

  // ===== IURAN BULANAN AGUSTUS 2026 (dueDate: 20 Agu 2026) =====
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'Iuran Bulanan Agustus 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'Iuran Bulanan Agustus 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-08-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Iuran Bulanan Agustus 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-08-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Iuran Bulanan Agustus 2026', amount: 23000, status: 'BELUM_LUNAS', dueDate: new Date('2026-08-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) (Bayar Rp36.000, sisa Rp60.000)' },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'Iuran Bulanan Agustus 2026', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) (Bayar Rp6.000, sisa Rp80.000)' },

  // ===== IURAN LAMA (hutang bulan sebelumnya) =====
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'hutang dibulan juli2026',   amount: 48000, status: 'LUNAS',      dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) Catatan Cicilan: Khalid 20k (Bayar Rp20.000, sisa Rp40.000)' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang dibulan juli2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang dibulan juli2026',   amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Hamim Dermawan',         type: 'IURAN', title: 'hutang dibulan juli2026',   amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'hutang dibulan juli2026',   amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'hutang dibulan juli 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-07-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 20000, status: 'BELUM_LUNAS', dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) Catatan Pelunasan: Lunas Khalid' },
  { user: 'Wira Yuda',              type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 50000, status: 'BELUM_LUNAS', dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang dibulan juni 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang dibulan juni 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-06-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Adji Nugroho',           type: 'IURAN', title: 'hutang dibulan mei 2026',   amount: 50000, status: 'BELUM_LUNAS', dueDate: new Date('2026-05-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Wira Yuda',              type: 'IURAN', title: 'hutang dibulan mei 2026',    amount: 44000, status: 'BELUM_LUNAS', dueDate: new Date('2026-05-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) (Bayar Rp16.000, sisa Rp44.000)' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'hutang dibulan mei 2026',    amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-05-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang dibulan mei 2026',    amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-05-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'hutang dibulan mei 2026',    amount: 50000, status: 'LUNAS',      dueDate: new Date('2026-05-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Muhammad Kholid Azzam',  type: 'IURAN', title: 'hutang dibulan april 2026', amount: 68000, status: 'LUNAS',      dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) Catatan Pelunasan: Lunas Khalid' },
  { user: 'Wira Yuda',              type: 'IURAN', title: 'hutang dibulan april 2026',  amount: 50000, status: 'LUNAS',      dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'hutang dibulan april 2026',  amount: 52000, status: 'BELUM_LUNAS', dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) (Bayar Rp44.000, sisa Rp52.000)' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang dibulan april 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang dibulan april 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'hutang dibulan april 2026',  amount: 50000, status: 'LUNAS',      dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'hutang dibulan april 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-04-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Wira Yuda',              type: 'IURAN', title: 'hutang dibulan maret 2026',  amount: 24000, status: 'LUNAS',      dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'hutang dibulan maret 2026',  amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang dibulan maret 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang dibulan maret 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'hutang dibulan maret 2026',  amount: 50000, status: 'LUNAS',      dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Afif Akbari',            type: 'IURAN', title: 'hutang di bulan maret',       amount: 48000, status: 'LUNAS',      dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026) Catatan Pelunasan: seabank' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'hutang di bulan maret 2026',  amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-03-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang di bulan februari', amount: 30000, status: 'BELUM_LUNAS', dueDate: new Date('2026-02-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Sayid Shobari',          type: 'IURAN', title: 'hutang di bulan februari',    amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-02-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ramadhan',               type: 'IURAN', title: 'hutang di bulan februari',    amount: 50000, status: 'LUNAS',      dueDate: new Date('2026-02-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang di bulan februari2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-02-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'hutang di bulan januari2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-01-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Hutang Iuran Asrama febuari 2026', amount: 80000, status: 'BELUM_LUNAS', dueDate: new Date('2026-02-20'), createdAt: new Date('2026-08-20'), note: 'Dipublikan (13/8/2026)' },

  // ===== IURAN/HUTANG LAMA (konfirmasi pembayaran Agustus 2026) =====
  { user: 'Desta Iman Hadi',        type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Azhar Rizqullah',        type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Al Haj Noor',            type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 100000, status: 'LUNAS',     dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Al Haj Noor',            type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 130000, status: 'LUNAS',     dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Kenedy Wijaya',          type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS',      dueDate: new Date('2026-08-21'), createdAt: new Date('2026-08-21') },

  // ===== IURAN HUTANG LAMA (dipublish Agustus 2026) =====
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN', title: 'hutang kas asrama 2025',  amount: 260000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },

  // ===== IURAN LAMA TAHUNAN =====
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Hutang Iuran Tahun 2025',   amount: 170000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Hutang Iuran Tahun 2024',   amount: 360000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Hutang Iuran Tahun 2023',   amount: 450000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN', title: 'Hutang Iuran Tahun 2021',   amount: 330000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Hutang Iuran Tahun 2025',   amount: 290000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Hutang Iuran Tahun 2023',   amount: 465000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Ibnur Ramadhan',         type: 'IURAN', title: 'Hutang Iuran Tahun 2024',   amount: 340000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Hutang Iuran Tahun 2025',   amount: 290000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Adji Nugroho',           type: 'IURAN', title: 'Hutang Iuran Tahun 2024',   amount: 550000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Riski Yulianto',         type: 'IURAN', title: 'Hutang Iuran Tahun 2023',   amount: 250000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Fikry zulfiandi',        type: 'IURAN', title: 'Hutang Iuran Tahun 2021',   amount: 180000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Muhammad Iqbal Abdillah', type: 'IURAN', title: 'Hutang Iuran kas Tahun 2024', amount: 200000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Muhammad Iqbal Abdillah', type: 'IURAN', title: 'Hutang Iuran kas Tahun 2023', amount: 250000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Muhammad Iqbal Abdillah', type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 215000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Aldi Ramadan',           type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 180000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Djulianto',              type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 330000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Riski Yulianto',         type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 330000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Chery',                  type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 330000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Faizal Ramadhan Harahap', type: 'IURAN', title: 'Hutang Iuran kas Tahun 2024', amount: 300000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Faizal Ramadhan Harahap', type: 'IURAN', title: 'Hutang Iuran kas Tahun 2023', amount: 600000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Barkah Imam Syahrifi',   type: 'IURAN', title: 'Hutang Iuran kas Tahun 2024', amount: 250000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Barkah Imam Syahrifi',   type: 'IURAN', title: 'Hutang Iuran kas Tahun 2023', amount: 500000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Barkah Imam Syahrifi',   type: 'IURAN', title: 'Hutang Iuran kas Tahun 2021', amount: 330000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Desta Iman Hadi',        type: 'IURAN', title: 'Konfirmasi Pembayaran Tagihan', amount: 80000, status: 'LUNAS', dueDate: new Date('2026-08-13'), createdAt: new Date('2026-08-13') },

  // ===== DENDA PIKET LAMA TAHUNAN =====
  { user: 'Hamim Dermawan',         type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025',  amount: 40000,  status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025', amount: 70000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Desta Iman Hadi',        type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025',  amount: 20000,  status: 'LUNAS',      createdAt: new Date('2026-08-13') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025',  amount: 110000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025',  amount: 80000,  status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Piket Tahun 2025',  amount: 140000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-13') },

  // ===== DENDA PIKET AGUSTUS 2026 =====
  { user: 'Desta Iman Hadi',        type: 'DENDA_PIKET', title: 'Denda Piket (30/8/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-08-30') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (31/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-31') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (30/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-30') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Piket (31/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-31') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Piket (29/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-29') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Piket (29/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-29') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Piket (28/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-28') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (28/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-28') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (28/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-28') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (27/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-27') },
  { user: 'Desta Iman Hadi',        type: 'DENDA_PIKET', title: 'Denda Piket (27/8/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-08-27') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (26/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-26') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Piket (26/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-26') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (25/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-25') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Piket (25/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-25') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (25/8/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-08-25') },
  { user: 'Desta Iman Hadi',        type: 'DENDA_PIKET', title: 'Denda Piket (24/8/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-08-24') },

  // ===== DENDA PIKET SEPTEMBER 2026 =====
  { user: 'Ramadhan',               type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (30/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-30') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (28/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-28') },
  { user: 'Muhammad Kholid Azzam',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (23/9/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-23') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Piket (22/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-22') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (20/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-20') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (19/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-19') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (19/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-19') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Piket (17/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-17') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (16/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-16') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (16/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-16') },
  { user: 'Wira Yuda',              type: 'DENDA_PIKET', title: 'Denda Piket (13/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-13') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (12/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-12') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (12/9/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-12') },
  { user: 'Desta Iman Hadi',        type: 'DENDA_PIKET', title: 'Denda Piket (10/9/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-10') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (9/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-09') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (9/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-09') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (7/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-07') },
  { user: 'Dandi Apriliady Putra',  type: 'DENDA_PIKET', title: 'Denda Piket (6/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-06') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (5/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-05') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (5/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-05') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (4/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-04') },
  { user: 'Wira Yuda',              type: 'DENDA_PIKET', title: 'Denda Piket (4/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-04') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_PIKET', title: 'Denda Piket (3/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-03') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_PIKET', title: 'Denda Piket (3/9/2026)',  amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-03') },

  // ===== DENDA PIKET OKTOBER 2026 =====
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (27/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-27') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (26/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-26') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (26/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-26') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (22/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-22') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (21/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-21') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (17/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-17') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (16/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-16') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (16/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-16') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (16/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-16') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (16/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-16') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (14/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-14') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (13/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-13') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (12/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-12') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (12/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-12') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (12/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-12') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (12/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-12') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (11/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-11') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (11/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-11') },
  { user: 'Muhammad Kholid Azzam',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (3/10/2026)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-03') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (8/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-08') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (7/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-07') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (5/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-05') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (5/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-05') },

  // ===== DENDA PIKET NOVEMBER 2026 =====
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (19/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-19') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (19/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-19') },
  { user: 'Ramadhan',               type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (18/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-18') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (18/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-18') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (17/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-17') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (16/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-16') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (16/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-16') },
  { user: 'Wira Yuda',              type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (15/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },
  { user: 'Ramadhan',               type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (14/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-14') },
  { user: 'Ramadhan',               type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (14/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-14') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (12/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-12') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (12/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-12') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (11/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-11') },
  { user: 'Wira Yuda',              type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (11/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-11') },
  { user: 'Sayid Shobari',          type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (11/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-11') },
  { user: 'Duta Perdana Putra',     type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (11/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-11') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (10/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-10') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (4/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-04') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (3/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-03') },
  { user: 'Afif Akbari',            type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (3/11/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-03') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (30/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-30') },
  { user: 'Adji Nugroho',           type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (30/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-30') },
  { user: 'Muhammad Nuryl faisza',  type: 'DENDA_PIKET', title: 'Denda Keterlambatan Piket - Tahap 1 (28/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-28') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'DENDA_PIKET', title: 'Denda Tidak Piket - Tahap 2 (27/10/2026)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-27') },

  // ===== IURAN OLAHRAGA: Badber (Badminton bareng) - 9 Oktober 2026 =====
  { user: 'Ramadhan',               type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',    createdAt: new Date('2026-10-09') },
  { user: 'Duta Perdana Putra',     type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Desta Iman Hadi',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Azhar Rizqullah',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Afif Akbari',            type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },
  { user: 'Adji Nugroho',           type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-10-09') },

  // ===== IURAN OLAHRAGA: Badber (15 November 2026) =====
  { user: 'Sayid Shobari',          type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-11-15') },
  { user: 'Ramadhan',               type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-11-15') },
  { user: 'Muhammad Nuryl faisza',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },
  { user: 'Duta Perdana Putra',     type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },
  { user: 'Desta Iman Hadi',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-11-15') },
  { user: 'Azhar Rizqullah',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-11-15') },
  { user: 'Adji Nugroho',           type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: Badber(badminton bareng)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-11-15') },

  // ===== IURAN OLAHRAGA: Futsal (15 September 2026) =====
  { user: 'Afif Akbari',            type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Azhar Rizqullah',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Dandi Apriliady Putra',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Desta Iman Hadi',        type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Duta Perdana Putra',     type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Kenedy Wijaya',          type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',  createdAt: new Date('2026-09-15') },
  { user: 'Ibnur Ramadhan',         type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-15') },
  { user: 'Ramadhan',               type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },
  { user: 'Wira Yuda',              type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-15') },
  { user: 'Muhammad Kholid Azzam',  type: 'IURAN_OLAHRAGA', title: 'Iuran Olahraga: futsal', amount: 10000, status: 'LUNAS',      createdAt: new Date('2026-09-15') },

  // ===== DENDA OLAHRAGA =====
  { user: 'Adji Nugroho',           type: 'DENDA_OLAHRAGA', title: 'Denda Olahraga: futsal (Tidak Ikut)', amount: 5000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-15') },
  { user: 'Afif Akbari',            type: 'DENDA_OLAHRAGA', title: 'hutang denda olahraga bulan sebelumnya', amount: 5000, status: 'DIBATALKAN', createdAt: new Date('2026-10-02') },
  { user: 'Adji Nugroho',           type: 'DENDA_OLAHRAGA', title: 'hutang denda olahraga bulan sebelumnya', amount: 12000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-02') },
  { user: 'Sayid Shobari',          type: 'DENDA_OLAHRAGA', title: 'hutang denda olahraga bulan sebelumnya', amount: 5000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-02') },
  { user: 'Ibnur Ramadhan',         type: 'DENDA_OLAHRAGA', title: 'hutang denda olahraga bulan sebelumnya', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-02') },
  { user: 'Kenedy Wijaya',          type: 'DENDA_OLAHRAGA', title: 'hutang denda olahraga bulan sebelumnya', amount: 5000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-02') },
  { user: 'Wira Yuda',              type: 'LAINNYA', title: 'Denda Olahraga: Badber(badminton bareng) (Tidak Ikut)', amount: 10000, status: 'BELUM_LUNAS', createdAt: new Date('2026-10-09') },

  // ===== LAINNYA: Biaya Administrasi Masuk Asrama =====
  { user: 'Duta Perdana Putra',     type: 'LAINNYA', title: 'Biaya Administrasi Masuk Asrama', amount: 50000, status: 'BELUM_LUNAS', dueDate: new Date('2026-11-30'), createdAt: new Date('2026-11-20') },

  // ===== IURAN OLAHRAGA: Batminton (Sayid Shobari - DIBATALKAN) =====
  { user: 'Sayid Shobari',          type: 'LAINNYA', title: 'Batminton', amount: 10000, status: 'DIBATALKAN', createdAt: new Date('2026-10-09') },
  { user: 'Muhammad Iqbal Dwi Nazri', type: 'LAINNYA', title: 'hutang denda olahraga bulan sebelumnya', amount: 20000, status: 'BELUM_LUNAS', createdAt: new Date('2026-09-30') },
];

// =====================================================================
// DATA TRANSAKSI ARUS KAS (dari screenshot Arus Kas - 140 transaksi)
// =====================================================================

type TxData = {
  date: Date;
  type: TxType;
  category: string;
  description?: string;
  amount: number;
  paidByName?: string;
};

const TRANSACTIONS: TxData[] = [
  // ===== NOVEMBER 2026 =====
  { date: new Date('2026-11-19'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan November 2026', amount: 80000 },
  { date: new Date('2026-11-19'), type: 'PENGELUARAN', category: 'Uang Gas Elpiji', description: 'Gas tabung', amount: 22000 },
  { date: new Date('2026-11-19'), type: 'PENGELUARAN', category: 'Uang Divisi Kesenian', description: undefined, amount: 20000 },
  { date: new Date('2026-11-18'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan November 2026', amount: 80000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-11-18'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-11-17'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan November 2026', amount: 80000, paidByName: 'Sayid Shobari' },
  { date: new Date('2026-11-17'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-11-17'), type: 'PENGELUARAN', category: 'Uang Divisi Kebersihan', description: 'Penyapu2,penyalap2,sekop sampah1,sendok,spon', amount: 202000 },
  { date: new Date('2026-11-16'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Ramadhan' },
  { date: new Date('2026-11-16'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Sayid Shobari' },
  { date: new Date('2026-11-16'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: '11 galon', amount: 66000 },
  { date: new Date('2026-11-15'), type: 'PENGELUARAN', category: 'Sewa lapangan badminton griya saba insani', description: undefined, amount: 50000 },
  { date: new Date('2026-11-12'), type: 'PENGELUARAN', category: 'Uang Divisi Kebersihan', description: 'Tresbek sampah', amount: 33000 },
  { date: new Date('2026-11-12'), type: 'PENGELUARAN', category: 'Uang Sampah', description: 'Angkut sampah', amount: 40000 },
  { date: new Date('2026-11-10'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan November 2026', amount: 80000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-11-09'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Piket (24/8/2026)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-11-09'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Piket (27/8/2026)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-11-09'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan November 2026', amount: 80000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-11-09'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Tinta printer', amount: 210000 },
  { date: new Date('2026-11-09'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: 'Dapat arisan rt', amount: 10000 },
  { date: new Date('2026-11-09'), type: 'PENGELUARAN', category: 'Uang Rapat RT', description: undefined, amount: 20000 },
  { date: new Date('2026-11-08'), type: 'PENGELUARAN', category: 'Uang Kerja Bakti', description: 'Gorengan,air es', amount: 70000 },
  { date: new Date('2026-11-07'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: 'Galon 11 igek', amount: 65000 },
  { date: new Date('2026-11-07'), type: 'PENGELUARAN', category: 'Beli bola pingpong', description: undefined, amount: 15000 },
  { date: new Date('2026-11-06'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: hutang dibulan april 2026', amount: 44000 },
  { date: new Date('2026-11-06'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan maret 2026', amount: 96000, paidByName: 'Ramadhan' },
  { date: new Date('2026-11-06'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang di bulan februari', amount: 60000, paidByName: 'Ramadhan' },
  { date: new Date('2026-11-03'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Gas tabung', amount: 22000 },

  // ===== OKTOBER 2026 =====
  { date: new Date('2026-10-31'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: hutang dibulan mei 2026', amount: 16000 },
  { date: new Date('2026-10-31'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan maret 2026', amount: 24000, paidByName: 'Wira Yuda' },
  { date: new Date('2026-10-31'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan april 2026', amount: 60000, paidByName: 'Wira Yuda' },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: 'Pembayaran cicilan tagihan: Biaya Administrasi Masuk Asrama', amount: 300000 },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan Agustus 2026', amount: 23000 },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan juni 2026', amount: 96000, paidByName: 'Dandi Apriliady Putra' },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan mei 2026', amount: 60000, paidByName: 'Dandi Apriliady Putra' },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan april 2026', amount: 60000, paidByName: 'Dandi Apriliady Putra' },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan maret 2026', amount: 60000, paidByName: 'Dandi Apriliady Putra' },
  { date: new Date('2026-10-29'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 96000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-10-29'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: undefined, amount: 60000 },
  { date: new Date('2026-10-29'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Bayar websed simas', amount: 60000 },
  { date: new Date('2026-10-25'), type: 'PENGELUARAN', category: 'Uang WiFi',   description: undefined, amount: 333000 },
  { date: new Date('2026-10-23'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: undefined, amount: 60000 },
  { date: new Date('2026-10-23'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: 'Duit nyewa proyektor', amount: 20000 },
  { date: new Date('2026-10-23'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Perbaikan spiker', amount: 20000 },
  { date: new Date('2026-10-20'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan Oktober 2026', amount: 50000 },
  { date: new Date('2026-10-20'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan Oktober 2026', amount: 50000 },
  { date: new Date('2026-10-20'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'rapat bulanan', amount: 39000 },
  { date: new Date('2026-10-19'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 80000, paidByName: 'Kenedy Wijaya' },
  { date: new Date('2026-10-19'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Piket (30/8/2026)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-10-19'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Piket (10/9/2026)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-10-18'), type: 'PENGELUARAN', category: 'Uang Sampah', description: undefined, amount: 40000 },
  { date: new Date('2026-10-17'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 80000, paidByName: 'Muhammad Nuryl faisza' },
  { date: new Date('2026-10-16'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 22000 },
  { date: new Date('2026-10-13'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 80000, paidByName: 'Sayid Shobari' },
  { date: new Date('2026-10-13'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: undefined, amount: 60000 },
  { date: new Date('2026-10-11'), type: 'PENGELUARAN', category: 'Uang Divisi Kebersihan', description: 'Tresbek', amount: 33000 },
  { date: new Date('2026-10-10'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 3000 },
  { date: new Date('2026-10-10'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Adji Nugroho' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Duta Perdana Putra' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Muhammad Iqbal Dwi Nazri' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Muhammad Nuryl faisza' },
  { date: new Date('2026-10-09'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: Badber(badminton bareng)', amount: 10000, paidByName: 'Ramadhan' },
  { date: new Date('2026-10-06'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: undefined, amount: 60000 },
  { date: new Date('2026-10-06'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: undefined, amount: 60000 },
  { date: new Date('2026-10-06'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: 'Uang jual barang bekas', amount: 100000 },
  { date: new Date('2026-10-05'), type: 'PENGELUARAN', category: 'Sewa lap badminton (griya saba insani)', description: undefined, amount: 50000 },
  { date: new Date('2026-10-04'), type: 'PENGELUARAN', category: 'Uang Kerja Bakti', description: 'Kawat,esbatu,saset es', amount: 59000 },
  { date: new Date('2026-10-03'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 80000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-10-03'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Oktober 2026', amount: 80000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-10-03'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Keterlambatan Piket - Tahap 1 (23/9/2026)', amount: 10000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-10-02'), type: 'PEMASUKAN',  category: 'Denda Olahraga', description: 'Pelunasan tagihan: hutang denda olahraga bulan sebelumnya', amount: 5000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-10-02'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Agustus 2026', amount: 96000, paidByName: 'Afif Akbari' },

  // ===== SEPTEMBER 2026 =====
  { date: new Date('2026-09-28'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 60000 },
  { date: new Date('2026-09-26'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 23000 },
  { date: new Date('2026-09-26'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Gas', amount: 22000 },
  { date: new Date('2026-09-25'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Wifi Bulan September', amount: 30000 },
  { date: new Date('2026-09-25'), type: 'PENGELUARAN', category: 'Uang WiFi',   description: undefined, amount: 333000 },
  { date: new Date('2026-09-24'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 96000, paidByName: 'Muhammad Nuryl faisza' },
  { date: new Date('2026-09-24'), type: 'PENGELUARAN', category: 'Uang Divisi Kebersihan', description: 'Alat kebersihan', amount: 84000 },
  { date: new Date('2026-09-23'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: undefined, amount: 60000 },
  { date: new Date('2026-09-21'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 308000 },
  { date: new Date('2026-09-21'), type: 'PENGELUARAN', category: 'Uang Rapat Bulanan', description: undefined, amount: 63000 },
  { date: new Date('2026-09-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan September 2026', amount: 30000 },
  { date: new Date('2026-09-19'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Kenedy Wijaya' },
  { date: new Date('2026-09-17'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-09-17'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 30000, paidByName: 'Duta Perdana Putra' },
  { date: new Date('2026-09-17'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-09-17'), type: 'PENGELUARAN', category: 'Uang Sampah', description: 'uang sampah om gepeng', amount: 40000 },
  { date: new Date('2026-09-17'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'tabung gas', amount: 21000 },
  { date: new Date('2026-09-17'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: '10 galon', amount: 60000 },
  { date: new Date('2026-09-16'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 33000 },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Dandi Apriliady Putra' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Duta Perdana Putra' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Kenedy Wijaya' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Muhammad Iqbal Dwi Nazri' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000 }, // unnamed (Nuryl or Ramadhan)
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Olahraga', description: 'Pelunasan tagihan: Iuran Olahraga: futsal', amount: 10000, paidByName: 'Ramadhan' },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'uang bulan 4,5,6,7', description: 'konfirugasi total saldo awal di sistem', amount: 89000 },
  { date: new Date('2026-09-15'), type: 'PENGELUARAN', category: 'Pelunasan lapangan futsal', description: 'Lapangan futsal bardosono', amount: 120000 },
  { date: new Date('2026-09-15'), type: 'PEMASUKAN',  category: 'Iuran Futsal biak RO 1 (4 orng)', description: 'Iuran per orang Rp.10.000', amount: 40000 },
  { date: new Date('2026-09-14'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Sayid Shobari' },
  { date: new Date('2026-09-14'), type: 'PENGELUARAN', category: 'dp lapangan futsal bardosono', description: 'dp lapangan futsal bardosono', amount: 100000 },
  { date: new Date('2026-09-13'), type: 'PEMASUKAN',  category: 'Denda Piket',  description: 'Pelunasan tagihan: Denda Piket Tahun 2025', amount: 20000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-09-13'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-09-12'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan September 2026', amount: 80000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-09-09'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: '10 galon', amount: 60000 },
  { date: new Date('2026-09-06'), type: 'PENGELUARAN', category: 'Lain-lain',   description: undefined, amount: 22000 },
  { date: new Date('2026-09-02'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Iuran Bulanan Agustus 2026', amount: 96000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-09-02'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan juli2026', amount: 48000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-09-01'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: '9 galon', amount: 54000 },

  // ===== AGUSTUS 2026 =====
  { date: new Date('2026-08-29'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'Perpanjang system website', amount: 60000 },
  { date: new Date('2026-08-26'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: Iuran Bulanan Agustus 2026', amount: 16000 },
  { date: new Date('2026-08-26'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan juli2026', amount: 96000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-08-26'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang di bulan maret', amount: 48000, paidByName: 'Afif Akbari' },
  { date: new Date('2026-08-24'), type: 'PENGELUARAN', category: 'Uang WiFi',   description: 'wifi republik', amount: 333000 },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pembayaran cicilan tagihan: hutang dibulan juli2026', amount: 20000 },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan juni 2026', amount: 96000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: hutang dibulan april 2026', amount: 84000, paidByName: 'Muhammad Kholid Azzam' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 80000, paidByName: 'Desta Iman Hadi' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 80000, paidByName: 'Azhar Rizqullah' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 80000, paidByName: 'Muhammad Nuryl faisza' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 130000, paidByName: 'Al Haj Noor' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 100000, paidByName: 'Al Haj Noor' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 80000, paidByName: 'Kenedy Wijaya' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Iuran Warga',  description: 'Pelunasan tagihan: Konfirmasi Pembayaran Tagihan', amount: 80000, paidByName: 'Adji Nugroho' },
  { date: new Date('2026-08-21'), type: 'PEMASUKAN',  category: 'Lain-lain',    description: undefined, amount: 332000 },
  { date: new Date('2026-08-20'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'uang konfigurasi system', amount: 34000 },
  { date: new Date('2026-08-19'), type: 'PENGELUARAN', category: 'Uang Air Galon', description: '10 galon', amount: 60000 },
  { date: new Date('2026-08-16'), type: 'PENGELUARAN', category: 'Lain-lain',   description: 'agustusan tirakattan', amount: 100000 },
  { date: new Date('2026-08-15'), type: 'PENGELUARAN', category: 'Uang Divisi Kebersihan', description: 'sampah', amount: 40000 },
];

// =====================================================================
// MAIN FUNCTION
// =====================================================================

async function main() {
  // Ambil user IDs dari DB
  const users = await db.user.findMany({
    select: {
      id: true,
      fullName: true,
      roles: {
        select: {
          role: {
            select: { name: true },
          },
        },
      },
    },
  });
  for (const u of users) {
    USERS[u.fullName] = u.id;
  }
  const admin = users.find(u => u.roles.some(r => r.role.name.includes('ADMIN') || r.role.name === 'BENDAHARA')) || users[0];
  if (!admin) throw new Error('Tidak ada user di DB!');
  ADMIN_ID = admin.id;

  console.log(`\n✅ Loaded ${users.length} users dari DB`);
  console.log(`✅ Admin: ${admin.fullName} (${ADMIN_ID})\n`);

  // Cek apakah sudah ada data
  const existingBills = await db.bill.count();
  const existingTx = await db.transaction.count();
  if (existingBills > 0 || existingTx > 0) {
    console.log(`⚠️  Data sudah ada: ${existingBills} bills, ${existingTx} transactions`);
    console.log('⚠️  Script ini tidak menghapus data yang sudah ada. Jika ingin re-run, hapus dulu data yang ada.');
    return;
  }

  // Insert Bills
  console.log(`📋 Inserting ${BILLS.length} bills...`);
  let billsInserted = 0;
  for (const b of BILLS) {
    try {
      const userId = uid(b.user);
      await db.bill.create({
        data: {
          userId,
          type: b.type,
          title: b.title,
          amount: b.amount,
          status: b.status,
          dueDate: b.dueDate ?? null,
          createdAt: b.createdAt ?? new Date(),
          note: b.note ?? null,
        },
      });
      billsInserted++;
    } catch (err) {
      console.error(`  ❌ Bill gagal: ${b.user} - ${b.title}: ${(err as Error).message}`);
    }
  }
  console.log(`  ✅ ${billsInserted}/${BILLS.length} bills berhasil diinsert\n`);

  // Insert Transactions
  console.log(`💰 Inserting ${TRANSACTIONS.length} transactions...`);
  let txInserted = 0;
  for (const t of TRANSACTIONS) {
    try {
      await db.transaction.create({
        data: {
          type: t.type,
          category: t.category,
          description: t.description ?? null,
          amount: t.amount,
          occurredAt: t.date,
          createdById: ADMIN_ID,
          paidByName: t.paidByName ?? null,
        },
      });
      txInserted++;
    } catch (err) {
      console.error(`  ❌ TX gagal: ${t.date.toISOString().slice(0,10)} ${t.category}: ${(err as Error).message}`);
    }
  }
  console.log(`  ✅ ${txInserted}/${TRANSACTIONS.length} transactions berhasil diinsert\n`);

  // Summary
  const finalBills = await db.bill.count();
  const finalTx = await db.transaction.count();
  console.log('='.repeat(50));
  console.log(`✅ RESTORE SELESAI!`);
  console.log(`   Bills di DB: ${finalBills}`);
  console.log(`   Transactions di DB: ${finalTx}`);
  console.log('='.repeat(50));
}

main().catch(console.error).finally(() => db.$disconnect());
