import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getConnectionStatus, getLatestQR } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // NOTE: Previously this endpoint required SUPERADMIN or KETUA role.
  // For development and easier access to the QR code, we now allow any authenticated user.
  // If stricter access is needed, re‑introduce role checks.

  let status = getConnectionStatus();
  let qr = getLatestQR();

  // If bot is disconnected, automatically trigger a reconnection in the background
  if (status === 'disconnected') {
    const { connectToWhatsApp } = await import('@/lib/whatsapp');
    connectToWhatsApp().catch((err) => console.error('Failed to auto-connect WhatsApp:', err));
    status = 'connecting'; // Immediately show connecting/loading state
  }

  return NextResponse.json({
    status,
    qr,
    timestamp: new Date().toISOString(),
  });
}
