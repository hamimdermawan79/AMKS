import { db } from '@/lib/db';
import { sendWhatsAppMessage, getConnectionStatus } from './whatsapp';
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

let isProcessingQueue = false;

export async function processNotificationQueue() {
  // Prevent parallel overlapping runs
  if (isProcessingQueue) return;

  // Don't burn queue if WhatsApp Bot is not connected yet
  if (getConnectionStatus() !== 'connected') {
    return;
  }

  isProcessingQueue = true;

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
      take: 5, // Process in small batches
    });

    if (pendingNotifications.length === 0) return;

    console.log(`✉️ Processing WA notification queue... Found ${pendingNotifications.length} pending.`);

    const processedUserTypes = new Set<string>();

    for (const notif of pendingNotifications) {
      // Re-check connection during loop
      if (getConnectionStatus() !== 'connected') {
        console.log('⚠️ WhatsApp bot disconnected mid-queue, pausing processing.');
        break;
      }

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

      let targetPhone = notif.user?.phone?.trim() || '';
      
      // If it has no user or no phone attached
      if (!targetPhone) {
        await db.notification.update({
          where: { id: notif.id },
          data: { sentWa: true, waMessageId: 'SKIPPED_NO_USER' },
        });
        continue;
      }

      // Validate phone length (minimum 9 digits)
      const digitsOnly = targetPhone.replace(/\D/g, '');
      if (digitsOnly.length < 9) {
        console.log(`🧹 Skipping invalid phone number "${targetPhone}" for ${notif.user?.fullName}`);
        await db.notification.update({
          where: { id: notif.id },
          data: { sentWa: true, waMessageId: 'SKIPPED_INVALID_PHONE' },
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
      
      // Safe delay between 1.5 to 3 seconds between messages
      const delayMs = Math.floor(Math.random() * 1500) + 1500;
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

        // If error is disconnection or detached frame, keep sentWa = false so it will be retried when reconnected
        const errLower = (result.error || '').toLowerCase();
        if (errLower.includes('not connected') || errLower.includes('detached') || errLower.includes('reconnecting')) {
          console.log('⚠️ Postponing message until WhatsApp bot reconnects.');
          break;
        }

        // Otherwise mark failed so queue doesn't get blocked
        await db.notification.update({
          where: { id: notif.id },
          data: {
            waMessageId: `FAILED: ${result.error?.slice(0, 50)}`,
            sentWa: true,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error running processNotificationQueue:', error);
  } finally {
    isProcessingQueue = false;
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
