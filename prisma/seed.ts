import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'SUPERADMIN', label: 'Super Admin', isSystem: true },
  { name: 'KETUA', label: 'Ketua', isSystem: true },
  { name: 'SEKRETARIS', label: 'Sekretaris', isSystem: true },
  { name: 'BENDAHARA', label: 'Bendahara', isSystem: true },
  { name: 'DIVISION_HEAD', label: 'Ketua Divisi', isSystem: true },
  { name: 'WARGA', label: 'Warga', isSystem: true },
  { name: 'ALUMNI', label: 'Alumni', isSystem: true },
];

const PERMISSIONS = [
  // User management
  { code: 'user:create', label: 'Buat user baru', group: 'User' },
  { code: 'user:read', label: 'Lihat user', group: 'User' },
  { code: 'user:update', label: 'Update user', group: 'User' },
  { code: 'user:delete', label: 'Hapus user', group: 'User' },

  // Role & Permission (SuperAdmin only)
  { code: 'role:manage', label: 'Kelola role', group: 'System' },
  { code: 'permission:manage', label: 'Kelola permission', group: 'System' },

  // Documents
  { code: 'document:create', label: 'Upload dokumen', group: 'Document' },
  { code: 'document:read', label: 'Lihat dokumen', group: 'Document' },
  { code: 'document:update', label: 'Update dokumen', group: 'Document' },
  { code: 'document:delete', label: 'Hapus dokumen', group: 'Document' },

  // Posts (Tentang Kami)
  { code: 'post:create', label: 'Buat post', group: 'Post' },
  { code: 'post:read', label: 'Lihat post', group: 'Post' },
  { code: 'post:update', label: 'Update post', group: 'Post' },
  { code: 'post:delete', label: 'Hapus post', group: 'Post' },

  // Karya Ilmiah (repositori karya tulis ilmiah warga)
  { code: 'work:create', label: 'Tambah karya ilmiah', group: 'KaryaIlmiah' },
  { code: 'work:read', label: 'Lihat karya ilmiah', group: 'KaryaIlmiah' },
  { code: 'work:update', label: 'Update karya ilmiah', group: 'KaryaIlmiah' },
  { code: 'work:delete', label: 'Hapus karya ilmiah', group: 'KaryaIlmiah' },

  // Permintaan akses karya ilmiah (dari publik)
  { code: 'access_request:read', label: 'Lihat permintaan akses', group: 'KaryaIlmiah' },
  { code: 'access_request:manage', label: 'Kelola permintaan akses', group: 'KaryaIlmiah' },

  // Activities
  { code: 'activity:create', label: 'Buat kegiatan', group: 'Activity' },
  { code: 'activity:read', label: 'Lihat kegiatan', group: 'Activity' },
  { code: 'activity:update', label: 'Update kegiatan', group: 'Activity' },
  { code: 'activity:delete', label: 'Hapus kegiatan', group: 'Activity' },

  // Announcements
  { code: 'announcement:create', label: 'Buat pengumuman', group: 'Announcement' },
  { code: 'announcement:read', label: 'Lihat pengumuman', group: 'Announcement' },
  { code: 'announcement:update', label: 'Update pengumuman', group: 'Announcement' },
  { code: 'announcement:delete', label: 'Hapus pengumuman', group: 'Announcement' },

  // Piket
  { code: 'piket:schedule', label: 'Generate jadwal piket', group: 'Piket' },
  { code: 'piket:attendance:mark', label: 'Tandai presensi piket', group: 'Piket' },
  { code: 'piket:read', label: 'Lihat jadwal piket', group: 'Piket' },

  // Fines
  { code: 'fine:read', label: 'Lihat denda', group: 'Fine' },
  { code: 'fine:generate', label: 'Generate denda', group: 'Fine' },
  { code: 'fine:settle', label: 'Selesaikan denda', group: 'Fine' },

  // Finance
  { code: 'finance:read', label: 'Lihat keuangan', group: 'Finance' },
  { code: 'finance:transaction:create', label: 'Catat transaksi', group: 'Finance' },
  { code: 'finance:transaction:update', label: 'Update transaksi', group: 'Finance' },
  { code: 'finance:transaction:delete', label: 'Hapus transaksi', group: 'Finance' },

  // Bills
  { code: 'bill:read', label: 'Lihat tagihan', group: 'Bill' },
  { code: 'bill:update', label: 'Update status tagihan', group: 'Bill' },

  // Division Management (scoped)
  { code: 'division:manage:kebersihan', label: 'Kelola divisi Kebersihan', group: 'Division' },
  { code: 'division:manage:kesenian', label: 'Kelola divisi Kesenian', group: 'Division' },
  { code: 'division:manage:keolahragaan', label: 'Kelola divisi Keolahragaan', group: 'Division' },
  { code: 'division:manage:rohani', label: 'Kelola divisi Rohani', group: 'Division' },
];

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPERADMIN: [
    // Full access to everything
    'user:create', 'user:read', 'user:update', 'user:delete',
    'role:manage', 'permission:manage',
    'document:create', 'document:read', 'document:update', 'document:delete',
    'post:create', 'post:read', 'post:update', 'post:delete',
    'work:create', 'work:read', 'work:update', 'work:delete',
    'access_request:read', 'access_request:manage',
    'activity:create', 'activity:read', 'activity:update', 'activity:delete',
    'announcement:create', 'announcement:read', 'announcement:update', 'announcement:delete',
    'piket:schedule', 'piket:attendance:mark', 'piket:read',
    'fine:read', 'fine:generate', 'fine:settle',
    'finance:read', 'finance:transaction:create', 'finance:transaction:update', 'finance:transaction:delete',
    'bill:read', 'bill:update',
    'division:manage:kebersihan', 'division:manage:kesenian', 'division:manage:keolahragaan', 'division:manage:rohani',
  ],
  KETUA: [
    // Access all pages + manajerial global
    'user:create', 'user:read', 'user:update', 'user:delete',
    'document:create', 'document:read', 'document:update', 'document:delete',
    'post:create', 'post:read', 'post:update', 'post:delete',
    'work:create', 'work:read', 'work:update', 'work:delete',
    'access_request:read', 'access_request:manage',
    'activity:create', 'activity:read', 'activity:update', 'activity:delete',
    'announcement:create', 'announcement:read', 'announcement:update', 'announcement:delete',
    'piket:schedule', 'piket:attendance:mark', 'piket:read',
    'fine:read', 'fine:generate', 'fine:settle',
    'finance:read', 'finance:transaction:create', 'finance:transaction:update', 'finance:transaction:delete',
    'bill:read', 'bill:update',
    'division:manage:kebersihan', 'division:manage:kesenian', 'division:manage:keolahragaan', 'division:manage:rohani',
  ],
  SEKRETARIS: [
    // Access all pages (documents, announcements) + manage karya ilmiah & access requests
    'user:create', 'user:read',
    'document:create', 'document:read', 'document:update', 'document:delete',
    'post:create', 'post:read', 'post:update', 'post:delete',
    'work:create', 'work:read', 'work:update', 'work:delete',
    'access_request:read', 'access_request:manage',
    'activity:read', 'announcement:read',
    'piket:read', 'fine:read', 'finance:read', 'bill:read',
  ],
  BENDAHARA: [
    // Finance engine
    'user:read',
    'document:read', 'post:read', 'activity:read', 'announcement:read',
    'work:read',
    'piket:read', 'fine:read', 'fine:settle',
    'finance:read', 'finance:transaction:create', 'finance:transaction:update', 'finance:transaction:delete',
    'bill:read', 'bill:update',
  ],
  DIVISION_HEAD: [
    // Manajerial 1 divisi (scoped)
    'user:read',
    'document:read', 'post:read',
    'work:read',
    'activity:create', 'activity:read', 'activity:update', 'activity:delete',
    'announcement:create', 'announcement:read', 'announcement:update', 'announcement:delete',
    'piket:schedule', 'piket:attendance:mark', 'piket:read',
    'fine:read',
    // Division management permissions. The role grants all four; `can()` narrows
    // each head to their own division by matching the user's divisionScope, so a
    // Kebersihan head can only manage Kebersihan, etc.
    'division:manage:kebersihan', 'division:manage:kesenian', 'division:manage:keolahragaan', 'division:manage:rohani',
  ],
  WARGA: [
    // Read-only
    'user:read',
    'document:read', 'post:read', 'activity:read', 'announcement:read',
    'work:read',
    'piket:read', 'piket:attendance:mark',
    'fine:read', 'bill:read',
  ],
  ALUMNI: [
    // Alumni only get read-only access, no tasks
    'user:read',
    'post:read', 'activity:read', 'announcement:read',
    'work:read',
  ],
};

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  console.log('Creating roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`✅ ${ROLES.length} roles created`);

  // Create permissions
  console.log('Creating permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ ${PERMISSIONS.length} permissions created`);

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const code of permissionCodes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
  console.log('✅ Role-permission mappings created');

  // Create SuperAdmin user
  console.log('Creating SuperAdmin user...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const superadminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });

  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      passwordHash,
      fullName: 'Super Admin',
      phone: '6281234567890',
      status: 'AKTIF',
      jabatan: 'Super Admin',
    },
  });

  if (superadminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superadmin.id,
          roleId: superadminRole.id,
        },
      },
      update: {},
      create: {
        userId: superadmin.id,
        roleId: superadminRole.id,
      },
    });
  }

  console.log('✅ SuperAdmin user created (username: superadmin, password: admin123)');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
