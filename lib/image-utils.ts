'use server';

import sharp from 'sharp';

/**
 * Kompres dan konversi gambar ke WebP menggunakan sharp.
 * - Resize max lebar 1920px (menjaga aspect ratio)
 * - Kualitas WebP 80%
 * - Fallback ke buffer asli jika sharp gagal
 */
export async function compressImage(
  buffer: Buffer,
  options?: { maxWidth?: number; quality?: number }
): Promise<{ buffer: Buffer; ext: string }> {
  const maxWidth = options?.maxWidth ?? 1920;
  const quality = options?.quality ?? 80;

  try {
    const webpBuffer = await sharp(buffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return { buffer: webpBuffer, ext: '.webp' };
  } catch (error) {
    console.error('Sharp compression error, returning original:', error);
    return { buffer, ext: '' }; // ext kosong = pakai ext asli
  }
}
