'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';

async function saveFile(file: File, subdir: string): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const dir = path.join(process.cwd(), 'public', 'uploads', subdir);
    await import('fs').then(fs => fs.promises.mkdir(dir, { recursive: true }));
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${subdir}/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// ===================== LETTER TEMPLATES =====================

export async function createLetterTemplate(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hasPermission = await canFromSession('letter_template:create');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const name = formData.get('name') as string;
  if (!name) throw new Error('Nama format surat wajib diisi');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('File format surat wajib diunggah');

  const fileUrl = await saveFile(file, 'surat-template');
  if (!fileUrl) throw new Error('Gagal mengunggah file');

  await db.letterTemplate.create({
    data: {
      name,
      description: (formData.get('description') as string) || null,
      fileUrl,
      fileName: file.name,
      uploadedById: session.user.id,
    },
  });

  revalidatePath('/admin/sekretaris/surat');
  revalidatePath('/fasilitas/format-surat');
}

export async function deleteLetterTemplate(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hasPermission = await canFromSession('letter_template:delete');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const template = await db.letterTemplate.findUnique({ where: { id } });
  if (template?.fileUrl) {
    try { await unlink(path.join(process.cwd(), 'public', template.fileUrl)); } catch {}
  }

  await db.letterTemplate.delete({ where: { id } });
  revalidatePath('/admin/sekretaris/surat');
  revalidatePath('/fasilitas/format-surat');
}

// ===================== LETTERS (ARSIP SURAT) =====================

export async function createLetter(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hasPermission = await canFromSession('letter:create');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const subject = formData.get('subject') as string;
  if (!subject) throw new Error('Perihal surat wajib diisi');

  const direction = formData.get('direction') as string;
  if (direction !== 'MASUK' && direction !== 'KELUAR') throw new Error('Jenis surat tidak valid');

  const dateStr = formData.get('date') as string;
  if (!dateStr) throw new Error('Tanggal surat wajib diisi');

  const file = formData.get('file') as File | null;
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  if (file && file.size > 0) {
    fileUrl = await saveFile(file, 'surat-arsip');
    fileName = file.name;
  }

  await db.letter.create({
    data: {
      number: (formData.get('number') as string) || null,
      subject,
      direction,
      date: new Date(dateStr),
      sender: (formData.get('sender') as string) || null,
      recipient: (formData.get('recipient') as string) || null,
      description: (formData.get('description') as string) || null,
      fileUrl,
      fileName,
      createdById: session.user.id,
    },
  });

  revalidatePath('/admin/sekretaris/surat');
}

export async function updateLetter(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hasPermission = await canFromSession('letter:update');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const subject = formData.get('subject') as string;
  if (!subject) throw new Error('Perihal surat wajib diisi');

  const direction = formData.get('direction') as string;
  if (direction !== 'MASUK' && direction !== 'KELUAR') throw new Error('Jenis surat tidak valid');

  const dateStr = formData.get('date') as string;
  if (!dateStr) throw new Error('Tanggal surat wajib diisi');

  const existing = await db.letter.findUnique({ where: { id } });
  if (!existing) throw new Error('Surat tidak ditemukan');

  const file = formData.get('file') as File | null;
  let fileUrl = existing.fileUrl;
  let fileName = existing.fileName;
  if (file && file.size > 0) {
    const newUrl = await saveFile(file, 'surat-arsip');
    if (newUrl) {
      if (fileUrl) {
        try { await unlink(path.join(process.cwd(), 'public', fileUrl)); } catch {}
      }
      fileUrl = newUrl;
      fileName = file.name;
    }
  }

  await db.letter.update({
    where: { id },
    data: {
      number: (formData.get('number') as string) || null,
      subject,
      direction,
      date: new Date(dateStr),
      sender: (formData.get('sender') as string) || null,
      recipient: (formData.get('recipient') as string) || null,
      description: (formData.get('description') as string) || null,
      fileUrl,
      fileName,
    },
  });

  revalidatePath('/admin/sekretaris/surat');
}

export async function deleteLetter(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hasPermission = await canFromSession('letter:delete');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const letter = await db.letter.findUnique({ where: { id } });
  if (letter?.fileUrl) {
    try { await unlink(path.join(process.cwd(), 'public', letter.fileUrl)); } catch {}
  }

  await db.letter.delete({ where: { id } });
  revalidatePath('/admin/sekretaris/surat');
}
