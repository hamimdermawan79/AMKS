import { db } from '@/lib/db';
import { createNotification } from './notifications';
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

    // Jadwal pengingat: Jam 00:00 (12 malam), 02:00, 05:00, 07:00, 09:00 WIB
    const validHours = [0, 2, 5, 7, 9];
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
        message = `Halo ${assign.user.fullName}, HARI INI Anda memiliki jadwal piket di ${sectorName}. Sistem presensi akan dibuka mulai pukul 01:00 WIB dini hari dan batas akhir presensi adalah pukul 11:00 WIB. Mohon bersiap untuk melaksanakan piket Anda.`;
      } else if (currentHour === 2) {
        // Jam 2 Dini Hari (02:00 WIB)
        message = `Halo ${assign.user.fullName}, presensi piket untuk ${sectorName} telah dibuka. Anda dapat melaksanakan piket dan melakukan presensi kehadiran di dashboard sebelum batas akhir pukul 11:00 WIB (tersisa 9 jam lagi).`;
      } else if (currentHour === 5) {
        // Jam 5 Subuh (05:00 WIB)
        message = `Selamat pagi ${assign.user.fullName}, mengingatkan kembali jadwal piket Anda HARI INI di ${sectorName}. Segera laksanakan tugas piket dan isi presensi sebelum pukul 11:00 WIB (tersisa 6 jam lagi).`;
      } else if (currentHour === 7) {
        // Jam 7 Pagi (07:00 WIB)
        message = `Halo ${assign.user.fullName}, pengingat pagi untuk piket Anda di ${sectorName}. Harap segera menyelesaikan piket dan presensi sebelum pukul 11:00 WIB (tersisa 4 jam lagi).`;
      } else if (currentHour === 9) {
        // Jam 9 Pagi (09:00 WIB)
        message = `⚠️ PENTING: Halo ${assign.user.fullName}, Anda belum melakukan presensi piket di ${sectorName}! Waktu tersisa tinggal 2 jam lagi sebelum batas akhir pukul 11:00 WIB. Hindari denda dengan segera melakukan piket dan presensi.`;
      } else {
        const timeRemaining = Math.max(1, 11 - currentHour);
        message = `Halo ${assign.user.fullName}, mengingatkan bahwa HARI INI Anda memiliki jadwal piket di ${sectorName}. Harap segera melakukan presensi piket di dashboard sebelum pukul 11:00 WIB (tersisa kurang lebih ${timeRemaining} jam lagi). Terima kasih!`;
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
 * Automatically check today's and yesterday's piket assignments that have passed 11:00 WIB.
 * If they don't have an attendance record, mark them as TIDAK_HADIR, issue a 10,000 fine,
 * and create a bill.
 */
export async function checkMissedPikets() {
  try {
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHour = nowWib.getHours();
    
    // We only process if it's past 11:00 WIB
    if (currentHour < 11) {
      console.log('⏰ Skipping checkMissedPikets: current time is before 11:00 WIB.');
      return;
    }

    // Get active period
    const activePeriod = await db.piketPeriod.findFirst({
      where: { isActive: true },
    });
    if (!activePeriod) return;

    // Get today's start and end date (in WIB)
    const endOfToday = new Date(nowWib);
    endOfToday.setHours(23, 59, 59, 999);

    // Check assignments up to today that have passed 11:00 WIB
    const unpaidAssignments = await db.piketAssignment.findMany({
      where: {
        periodId: activePeriod.id,
        date: {
          lte: endOfToday, // Include today's assignments since currentHour >= 11
        },
        attendance: null,
      },
      include: {
        user: true,
      },
    });

    console.log(`⏰ Found ${unpaidAssignments.length} assignments to process for missed picket status.`);

    for (const assign of unpaidAssignments) {
      // Super Admin tidak dikenai denda piket otomatis
      if (await isUserSuperAdminById(assign.userId)) {
        continue;
      }

      // Idempotency: skip if attendance already exists for this assignment
      const existingAttendance = await db.piketAttendance.findUnique({
        where: { assignmentId: assign.id },
      });
      if (existingAttendance) {
        continue;
      }

      // Idempotency: skip if denda notification already exists for this assignment
      const dendaRefId = `DENDA_PIKET:${assign.id}`;
      const existingDendaNotif = await db.notification.findFirst({
        where: { referenceId: dendaRefId },
      });
      if (existingDendaNotif) {
        continue;
      }

      // Create attendance as TIDAK_HADIR
      await db.piketAttendance.create({
        data: {
          assignmentId: assign.id,
          status: 'TIDAK_HADIR',
          markedById: null, // marked by system
        },
      });

      const fineAmount = activePeriod.finePerDay || 10000;

      // Create fine record
      const fine = await db.fine.create({
        data: {
          userId: assign.userId,
          periodId: activePeriod.id,
          daysMissed: 1,
          amount: fineAmount,
        },
      });

      // Create bill
      const bill = await db.bill.create({
        data: {
          userId: assign.userId,
          type: 'DENDA_PIKET',
          title: `Denda Piket (${new Date(assign.date).toLocaleDateString('id-ID')})`,
          amount: fineAmount,
          status: 'BELUM_LUNAS',
          division: 'KEBERSIHAN',
          note: `Terlambat / tidak melakukan presensi piket pada tanggal ${new Date(assign.date).toLocaleDateString('id-ID')} sebelum pukul 11:00 WIB.`,
        },
      });

      // Link fine to bill
      await db.fine.update({
        where: { id: fine.id },
        data: { billId: bill.id },
      });

      // Create Notification with unique referenceId to prevent duplicates
      await createNotification({
        userId: assign.userId,
        title: 'Denda Piket Otomatis Terbit',
        message: `Pemberitahuan: Anda dikenakan denda piket sebesar Rp${fineAmount.toLocaleString('id-ID')} karena tidak melakukan presensi dan tugas piket pada tanggal ${new Date(assign.date).toLocaleDateString('id-ID')} sebelum batas akhir 11:00 WIB. Tagihan denda telah terbit di sistem, harap segera melakukan pelunasan ke Bendahara.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: dendaRefId,
      });
      
      console.log(`✅ Automated denda issued for ${assign.user.fullName} on date ${assign.date.toLocaleDateString()}`);
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

let cronInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  if (cronInterval) return;

  console.log('⏰ Starting Cron jobs worker (every 15 minutes)...');
  
  // Run checks immediately on startup
  checkTodayPiketReminders();
  checkUpcomingBills();
  checkMissedPikets();
  checkAnnouncementBroadcast();

  // Run checks every 15 minutes so specific reminder hours (0, 2, 5, 7, 9, 11 WIB) are caught accurately
  cronInterval = setInterval(() => {
    checkTodayPiketReminders();
    checkUpcomingBills();
    checkMissedPikets();
    checkAnnouncementBroadcast();
  }, 1000 * 60 * 15); // 15 minutes
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('⏰ Cron jobs worker stopped.');
  }
}

