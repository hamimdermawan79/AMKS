import { NextResponse } from 'next/server';
import { checkAnnouncementBroadcast } from '@/lib/cron';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET environment variable is not configured on the server.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await checkAnnouncementBroadcast();

    return NextResponse.json({
      success: true,
      message: 'Announcement broadcast check completed.',
    });
  } catch (error) {
    console.error('Broadcast announcement cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
