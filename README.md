# AMKS

Sistem Informasi Manajemen Asrama Mahasiswa.

## Recent Fixes & Updates

- **Perbaikan Keuangan View:** Memisahkan akses halaman Keuangan. Pengguna dengan role `warga` biasa akan otomatis menampilkan `KeuanganUserView` untuk tagihannya, sedangkan Bendahara/Ketua mengakses halaman manajemen kelola keuangan (*Admin View*).
- **Perbaikan Navigasi Sidebar:** Membuka semua *link* menu Divisi (Kebersihan, Kesenian, Keolahragaan, Rohani) di *sidebar* agar selalu muncul untuk seluruh warga.
- **Main Dashboard & Kegiatan Terdekat:**
  - Mengubah *box* "Kegiatan Terdekat" dan "Tagihan Saya" di `/user` agar dinamis dan terhubung langsung dengan *database* (Kerja Bakti, Olahraga, Tagihan).
  - Menyeragamkan *layout* Kegiatan Terdekat dengan format: **Tanggal** -> **Nama Kegiatan** -> **Peran/Tugas Khusus** (jika ada).
  - **Fitur Jadwal Rohani:** Jadwal Rohani terdekat kini akan otomatis muncul di *Dashboard*. Apabila warga yang sedang *login* bertugas sebagai **Imam Maghrib**, **Imam Isya**, atau pengisi **Kultum**, sistem akan mendeteksi dan memunculkan notifikasi/pesan khusus bahwa Anda bertugas pada kegiatan tersebut.
- **Pengecualian Superadmin:** Akun Superadmin kini dikecualikan dari daftar warga asrama reguler agar tidak muncul di daftar tagihan bulanan dan tidak mendapat denda piket/tagihan secara tak sengaja.
- **Penyempurnaan Buku Pembantu Warga & Rangkuman Bulanan (Keuangan):**
  - **Rangkuman Tunggakan:** Tabel daftar warga yang menunggak kini dikelompokkan secara cerdas per nama warga (tidak ada duplikasi nama warga). Menambahkan dropdown "Jenis Tagihan" agar Bendahara dapat melihat detail nominal per tagihan secara spesifik tanpa harus berpindah halaman.
  - **Action Buttons:** Menambahkan tombol aksi cepat langsung pada tiap baris Buku Pembantu Warga (Aksi: Konfirmasi Lunas ✅, Batalkan Tagihan ❌, dan Beri Izin Telat Awal Bulan Depan 🕒).
- **Perombakan Layout Dashboard User:**
  - Membersihkan tampilan *Headbar* dari elemen redundan ("Selamat datang") menjadi lebih profesional dengan hanya menampilkan Nama Lengkap dan Jabatan.
  - Mengubah ucapan *Greetings* menjadi lebih dinamis mengikuti zona waktu (Pagi/Siang/Sore/Malam).
  - Menambahkan tautan **Details →** pada card **Total Tagihan** di bagian atas untuk navigasi cepat.
  - Menghapus list "Tagihan Saya" dari grid tengah guna memberi ruang pada informasi pengumuman.
  - Menata proporsi card **Pengumuman**, **Kegiatan Terdekat**, dan **Jadwal Piket Saya** agar lebih estetis dan hierarkis dengan grid 2:1.
  - Menambahkan logika adaptif pada card **Jadwal Piket Saya**: Jika hari ini adalah jadwal piket warga tersebut dan waktu berada dalam rentang *01:00 - 11:00 WIB*, card akan otomatis menyorot dan mengubah *call-to-action* menjadi tombol **Silahkan Presensi di Sini →** yang mengarahkan langsung ke halaman presensi.
- **Two-Way Sync Modul Keuangan & Kebersihan (Denda Piket):**
  - **Auto-Settle:** Menambahkan sinkronisasi otomatis agar ketika Bendahara melunasi (`settleBill`) tagihan berjenis *Denda Piket*, sistem akan mencari data `Fine` (Denda) di modul Kebersihan dan merekam pembayaran (menerbitkan `FinePayment` otomatis yang bertaut pada Transaksi Pemasukan). Hal ini menyelesaikan isu *total denda sepanjang masa yang terus membludak* di modul Kebersihan akibat miskomunikasi pelunasan antar modul.
  - **Auto-Cancel:** Apabila Bendahara membatalkan (`cancelBill`) tagihan *Denda Piket*, sistem juga akan merespons secara instan dengan menghapus bersih data denda piket tersebut dari panel Admin Kebersihan.

---

## Modul Kebersihan & Piket — Pembaruan Lengkap

Bagian ini mendokumentasikan secara rinci seluruh pengembangan terbaru pada modul Kebersihan, mencakup tampilan warga (*user view*), alur presensi dengan bukti, halaman laporan (*report*) untuk pengurus, sistem denda yang persisten, hingga pembayaran cicilan dan ekspor PDF.

### 1. Perombakan Tampilan Warga (`KebersihanUserView`)

Halaman Kebersihan yang dilihat warga (`/admin/kebersihan`) mengalami penyempurnaan pada dua area utama:

- **Card "Piket Saya Terdekat" — Tombol Presensi Adaptif:**
  - Tombol presensi kini mengikuti *window* waktu resmi piket (pukul **01:00–11:00 WIB** pada hari piket yang bersangkutan, selaras dengan validasi di sisi server).
  - Status tombol berubah secara dinamis:
    - **"Presensi di sini"** (tombol aktif) ketika waktu presensi sedang dibuka.
    - **"Presensi Tutup"** (tombol nonaktif/abu-abu) ketika waktu belum tiba atau sudah terlewat, disertai keterangan singkat ("Presensi dibuka pukul 01:00–11:00 WIB pada hari piket Anda" atau "Batas waktu presensi sudah terlewat").
    - **"Sudah presensi"** (badge hijau) setelah warga berhasil presensi.
  - **Perbaikan bug:** Logika `isPresensiOpen` sebelumnya keliru menambahkan akhiran `T00:00:00+07:00` pada string ISO yang sudah lengkap sehingga menghasilkan tanggal tidak valid — akibatnya tombol presensi tidak pernah muncul dari *card*. Diganti dengan fungsi `presensiStatus` yang membandingkan tanggal berbasis kalender WIB (*date-only key*), sehingga bekerja konsisten baik dari *card*, tabel jadwal, maupun riwayat.

- **Bagian "Riwayat Piket Saya" (sebelumnya "Presensi Piket Saya"):**
  - **Panel Statistik (4 kartu):** Piket (hijau), Tidak Piket (merah), Belum Terlaksana (abu-abu), dan Estimasi Denda (kuning).
  - **Estimasi Denda** dihitung dari `jumlah hari tidak piket × tarif denda/hari` (`finePerDay` yang ditetapkan pengurus pada periode), disertai catatan bahwa angka final ditetapkan saat periode ditutup.
  - **Log Riwayat** menampilkan hari, tanggal, dan sektor dengan warna sesuai status: **Piket = hijau**, **Tidak Piket = merah**, dan **belum waktunya = abu-abu**. Hari yang masih dalam *window* presensi tetap menampilkan tombol "Presensi" sehingga log sekaligus berfungsi sebagai sarana aksi.
  - **Pemetaan status:** `hadir` → Piket; `tutup` (hari/jam presensi terlewat tanpa kehadiran) → Tidak Piket; `belum`/`buka` → pending (abu-abu, tidak dihitung sebagai denda).

### 2. Presensi dengan Bukti (Modal Presensi)

Alur presensi warga kini mewajibkan kelengkapan bukti melalui sebuah *modal* (popup) sebelum kehadiran tercatat:

- **Foto Bukti Piket** — narasi **"Tambahkan Bukti Anda Telah Piket"**. Menerima format JPG/PNG/WEBP dengan ukuran maksimal 10 MB.
- **Checkbox Pernyataan** — **"Saya Telah Melakukan Piket, dan Saya Mengisi Form Ini Dengan Kejujuran Penuh"**.
- **Kotak Keluhan** — narasi **"Sampaikan Keluhan Anda disini"** untuk menampung komplain/keluhan selama piket.
- **Validasi wajib:** Tombol "Presensi" baru aktif setelah ketiga elemen terisi (foto + centang pernyataan + keluhan). Validasi diterapkan ganda di sisi klien (UX) dan di sisi server (keamanan).
- **Penyimpanan berkas:** Foto disimpan ke `public/uploads/piket/` mengikuti pola unggah yang sudah ada pada modul Karya Ilmiah (`writeFile` + nama acak `randomUUID`). *Path* publik foto dan teks keluhan disimpan pada record `PiketAttendance`.
- **Refactor `selfPresensi`:** *Server action* `selfPresensi` diubah dari menerima `assignmentId` (string) menjadi menerima `FormData` (berisi `assignmentId`, `photo`, `complaint`, `agreement`) agar dapat memproses unggahan berkas. Validasi *window* waktu 01:00–11:00 WIB tetap dipertahankan.

### 3. Perubahan Skema Basis Data (`prisma/schema.prisma`)

- **`PiketAttendance`** memperoleh dua kolom baru:
  - `photoUrl String?` — *path* publik foto bukti piket.
  - `complaint String?` — teks keluhan warga saat presensi.
- **Model baru `FinePayment`** — buku besar (*ledger*) pembayaran/cicilan denda piket:
  - Field: `id`, `fineId`, `amount`, `note`, `paidAt`, `recordedById`, dan relasi 1:1 opsional ke `Transaction` (`paymentTxId`).
  - Relasi `Fine.payments FinePayment[]` ditambahkan; total terbayar sebuah denda = `sum(payments.amount)`.
  - Dirancang **terpisah** dari relasi `Bill`↔`Transaction` (yang bersifat 1:1) agar mendukung banyak cicilan tanpa mengubah modul Keuangan yang sudah berjalan.
- Relasi balik (*opposite relation*) ditambahkan pada model `User` (`recordedFinePayments`) dan `Transaction` (`finePayment`).

### 4. Server Actions Baru (`app/(dashboard)/admin/kebersihan/actions.ts`)

- **`closePeriodAction(periodId)`** — membungkus `closePiketPeriod` dengan otorisasi pengurus dan **penjaga idempotensi**: periode yang sudah ditutup (`isActive = false`) ditolak agar proses tidak berulang. Karena denda harian sudah diterbitkan otomatis oleh cron (`checkMissedPikets`), penutupan periode hanya menyelesaikan absensi yang tertinggal (fallback denda harian), mengirimkan rekapitulasi kehadiran via WhatsApp tanpa menerbitkan tagihan ganda, dan menonaktifkan status periode aktif.
- **`recordFinePayment({ fineId, amount, note })`** — mencatat pembayaran/cicilan denda:
  - Membuat satu `Transaction` bertipe **PEMASUKAN** kategori **"Denda Piket"** (tanpa relasi `Bill` langsung, karena satu denda dapat dicicil beberapa kali).
  - Mencatat record `FinePayment` yang menunjuk transaksi tersebut.
  - Bila total pembayaran ≥ nominal denda, `Bill` terkait otomatis diset **LUNAS**.
  - Memvalidasi agar nominal tidak melebihi sisa denda, dan menolak pembayaran jika denda sudah lunas.
  - Sengaja **tidak** memodifikasi `settleBill` agar modul Keuangan yang ada tetap utuh.

### 5. Halaman Laporan Pengurus (`/admin/kebersihan/laporan`)

Halaman baru khusus pengurus, dengan akses dibatasi melalui RBAC (`division:manage:kebersihan`) untuk **Superadmin, Ketua, dan Ketua Divisi Kebersihan**. Terdiri atas berkas server (`page.tsx`) dan komponen klien (`LaporanClient.tsx`).

- **Pemilih Periode (*Period Selector*):** Dropdown untuk memilih periode piket aktif maupun yang sudah lampau; seluruh laporan menyesuaikan periode terpilih.
- **A. Statistik Piket per Warga (periode terpilih):**
  - Jumlah Piket / Tidak Piket / Belum dan estimasi denda per warga.
  - **Akun Superadmin dikecualikan** dari statistik per orang (sesuai kebijakan).
  - Disertai **grafik batang (recharts)** Piket vs Tidak Piket.
- **B. Rekap Harian:** Per tanggal menampilkan siapa yang **Piket (hijau)** / **Tidak Piket (merah)**, isi **keluhan**, dan tombol **"Lihat Foto"** untuk menampilkan bukti. Data ini melekat pada periode sehingga otomatis "berganti" ketika jadwal baru di-*generate*.
- **C. Denda per Warga (Sepanjang Masa):** Akumulasi seluruh `Fine` lintas periode (tidak hilang saat jadwal baru dibuat). Menampilkan total denda, total terbayar, dan sisa per warga, lengkap dengan rincian per periode dan riwayat cicilan.
  - Setiap denda yang belum lunas memiliki tombol **"Cicil / Bayar"** yang membuka *modal* pembayaran (input nominal + catatan opsional + riwayat pembayaran).
- **D. Ringkasan Global:** Tiga kartu ringkasan — Total Denda Sepanjang Masa, Total Terbayar, dan **Belum Terbayar (Sepanjang Masa)**.
- **Tombol "Tutup Periode & Finalisasi Denda":** Hanya muncul pada periode aktif; memicu `closePeriodAction` dengan konfirmasi.
- **Tombol "Cetak Presentasi":** Mengekspor seluruh area laporan menjadi **berkas PDF** (lihat poin 6), ditujukan untuk bahan rapat evaluasi bulanan/audit.

### 6. Ekspor PDF "Cetak Presentasi"

- Menambahkan dependensi **`jspdf`** dan **`html2canvas`**.
- Tombol "Cetak Presentasi" menangkap area laporan (termasuk grafik recharts) menjadi *canvas* lalu menyusunnya ke PDF A4 multi-halaman, dengan nama berkas mengikuti rentang tanggal periode.
- Berkas PDF berisi judul laporan, ringkasan global, statistik per warga beserta grafik, rekap harian, dan rekap denda — sebagai dokumen lengkap untuk rapat evaluasi.

### 7. Navigasi

- Tautan **"Laporan & Denda"** ditambahkan pada dua titik masuk pengurus:
  - Di header halaman kelola (`KebersihanAdminClient`).
  - Di area tombol admin pada tampilan divisi (`KebersihanUserView`), berdampingan dengan tombol "Akses Layanan Admin".

### Catatan Keamanan

- Foto bukti piket disimpan di `public/uploads/piket/` yang **dapat diakses publik** melalui URL langsung tanpa autentikasi (mengikuti konvensi unggah modul Karya Ilmiah yang sudah ada). Karena foto bukti bersifat lebih sensitif (memuat wajah/identitas warga), bila diperlukan tingkat privasi lebih tinggi, berkas dapat dipindahkan ke luar direktori `public/` dan disajikan melalui *route handler* yang memeriksa autentikasi.

## Plan: Fitur Buku Alumni (Untuk Tim Backend)

Fitur Buku Alumni memungkinkan asrama untuk mendata dan menampilkan profil alumni yang pernah menetap di asrama.

### 1. Struktur Database (Schema)
Perlu dibuat model `Alumni` di database (misal menggunakan Prisma) dengan skema dasar berikut:
- `id` (String/UUID, Primary Key)
- `nama` (String) - Nama lengkap alumni
- `tanggalMasuk` (DateTime) - Tanggal masuk asrama
- `tanggalKeluar` (DateTime) - Tanggal meninggalkan asrama
- `kampus` (String) - Nama universitas/kampus
- `fotoUrl` (String, opsional) - Path/URL foto alumni (jika ada)
- `createdAt` & `updatedAt` (DateTime)

### 2. Konfigurasi Izin Akses (Permissions/RBAC)
Penambahan dan pengelolaan data Buku Alumni hanya dapat dilakukan oleh peran (Role) tertentu:
- **Superadmin**
- **Ketua**
- **Sekretaris**

Pengaturan konfigurasi hak akses ini harus ditambahkan dan dikelola melalui **Menu Pengaturan Sistem** di _dashboard_ Superadmin, Ketua, dan Sekretaris. Dengan demikian, izin (e.g. `canManageAlumni`) dapat disesuaikan secara dinamis dari UI tanpa hardcode.

### 3. API & Endpoints
- `GET /api/alumni`: Fetch daftar alumni (Public/Frontend).
- `POST /api/alumni`: Create data alumni baru (Protected).
- `PUT /api/alumni/:id`: Update data (Protected).
- `DELETE /api/alumni/:id`: Delete data (Protected).
Pastikan middleware memeriksa konfigurasi akses sebelum mengeksekusi *route* modifikasi data.
