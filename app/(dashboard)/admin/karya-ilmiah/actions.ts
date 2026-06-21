'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ScientificWorkType } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const currentYear = 2026; // tahun acuan validasi (selaras dengan kalender sistem)

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'karya');
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// Field berkas PDF yang didukung -> nama input pada FormData
const FILE_FIELDS = {
  abstractFileUrl: 'abstractFile',
  titlePageFileUrl: 'titlePageFile',
  tocFileUrl: 'tocFile',
} as const;

type FileFieldKey = keyof typeof FILE_FIELDS;

const fieldSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  authorName: z.string().min(1, 'Nama penulis wajib diisi'),
  authorInstitution: z.string().optional(),
  type: z.nativeEnum(ScientificWorkType),
  year: z
    .number({ invalid_type_error: 'Tahun harus berupa angka' })
    .int('Tahun harus bilangan bulat')
    .min(1980, 'Tahun minimal 1980')
    .max(currentYear + 1, `Tahun maksimal ${currentYear + 1}`),
  isPublished: z.boolean(),
});

/**
 * Simpan berkas PDF ke public/uploads/karya.
 * Mengembalikan path publik (mis. /uploads/karya/xxx.pdf), atau null bila tidak ada berkas.
 */
async function savePdf(file: File | null, label: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (file.type !== 'application/pdf') {
    throw new Error(`Berkas ${label} harus berformat PDF`);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`Ukuran berkas ${label} maksimal 10 MB`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/karya/${filename}`;
}

/** Hapus berkas lama dari disk (best-effort). */
async function removeFile(publicPath: string | null | undefined) {
  if (!publicPath) return;
  try {
    const abs = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
    await unlink(abs);
  } catch {
    // abaikan jika berkas sudah tidak ada
  }
}

function parseFields(formData: FormData) {
  return fieldSchema.parse({
    title: String(formData.get('title') ?? ''),
    authorName: String(formData.get('authorName') ?? ''),
    authorInstitution: String(formData.get('authorInstitution') ?? ''),
    type: String(formData.get('type') ?? '') as ScientificWorkType,
    year: Number(formData.get('year')),
    isPublished: formData.get('isPublished') === 'true',
  });
}

const FILE_LABELS: Record<FileFieldKey, string> = {
  abstractFileUrl: 'abstrak',
  titlePageFileUrl: 'halaman judul',
  tocFileUrl: 'daftar isi',
};

/** Simpan semua berkas yang diunggah; kembalikan map field -> path (hanya yang ada). */
async function saveUploadedFiles(
  formData: FormData
): Promise<Partial<Record<FileFieldKey, string>>> {
  const result: Partial<Record<FileFieldKey, string>> = {};
  for (const [field, inputName] of Object.entries(FILE_FIELDS) as [
    FileFieldKey,
    string,
  ][]) {
    const raw = formData.get(inputName);
    const saved = await savePdf(
      raw instanceof File ? raw : null,
      FILE_LABELS[field]
    );
    if (saved) result[field] = saved;
  }
  return result;
}

export async function createWork(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await canFromSession('work:create');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk menambah karya ilmiah');
  }

  const fields = parseFields(formData);
  const files = await saveUploadedFiles(formData);

  await db.scientificWork.create({
    data: {
      title: fields.title,
      authorName: fields.authorName,
      authorInstitution: fields.authorInstitution?.trim() || null,
      type: fields.type,
      year: fields.year,
      abstractFileUrl: files.abstractFileUrl ?? null,
      titlePageFileUrl: files.titlePageFileUrl ?? null,
      tocFileUrl: files.tocFileUrl ?? null,
      isPublished: fields.isPublished,
      publishedById: session.user.id,
    },
  });

  revalidatePath('/admin/karya-ilmiah');
  revalidatePath('/karya-ilmiah');
  return { success: true };
}

export async function updateWork(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await canFromSession('work:update');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk mengubah karya ilmiah');
  }

  const fields = parseFields(formData);
  const newFiles = await saveUploadedFiles(formData);

  const existing = await db.scientificWork.findUnique({
    where: { id },
    select: {
      abstractFileUrl: true,
      titlePageFileUrl: true,
      tocFileUrl: true,
    },
  });

  // Field non-berkas selalu diperbarui; berkas hanya diganti jika ada yang baru
  const data: {
    title: string;
    authorName: string;
    authorInstitution: string | null;
    type: ScientificWorkType;
    year: number;
    isPublished: boolean;
    abstractFileUrl?: string;
    titlePageFileUrl?: string;
    tocFileUrl?: string;
  } = {
    title: fields.title,
    authorName: fields.authorName,
    authorInstitution: fields.authorInstitution?.trim() || null,
    type: fields.type,
    year: fields.year,
    isPublished: fields.isPublished,
  };

  for (const field of Object.keys(FILE_FIELDS) as FileFieldKey[]) {
    if (newFiles[field]) data[field] = newFiles[field];
  }

  await db.scientificWork.update({ where: { id }, data });

  // Hapus berkas lama yang baru saja diganti
  for (const field of Object.keys(FILE_FIELDS) as FileFieldKey[]) {
    if (newFiles[field] && existing?.[field]) {
      await removeFile(existing[field]);
    }
  }

  revalidatePath('/admin/karya-ilmiah');
  revalidatePath('/karya-ilmiah');
  return { success: true };
}

export async function deleteWork(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await canFromSession('work:delete');
  if (!hasPermission) {
    throw new Error('Anda tidak memiliki izin untuk menghapus karya ilmiah');
  }

  const existing = await db.scientificWork.findUnique({
    where: { id },
    select: {
      abstractFileUrl: true,
      titlePageFileUrl: true,
      tocFileUrl: true,
    },
  });

  // Cascade akan menghapus access_requests terkait
  await db.scientificWork.delete({ where: { id } });

  if (existing) {
    await removeFile(existing.abstractFileUrl);
    await removeFile(existing.titlePageFileUrl);
    await removeFile(existing.tocFileUrl);
  }

  revalidatePath('/admin/karya-ilmiah');
  revalidatePath('/karya-ilmiah');
  return { success: true };
}
