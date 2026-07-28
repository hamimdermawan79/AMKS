'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { compressImage } from '@/lib/image-utils';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_IMG = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').regex(/^[\p{L}\p{M}\s.'-]+$/u, 'Nama hanya boleh berisi huruf, spasi, titik, tanda petik, atau tanda hubung'),
  phone: z.string().regex(/^(\+?62|0)\d{9,13}$/, 'Format nomor WA tidak valid (contoh: 6281234567890 atau 081234567890)'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  status: z.enum(['AKTIF', 'ALUMNI']),
  roleIds: z.array(z.string()).min(1, 'Minimal 1 role harus dipilih'),
  jabatan: z.string().nullable().optional(),
  jurusan: z.string().nullable().optional(),
  namaKampus: z.string().nullable().optional(),
  tahunMasuk: z.number().nullable().optional(),
  asalDaerah: z.string().nullable().optional(),
  tahunKeluar: z.number().nullable().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').regex(/^[\p{L}\p{M}\s.'-]+$/u, 'Nama hanya boleh berisi huruf, spasi, titik, tanda petik, atau tanda hubung'),
  phone: z.string().regex(/^(\+?62|0)\d{9,13}$/, 'Format nomor WA tidak valid (contoh: 6281234567890 atau 081234567890)'),
  password: z.string().optional(),
  status: z.enum(['AKTIF', 'ALUMNI']),
  roleIds: z.array(z.string()).min(1, 'Minimal 1 role harus dipilih'),
  jabatan: z.string().nullable().optional(),
  jurusan: z.string().nullable().optional(),
  namaKampus: z.string().nullable().optional(),
  tahunMasuk: z.number().nullable().optional(),
  asalDaerah: z.string().nullable().optional(),
  tahunKeluar: z.number().nullable().optional(),
});

/** Alumni users always get the ALUMNI role; create it if seed was not run yet. */
async function resolveRoleIds(status: string, roleIds: string[]): Promise<string[]> {
  if (status === 'ALUMNI') {
    const alumniRole = await db.role.upsert({
      where: { name: 'ALUMNI' },
      update: {},
      create: { name: 'ALUMNI', label: 'Alumni', isSystem: true },
    });
    return [alumniRole.id];
  }
  return roleIds;
}

// Roles that can only be assigned to exactly 1 active user globally
const GLOBALLY_EXCLUSIVE_ROLES = ['KETUA', 'SEKRETARIS', 'BENDAHARA'];

/**
 * Validate exclusive-role constraints:
 * - SUPERADMIN cannot be assigned via this API (fixed system account).
 * - KETUA, SEKRETARIS, BENDAHARA: only 1 active user may hold each.
 * - DIVISION_HEAD: only 1 active user per divisionScope.
 * excludeUserId: skip checking the user being updated (their own current roles).
 */
async function validateExclusiveRoles(
  roleIds: string[],
  divisionScope: string | null | undefined,
  excludeUserId?: string
) {
  if (roleIds.length === 0) return;

  // Fetch the role records for the requested roleIds
  const requestedRoles = await db.role.findMany({
    where: { id: { in: roleIds } },
    select: { id: true, name: true, label: true },
  });

  for (const role of requestedRoles) {
    // Block SUPERADMIN assignment entirely
    if (role.name === 'SUPERADMIN') {
      throw new Error(
        'Role Super Admin tidak dapat diberikan. Akun Super Admin bersifat tetap dan tidak dapat diubah.'
      );
    }

    // Check globally exclusive roles (KETUA, SEKRETARIS, BENDAHARA)
    if (GLOBALLY_EXCLUSIVE_ROLES.includes(role.name)) {
      // Find all users that have this role
      const usersWithRole = await db.userRole.findMany({
        where: { roleId: role.id },
        include: { user: { select: { id: true, fullName: true, status: true } } },
      });
      // Filter: active users only, not the current user being edited
      const conflicting = usersWithRole.find(
        (ur) =>
          ur.user.status === 'AKTIF' &&
          (!excludeUserId || ur.user.id !== excludeUserId)
      );
      if (conflicting) {
        throw new Error(
          `Role "${role.label}" sudah digunakan oleh ${conflicting.user.fullName}. Role ini hanya boleh dimiliki oleh 1 orang.`
        );
      }
    }

    // Check DIVISION_HEAD per divisionScope
    if (role.name === 'DIVISION_HEAD') {
      if (!divisionScope) {
        throw new Error('Divisi wajib dipilih untuk role Ketua Divisi.');
      }
      // Find all active users with this divisionScope, then check JS-side if they are DIVISION_HEAD
      const existingHeads = await db.user.findMany({
        where: {
          status: 'AKTIF',
          divisionScope: divisionScope as any,
        },
        include: {
          roles: {
            include: { role: { select: { name: true } } },
          },
        },
      });
      const conflicting = existingHeads.find(
        (u) =>
          (!excludeUserId || u.id !== excludeUserId) &&
          u.roles.some((ur) => ur.role.name === 'DIVISION_HEAD')
      );
      if (conflicting) {
        throw new Error(
          `Ketua Divisi ${divisionScope} sudah dijabat oleh ${conflicting.fullName}. Setiap divisi hanya boleh memiliki 1 ketua.`
        );
      }
    }
  }
}

export async function createUser(data: {
  username: string;
  fullName: string;
  phone: string;
  password: string;
  status: string;
  roleIds: string[];
  photoFile?: File | null;
  divisionScope?: string | null;
  jabatan?: string | null;
  jurusan?: string | null;
  namaKampus?: string | null;
  tahunMasuk?: number | null;
  asalDaerah?: string | null;
  tahunKeluar?: number | null;
}) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check permission
  const hasPermission = await canFromSession('user:create');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk membuat user');
  }

  // Alumni status auto-assigns ALUMNI role (no manual role pick needed)
  const roleIds = await resolveRoleIds(data.status, data.roleIds);
  const validated = createUserSchema.parse({ ...data, roleIds });

  // Validate exclusive-role constraints (only for non-alumni)
  if (data.status !== 'ALUMNI') {
    await validateExclusiveRoles(validated.roleIds, data.divisionScope);
  }

  // Check if username already exists
  const existingUser = await db.user.findUnique({
    where: { username: validated.username },
  });

  if (existingUser) {
    throw new Error('Username sudah digunakan');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validated.password, 10);

  // Save photo if provided
  let photoUrl: string | null = null;
  if (data.photoFile) {
    photoUrl = await savePhoto(data.photoFile);
  }

  // Create user
  const user = await db.user.create({
    data: {
      username: validated.username,
      fullName: validated.fullName,
      phone: normalizePhone(validated.phone),
      passwordHash,
      photoUrl,
      status: validated.status as any,
      divisionScope: validated.status === 'ALUMNI' ? null : ((data.divisionScope as any) || null),
      jabatan: validated.status === 'ALUMNI' ? null : (validated.jabatan || null),
      jurusan: validated.jurusan || null,
      namaKampus: validated.namaKampus || null,
      tahunMasuk: validated.tahunMasuk || null,
      asalDaerah: validated.asalDaerah || null,
      tahunKeluar: validated.status === 'ALUMNI' ? (validated.tahunKeluar || null) : null,
      createdById: session.user.id,
    },
  });

  // Assign roles
  for (const roleId of validated.roleIds) {
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId,
      },
    });
  }

  revalidatePath('/admin/warga');
  revalidatePath('/arsip-dokumen/buku-alumni');
  return { success: true, userId: user.id };
}

export async function updateUser(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    password?: string;
    status: string;
    roleIds: string[];
    photoFile?: File | null;
    divisionScope?: string | null;
    jabatan?: string | null;
    jurusan?: string | null;
    namaKampus?: string | null;
    tahunMasuk?: number | null;
    asalDaerah?: string | null;
    tahunKeluar?: number | null;
  }
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check permission
  const hasPermission = await canFromSession('user:update');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk update user');
  }

  // Alumni status auto-assigns ALUMNI role (no manual role pick needed)
  const roleIds = await resolveRoleIds(data.status, data.roleIds);
  const validated = updateUserSchema.parse({ ...data, roleIds });

  // Validate exclusive-role constraints (only for non-alumni, exclude self)
  if (data.status !== 'ALUMNI') {
    await validateExclusiveRoles(validated.roleIds, data.divisionScope, userId);
  }

  // Prepare update data
  const updateData: any = {
    fullName: validated.fullName,
    phone: normalizePhone(validated.phone),
    status: validated.status as any,
    divisionScope: validated.status === 'ALUMNI' ? null : ((data.divisionScope as any) || null),
    jabatan: validated.status === 'ALUMNI' ? null : (validated.jabatan || null),
    jurusan: validated.jurusan || null,
    namaKampus: validated.namaKampus || null,
    tahunMasuk: validated.tahunMasuk || null,
    asalDaerah: validated.asalDaerah || null,
    tahunKeluar: validated.status === 'ALUMNI' ? (validated.tahunKeluar || null) : null,
  };

  // Save new photo if provided
  if (data.photoFile) {
    // Delete old photo
    const existing = await db.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
    if (existing?.photoUrl) {
      try { await unlink(path.join(process.cwd(), 'public', existing.photoUrl)); } catch { }
    }
    updateData.photoUrl = await savePhoto(data.photoFile);
  }

  // Hash password if provided
  if (validated.password && validated.password.length > 0) {
    updateData.passwordHash = await bcrypt.hash(validated.password, 10);
  }

  // Update user
  await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Update roles: delete existing, create new
  await db.userRole.deleteMany({
    where: { userId },
  });

  for (const roleId of validated.roleIds) {
    await db.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  revalidatePath('/admin/warga');
  revalidatePath('/arsip-dokumen/buku-alumni');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check permission
  const hasPermission = await canFromSession('user:delete');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk menghapus user');
  }

  // Prevent deleting self
  if (userId === session.user.id) {
    throw new Error('Tidak dapat menghapus user sendiri');
  }

  // Prevent deleting the SuperAdmin account
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (targetUser?.roles.some((r) => r.role.name === 'SUPERADMIN')) {
    throw new Error('Akun Super Admin tidak dapat dihapus. Akun ini bersifat tetap.');
  }

  // Delete user photo if exists
  if (targetUser?.photoUrl) {
    try { await unlink(path.join(process.cwd(), 'public', targetUser.photoUrl)); } catch { }
  }

  // Delete user (cascade will handle user_roles)
  await db.user.delete({
    where: { id: userId },
  });

  revalidatePath('/admin/warga');
  revalidatePath('/arsip-dokumen/buku-alumni');
  return { success: true };
}

function normalizePhone(phone: string): string {
  // Remove + prefix if present
  let normalized = phone.replace(/^\+/, '');
  // Replace leading 0 with 62
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.slice(1);
  }
  return normalized;
}

async function savePhoto(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMG.includes(ext)) {
    throw new Error(`Format foto tidak didukung: ${ext}`);
  }
  const dir = path.join(UPLOAD_ROOT, 'users');
  await mkdir(dir, { recursive: true });
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, ext: compressedExt } = await compressImage(rawBuffer);
  const finalExt = compressedExt || ext;
  const filename = `${randomUUID()}${finalExt}`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);
  return `/uploads/users/${filename}`;
}
