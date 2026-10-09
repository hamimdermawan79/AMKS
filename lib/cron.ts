import { db } from '@/lib/db';
import { createNotification, processNotificationQueue } from './notifications';
import { isUserSuperAdminById } from '@/lib/rbac/can';

const SECTOR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function getSectorName(sectorIndex: number): string {
  const letter = SECTOR_LABELS[sectorIndex] ?? String.fromCharCode(65 + sectorIndex);
  return `Sektor ${letter}`;
}

/**
 * Check for piket assignments scheduled for TODAY (Hari H ONLY).
 * Reminders are sent periodically on the day of piket at specific hours (01:00, 04:00, 08:00 WIB),
 * accurately displaying sector names (Sektor A, Sektor B, Sektor C, etc.).
 * Will notify user if they haven't marked their attendance yet.
 */
export async function checkTodayPiketReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentHour = nowWib.getHours();

    // Jadwal pengingat: Jam 00:00 (12 malam), 02:00, 05:00, 07:00, 09:00, 10:00, 11:00, 13:00, 15:00, 16:00 WIB
    const validHours = [0, 2, 5, 7, 9, 10, 11, 13, 15, 16];
    if (!validHours.includes(currentHour)) {
      return;
    }

    const startOfToday = new Date(nowWib);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(nowWib);
    endOfToday.setHours(23, 59, 59, 999);

    const assignments = await db.piketAssignment.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
        attendance: null, // Belum melakukan presensi
        period: { isActive: true }, // Hanya dari periode aktif
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (assignments.length === 0) return;

    for (const assign of assignments) {
      // Append currentHour agar terkirim di setiap sesi jam jika belum presensi
      const refId = `PIKET_REMINDER:${assign.id}:${currentHour}`;

      // Strict Idempotency Check: pastikan hanya 1 notifikasi dibuat per jam tersebut
      const existing = await db.notification.findFirst({
        where: {
          referenceId: refId,
        },
      });

      if (existing) {
        continue;
      }

      const sectorName = getSectorName(assign.sector);
      let message = '';

      if (currentHour === 0) {
        // Jam 12 Malam (00:00 WIB)
        message = `Halo ${assign.user.fullName}, HARI INI Anda memiliki jadwal piket di ${sectorName}. Sistem presensi dibuka mulai pukul 01:00 WIB. Batas tepat waktu adalah pukul 11:00 WIB (denda Rp10.000 jika terlambat) dan batas akhir presensi pukul 17:00 WIB (total denda Rp20.000 jika tidak piket). Mohon bersiap melaksanakan tugas piket Anda.`;
      } else if (currentHour === 2) {
        // Jam 2 Dini Hari (02:00 WIB)
        message = `Halo ${assign.user.fullName}, presensi piket untuk ${sectorName} telah dibuka. Anda dapat melaksanakan tugas piket dan melakukan presensi di dashboard sebelum batas tepat waktu pukul 11:00 WIB.`;
      } else if (currentHour === 5) {
        // Jam 5 Subuh (05:00 WIB)
        message = `Selamat pagi ${assign.user.fullName}, mengingatkan kembali jadwal piket Anda HARI INI di ${sectorName}. Segera laksanakan tugas piket dan isi presensi sebelum batas tepat waktu pukul 11:00 WIB (tersisa 6 jam lagi).`;
      } else if (currentHour === 7) {
        // Jam 7 Pagi (07:00 WIB)
        message = `Halo ${assign.user.fullName}, pengingat pagi untuk piket Anda di ${sectorName}. Harap segera menyelesaikan piket dan presensi sebelum pukul 11:00 WIB (tersisa 4 jam lagi).`;
      } else if (currentHour === 9 || currentHour === 10) {
        // Jam 9 & 10 Pagi (09:00, 10:00 WIB)
        message = `⚠️ PENTING: Halo ${assign.user.fullName}, Anda belum melakukan presensi piket di ${sectorName}! Waktu tersisa tinggal ${Math.max(1, 11 - currentHour)} jam sebelum batas tepat waktu pukul 11:00 WIB. Hindari denda keterlambatan Tahap 1 (Rp10.000) dengan segera melakukan piket dan presensi.`;
      } else if (currentHour === 11) {
        // Jam 11 Siang (11:00 WIB)
        message = `⚠️ PERINGATAN TAHAP 1: Halo ${assign.user.fullName}, batas waktu presensi tepat waktu pukul 11:00 WIB telah lewat. Denda keterlambatan Tahap 1 sebesar Rp10.000 telah terbit. Namun presensi TETAP DIBUKA sampai pukul 17:00 WIB (5 sore). Anda masih diwajibkan membersihkan area ${sectorName}. Segera lakukan presensi sebelum jam 17:00 WIB agar TIDAK terkena denda tambahan Tahap 2 sebesar Rp10.000 lagi!`;
      } else if (currentHour === 13 || currentHour === 15) {
        // Jam 13 & 15 Sore (13:00, 15:00 WIB)
        message = `📢 PENGINGAT SORE: Halo ${assign.user.fullName}, Anda belum melakukan presensi piket di ${sectorName}. Presensi Tahap 2 akan ditutup pada pukul 17:00 WIB (tersisa ${17 - currentHour} jam lagi). Segera selesaikan piket dan presensi untuk menghindari total denda Rp20.000!`;
      } else if (currentHour === 16) {
        // Jam 16 Sore (16:00 WIB - 1 Jam Terakhir)
        message = `🚨 MENDESAK (1 JAM TERAKHIR): Halo ${assign.user.fullName}, waktu presensi piket di ${sectorName} tersisa kurang dari 1 jam (tutup tepat pukul 17:00 WIB)! Segera unggah bukti presensi sekarang. Jika lewat jam 17:00 WIB, presensi ditutup permanen dan Anda dikenakan denda tambahan Tahap 2 sebesar Rp10.000 (total denda Rp20.000)!`;
      } else {
        message = `Halo ${assign.user.fullName}, mengingatkan bahwa HARI INI Anda memiliki jadwal piket di ${sectorName}. Harap segera melakukan presensi piket di dashboard sebelum pukul 17:00 WIB. Terima kasih!`;
      }

      // Create notification
      await createNotification({
        userId: assign.userId,
        title: `PENGINGAT PIKET HARI INI: ${sectorName}`,
        message,
        type: 'PIKET_REMINDER',
        referenceId: refId,
      });

      console.log(`✉️ Piket reminder (Jam ${currentHour}:00 WIB) queued for ${assign.user.fullName} (${sectorName})`);
    }
  } catch (error) {
    console.error('Failed to run checkTodayPiketReminders:', error);
  }
}

/**
 * Check for unpaid bills due in 3 days (H-3) or 1 day (H-1)
 * and create notifications.
 */
export async function checkUpcomingBills() {
  try {
    const now = new Date();
    
    // Unpaid bills
    const bills = await db.bill.findMany({
      where: {
        status: 'BELUM_LUNAS',
        dueDate: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    for (const bill of bills) {
      if (!bill.dueDate) continue;

      const diffTime = bill.dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // H-3 Reminder
      if (diffDays === 3) {
        const refId = `${bill.id}:H3`;
        const existing = await db.notification.findFirst({
          where: {
            type: 'TAGIHAN_REMINDER',
            referenceId: refId,
          },
        });

        if (!existing) {
          await createNotification({
            userId: bill.userId,
            title: 'Tenggat Tagihan H-3',
            message: `Mengingatkan bahwa tagihan "${bill.title}" sebesar Rp${bill.amount.toLocaleString('id-ID')} akan jatuh tempo dalam 3 hari (tenggat: ${bill.dueDate.toLocaleDateString('id-ID')}). Harap segera melakukan koordinasi pelunasan dengan Bendahara.`,
            type: 'TAGIHAN_REMINDER',
            referenceId: refId,
          });
        }
      }

      // H-1 Reminder
      if (diffDays === 1) {
        const refId = `${bill.id}:H1`;
        const existing = await db.notification.findFirst({
          where: {
            type: 'TAGIHAN_REMINDER',
            referenceId: refId,
          },
        });

        if (!existing) {
          await createNotification({
            userId: bill.userId,
            title: 'PENTING: Tenggat Tagihan Besok (H-1)',
            message: `PENTING! Tagihan "${bill.title}" sebesar Rp${bill.amount.toLocaleString('id-ID')} akan jatuh tempo BESOK (tenggat: ${bill.dueDate.toLocaleDateString('id-ID')}). Mohon segera lakukan pelunasan ke Bendahara.`,
            type: 'TAGIHAN_REMINDER',
            referenceId: refId,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to run checkUpcomingBills:', error);
  }
}


/**
 * Automatically handle the 2-stage piket attendance and fine schedule:
 * 1. Tahap 1 (Pukul >= 11:00 WIB):
 *    - If resident hasn't marked attendance by 11:00 WIB, issue Stage 1 fine of Rp10,000.
 *    - Presensi REMAINS OPEN until 17:00 WIB (5 sore). DO NOT create a PiketAttendance record yet!
 * 2. Tahap 2 (Pukul >= 17:00 WIB):
 *    - Presensi officially CLOSES.
 *    - If resident STILL hasn't submitted attendance, mark attendance as TIDAK_HADIR,
 *      issue Stage 2 fine of Rp10,000 (total fine = Rp20,000).
 */
export async function checkMissedPikets() {
  try {
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHour = nowWib.getHours();

    // Get active period
    const activePeriod = await db.piketPeriod.findFirst({
      where: { isActive: true },
    });
    if (!activePeriod) return;

    const startOfToday = new Date(nowWib);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(nowWib);
    endOfToday.setHours(23, 59, 59, 999);

    const fineAmount = activePeriod.finePerDay || 10000;

    // =========================================================================
    // TAHAP 1 (Pukul >= 11:00 WIB):
    // Jika lewat jam 11 siang belum presensi, terbitkan denda Tahap 1 (Rp10.000).
    // Presensi TETAP BUKA sampai jam 17:00, jadi JANGAN buat PiketAttendance record!
    // =========================================================================
    if (currentHour >= 11) {
      const stage1Candidates = await db.piketAssignment.findMany({
        where: {
          periodId: activePeriod.id,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
          attendance: null,
        },
        include: {
          user: true,
        },
      });

      for (const assign of stage1Candidates) {
        if (await isUserSuperAdminById(assign.userId)) {
          continue;
        }

        const stage1RefId = `DENDA_PIKET_STAGE1:${assign.id}`;
        const legacyRefId = `DENDA_PIKET:${assign.id}`;
        const existingStage1 = await db.notification.findFirst({
          where: { referenceId: { in: [stage1RefId, legacyRefId] } },
        });

        if (existingStage1) {
          continue;
        }

        const dateStr = new Date(assign.date).toLocaleDateString('id-ID');
        const sectorName = getSectorName(assign.sector);

        // Create Stage 1 Fine record
        const fine = await db.fine.create({
          data: {
            userId: assign.userId,
            periodId: activePeriod.id,
            daysMissed: 1,
            amount: fineAmount,
          },
        });

        // Create Stage 1 Bill
        const bill = await db.bill.create({
          data: {
            userId: assign.userId,
            type: 'DENDA_PIKET',
            title: `Denda Keterlambatan Piket - Tahap 1 (${dateStr})`,
            amount: fineAmount,
            status: 'BELUM_LUNAS',
            division: 'KEBERSIHAN',
            note: `Belum melakukan presensi piket pada tanggal ${dateStr} hingga batas tepat waktu pukul 11:00 WIB. Presensi tetap dibuka sampai pukul 17:00 WIB.`,
          },
        });

        // Link fine to bill
        await db.fine.update({
          where: { id: fine.id },
          data: { billId: bill.id },
        });

        // Send Stage 1 Notification & Reminder
        await createNotification({
          userId: assign.userId,
          title: 'Denda Keterlambatan Piket (Tahap 1)',
          message: `Pemberitahuan: Anda belum melakukan presensi piket hingga pukul 11:00 WIB hari ini (${dateStr}). Anda dikenakan denda keterlambatan Tahap 1 sebesar Rp${fineAmount.toLocaleString('id-ID')}.\n\nAnda MASIH DIHARUSKAN piket membersihkan area ${sectorName}. Presensi tetap dibuka sampai pukul 17:00 WIB (5 sore). Harap segera bersihkan dan kirim bukti presensi sebelum pukul 17:00 WIB agar tidak terkena denda tambahan Tahap 2 sebesar Rp${fineAmount.toLocaleString('id-ID')}.`,
          type: 'TAGIHAN_REMINDER',
          referenceId: stage1RefId,
        });

        console.log(`⚠️ Tahap 1 denda issued for ${assign.user.fullName} (${sectorName}) on date ${dateStr}`);
      }
    }

    // =========================================================================
    // TAHAP 2 (Pukul >= 17:00 WIB untuk hari ini, ATAU hari-hari sebelumnya yang terlewat):
    // Presensi resmi TUTUP. Warga yang tidak presensi dicatat TIDAK_HADIR,
    // dan diterbitkan denda Tahap 2 (Rp10.000), total denda menjadi Rp20.000.
    // =========================================================================
    const dateCondition = currentHour >= 17 ? { lte: endOfToday } : { lt: startOfToday };

    const missedAssignments = await db.piketAssignment.findMany({
      where: {
        periodId: activePeriod.id,
        date: dateCondition,
        attendance: null,
      },
      include: {
        user: true,
      },
    });

    for (const assign of missedAssignments) {
      if (await isUserSuperAdminById(assign.userId)) {
        continue;
      }

      const dateStr = new Date(assign.date).toLocaleDateString('id-ID');

      // 1. Pastikan kehadiran dicatat sebagai TIDAK_HADIR
      const existingAttendance = await db.piketAttendance.findUnique({
        where: { assignmentId: assign.id },
      });
      if (!existingAttendance) {
        await db.piketAttendance.create({
          data: {
            assignmentId: assign.id,
            status: 'TIDAK_HADIR',
            markedById: null, // marked by system
          },
        });
      }

      // 2. Pastikan denda Tahap 1 sudah terbit (jika server down antara jam 11-17)
      const stage1RefId = `DENDA_PIKET_STAGE1:${assign.id}`;
      const legacyRefId = `DENDA_PIKET:${assign.id}`;
      const existingStage1 = await db.notification.findFirst({
        where: { referenceId: { in: [stage1RefId, legacyRefId] } },
      });

      if (!existingStage1) {
        const fine1 = await db.fine.create({
          data: {
            userId: assign.userId,
            periodId: activePeriod.id,
            daysMissed: 1,
            amount: fineAmount,
          },
        });

        const bill1 = await db.bill.create({
          data: {
            userId: assign.userId,
            type: 'DENDA_PIKET',
            title: `Denda Keterlambatan Piket - Tahap 1 (${dateStr})`,
            amount: fineAmount,
            status: 'BELUM_LUNAS',
            division: 'KEBERSIHAN',
            note: `Terlambat melakukan presensi piket pada tanggal ${dateStr} melewati batas waktu pukul 11:00 WIB.`,
          },
        });

        await db.fine.update({
          where: { id: fine1.id },
          data: { billId: bill1.id },
        });

        await createNotification({
          userId: assign.userId,
          title: 'Denda Keterlambatan Piket (Tahap 1)',
          message: `Pemberitahuan: Anda dikenakan denda keterlambatan piket Tahap 1 sebesar Rp${fineAmount.toLocaleString('id-ID')} untuk tanggal ${dateStr}.`,
          type: 'TAGIHAN_REMINDER',
          referenceId: stage1RefId,
        });
      }

      // 3. Terbitkan denda Tahap 2 (Rp10.000)
      const stage2RefId = `DENDA_PIKET_STAGE2:${assign.id}`;
      const existingStage2 = await db.notification.findFirst({
        where: { referenceId: stage2RefId },
      });

      if (!existingStage2) {
        const fine2 = await db.fine.create({
          data: {
            userId: assign.userId,
            periodId: activePeriod.id,
            daysMissed: 1,
            amount: fineAmount,
          },
        });

        const bill2 = await db.bill.create({
          data: {
            userId: assign.userId,
            type: 'DENDA_PIKET',
            title: `Denda Tidak Piket - Tahap 2 (${dateStr})`,
            amount: fineAmount,
            status: 'BELUM_LUNAS',
            division: 'KEBERSIHAN',
            note: `Tidak melakukan presensi piket hingga batas akhir pukul 17:00 WIB ditutup pada tanggal ${dateStr}. Total denda piket: Rp${(fineAmount * 2).toLocaleString('id-ID')}.`,
          },
        });

        await db.fine.update({
          where: { id: fine2.id },
          data: { billId: bill2.id },
        });

        await createNotification({
          userId: assign.userId,
          title: 'Denda Tidak Piket (Tahap 2) - Presensi Ditutup',
          message: `Peringatan: Presensi piket tanggal ${dateStr} telah resmi ditutup pada pukul 17:00 WIB. Anda tercatat TIDAK HADIR dan dikenakan denda tambahan Tahap 2 sebesar Rp${fineAmount.toLocaleString('id-ID')} (Total denda piket hari ini: Rp${(fineAmount * 2).toLocaleString('id-ID')}). Tagihan denda telah terbit di sistem, harap segera melakukan pelunasan ke Bendahara.`,
          type: 'TAGIHAN_REMINDER',
          referenceId: stage2RefId,
        });

        console.log(`⛔ Tahap 2 Denda (Final) issued for ${assign.user.fullName} on date ${dateStr}`);
      }
    }
  } catch (error) {
    console.error('Failed to run checkMissedPikets:', error);
  }
}

/**
 * Broadcast pending announcements to all active users (excl. SUPERADMIN & ALUMNI).
 * Runs every hour via cron. Idempotent — checks for existing notifications
 * before creating new ones.
 */
export async function checkAnnouncementBroadcast() {
  try {
    const announcements = await db.announcement.findMany({
      where: { broadcastComplete: false },
    });

    if (announcements.length === 0) {
      return;
    }

    const divisionLabels: Record<string, string> = {
      KEBERSIHAN: 'Kebersihan',
      KESENIAN: 'Kesenian',
      KEOLAHRAGAAN: 'Keolahragaan',
      ROHANI: 'Rohani',
      KEAMANAN: 'Keamanan',
    };

    for (const announcement of announcements) {
      // Idempotency check: notifications already exist for this announcement
      const existingCount = await db.notification.count({
        where: { type: 'PENGUMUMAN', referenceId: announcement.id },
      });

      if (existingCount > 0) {
        // Partial/crash recovery: mark complete without re-creating
        await db.announcement.update({
          where: { id: announcement.id },
          data: { broadcastComplete: true },
        });
        continue;
      }

      // Fetch target users: AKTIF, exclude SUPERADMIN & ALUMNI roles
      const targetUsers = await db.user.findMany({
        where: {
          status: 'AKTIF',
          roles: {
            none: {
              role: { name: { in: ['SUPERADMIN', 'ALUMNI'] } },
            },
          },
        },
        select: { id: true },
      });

      if (targetUsers.length === 0) {
        await db.announcement.update({
          where: { id: announcement.id },
          data: { broadcastComplete: true },
        });
        continue;
      }

      const divLabel = divisionLabels[announcement.division] || announcement.division;

      // Batch insert notifications — single query
      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          title: `Pengumuman Baru: ${announcement.title}`,
          message: `Terdapat pengumuman baru dari Divisi ${divLabel}:\n\n${announcement.body}`,
          type: 'PENGUMUMAN',
          referenceId: announcement.id,
        })),
      });

      // Mark broadcast complete
      await db.announcement.update({
        where: { id: announcement.id },
        data: { broadcastComplete: true },
      });

      console.log(`📢 Broadcast complete for announcement ${announcement.id} (${targetUsers.length} users).`);
    }
  } catch (error) {
    console.error('Failed to run checkAnnouncementBroadcast:', error);
  }
}

/**
 * Re-export the WhatsApp formatters from the shared client-safe module.
 */
import {
  formatRohaniReminderWhatsAppMessage,
  formatRohaniH1WhatsAppMessage,
} from '@/lib/rohani/format-wa';
export { formatRohaniReminderWhatsAppMessage, formatRohaniH1WhatsAppMessage };

/**
 * Check for Rohani schedules occurring within the next 4 days in WIB time (H-3, H-2, H-1, Hari H).
 * Sends reminder message with days remaining to ALL active warga via WhatsApp & notifications.
 */
export async function checkRohaniReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const startOfToday = new Date(nowWib);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfWindow = new Date(startOfToday);
    endOfWindow.setDate(endOfWindow.getDate() + 4); // Cek hingga 4 hari ke depan

    // Find any schedule occurring within H-3, H-2, H-1, or Hari H
    const upcomingSchedules = await db.rohaniSchedule.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfWindow,
        },
      },
      include: {
        imamMaghrib: { select: { fullName: true } },
        imamIsha: { select: { fullName: true } },
        kultumBy: { select: { fullName: true } },
        cadanganImam: { select: { fullName: true } },
        cadanganKultum: { select: { fullName: true } },
      },
    });

    if (upcomingSchedules.length === 0) return;

    // Get all active users (excluding Superadmin and Alumni)
    const targetUsers = await db.user.findMany({
      where: {
        status: 'AKTIF',
        roles: {
          none: {
            role: { name: { in: ['SUPERADMIN', 'ALUMNI'] } },
          },
        },
      },
      select: { id: true, fullName: true, phone: true },
    });

    if (targetUsers.length === 0) return;

    for (const schedule of upcomingSchedules) {
      const scheduleWib = new Date(new Date(schedule.date).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const scheduleDateOnly = new Date(scheduleWib);
      scheduleDateOnly.setHours(0, 0, 0, 0);

      const diffMs = scheduleDateOnly.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Remind only on H-3, H-2, H-1, and Hari H (0)
      if (diffDays < 0 || diffDays > 3) continue;

      const refId = `ROHANI_REMINDER:${schedule.id}:H${diffDays}`;
      const legacyH1RefId = `ROHANI_H1_BROADCAST:${schedule.id}`;

      // Idempotency: skip if already sent for this specific H-day
      const existing = await db.notification.findFirst({
        where: {
          referenceId: diffDays === 1 ? { in: [refId, legacyH1RefId] } : refId,
        },
      });
      if (existing) {
        continue;
      }

      const { title, message } = formatRohaniReminderWhatsAppMessage(schedule, diffDays);

      // Batch insert notifications
      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          title,
          message,
          type: 'PENGUMUMAN',
          referenceId: refId,
        })),
      });

      console.log(`📢 Rohani H-${diffDays} reminder broadcast queued for ${targetUsers.length} users (Schedule: ${schedule.id}).`);
    }

    // Trigger queue processing
    processNotificationQueue().catch(console.error);
  } catch (error) {
    console.error('Failed to run checkRohaniReminders:', error);
  }
}

// Backwards-compatible alias for existing callers
export const checkRohaniHMinus1Reminders = checkRohaniReminders;

import {
  formatMeetingReminderMessage,
  formatActivityReminderMessage,
} from '@/lib/kesekretariatan/format-meeting-wa';

/**
 * Check for upcoming meetings (Internal Asrama & Eksternal RT)
 * and send automatic WhatsApp reminder on H-3, H-2, H-1, and Hari H (H-0).
 */
export async function checkMeetingReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const startOfToday = new Date(nowWib);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfWindow = new Date(startOfToday);
    endOfWindow.setDate(endOfWindow.getDate() + 4); // Cek hingga 4 hari ke depan

    const upcomingMeetings = await db.meeting.findMany({
      where: {
        status: 'TERJADWAL',
        scheduledAt: {
          gte: startOfToday,
          lte: endOfWindow,
        },
      },
      include: {
        leader: { select: { fullName: true } },
        noteTaker: { select: { fullName: true } },
        attendances: {
          where: { role: 'DELEGASI' },
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (upcomingMeetings.length === 0) return;

    // Cache active warga for internal meeting broadcasts
    let cachedActiveUsers: { id: string }[] | null = null;

    for (const meeting of upcomingMeetings) {
      const meetingWib = new Date(new Date(meeting.scheduledAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const meetingDateOnly = new Date(meetingWib);
      meetingDateOnly.setHours(0, 0, 0, 0);

      const diffMs = meetingDateOnly.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Hanya proses jika tepat H-3, H-2, H-1, atau Hari H (0)
      if (diffDays < 0 || diffDays > 3) continue;

      const refId = `MEETING_REMINDER:${meeting.id}:H${diffDays}`;

      // Idempotency: skip if already sent
      const existing = await db.notification.findFirst({
        where: { referenceId: refId },
      });
      if (existing) continue;

      if (meeting.type === 'INTERNAL') {
        // Broadcast ke seluruh warga asrama aktif
        if (!cachedActiveUsers) {
          cachedActiveUsers = await db.user.findMany({
            where: {
              status: 'AKTIF',
              roles: {
                none: {
                  role: { name: { in: ['SUPERADMIN', 'ALUMNI'] } },
                },
              },
            },
            select: { id: true },
          });
        }

        if (cachedActiveUsers.length === 0) continue;

        const { title, message } = formatMeetingReminderMessage(meeting, diffDays, false);

        await db.notification.createMany({
          data: cachedActiveUsers.map((u) => ({
            userId: u.id,
            title,
            message,
            type: 'RAPAT_REMINDER',
            referenceId: refId,
          })),
        });

        console.log(`📢 Rapat Internal H-${diffDays} reminder queued for ${cachedActiveUsers.length} users (Meeting: ${meeting.title}).`);
      } else {
        // EKSTERNAL_RT: kirim ke seluruh delegasi RT
        const delegates = meeting.attendances;
        let targetUserIds = delegates.map((d) => d.userId);

        // Jika delegasi belum ditentukan, beritahu Ketua & Sekretaris
        if (targetUserIds.length === 0) {
          const admins = await db.user.findMany({
            where: {
              status: 'AKTIF',
              roles: {
                some: {
                  role: { name: { in: ['KETUA', 'SEKRETARIS'] } },
                },
              },
            },
            select: { id: true },
          });
          targetUserIds = admins.map((a) => a.id);
        }

        if (targetUserIds.length === 0) continue;

        const { title, message } = formatMeetingReminderMessage(meeting, diffDays, delegates.length > 0);

        await db.notification.createMany({
          data: targetUserIds.map((userId) => ({
            userId,
            title,
            message,
            type: 'RAPAT_REMINDER',
            referenceId: refId,
          })),
        });

        console.log(`📢 Rapat RT 12 H-${diffDays} reminder queued for ${targetUserIds.length} recipients (Meeting: ${meeting.title}).`);
      }
    }

    processNotificationQueue().catch(console.error);
  } catch (error) {
    console.error('Failed to run checkMeetingReminders:', error);
  }
}

/**
 * Check for upcoming activities across IKMAS (Division Activities & Sports)
 * and send automatic WhatsApp reminder on H-3, H-2, H-1, and Hari H (H-0).
 */
export async function checkActivityReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const startOfToday = new Date(nowWib);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfWindow = new Date(startOfToday);
    endOfWindow.setDate(endOfWindow.getDate() + 4);

    // 1. Division Activities (Activity model)
    const upcomingActivities = await db.activity.findMany({
      where: {
        startAt: {
          gte: startOfToday,
          lte: endOfWindow,
        },
      },
    });

    // 2. Sports Activities (SportsActivity model)
    const upcomingSports = await db.sportsActivity.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfWindow,
        },
      },
      include: {
        attendance: {
          select: { userId: true },
        },
      },
    });

    if (upcomingActivities.length === 0 && upcomingSports.length === 0) return;

    let cachedActiveUsers: { id: string }[] | null = null;
    const getActiveUsers = async () => {
      if (!cachedActiveUsers) {
        cachedActiveUsers = await db.user.findMany({
          where: {
            status: 'AKTIF',
            roles: {
              none: {
                role: { name: { in: ['SUPERADMIN', 'ALUMNI'] } },
              },
            },
          },
          select: { id: true },
        });
      }
      return cachedActiveUsers;
    };

    // Process General Division Activities
    for (const act of upcomingActivities) {
      if (!act.startAt) continue;

      const actWib = new Date(new Date(act.startAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const actDateOnly = new Date(actWib);
      actDateOnly.setHours(0, 0, 0, 0);

      const diffDays = Math.round((actDateOnly.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > 3) continue;

      const refId = `ACTIVITY_REMINDER:${act.id}:H${diffDays}`;
      const existing = await db.notification.findFirst({ where: { referenceId: refId } });
      if (existing) continue;

      const targetUsers = await getActiveUsers();
      if (targetUsers.length === 0) continue;

      const { title, message } = formatActivityReminderMessage(
        {
          id: act.id,
          title: act.title,
          startAt: act.startAt,
          location: act.location,
          description: act.description,
          division: act.division,
        },
        diffDays
      );

      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          title,
          message,
          type: 'KEGIATAN_REMINDER',
          referenceId: refId,
        })),
      });

      console.log(`📢 Kegiatan H-${diffDays} reminder queued for ${targetUsers.length} users (${act.title}).`);
    }

    // Process Sports Activities
    for (const sport of upcomingSports) {
      const sportWib = new Date(new Date(sport.date).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const sportDateOnly = new Date(sportWib);
      sportDateOnly.setHours(0, 0, 0, 0);

      const diffDays = Math.round((sportDateOnly.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > 3) continue;

      const refId = `SPORTS_REMINDER:${sport.id}:H${diffDays}`;
      const existing = await db.notification.findFirst({ where: { referenceId: refId } });
      if (existing) continue;

      const targetUserIds = sport.attendance.length > 0
        ? sport.attendance.map((a) => a.userId)
        : (await getActiveUsers()).map((u) => u.id);

      if (targetUserIds.length === 0) continue;

      const { title, message } = formatActivityReminderMessage(
        {
          id: sport.id,
          title: sport.title,
          startAt: sport.date,
          location: sport.location,
          description: `Kegiatan Olahraga Bersama. Iuran: Rp${sport.feeAmount.toLocaleString('id-ID')}, Denda bila mangkir: Rp${sport.fineAmount.toLocaleString('id-ID')}`,
          division: 'KEOLAHRAGAAN',
        },
        diffDays
      );

      await db.notification.createMany({
        data: targetUserIds.map((userId) => ({
          userId,
          title,
          message,
          type: 'KEGIATAN_REMINDER',
          referenceId: refId,
        })),
      });

      console.log(`📢 Olahraga H-${diffDays} reminder queued for ${targetUserIds.length} users (${sport.title}).`);
    }

    processNotificationQueue().catch(console.error);
  } catch (error) {
    console.error('Failed to run checkActivityReminders:', error);
  }
}

/**
 * Broadcast reminders for security night duty (piket keamanan malam).
 * - 08:00 & 13:00 WIB: Pengingat hari H (pagi & siang) agar warga bersiap
 * - 18:00 - 20:00 WIB: Pengingat sore hari H bahwa piket malam dimulai jam 21:00 WIB
 * - 21:00 - 23:00 WIB: Pengingat operasional piket berjalan & pengisian presensi
 * - 00:00 WIB: Peringatan batas akhir pengisian presensi piket malam
 * - 19:00 WIB: Pengingat H-1 bagi petugas keamanan besok malam
 */
export async function checkSecurityDutyReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentHour = nowWib.getHours();

    // Valid jam pengiriman: 8 (pagi), 13 (siang), 18, 19, 20 (sore), 21, 22, 23 (malam), 0 (tengah malam)
    const validHours = [8, 13, 18, 19, 20, 21, 22, 23, 0];
    if (!validHours.includes(currentHour)) return;

    const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    
    // Yesterday date string in WIB (for midnight 00:00 check of duty that just completed)
    const yesterdayDate = new Date(nowWib);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDateStr = yesterdayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    // Tomorrow date string in WIB (for H-1 reminder)
    const tomorrowDate = new Date(nowWib);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowDateStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    // Wide window to eliminate any UTC vs WIB offset mismatch
    const windowStart = new Date(nowWib.getTime() - 48 * 60 * 60 * 1000);
    const windowEnd = new Date(nowWib.getTime() + 48 * 60 * 60 * 1000);

    const candidates = await db.securityDutyAssignment.findMany({
      where: {
        date: { gte: windowStart, lte: windowEnd },
        period: { isActive: true },
        attendance: null, // belum presensi
      },
      include: { user: true },
    });

    if (candidates.length === 0) return;

    // 1. Process H-1 Reminder (dikirim jam 19:00 WIB kepada petugas besok malam)
    if (currentHour === 19) {
      const tomorrowAssignments = candidates.filter((a) => {
        const aDateStr = new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        return aDateStr === tomorrowDateStr;
      });

      for (const assign of tomorrowAssignments) {
        const dateStr = new Date(assign.date).toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
        });
        const refId = `SEC_DUTY_H1:${assign.id}`;
        const exists = await db.notification.findFirst({ where: { referenceId: refId } });
        if (exists) continue;

        await createNotification({
          userId: assign.userId,
          title: '📅 Pengingat H-1: Piket Keamanan Besok Malam',
          message: `Halo ${assign.user.fullName}, mengingatkan bahwa BESOK MALAM (${dateStr}) Anda memiliki jadwal piket keamanan asrama mulai pukul 21:00 WIB.\n\nMohon bersiap untuk menjalankan tugas piket malam besok. Terima kasih!`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      }
    }

    // 2. Process Hari-H Reminders
    // Jika jam 00:00 (tengah malam), target adalah piket malam hari kemarin (yang berakhir jam 00:00 hari ini)
    const targetDateStr = currentHour === 0 ? yesterdayDateStr : todayDateStr;
    const todayAssignments = candidates.filter((a) => {
      const aDateStr = new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      return aDateStr === targetDateStr;
    });

    for (const assign of todayAssignments) {
      const dateStr = new Date(assign.date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
      });

      const refId = `SEC_DUTY_HOUR_${currentHour}:${assign.id}`;
      const exists = await db.notification.findFirst({ where: { referenceId: refId } });
      if (exists) continue;

      if (currentHour === 8) {
        // Pagi (08:00 WIB)
        await createNotification({
          userId: assign.userId,
          title: '☀️ Pengingat Pagi: Piket Keamanan Malam Ini',
          message: `Selamat pagi ${assign.user.fullName}, mengingatkan bahwa HARI INI (${dateStr}) Anda memiliki jadwal piket keamanan malam mulai pukul 21:00 WIB.\n\nHarap mengatur jadwal Anda agar dapat melaksanakan tugas pengecekan keamanan malam nanti.`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      } else if (currentHour === 13) {
        // Siang (13:00 WIB)
        await createNotification({
          userId: assign.userId,
          title: '📢 Pengingat Siang: Piket Keamanan Malam Ini',
          message: `Halo ${assign.user.fullName}, jangan lupa malam nanti (${dateStr}) adalah jadwal piket keamanan Anda mulai pukul 21:00 WIB.\n\nPastikan Anda bersiap melaksanakan pengecekan pintu, garasi, dan motor warga asrama.`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      } else if (currentHour >= 18 && currentHour < 21) {
        // Sore (18:00 - 20:00 WIB)
        await createNotification({
          userId: assign.userId,
          title: '🌙 Pengingat Sore: Piket Keamanan Malam Ini',
          message: `Halo ${assign.user.fullName}, mengingatkan bahwa kamu bertugas piket keamanan malam HARI INI (${dateStr}) mulai pukul 21:00 WIB. Mohon bersiap melaksanakan tugas piket malam.`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      } else if (currentHour >= 21 && currentHour <= 23) {
        // Jam piket berjalan & presensi (21:00 - 23:00 WIB)
        const hourLabel = `${String(currentHour).padStart(2, '0')}:00 WIB`;
        let urgencyEmoji = currentHour === 23 ? '⚠️' : '🔔';

        await createNotification({
          userId: assign.userId,
          title: `${urgencyEmoji} Jangan Lupa Cek & Jaga Keamanan Asrama Sambas (${hourLabel})`,
          message: `${urgencyEmoji} Halo ${assign.user.fullName}, jangan lupa cek dan jaga keamanan Asrama Sambas dengan menyelesaikan piket malam Anda hari ini (${dateStr}).\n\n📋 Tugas piket malam (21:00 – 00:00 WIB):\n• Cek kondisi pintu luar asrama (terkunci rapat)\n• Cek garasi (sudah ditutup & dikunci)\n• Cek motor di luar (pastikan terkunci stang)\n• Konfirmasi warga yang keluar malam\n\nSetelah selesai, harap segera isi presensi piket di aplikasi AMKS.`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      } else if (currentHour === 0) {
        // Jam 00:00 (Tengah malam)
        await createNotification({
          userId: assign.userId,
          title: '🚨 Peringatan Batas Akhir Presensi Piket Keamanan Malam',
          message: `🚨 Halo ${assign.user.fullName}, waktu operasional piket keamanan malam untuk ${dateStr} telah mencapai batas akhir (00:00 WIB).\n\nJika sudah selesai melaksanakan tugas pengecekan keamanan asrama, segera isi dan selesaikan presensi sekarang di aplikasi AMKS.`,
          type: 'PIKET_REMINDER',
          referenceId: refId,
        });
      }
    }

    processNotificationQueue().catch(console.error);
  } catch (error) {
    console.error('Failed to run checkSecurityDutyReminders:', error);
  }
}

/**
 * Check CCTV status and send reminders/broadcasts:
 * 1. Auto-deactivate if >= 5 days without verification
 * 2. If inactive: hourly reminder to KEAMANAN + KETUA
 * 3. H-1 before auto-deactivation (day 4): pre-warning
 * 4. Monthly memory cleaning reminder (>= 30 days)
 */
export async function checkCctvReminders() {
  try {
    let cctvStatus = await db.cctvStatus.findFirst();
    if (!cctvStatus) {
      cctvStatus = await db.cctvStatus.create({ data: { isActive: true } });
    }

    const now = new Date();
    const daysSinceVerified = Math.floor(
      (now.getTime() - cctvStatus.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Auto-deactivate if >= 5 days
    if (daysSinceVerified >= 5 && cctvStatus.isActive) {
      cctvStatus = await db.cctvStatus.update({
        where: { id: cctvStatus.id },
        data: { isActive: false },
      });
      console.log('🔴 CCTV auto-deactivated (5+ days without verification)');
    }

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

    if (keamananUsers.length === 0) return;

    let notificationsCreated = false;

    // 1. Inactive CCTV broadcast (every hour until activated)
    if (!cctvStatus.isActive) {
      const refId = `CCTV_INACTIVE:${now.toISOString().slice(0, 13)}`;
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
        notificationsCreated = true;
      }
    }

    // 2. Pre-check reminder (day 4)
    if (cctvStatus.isActive && daysSinceVerified >= 4) {
      const refId = `CCTV_PRECHECK:${now.toISOString().slice(0, 10)}`;
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
        notificationsCreated = true;
      }
    }

    // 3. Monthly memory clean reminder (>= 30 days)
    const daysSinceMemoryCleaned = cctvStatus.lastMemoryCleanedAt
      ? Math.floor((now.getTime() - cctvStatus.lastMemoryCleanedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceMemoryCleaned >= 30) {
      const refId = `CCTV_MEMORY:${now.toISOString().slice(0, 10)}`;
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
        notificationsCreated = true;
      }
    }

    if (notificationsCreated) {
      processNotificationQueue().catch(console.error);
    }
  } catch (error) {
    console.error('Failed to run checkCctvReminders:', error);
  }
}

let cronInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  if (cronInterval) return;

  console.log('⏰ Starting Cron jobs worker (every 15 minutes)...');
  
  // Run checks immediately on startup
  checkTodayPiketReminders();
  checkUpcomingBills();
  checkMissedPikets();
  checkAnnouncementBroadcast();
  checkRohaniReminders();
  checkMeetingReminders();
  checkActivityReminders();
  checkSecurityDutyReminders();
  checkCctvReminders();

  // Run checks every 15 minutes so specific reminder hours are caught accurately
  cronInterval = setInterval(() => {
    checkTodayPiketReminders();
    checkUpcomingBills();
    checkMissedPikets();
    checkAnnouncementBroadcast();
    checkRohaniReminders();
    checkMeetingReminders();
    checkActivityReminders();
    checkSecurityDutyReminders();
    checkCctvReminders();
  }, 1000 * 60 * 15); // 15 minutes
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('⏰ Cron jobs worker stopped.');
  }
}


