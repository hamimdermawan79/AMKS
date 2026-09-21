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

/**
 * Re-export the WhatsApp formatter from the shared client-safe module.
 */
import { formatRohaniH1WhatsAppMessage } from '@/lib/rohani/format-wa';
export { formatRohaniH1WhatsAppMessage };

/**
 * Check for Rohani schedules occurring TOMORROW (H-1) in WIB time.
 * If found, send the H-1 announcement message to ALL active warga via WhatsApp.
 */
export async function checkRohaniHMinus1Reminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

    // Tomorrow in WIB
    const tomorrowStart = new Date(nowWib);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(nowWib);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find any schedule occurring tomorrow
    const upcomingSchedules = await db.rohaniSchedule.findMany({
      where: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
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
      const refId = `ROHANI_H1_BROADCAST:${schedule.id}`;

      // Idempotency: skip if already sent
      const existing = await db.notification.findFirst({
        where: { referenceId: refId },
      });
      if (existing) {
        continue;
      }

      const waMessage = formatRohaniH1WhatsAppMessage(schedule);

      // Batch insert notifications
      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          title: `Pengumuman Rohani (H-1): Sholat & Tadarus QS. ${schedule.currentSurah}`,
          message: waMessage,
          type: 'PENGUMUMAN',
          referenceId: refId,
        })),
      });

      console.log(`📢 Rohani H-1 WhatsApp broadcast queued for ${targetUsers.length} users (Schedule: ${schedule.id}).`);
    }

    // Trigger queue processing
    processNotificationQueue().catch(console.error);
  } catch (error) {
    console.error('Failed to run checkRohaniHMinus1Reminders:', error);
  }
}

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

let cronInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  if (cronInterval) return;

  console.log('⏰ Starting Cron jobs worker (every 15 minutes)...');
  
  // Run checks immediately on startup
  checkTodayPiketReminders();
  checkUpcomingBills();
  checkMissedPikets();
  checkAnnouncementBroadcast();
  checkRohaniHMinus1Reminders();
  checkMeetingReminders();
  checkActivityReminders();

  // Run checks every 15 minutes so specific reminder hours are caught accurately
  cronInterval = setInterval(() => {
    checkTodayPiketReminders();
    checkUpcomingBills();
    checkMissedPikets();
    checkAnnouncementBroadcast();
    checkRohaniHMinus1Reminders();
    checkMeetingReminders();
    checkActivityReminders();
  }, 1000 * 60 * 15); // 15 minutes
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('⏰ Cron jobs worker stopped.');
  }
}


