import { Client, LocalAuth } from 'whatsapp-web.js';
import path from 'path';
import fs from 'fs';

// Global state to prevent duplicate instances during Next.js hot-reloads (HMR)
const globalForWhatsApp = globalThis as unknown as {
  client: Client | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  currentQR: string | null;
};

if (globalForWhatsApp.connectionStatus === undefined) {
  globalForWhatsApp.connectionStatus = 'disconnected';
}
if (globalForWhatsApp.currentQR === undefined) {
  globalForWhatsApp.currentQR = null;
}

export function getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
  return globalForWhatsApp.connectionStatus;
}

export function getLatestQR(): string | null {
  return globalForWhatsApp.currentQR;
}

export async function connectToWhatsApp(): Promise<Client> {
  if (globalForWhatsApp.client && (globalForWhatsApp.connectionStatus === 'connected' || globalForWhatsApp.connectionStatus === 'connecting')) {
    return globalForWhatsApp.client;
  }

  // Clean up any existing client
  if (globalForWhatsApp.client) {
    try {
      await globalForWhatsApp.client.destroy();
    } catch (e) {
      console.error('Error destroying old WhatsApp client:', e);
    }
    globalForWhatsApp.client = null;
  }

  globalForWhatsApp.connectionStatus = 'connecting';
  globalForWhatsApp.currentQR = null;
  console.log('📡 Starting WhatsApp Bot service (whatsapp-web.js)...');

  const authFolder = path.join(process.cwd(), '.wwebjs_auth');

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: authFolder,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
  });

  globalForWhatsApp.client = client;

  client.on('qr', (qr) => {
    globalForWhatsApp.currentQR = qr;
    globalForWhatsApp.connectionStatus = 'connecting';
    console.log('⚠️ WhatsApp QR Code received! Please scan in dashboard.');
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp client is ready and connected!');
    globalForWhatsApp.connectionStatus = 'connected';
    globalForWhatsApp.currentQR = null;
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failure:', msg);
    globalForWhatsApp.connectionStatus = 'disconnected';
    globalForWhatsApp.currentQR = null;
  });

  client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp client was disconnected:', reason);
    globalForWhatsApp.connectionStatus = 'disconnected';
    globalForWhatsApp.currentQR = null;

    // Only clear auth folder if explicitly logged out from phone or auth failed
    const reasonStr = String(reason || '').toUpperCase();
    if (reasonStr.includes('LOGOUT') || reasonStr.includes('UNPAIRED')) {
      if (fs.existsSync(authFolder)) {
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
          console.log('🧹 Cleared expired whatsapp-auth credentials folder.');
        } catch (e) {
          console.error('Failed to clear credentials folder:', e);
        }
      }
    }
  });

  // Start initialization (non-blocking)
  client.initialize().catch((err) => {
    console.error('Failed to initialize whatsapp-web.js client:', err);
    globalForWhatsApp.connectionStatus = 'disconnected';
  });

  return client;
}

export async function disconnectWhatsApp(): Promise<void> {
  if (globalForWhatsApp.client) {
    try {
      await globalForWhatsApp.client.logout();
      await globalForWhatsApp.client.destroy();
    } catch (e) {
      console.error('Error during WhatsApp disconnect:', e);
    }
    globalForWhatsApp.client = null;
    globalForWhatsApp.connectionStatus = 'disconnected';
    globalForWhatsApp.currentQR = null;

    const authFolder = path.join(process.cwd(), '.wwebjs_auth');
    if (fs.existsSync(authFolder)) {
      try {
        fs.rmSync(authFolder, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to clean auth folder:', e);
      }
    }
    console.log('🔌 WhatsApp disconnected and auth cleared.');
  }
}

export async function sendWhatsAppMessage(
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!globalForWhatsApp.client || globalForWhatsApp.connectionStatus !== 'connected') {
      return { success: false, error: 'WhatsApp bot is not connected' };
    }

    if (!toPhone || typeof toPhone !== 'string') {
      return { success: false, error: 'Nomor telepon tidak valid' };
    }

    // Clean phone number
    let cleanedPhone = toPhone.replace(/\D/g, '');

    if (cleanedPhone.length < 8) {
      return { success: false, error: 'Nomor telepon terlalu pendek / tidak valid' };
    }

    // Ensure it starts with 62 (Indonesia)
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '62' + cleanedPhone.slice(1);
    } else if (!cleanedPhone.startsWith('62')) {
      cleanedPhone = '62' + cleanedPhone;
    }

    const jid = `${cleanedPhone}@c.us`; // whatsapp-web.js uses @c.us for user JIDs
    const response = await globalForWhatsApp.client.sendMessage(jid, message);

    if (response && response.id && response.id.id) {
      return { success: true, messageId: response.id.id };
    }

    return { success: true };
  } catch (error: any) {
    const errorMsg = String(error?.message || error || 'Unknown error');
    console.error(`Failed to send WhatsApp message to ${toPhone}:`, errorMsg);

    // Auto-detect Chromium detached Frame or destroyed execution context
    const isDetachedFrame = 
      errorMsg.includes('detached Frame') || 
      errorMsg.includes('Execution context was destroyed') || 
      errorMsg.includes('Session closed') ||
      errorMsg.includes('Protocol error');

    if (isDetachedFrame) {
      console.warn('⚠️ Chromium frame detached / destroyed. Resetting client state and auto-reconnecting...');
      globalForWhatsApp.connectionStatus = 'disconnected';
      
      // Auto reconnect in background
      setTimeout(() => {
        connectToWhatsApp().catch((e) => console.error('Auto-reconnect failed:', e));
      }, 1000);

      return { success: false, error: 'WhatsApp bot session frame detached. Reconnecting in background...' };
    }

    return { success: false, error: errorMsg };
  }
}
