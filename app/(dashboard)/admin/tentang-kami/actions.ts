'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

// Allowed document extensions
const ALLOWED_DOC = ['.pdf', '.doc', '.docx'];

async function saveFile(file: File, subdir: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name).toLowerCase();
  const isImage = file.type.startsWith('image/');

  if (!isImage && !ALLOWED_DOC.includes(ext)) {
    throw new Error(`Format file tidak didukung: ${ext}`);
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isImage) {
    const filename = `${randomUUID()}.webp`;
    const filepath = path.join(dir, filename);
    
    try {
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();
      await writeFile(filepath, webpBuffer);
      return `/uploads/${subdir}/${filename}`;
    } catch (error) {
      console.error('Sharp conversion error:', error);
      // Fallback to saving original file if sharp fails (e.g. unsupported format like some HEIC on Windows)
      const fallbackFilename = `${randomUUID()}${ext}`;
      const fallbackFilepath = path.join(dir, fallbackFilename);
      await writeFile(fallbackFilepath, buffer);
      return `/uploads/${subdir}/${fallbackFilename}`;
    }
  } else {
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${subdir}/${filename}`;
  }
}

export async function saveProfile(data: {
  visi: string;
  misi: string;
  sejarah: string;
  about: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('post:update');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const existing = await db.asramaProfile.findFirst();

  if (existing) {
    await db.asramaProfile.update({
      where: { id: existing.id },
      data: { ...data, updatedById: session.user.id },
    });
  } else {
    await db.asramaProfile.create({
      data: { ...data, updatedById: session.user.id },
    });
  }

  revalidatePath('/tentang-kami');
  revalidatePath('/admin/tentang-kami');
}

export async function createActivity(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('post:create');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const title = formData.get('title') as string;
  if (!title) throw new Error('Nama kegiatan wajib diisi');

  // Save cover image
  const coverFile = formData.get('cover') as File | null;
  const coverUrl = coverFile ? await saveFile(coverFile, 'kegiatan') : null;

  // Save additional images
  const imageCount = parseInt((formData.get('imageCount') as string) || '0', 10);
  const images: string[] = [];

  for (let i = 0; i < imageCount; i++) {
    const file = formData.get(`image_${i}`) as File | null;
    if (file) {
      const url = await saveFile(file, 'kegiatan');
      if (url) images.push(url);
    }
  }

  const startAtStr = formData.get('startAt') as string;
  const startAt = startAtStr ? new Date(startAtStr) : null;
  const youtubeUrl = formData.get('youtubeUrl') as string | null;

  await db.activity.create({
    data: {
      title,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      youtubeUrl: youtubeUrl || null,
      coverUrl,
      images,
      startAt,
      createdById: session.user.id,
    },
  });

  revalidatePath('/tentang-kami');
  revalidatePath('/admin/tentang-kami');
}

export async function deleteActivity(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('post:delete');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  // Delete associated files from filesystem
  const activity = await db.activity.findUnique({ where: { id } });
  if (activity) {
    const allPhotos = [activity.coverUrl, ...(activity.images ?? [])].filter(Boolean) as string[];
    for (const photoUrl of allPhotos) {
      try {
        const filepath = path.join(process.cwd(), 'public', photoUrl);
        await unlink(filepath);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }

  await db.activity.delete({ where: { id } });

  revalidatePath('/tentang-kami');
  revalidatePath('/admin/tentang-kami');
}

export async function uploadDoc(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('document:create');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const title = formData.get('title') as string;
  if (!title) throw new Error('Judul dokumen wajib diisi');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('File wajib diunggah');

  const fileUrl = await saveFile(file, 'documents');

  await db.document.create({
    data: {
      title,
      fileUrl: fileUrl!,
      isPublic: true,
      uploadedById: session.user.id,
    },
  });

  revalidatePath('/dokumentasi');
  revalidatePath('/admin/tentang-kami');
}

export async function deleteDoc(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('document:delete');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  // Delete file from filesystem
  const doc = await db.document.findUnique({ where: { id } });
  if (doc?.fileUrl) {
    try {
      const filepath = path.join(process.cwd(), 'public', doc.fileUrl);
      await unlink(filepath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  await db.document.delete({ where: { id } });

  revalidatePath('/dokumentasi');
  revalidatePath('/admin/tentang-kami');
}
