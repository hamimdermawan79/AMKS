import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KESEKRETARIATAN_PERMISSIONS = [
  { code: 'meeting:create', label: 'Buat agenda rapat & jadwal RT', group: 'Kesekretariatan' },
  { code: 'meeting:read', label: 'Lihat agenda rapat & notulensi', group: 'Kesekretariatan' },
  { code: 'meeting:update', label: 'Kelola notulensi & kehadiran rapat', group: 'Kesekretariatan' },
  { code: 'meeting:delete', label: 'Hapus agenda / notulensi rapat', group: 'Kesekretariatan' },
  { code: 'division:manage:sekretaris', label: 'Kelola divisi Sekretaris', group: 'Division' },
];

const ROLE_PERM_MAP: Record<string, string[]> = {
  SUPERADMIN: ['meeting:create', 'meeting:read', 'meeting:update', 'meeting:delete', 'division:manage:sekretaris'],
  KETUA: ['meeting:create', 'meeting:read', 'meeting:update', 'meeting:delete', 'division:manage:sekretaris'],
  SEKRETARIS: ['meeting:create', 'meeting:read', 'meeting:update', 'meeting:delete', 'division:manage:sekretaris'],
  DIVISION_HEAD: ['meeting:read', 'meeting:update'],
  WARGA: ['meeting:read'],
  CALON_WARGA: ['meeting:read'],
  ALUMNI: ['meeting:read'],
};

async function main() {
  console.log('🔄 Menyinkronkan permission Kesekretariatan & Notulensi ke Database...');

  // 1. Upsert Permissions
  const permMap = new Map<string, string>();
  for (const p of KESEKRETARIATAN_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: p.code },
      update: { label: p.label, group: p.group },
      create: { code: p.code, label: p.label, group: p.group },
    });
    permMap.set(p.code, record.id);
    console.log(`  ✓ Permission: [${p.group}] ${p.code} (${p.label})`);
  }

  // 2. Assign to Roles
  for (const [roleName, permCodes] of Object.entries(ROLE_PERM_MAP)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const code of permCodes) {
      const permId = permMap.get(code);
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permId,
        },
      });
    }
    console.log(`  ✓ Role ${roleName}: ditautkan ${permCodes.length} izin kesekretariatan`);
  }

  console.log('\n✅ Sinkronisasi RBAC Kesekretariatan selesai! Modul sekarang akan muncul di Pengaturan Sistem.');
}

main()
  .catch((e) => {
    console.error('❌ Sinkronisasi gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
