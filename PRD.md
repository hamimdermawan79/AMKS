# PRD — Sistem Web Asrama AMKS

> Product Requirements Document
> Status: Draft v1 · Tanggal: 2026-06-21

## 1. Ringkasan Produk

Sistem web internal untuk pengelolaan asrama: manajemen warga, kepengurusan, kegiatan per-divisi, jadwal & presensi piket dengan denda otomatis, pencatatan keuangan, dokumen resmi, dan notifikasi via WhatsApp bot.

Sistem bersifat **closed (login-only)** kecuali landing page dan dokumentasi (AD/ART) yang publik. **Tidak ada pembayaran online sama sekali** — sistem hanya mencatat tagihan/denda/iuran dan mengirim **notifikasi tenggat** (via bot WA & dashboard). Tidak ada payment gateway, tidak ada proses transaksi uang di dalam aplikasi.

## 2. Tujuan & Non-Tujuan

### Tujuan
- Mendigitalkan administrasi asrama: warga, jabatan, status, kegiatan.
- Otomatisasi jadwal piket + presensi + perhitungan denda.
- Pencatatan keuangan asrama (pemasukan/pengeluaran) + visualisasi.
- Transparansi tagihan per warga (utang denda/iuran) lewat dashboard.
- Pengingat otomatis (piket, tenggat tagihan) lewat WhatsApp & dashboard.

### Non-Tujuan
- **Bukan** payment gateway / dompet digital / pemrosesan transaksi uang.
- Tidak ada upload bukti transfer maupun verifikasi pembayaran online.
- Tidak ada self-registration publik.

## 3. Pengguna & Role

Sistem RBAC: role + permission (dapat diatur SuperAdmin). Divisi diperlakukan sebagai **scope**, bukan role terpisah.

| Role | Hak utama |
|------|-----------|
| **SuperAdmin** | Full access + atur permission semua role |
| **Ketua** | Akses semua page + manajerial global |
| **Sekretaris** | Akses semua page (dokumen, pengumuman, registrasi) |
| **Bendahara** | Engine keuangan, kelola tagihan/iuran |
| **Ketua Divisi** (Kebersihan/Kesenian/Keolahragaan/Rohani) | Manajerial 1 divisi sesuai scope |
| **Warga** | Common user, akses read-only sesuai page |

Aturan akses page divisi:
- Lihat **semua** page divisi: SuperAdmin, Ketua, Sekretaris.
- Ketua Divisi: hanya page divisinya + tombol **"Manajerial"**.
- Warga: semua page divisi mode read-only (jadwal, kegiatan, pengumuman); tombol Manajerial tidak muncul.

## 4. Fitur per Area

### 4.1 Halaman Publik (tanpa login)
- **Landing/Hero** + tombol **Login** (satu-satunya pintu masuk sistem).
- **Dokumentasi**: dokumen resmi (AD/ART, dll). **Publik — bisa dilihat tanpa login.**
- **Tentang Kami**: galeri foto kegiatan + profil asrama.
- **Hubungi Kami**: info/form kontak.

### 4.2 Registrasi (tertutup)
- Hanya **SuperAdmin / Ketua / Sekretaris** yang dapat mendaftarkan warga.
- Login warga: **username + password**. Tiap warga punya **nomor WA**.

### 4.3 User Dashboard
- Ringkasan: **Status Warga** (Aktif/Alumni), **Jabatan**.
- **Keterangan hutang**: total tagihan belum lunas milik warga login.
- **Daftar tagihan** pribadi (denda piket, iuran, lainnya) + status & tenggat.
- **Kegiatan terdekat** (gabungan kegiatan semua divisi).
- Notifikasi tenggat tagihan/iuran tampil di dashboard.

### 4.4 Page Divisi
Setiap page (Kebersihan, Kesenian, Keolahragaan, Rohani):
- Jadwal kegiatan + pengumuman divisi.
- Tombol **"Manajerial"** (hanya Ketua Divisi terkait / Ketua / SuperAdmin): tambah/sunting kegiatan & pengumuman.

**Kebersihan (tambahan):**
- Tampilkan **jadwal piket**.
- Tombol **"Presensi Piket di sini"**.
- **List warga yang tidak piket** + denda terhitung otomatis.
- Manajerial: **buat jadwal piket** — tentukan tanggal mulai–selesai, jumlah kerja bakti, jumlah warga/hari, tarif denda → generate. Trigger notifikasi WA.

### 4.5 Engine Piket (Kebersihan)
- Rules configurable: rentang tanggal, jumlah kerja bakti (1–2x/bulan, hari Minggu), jumlah warga per hari, tarif denda per hari.
- Generate: kerja bakti dipilih merata pada hari Minggu (hari itu **tidak ada piket individu**); sisa hari dibagi **acak & merata** ke warga aktif.
- Presensi: warga klik "Presensi Piket di sini" pada tanggalnya.
- Denda: warga tidak piket × tarif/hari → tagihan denda (contoh: 5 hari × Rp10.000 = Rp50.000).
- Notifikasi reminder H-1 ke warga terjadwal (WA + dashboard).

### 4.6 Engine Keuangan (Bendahara)
- Statistik keuangan asrama.
- **Linechart pemasukan vs pengeluaran** per hari/bulan (tombol generate rentang).
- List warga + detail keuangan tiap warga (utang belum terbayar dll).
- Pencatatan pemasukan/pengeluaran (manual, internal).
- **Bendahara menandai tagihan "Lunas"** secara manual (pencatatan, bukan pembayaran online).

### 4.7 Pengaturan (SuperAdmin)
- Matriks Role × Permission (toggle) tanpa ubah kode.
- Kelola role & jabatan.

### 4.8 Notifikasi (WhatsApp + Dashboard)
- **Tanpa pembayaran** — notifikasi adalah inti penanganan tenggat.
- Reminder piket H-1.
- Reminder tenggat **iuran asrama** & **denda** (jatuh tempo).
- Pengumuman penting divisi.
- WA bot = service terpisah (Baileys) + antrian pesan; dashboard menampilkan notifikasi yang sama.

## 5. Aturan Bisnis Kunci
- Denda dihitung dari data presensi (derivasi), bukan angka statis.
- Tagihan & iuran hanya **dicatat**; statusnya Belum Lunas / Lunas / Dibatalkan, diubah manual oleh Bendahara.
- Status Lunas tidak mewakili transaksi online — hanya konfirmasi administratif.
- Alumni: status warga = ALUMNI (akses & kewajiban menyesuaikan, ditentukan di iterasi berikutnya).

## 6. Tech Stack
- **Next.js (App Router)** + TypeScript + React + Tailwind.
- **PostgreSQL lokal** + **Prisma** ORM.
- **Auth.js** (credentials: username + password).
- **WhatsApp unofficial (Baileys)** sebagai service terpisah + queue.
- Chart: Recharts (atau setara) untuk linechart keuangan.

## 7. Kriteria Sukses (MVP)
- Landing + dokumentasi publik tampil tanpa login.
- Login username/password; RBAC bekerja (tombol Manajerial sesuai role/scope).
- Registrasi tertutup berfungsi.
- Generate jadwal piket benar (kerja bakti dikecualikan, distribusi acak merata).
- Presensi + penutupan periode menghasilkan denda & tagihan otomatis.
- Linechart keuangan render; detail utang per warga tampil.
- Notifikasi tenggat & reminder piket masuk antrian dan terkirim saat bot aktif.
