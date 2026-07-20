import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Izinkan berjalan hingga 60 detik (jika menggunakan serverless Vercel)

export async function GET(request: Request) {
  try {
    // 1. Otorisasi Keamanan
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET environment variable is not configured on the server.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Hitung tanggal 30 hari yang lalu dari sekarang
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 3. Cari absensi piket yang fotonya belum dihapus dan umurnya lebih dari 30 hari
    const oldAttendances = await db.piketAttendance.findMany({
      where: {
        markedAt: {
          lt: thirtyDaysAgo,
        },
        photoUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        photoUrl: true,
      },
    });

    if (oldAttendances.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old piket photos found to clean up.',
        deletedCount: 0,
      });
    }

    let deletedFilesCount = 0;
    const errors: string[] = [];
    const publicDir = path.join(process.cwd(), 'public');

    // 4. Proses hapus file fisik dan update database
    for (const attendance of oldAttendances) {
      if (!attendance.photoUrl) continue;

      try {
        // Ambil path absolut file fisik (contoh photoUrl: '/uploads/piket/xxxx.webp')
        const filePath = path.join(publicDir, attendance.photoUrl);
        
        // Hapus file fisik
        await unlink(filePath).catch((err) => {
          // Abaikan error ENOENT (berkas sudah tidak ada), catat error lain
          if (err.code !== 'ENOENT') throw err;
        });
        
        deletedFilesCount++;

        // Hapus URL dari database
        await db.piketAttendance.update({
          where: { id: attendance.id },
          data: { photoUrl: null },
        });
      } catch (err) {
        console.error(`Failed to delete photo for PiketAttendance ID ${attendance.id}:`, err);
        errors.push(`ID ${attendance.id}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Processed ${oldAttendances.length} records.`,
      deletedFilesCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Piket cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
