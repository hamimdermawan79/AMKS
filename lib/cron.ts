import { db } from '@/lib/db';
import { createNotification } from './notifications';

/**
 * Check for piket assignments scheduled for tomorrow (H-1)
 * and create notifications if they don't already exist.
 */
export async function checkUpcomingPiketAssignments() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set range for tomorrow from 00:00:00 to 23:59:59
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    console.log(`⏰ Checking piket assignments for date: ${startOfTomorrow.toLocaleDateString()}`);

    const assignments = await db.piketAssignment.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
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

    for (const assign of assignments) {
      // Check if notification already sent for this assignment
      const existing = await db.notification.findFirst({
        where: {
          type: 'PIKET_REMINDER',
          referenceId: assign.id,
        },
      });

      if (existing) continue;

      // Create notification
      const sectorName = assign.sector === 0 ? 'Sektor A' : assign.sector === 1 ? 'Sektor B' : `Sektor ${assign.sector + 1}`;
      await createNotification({
        userId: assign.userId,
        title: 'Pengingat Piket Besok (H-1)',
        message: `Halo ${assign.user.fullName}, mengingatkan bahwa besok Anda terjadwal piket di ${sectorName}. Harap melakukan presensi piket di dashboard pada hari tersebut. Terima kasih!`,
        type: 'PIKET_REMINDER',
        referenceId: assign.id,
      });
    }
  } catch (error) {
    console.error('Failed to run checkUpcomingPiketAssignments:', error);
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
    const today = new Date(nowWib);
    today.setHours(0, 0, 0, 0);

    // Let's check any assignments on or before today
    const unpaidAssignments = await db.piketAssignment.findMany({
      where: {
        periodId: activePeriod.id,
        date: {
          lte: today,
        },
        attendance: null,
      },
      include: {
        user: true,
      },
    });

    console.log(`⏰ Found ${unpaidAssignments.length} assignments to process for missed picket status.`);

    for (const assign of unpaidAssignments) {
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

      // Create Notification
      await createNotification({
        userId: assign.userId,
        title: 'Denda Piket Otomatis Terbit',
        message: `Anda dikenakan denda piket sebesar Rp${fineAmount.toLocaleString('id-ID')} karena terlambat / tidak melakukan presensi piket pada tanggal ${new Date(assign.date).toLocaleDateString('id-ID')} sebelum 11:00 WIB. Harap segera melunasi ke Bendahara.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: bill.id,
      });
      
      console.log(`✅ Automated denda issued for ${assign.user.fullName} on date ${assign.date.toLocaleDateString()}`);
    }
  } catch (error) {
    console.error('Failed to run checkMissedPikets:', error);
  }
}

/**
 * Check piket assignments for today (H-0).
 * If the assignment date is today and they haven't marked attendance yet,
 * and we haven't sent a reminder in the last 3 hours, send a WhatsApp reminder.
 */
export async function checkHourlyPiketReminders() {
  try {
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHour = nowWib.getHours();
    
    // Reminders are only relevant on the piket day between 05:00 WIB and 11:00 WIB (when presensi closes)
    if (currentHour < 5 || currentHour >= 11) {
      return;
    }

    const today = new Date(nowWib);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(nowWib);
    endOfToday.setHours(23, 59, 59, 999);

    const assignments = await db.piketAssignment.findMany({
      where: {
        date: {
          gte: today,
          lte: endOfToday,
        },
        attendance: null, // Hasn't checked in yet
      },
      include: {
        user: true,
      },
    });

    console.log(`⏰ Checking hourly reminders for ${assignments.length} people assigned today...`);

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    for (const assign of assignments) {
      // Check if we sent a reminder in the last 3 hours for this specific assignment
      const recentReminder = await db.notification.findFirst({
        where: {
          userId: assign.userId,
          type: 'PIKET_REMINDER',
          referenceId: `SPAM:${assign.id}`,
          createdAt: {
            gte: threeHoursAgo,
          },
        },
      });

      if (recentReminder) {
        console.log(`🧹 Skipping reminder for ${assign.user.fullName} - sent recently.`);
        continue;
      }

      // Send/enqueue reminder notification
      const timeRemaining = 11 - currentHour;
      await createNotification({
        userId: assign.userId,
        title: 'PENGINGAT PIKET: Segera Presensi!',
        message: `PENTING! Halo ${assign.user.fullName}, Anda terjadwal piket HARI INI. Harap segera lakukan presensi piket di dashboard sebelum pukul 11:00 WIB (tersisa kurang lebih ${timeRemaining} jam lagi). Jika terlambat, Anda akan dikenakan denda otomatis sebesar Rp10.000. Terima kasih!`,
        type: 'PIKET_REMINDER',
        referenceId: `SPAM:${assign.id}`,
      });
      
      console.log(`✉️ Queued hourly reminder for ${assign.user.fullName}`);
    }
  } catch (error) {
    console.error('Failed to run checkHourlyPiketReminders:', error);
  }
}

let cronInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  if (cronInterval) return;

  console.log('⏰ Starting Cron jobs worker (every 1 hour)...');
  
  // Run checks immediately on startup
  checkUpcomingPiketAssignments();
  checkUpcomingBills();
  checkMissedPikets();
  checkHourlyPiketReminders();

  // Run checks every hour
  cronInterval = setInterval(() => {
    checkUpcomingPiketAssignments();
    checkUpcomingBills();
    checkMissedPikets();
    checkHourlyPiketReminders();
  }, 1000 * 60 * 60); // 1 hour
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('⏰ Cron jobs worker stopped.');
  }
}

