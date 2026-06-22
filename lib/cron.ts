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

let cronInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  if (cronInterval) return;

  console.log('⏰ Starting Cron jobs worker (every 1 hour)...');
  
  // Run checks immediately on startup
  checkUpcomingPiketAssignments();
  checkUpcomingBills();

  // Run checks every hour
  cronInterval = setInterval(() => {
    checkUpcomingPiketAssignments();
    checkUpcomingBills();
  }, 1000 * 60 * 60); // 1 hour
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('⏰ Cron jobs worker stopped.');
  }
}
