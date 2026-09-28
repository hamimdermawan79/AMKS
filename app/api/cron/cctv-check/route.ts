import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification, processNotificationQueue } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * CCTV Monitor Cron Job
 * =====================
 * Dipanggil secara berkala (setiap 1 jam) untuk:
 *
 * 1. Cek apakah status CCTV sudah 5 hari tanpa verifikasi → otomatis nonaktif
 * 2. Jika nonaktif → kirim broadcast ke role keamanan setiap 1 jam
 * 3. Setiap 30 hari → kirim reminder pembersihan memori CCTV
 */
export async function GET(request: Request) {
  try {
    // 1. Otorisasi
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil status CCTV (singleton)
    let cctvStatus = await db.cctvStatus.findFirst();
    if (!cctvStatus) {
      cctvStatus = await db.cctvStatus.create({ data: { isActive: true } });
    }

    const now = new Date();
    const daysSinceVerified = Math.floor(
      (now.getTime() - cctvStatus.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const actions: string[] = [];

    // 3. Auto-deactivate jika lebih dari 5 hari tanpa verifikasi
    if (daysSinceVerified >= 5 && cctvStatus.isActive) {
      cctvStatus = await db.cctvStatus.update({
        where: { id: cctvStatus.id },
        data: { isActive: false },
      });
      actions.push('CCTV auto-deactivated (5+ days without verification)');
    }

    // 4. Ambil semua user dengan role KEAMANAN untuk broadcast
    const keamananUsers = await db.user.findMany({
      where: {
        status: 'AKTIF',
        roles: {
          some: {
            role: {
              name: { in: ['KEAMANAN', 'KETUA'] },
            },
          },
        },
      },
      select: { id: true, fullName: true },
    });

    // 5. Broadcast jika CCTV nonaktif (setiap jam sampai diaktifkan)
    if (!cctvStatus.isActive) {
      const refId = `CCTV_INACTIVE:${now.toISOString().slice(0, 13)}`; // Per jam

      // Cek apakah sudah pernah kirim di jam ini
      const alreadySent = await db.notification.findFirst({
        where: { referenceId: refId },
      });

      if (!alreadySent) {
        for (const user of keamananUsers) {
          await createNotification({
            userId: user.id,
            title: '🚨 CCTV NONAKTIF — Segera Cek!',
            message: `Halo ${user.fullName}, status CCTV asrama saat ini *NONAKTIF* karena sudah ${daysSinceVerified} hari tidak diverifikasi.\n\n⚠️ Segera cek kondisi CCTV:\n• Apakah kamera masih merekam?\n• Apakah DVR/NVR menyala?\n• Apakah ada gangguan listrik?\n\n🔧 Setelah memastikan CCTV aktif, segera update status di sistem AMKS → Divisi Keamanan → Tab Info CCTV → Ubah Status ke "Aktif".\n\n⏰ Pesan ini akan terus dikirim setiap 1 jam sampai status CCTV diperbarui.`,
            type: 'CCTV_CHECK',
            referenceId: refId,
          });
        }
        actions.push(`Sent CCTV inactive alert to ${keamananUsers.length} users`);
      } else {
        actions.push('CCTV inactive alert already sent this hour, skipped');
      }
    }

    // 6. Reminder 5-harian: Jika CCTV aktif tapi sudah >= 4 hari (akan segera nonaktif)
    if (cctvStatus.isActive && daysSinceVerified >= 4) {
      const refId = `CCTV_PRECHECK:${now.toISOString().slice(0, 10)}`; // Per hari

      const alreadySent = await db.notification.findFirst({
        where: { referenceId: refId },
      });

      if (!alreadySent) {
        for (const user of keamananUsers) {
          await createNotification({
            userId: user.id,
            title: '📹 Reminder Cek CCTV (H-1 Nonaktif Otomatis)',
            message: `Halo ${user.fullName}, status CCTV sudah ${daysSinceVerified} hari tidak diverifikasi.\n\n⏳ Jika tidak diupdate dalam 1 hari lagi, status akan otomatis menjadi *NONAKTIF*.\n\n✅ Segera cek dan konfirmasi di AMKS → Keamanan → Info CCTV → "Konfirmasi CCTV Aktif".`,
            type: 'CCTV_CHECK',
            referenceId: refId,
          });
        }
        actions.push(`Sent CCTV pre-check reminder to ${keamananUsers.length} users`);
      }
    }

    // 7. Reminder bulanan pembersihan memori CCTV
    const daysSinceMemoryCleaned = cctvStatus.lastMemoryCleanedAt
      ? Math.floor((now.getTime() - cctvStatus.lastMemoryCleanedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999; // Belum pernah dibersihkan

    if (daysSinceMemoryCleaned >= 30) {
      const refId = `CCTV_MEMORY:${now.toISOString().slice(0, 10)}`; // Per hari

      const alreadySent = await db.notification.findFirst({
        where: { referenceId: refId },
      });

      if (!alreadySent) {
        const memMsg = cctvStatus.lastMemoryCleanedAt
          ? `Terakhir dibersihkan: ${cctvStatus.lastMemoryCleanedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysSinceMemoryCleaned} hari lalu).`
          : 'Belum pernah ada catatan pembersihan memori.';

        for (const user of keamananUsers) {
          await createNotification({
            userId: user.id,
            title: '💾 Reminder Bersihkan Memori CCTV',
            message: `Halo ${user.fullName}, sudah waktunya membersihkan memori/storage CCTV asrama.\n\n${memMsg}\n\n📋 Yang perlu dilakukan:\n• Backup rekaman penting jika ada\n• Format / bersihkan storage DVR/NVR\n• Pastikan rekaman berjalan normal setelahnya\n\n✅ Setelah selesai, konfirmasi di AMKS → Keamanan → Info CCTV → "Konfirmasi Memori Dibersihkan".`,
            type: 'CCTV_CHECK',
            referenceId: refId,
          });
        }
        actions.push(`Sent memory cleaning reminder to ${keamananUsers.length} users`);
      }
    }

    // 8. Proses antrian notifikasi (kirim WA)
    processNotificationQueue().catch(console.error);

    return NextResponse.json({
      success: true,
      cctvActive: cctvStatus.isActive,
      daysSinceVerified,
      daysSinceMemoryCleaned,
      actions,
    });
  } catch (error) {
    console.error('CCTV check cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
