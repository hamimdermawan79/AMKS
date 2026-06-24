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

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_IMG = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),
  phone: z.string().regex(/^62\d{9,13}$/, 'Format nomor WA: 62xxx (9-13 digit)'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  status: z.enum(['AKTIF', 'ALUMNI']),
  roleIds: z.array(z.string()).min(1, 'Minimal 1 role harus dipilih'),
  jabatan: z.string().nullable().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),
  phone: z.string().regex(/^62\d{9,13}$/, 'Format nomor WA: 62xxx (9-13 digit)'),
  password: z.string().optional(),
  status: z.enum(['AKTIF', 'ALUMNI']),
  roleIds: z.array(z.string()).min(1, 'Minimal 1 role harus dipilih'),
  jabatan: z.string().nullable().optional(),
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
      phone: validated.phone,
      passwordHash,
      photoUrl,
      status: validated.status as any,
      divisionScope: validated.status === 'ALUMNI' ? null : ((data.divisionScope as any) || null),
      jabatan: validated.status === 'ALUMNI' ? null : (validated.jabatan || null),
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

  // Prepare update data
  const updateData: any = {
    fullName: validated.fullName,
    phone: validated.phone,
    status: validated.status as any,
    divisionScope: validated.status === 'ALUMNI' ? null : ((data.divisionScope as any) || null),
    jabatan: validated.status === 'ALUMNI' ? null : (validated.jabatan || null),
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

  // Delete user photo
  const user = await db.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
  if (user?.photoUrl) {
    try { await unlink(path.join(process.cwd(), 'public', user.photoUrl)); } catch { }
  }

  // Delete user (cascade will handle user_roles)
  await db.user.delete({
    where: { id: userId },
  });

  revalidatePath('/admin/warga');
  return { success: true };
}

async function savePhoto(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMG.includes(ext)) {
    throw new Error(`Format foto tidak didukung: ${ext}`);
  }
  const dir = path.join(UPLOAD_ROOT, 'users');
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  return `/uploads/users/${filename}`;
}
