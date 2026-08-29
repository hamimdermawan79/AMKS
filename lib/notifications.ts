import { db } from '@/lib/db';
import { sendWhatsAppMessage } from './whatsapp';
import { NotificationType } from '@prisma/client';

const KARYA_ILMIAH_ACCESS_NOTIFY_ROLES = ['SUPERADMIN', 'KETUA', 'SEKRETARIS'] as const;

interface CreateNotificationPayload {
  userId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string | null;
  scheduledFor?: Date | null;
}

export async function createNotification(payload: CreateNotificationPayload) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: payload.userId || null,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        referenceId: payload.referenceId || null,
        scheduledFor: payload.scheduledFor || null,
        isRead: false,
        sentWa: false,
      },
    });

    console.log(`✨ Notification created in DB: "${payload.title}" for user: ${payload.userId || 'Global'}`);
    return notification;
  } catch (error) {
    console.error('Failed to create notification in DB:', error);
    throw error;
  }
}

export async function processNotificationQueue() {
  try {
    const now = new Date();
    
    // Fetch notifications that need WA sending
    const pendingNotifications = await db.notification.findMany({
      where: {
        sentWa: false,
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } }
        ]
      },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            status: true,
          }
        }
      },
      take: 5, // Process in small batches to avoid rate limit / socket congestion
    });

    if (pendingNotifications.length === 0) return;

    console.log(`✉️ Processing WA notification queue... Found ${pendingNotifications.length} pending.`);

    const processedUserTypes = new Set<string>();

    for (const notif of pendingNotifications) {
      // Deduplicate multiple pending notifications of the same type for the same user in batch
      if (notif.userId && (notif.type === 'PIKET_REMINDER' || notif.type === 'TAGIHAN_REMINDER')) {
        const dupKey = `${notif.userId}:${notif.type}`;
        if (processedUserTypes.has(dupKey)) {
          console.log(`🧹 Skipping duplicate WA message for ${notif.user?.fullName || notif.userId} (type: ${notif.type})`);
          await db.notification.update({
            where: { id: notif.id },
            data: { sentWa: true, waMessageId: 'SKIPPED_DUPLICATE' },
          });
          continue;
        }
        processedUserTypes.add(dupKey);
      }

      let targetPhone = '';
      
      // If it has a specific user, send to their phone
      if (notif.user?.phone) {
        targetPhone = notif.user.phone;
      } else {
        // If it's a global announcement but has no userId, we skip WA sending or log it
        // Note: Broadcast announcements are usually duplicated per active user or sent as single system logs.
        // If no user is attached, we mark it sentWa: true (nothing to send via personal WA)
        await db.notification.update({
          where: { id: notif.id },
          data: { sentWa: true, waMessageId: 'SKIPPED_NO_USER' },
        });
        continue;
      }

      // If user is alumni, skip sending WA
      if (notif.user?.status === 'ALUMNI') {
        console.log(`🧹 Skipping WA message for ${notif.user?.fullName} (User is ALUMNI)`);
        await db.notification.update({
          where: { id: notif.id },
          data: { sentWa: true, waMessageId: 'SKIPPED_ALUMNI' },
        });
        continue;
      }

      // Format message with premium look (bold, emojis)
      const formattedMessage = formatWaMessage(notif.title, notif.message, notif.type);
      
      // Add a randomized delay between 10 to 20 seconds to prevent spamming
      const delayMs = Math.floor(Math.random() * 10000) + 10000;
      console.log(`⏳ Waiting for ${(delayMs / 1000).toFixed(1)}s before sending to avoid spam detection...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      console.log(`📤 Sending WA to ${notif.user?.fullName} (${targetPhone})...`);
      const result = await sendWhatsAppMessage(targetPhone, formattedMessage);

      if (result.success) {
        await db.notification.update({
          where: { id: notif.id },
          data: {
            sentWa: true,
            waMessageId: result.messageId || 'SENT',
          },
        });
        console.log(`✅ WA Sent successfully to ${notif.user?.fullName}`);
      } else {
        console.error(`❌ WA Failed to send to ${notif.user?.fullName}:`, result.error);
        // We update with FAILED status but we can let it retry or mark it failed.
        // Let's set waMessageId to error message and allow retry a limited number of times.
        // To keep it simple, let's mark it as FAILED in waMessageId.
        await db.notification.update({
          where: { id: notif.id },
          data: {
            waMessageId: `FAILED: ${result.error?.slice(0, 50)}`,
            // Set sentWa to true so it doesn't infinite loop, or let it retry once more by keeping it false
            // But let's set it to true so it doesn't block the queue
            sentWa: true,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error running processNotificationQueue:', error);
  }
}

function formatWaMessage(title: string, message: string, type: NotificationType): string {
  let emoji = '🔔';
  if (type === 'PIKET_REMINDER') emoji = '🧹';
  else if (type === 'TAGIHAN_REMINDER') emoji = '💵';
  else if (type === 'PENGUMUMAN') emoji = '📢';
  else if (type === 'SYSTEM') emoji = '📚';
  
  return `*${emoji} ${title.toUpperCase()} ${emoji}*

${message}

Silahkan login untuk akses cepatnya, klik link ini:
https://amksyogyakarta.my.id/login

_Pesan otomatis dari Sistem Web Asrama AMKS. Mohon tidak membalas pesan ini._`;
}

/** Kirim notifikasi in-app (+ antrian WA) ke Ketua, Sekretaris, dan Super Admin. */
export async function notifyKaryaIlmiahAccessRequestAdmins(payload: {
  accessRequestId: string;
  workTitle: string;
  requesterName: string;
  institution: string;
  purpose: string;
  whatsapp: string;
}) {
  const admins = await db.user.findMany({
    where: {
      status: 'AKTIF',
      roles: {
        some: {
          role: { name: { in: [...KARYA_ILMIAH_ACCESS_NOTIFY_ROLES] } },
        },
      },
    },
    select: { id: true },
  });

  const uniqueAdminIds = [...new Set(admins.map((a) => a.id))];
  const message = `${payload.requesterName} (${payload.institution}) meminta akses berkas "${payload.workTitle}". Keperluan: ${payload.purpose}. WA: ${payload.whatsapp}. Kelola di menu Permintaan Akses Karya Ilmiah.`;

  await Promise.all(
    uniqueAdminIds.map((userId) =>
      createNotification({
        userId,
        title: 'Permintaan Akses Karya Ilmiah Baru',
        message,
        type: 'SYSTEM',
        referenceId: payload.accessRequestId,
      })
    )
  );

  return uniqueAdminIds.length;
}

// Background Worker state
let workerInterval: NodeJS.Timeout | null = null;

export function startNotificationWorker() {
  if (workerInterval) return;

  console.log('👷 Starting Notification background worker (every 10 seconds)...');
  
  // Run once immediately
  processNotificationQueue();

  workerInterval = setInterval(() => {
    processNotificationQueue();
  }, 10000); // 10 seconds interval
}

export function stopNotificationWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('👷 Notification background worker stopped.');
  }
}
