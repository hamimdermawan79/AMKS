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
    
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    // Ensure dir exists
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

export async function createInventory(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('inventory:create');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const name = formData.get('name') as string;
  const quantity = parseInt(formData.get('quantity') as string || '0', 10);
  const condition = formData.get('condition') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  if (!name) throw new Error('Nama barang wajib diisi');

  // Save photo
  const photoFile = formData.get('photo') as File | null;
  const photoUrl = photoFile && photoFile.size > 0 ? await saveFile(photoFile, 'inventaris') : null;

  await db.inventory.create({
    data: {
      name,
      quantity,
      condition: condition || null,
      location: location || null,
      description: description || null,
      photoUrl,
      createdById: session.user.id,
    },
  });

  revalidatePath('/fasilitas/inventaris');
  revalidatePath('/admin/sekretaris/inventaris');
}

export async function updateInventory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('inventory:update');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const name = formData.get('name') as string;
  const quantity = parseInt(formData.get('quantity') as string || '0', 10);
  const condition = formData.get('condition') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  if (!name) throw new Error('Nama barang wajib diisi');

  const existingItem = await db.inventory.findUnique({ where: { id } });
  if (!existingItem) throw new Error('Barang tidak ditemukan');

  const photoFile = formData.get('photo') as File | null;
  let photoUrl = existingItem.photoUrl;

  if (photoFile && photoFile.size > 0) {
    const newPhoto = await saveFile(photoFile, 'inventaris');
    if (newPhoto) {
      if (photoUrl) {
        try {
          await unlink(path.join(process.cwd(), 'public', photoUrl));
        } catch {}
      }
      photoUrl = newPhoto;
    }
  }

  await db.inventory.update({
    where: { id },
    data: {
      name,
      quantity,
      condition: condition || null,
      location: location || null,
      description: description || null,
      photoUrl,
    },
  });

  revalidatePath('/fasilitas/inventaris');
  revalidatePath('/admin/sekretaris/inventaris');
}

export async function deleteInventory(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasPermission = await canFromSession('inventory:delete');
  if (!hasPermission) throw new Error('Tidak memiliki izin');

  const existingItem = await db.inventory.findUnique({ where: { id } });
  if (existingItem?.photoUrl) {
    try {
      await unlink(path.join(process.cwd(), 'public', existingItem.photoUrl));
    } catch {}
  }

  await db.inventory.delete({ where: { id } });

  revalidatePath('/fasilitas/inventaris');
  revalidatePath('/admin/sekretaris/inventaris');
}
