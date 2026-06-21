# Plan Implementasi — Sistem Web Asrama AMKS

> Technical plan · Tanggal: 2026-06-21 · Lihat juga `PRD.md`

## 1. Stack & Keputusan

- **Next.js (App Router)** + TypeScript + React + Tailwind CSS — full-stack, satu repo.
- **PostgreSQL lokal** + **Prisma** ORM.
- **Auth.js (NextAuth)** — credentials provider (username + password), session JWT.
- **WhatsApp unofficial (Baileys)** — service Node terpisah + antrian pesan via DB.
- **Recharts** — linechart keuangan.
- **Tanpa payment gateway** — bills/denda/iuran hanya dicatat + notifikasi tenggat.

## 2. Struktur Folder

```
AMKS/
├─ app/
│  ├─ (public)/              # landing, dokumentasi (AD/ART publik), tentang-kami, hubungi-kami
│  ├─ login/
│  ├─ (dashboard)/
│  │  ├─ user/               # User Dashboard
│  │  └─ admin/
│  │     ├─ kebersihan/      # + Manajerial (engine piket)
│  │     ├─ kesenian/
│  │     ├─ keolahragaan/
│  │     ├─ rohani/
│  │     ├─ keuangan/        # engine Bendahara
│  │     ├─ warga/           # manajemen warga + registrasi tertutup
│  │     └─ pengaturan/      # SuperAdmin: role & permission
│  └─ api/                   # route handlers bila perlu
├─ lib/
│  ├─ db.ts                  # Prisma client singleton
│  ├─ auth/                  # Auth.js config + helper
│  ├─ rbac/can.ts            # permission check + scope divisi
│  └─ piket/generate.ts      # generator jadwal piket
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                # roles, permissions, superadmin, tarif denda
├─ services/
│  └─ wa-bot/                # Baileys (proses sendiri) + worker queue wa_message
└─ components/
```

## 3. Model Data (Prisma)

### Enum
```prisma
enum Division { KEBERSIHAN KESENIAN KEOLAHRAGAAN ROHANI }
enum WargaStatus { AKTIF ALUMNI }
enum TxType { PEMASUKAN PENGELUARAN }
enum BillType { DENDA_PIKET IURAN LAINNYA }
enum BillStatus { BELUM_LUNAS LUNAS DIBATALKAN }
enum AttendanceStatus { HADIR TIDAK_HADIR IZIN }
enum WaStatus { PENDING SENT FAILED }
```

### Tabel
- **users**: id, username @unique, passwordHash, fullName, phone (62xxx), status (AKTIF), jabatan?, divisionScope?, photoUrl?, createdById?, timestamps.
- **roles**: id, name @unique, label, isSystem.
- **permissions**: id, code @unique (`resource:action`), label, group.
- **role_permissions**: roleId, permissionId — `@@id([roleId, permissionId])` (editable SuperAdmin).
- **user_roles**: userId, roleId — `@@id([userId, roleId])` (multi-role).
- **documents**: id, title, description, fileUrl, category, isPublic (AD/ART = true), uploadedById, createdAt.
- **posts**: id, title, body, coverUrl, images[], publishedAt, authorId, isPublic.
- **activities**: id, division, title, description, location, startAt, endAt, createdById, createdAt.
- **announcements**: id, division, title, body, pinned, createdById, createdAt.
- **piket_period**: id, startDate, endDate, kerjaBaktiCount, kerjaBaktiWeekday (0=Minggu), peoplePerDay, finePerDay, isActive, generatedById, createdAt.
- **piket_kerja_bakti**: id, periodId, date.
- **piket_assignment**: id, periodId, userId, date — `@@unique([periodId, date, userId])`.
- **piket_attendance**: id, assignmentId @unique, status, markedAt, markedById.
- **fines**: id, userId, periodId, daysMissed, amount (=daysMissed×finePerDay), billId?, createdAt.
- **bills**: id, userId, type, title, amount, status (BELUM_LUNAS), dueDate?, settledAt?, settledById?, note?, createdAt.
- **transactions**: id, type, category, amount, description, occurredAt, relatedBillId?, createdById, createdAt.
- **wa_message**: id, toPhone, body, status (PENDING), attempts, relatedType?, relatedId?, sentAt?, error?, createdAt.
- **audit_log**: id, actorId, action, entity, entityId, meta (Json), createdAt.

## 4. RBAC

- Role + Permission many-to-many; SuperAdmin toggle di `/admin/pengaturan`.
- Divisi = scope (`divisionScope`), bukan role terpisah.
- Permission granular: `user:*`, `role:manage`, `permission:manage`, `document:*`, `post:*`, `activity:*`, `announcement:*`, `piket:schedule|attendance:mark|read`, `fine:read|generate|settle`, `finance:read|transaction:*`, `bill:read|update`, `division:manage:<divisi>`.
- Helper `can(user, permission, scope?)` dipakai di server action + conditional render tombol Manajerial.
- Akses page: semua page → SuperAdmin/Ketua/Sekretaris; Ketua Divisi → divisinya; Warga → read-only.

## 5. Engine Piket (`lib/piket/generate.ts`)

1. Enumerasi tanggal `[startDate, endDate]`.
2. Pilih `kerjaBaktiCount` hari Minggu merata → `piket_kerja_bakti` (dikecualikan dari piket).
3. Sisa hari → distribusi acak & merata `peoplePerDay` warga aktif → `piket_assignment` (round-robin acak).
4. Presensi: warga klik tombol → `piket_attendance(HADIR)`. Lewat tanggal tanpa presensi → TIDAK_HADIR.
5. Tutup periode → hitung `daysMissed` → buat `fines` → buat `bills(DENDA_PIKET)` → enqueue `wa_message`.
6. Reminder H-1: enqueue WA ke warga terjadwal.

## 6. Notifikasi (tanpa pembayaran)

- Enqueue ke `wa_message`; service `wa-bot` (Baileys) poll & kirim.
- Dashboard menampilkan notifikasi yang sama (tenggat iuran/denda, reminder piket, pengumuman).
- Status bill diubah manual oleh Bendahara (pencatatan administratif, bukan transaksi online).

## 7. Fase Eksekusi

| Fase | Isi |
|------|-----|
| **0 — Scaffold** | Init Next.js+TS+Tailwind, Prisma, koneksi Postgres lokal, Auth.js, struktur folder, `schema.prisma` + `seed.ts`, layout public & dashboard shell + guard RBAC |
| **1 — Auth & RBAC** | Login username/password, session, `can()`, guard route, page Pengaturan (toggle permission) |
| **2 — Warga & Registrasi** | CRUD warga, registrasi tertutup, status/jabatan/divisi |
| **3 — Konten** | Dokumentasi (AD/ART publik), posts (Tentang Kami), activities & announcements + Manajerial |
| **4 — Piket Engine** | piket_period, generator, presensi, list tidak piket, denda → bills |
| **5 — Keuangan** | transactions, bills, linechart, detail per warga, settle manual |
| **6 — WhatsApp** | service wa-bot (Baileys) + worker queue, reminder piket H-1 & notifikasi tenggat |

## 8. Verifikasi per Fase

- `npx prisma migrate dev` → tabel terbentuk di Postgres lokal.
- `npx prisma db seed` → SuperAdmin + roles/permissions ada.
- `npm run dev` → landing & dokumentasi tampil tanpa login; login SuperAdmin sukses.
- RBAC: Warga tak melihat tombol Manajerial; Ketua Divisi hanya divisinya; SuperAdmin/Ketua/Sekretaris akses semua page.
- Piket: generate mengecualikan kerja bakti & distribusi merata; presensi + tutup periode → denda & bill otomatis.
- Keuangan: linechart render; detail utang per warga tampil; settle manual mengubah status.
- WA: `wa_message` ter-enqueue (cek tabel) & terkirim saat bot aktif (scan QR).

## 9. Env (placeholder, diisi user)

```
DATABASE_URL=postgresql://user:password@localhost:5432/amks
AUTH_SECRET=<generate>
```
