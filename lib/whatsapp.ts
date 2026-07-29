import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  WASocket,
  AuthenticationState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
// @ts-ignore
import qrcodeTerminal from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

// Global state for WhatsApp connection to prevent duplicate instances during development HMR
const globalForWhatsApp = globalThis as unknown as {
  sock: WASocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  currentQR: string | null;
};

if (globalForWhatsApp.sock === undefined) {
  globalForWhatsApp.sock = null;
}
if (globalForWhatsApp.connectionStatus === undefined) {
  globalForWhatsApp.connectionStatus = 'disconnected';
}
if (globalForWhatsApp.currentQR === undefined) {
  globalForWhatsApp.currentQR = null;
}

export function getWhatsAppSocket(): WASocket | null {
  return globalForWhatsApp.sock;
}

export function getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
  return globalForWhatsApp.connectionStatus;
}

export function getLatestQR(): string | null {
  return globalForWhatsApp.currentQR;
}

export async function connectToWhatsApp(): Promise<WASocket> {
  if (globalForWhatsApp.sock && (globalForWhatsApp.connectionStatus === 'connected' || globalForWhatsApp.connectionStatus === 'connecting')) {
    return globalForWhatsApp.sock;
  }

  // Clean up any existing socket and its listeners to avoid leaks
  if (globalForWhatsApp.sock) {
    try {
      globalForWhatsApp.sock.ev.removeAllListeners('connection.update');
      globalForWhatsApp.sock.ev.removeAllListeners('creds.update');
      globalForWhatsApp.sock.end(undefined);
    } catch (e) {
      console.error('Error cleaning up old socket:', e);
    }
    globalForWhatsApp.sock = null;
  }

  globalForWhatsApp.connectionStatus = 'connecting';
  globalForWhatsApp.currentQR = null;
  console.log('📡 Starting WhatsApp Bot service...');

  // Setup auth state folder in the root directory
  const authFolder = path.join(process.cwd(), 'whatsapp-auth');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const socket = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }) as any,
    printQRInTerminal: false,
  });

  globalForWhatsApp.sock = socket;

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      globalForWhatsApp.currentQR = qr;
      globalForWhatsApp.connectionStatus = 'connecting';
      console.log('⚠️ WhatsApp QR Code received! Please scan to connect:');
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      
      // Clear auth if logged out, bad session, or connection replaced
      const shouldClearAuth = 
        statusCode === DisconnectReason.loggedOut || 
        statusCode === DisconnectReason.badSession || 
        statusCode === DisconnectReason.connectionReplaced ||
        statusCode === DisconnectReason.multideviceMismatch;
        
      const shouldReconnect = !shouldClearAuth;

      console.log('❌ WhatsApp connection closed. Status:', statusCode, 'Reason:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
      
      globalForWhatsApp.connectionStatus = 'disconnected';
      globalForWhatsApp.currentQR = null;

      if (shouldClearAuth) {
        // Clear auth credentials directory to force fresh QR next connection
        const authFolder = path.join(process.cwd(), 'whatsapp-auth');
        if (fs.existsSync(authFolder)) {
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
            console.log('🧹 Cleared expired or corrupt whatsapp-auth credentials.');
          } catch (e) {
            console.error('Failed to clear whatsapp-auth credentials:', e);
          }
        }
      }

      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 5000);
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connection opened successfully!');
      globalForWhatsApp.connectionStatus = 'connected';
      globalForWhatsApp.currentQR = null; // Clear QR once connected
    }
  });

  socket.ev.on('creds.update', saveCreds);

  return socket;
}

export async function disconnectWhatsApp(): Promise<void> {
  if (globalForWhatsApp.sock) {
    try {
      await globalForWhatsApp.sock.logout();
    } catch (e) {
      console.error('Error during WhatsApp logout:', e);
    }
    globalForWhatsApp.sock = null;
    globalForWhatsApp.connectionStatus = 'disconnected';
    globalForWhatsApp.currentQR = null;
    // Remove auth folder to force fresh QR on next connect
    const authFolder = path.join(process.cwd(), 'whatsapp-auth');
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    console.log('🔌 WhatsApp disconnected and auth cleared.');
  }
}

export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!globalForWhatsApp.sock || globalForWhatsApp.connectionStatus !== 'connected') {
      return { success: false, error: 'WhatsApp bot is not connected' };
    }

    // Clean phone number (replace + or spaces if any)
    let cleanedPhone = toPhone.replace(/\D/g, '');
    
    // Ensure it starts with 62 (Indonesia)
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '62' + cleanedPhone.slice(1);
    } else if (!cleanedPhone.startsWith('62')) {
      cleanedPhone = '62' + cleanedPhone;
    }

    const jid = `${cleanedPhone}@s.whatsapp.net`;
    const sentMsg = await globalForWhatsApp.sock.sendMessage(jid, { text: message });

    if (sentMsg?.key?.id) {
      return { success: true, messageId: sentMsg.key.id };
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to send WhatsApp message to ${toPhone}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
