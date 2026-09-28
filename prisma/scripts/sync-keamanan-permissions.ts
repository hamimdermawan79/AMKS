import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEAMANAN_PERMISSIONS = [
  // Existing
  { code: 'division:manage:keamanan', label: 'Kelola divisi Keamanan (pengumuman, kegiatan, piket malam, buku tamu)', group: 'Keamanan' },
  { code: 'cctv:view', label: 'Lihat kredensial & akses sistem CCTV', group: 'Keamanan' },
  // New
  { code: 'security:duty:manage', label: 'Kelola jadwal piket malam keamanan (generate, hapus, ganti petugas)', group: 'Keamanan' },
  { code: 'security:duty:attend', label: 'Isi presensi piket malam keamanan', group: 'Keamanan' },
  { code: 'guest:book:write', label: 'Tambah & kelola data buku tamu asrama', group: 'Keamanan' },
  { code: 'guest:book:read', label: 'Lihat daftar tamu yang berkunjung', group: 'Keamanan' },
];

const ROLE_PERM_MAP: Record<string, string[]> = {
  SUPERADMIN: [
    'division:manage:keamanan', 'cctv:view',
    'security:duty:manage', 'security:duty:attend',
    'guest:book:write', 'guest:book:read',
  ],
  KETUA: [
    'division:manage:keamanan', 'cctv:view',
    'security:duty:manage', 'security:duty:attend',
    'guest:book:write', 'guest:book:read',
  ],
  SEKRETARIS: [
    'guest:book:write', 'guest:book:read',
    'security:duty:attend',
  ],
  DIVISION_HEAD: [
    'division:manage:keamanan',
    'security:duty:manage', 'security:duty:attend',
    'guest:book:write', 'guest:book:read',
    'cctv:view',
  ],
  WARGA: ['security:duty:attend', 'guest:book:read'],
  CALON_WARGA: ['guest:book:read'],
  ALUMNI: ['guest:book:read'],
};

async function main() {
  console.log('🔄 Menyinkronkan permission Keamanan (Piket Malam & Buku Tamu) ke Database...\n');

  // 1. Upsert permissions
  const permMap = new Map<string, string>();
  for (const p of KEAMANAN_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: p.code },
      update: { label: p.label, group: p.group },
      create: { code: p.code, label: p.label, group: p.group },
    });
    permMap.set(p.code, record.id);
    console.log(`  ✓ Permission: [${p.group}] ${p.code}`);
  }

  // 2. Assign to roles
  for (const [roleName, permCodes] of Object.entries(ROLE_PERM_MAP)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`  ⚠️  Role ${roleName} tidak ditemukan, skip.`);
      continue;
    }

    for (const code of permCodes) {
      const permId = permMap.get(code);
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permId },
        },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
    console.log(`  ✓ Role ${roleName}: ${permCodes.length} izin ditautkan`);
  }

  console.log('\n✅ Sinkronisasi RBAC Keamanan selesai! Semua izin muncul di Pengaturan Sistem.');
}

main()
  .catch((e) => {
    console.error('❌ Sinkronisasi gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
