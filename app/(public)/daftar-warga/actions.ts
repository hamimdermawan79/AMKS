'use server';

import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { compressImage } from '@/lib/image-utils';
import { canFromSession } from '@/lib/rbac/can';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'calon-warga');
const ALLOWED_IMG = ['.jpg', '.jpeg', '.png', '.webp'];

async function saveFile(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMG.includes(ext)) {
    throw new Error(`Format file tidak didukung: ${ext}`);
  }
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, ext: compressedExt } = await compressImage(rawBuffer);
  const finalExt = compressedExt || ext;
  const filename = `${randomUUID()}${finalExt}`;
  const filepath = path.join(UPLOAD_ROOT, filename);
  await writeFile(filepath, buffer);
  return `/uploads/calon-warga/${filename}`;
}

export async function submitPendaftaranCalonWarga(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // ── Ambil & validasi file ──────────────────────────────────────────────
    const fotoKtpFile = formData.get('fotoKtp') as File | null;
    const fotoFormalFile = formData.get('fotoFormal') as File | null;

    if (!fotoKtpFile || fotoKtpFile.size === 0) {
      return { success: false, error: 'Foto KTP wajib diupload.' };
    }
    if (!fotoFormalFile || fotoFormalFile.size === 0) {
      return { success: false, error: 'Foto formal wajib diupload.' };
    }

    // ── Ambil field teks ──────────────────────────────────────────────────
    const namaLengkap = (formData.get('namaLengkap') as string)?.trim();
    const asalDaerahSambas = (formData.get('asalDaerahSambas') as string)?.trim();
    const noHp = (formData.get('noHp') as string)?.trim();
    const jurusan = (formData.get('jurusan') as string)?.trim();
    const namaUniversitas = (formData.get('namaUniversitas') as string)?.trim();
    const tahunMasukAsrama = parseInt(formData.get('tahunMasukAsrama') as string, 10);
    const alasanMasuk = (formData.get('alasanMasuk') as string)?.trim();
    const namaAyah = (formData.get('namaAyah') as string)?.trim();
    const pekerjaanAyah = (formData.get('pekerjaanAyah') as string)?.trim();
    const noHpAyah = (formData.get('noHpAyah') as string)?.trim();
    const namaIbu = (formData.get('namaIbu') as string)?.trim();
    const pekerjaanIbu = (formData.get('pekerjaanIbu') as string)?.trim();
    const noHpIbu = (formData.get('noHpIbu') as string)?.trim();

    // ── Validasi teks wajib ───────────────────────────────────────────────
    const required = [
      ['Nama Lengkap', namaLengkap],
      ['Asal Daerah Sambas', asalDaerahSambas],
      ['Nomor HP', noHp],
      ['Jurusan', jurusan],
      ['Nama Universitas', namaUniversitas],
      ['Alasan Masuk', alasanMasuk],
      ['Nama Ayah', namaAyah],
      ['Pekerjaan Ayah', pekerjaanAyah],
      ['No HP Ayah', noHpAyah],
      ['Nama Ibu', namaIbu],
      ['Pekerjaan Ibu', pekerjaanIbu],
      ['No HP Ibu', noHpIbu],
    ] as [string, string][];

    for (const [field, val] of required) {
      if (!val) return { success: false, error: `Field "${field}" wajib diisi.` };
    }

    if (isNaN(tahunMasukAsrama)) {
      return { success: false, error: 'Tahun masuk asrama wajib dipilih.' };
    }

    // ── Simpan file ke disk ───────────────────────────────────────────────
    const [fotoKtpUrl, fotoFormalUrl] = await Promise.all([
      saveFile(fotoKtpFile),
      saveFile(fotoFormalFile),
    ]);

    try {
      // ── Simpan ke database ────────────────────────────────────────────────
      const calonWarga = await db.calonWarga.create({
        data: {
          fotoKtp: fotoKtpUrl,
          fotoFormal: fotoFormalUrl,
          namaLengkap,
          asalDaerahSambas,
          noHp,
          jurusan,
          namaUniversitas,
          tahunMasukAsrama,
          alasanMasuk,
          namaAyah,
          pekerjaanAyah,
          noHpAyah,
          namaIbu,
          pekerjaanIbu,
          noHpIbu,
        },
      });

      // ── Kirim notifikasi ke Ketua, Sekretaris, Superadmin ─────────────────
      const admins = await db.user.findMany({
        where: {
          status: 'AKTIF',
          roles: {
            some: {
              role: { name: { in: ['SUPERADMIN', 'KETUA', 'SEKRETARIS'] } },
            },
          },
        },
        select: { id: true },
      });

      const uniqueAdminIds = [...new Set(admins.map((a) => a.id))];
      const notifMessage = `${namaLengkap} dari ${asalDaerahSambas}, mahasiswa ${namaUniversitas} (${jurusan}), telah mendaftar sebagai calon warga asrama untuk tahun ${tahunMasukAsrama}. Tinjau di menu Calon Warga.`;

      await Promise.all(
        uniqueAdminIds.map((userId) =>
          createNotification({
            userId,
            title: '🏠 Pendaftaran Calon Warga Baru',
            message: notifMessage,
            type: 'SYSTEM',
            referenceId: calonWarga.id,
          })
        )
      );

      revalidatePath('/admin/calon-warga');
      return { success: true };
    } catch (dbError) {
      // Jika simpan database gagal, hapus foto yang terlanjur terupload
      const ktpPath = path.join(process.cwd(), 'public', fotoKtpUrl);
      const formalPath = path.join(process.cwd(), 'public', fotoFormalUrl);
      await Promise.all([
        unlink(ktpPath).catch(() => {}),
        unlink(formalPath).catch(() => {})
      ]);
      throw dbError; // Lempar ke blok catch utama
    }
  } catch (err) {
    console.error('submitPendaftaranCalonWarga error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
    return { success: false, error: message };
  }
}

// ── Admin actions ──────────────────────────────────────────────────────────

export async function getCalonWargaList() {
  const canAccess = await canFromSession('user:read');
  if (!canAccess) throw new Error('Unauthorized');
  
  return db.calonWarga.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateCalonWargaStatus(
  id: string,
  status: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK',
  catatanAdmin?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const canAccess = await canFromSession('user:update');
    if (!canAccess) throw new Error('Unauthorized');

    await db.calonWarga.update({
      where: { id },
      data: { status, catatanAdmin: catatanAdmin ?? null },
    });
    revalidatePath('/admin/calon-warga');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal update status.';
    return { success: false, error: message };
  }
}
