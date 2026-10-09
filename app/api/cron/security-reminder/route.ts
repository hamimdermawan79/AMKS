import { NextResponse } from 'next/server';
import { checkSecurityDutyReminders } from '@/lib/cron';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await checkSecurityDutyReminders();

    return NextResponse.json({
      success: true,
      message: 'Security duty reminder check completed.',
    });
  } catch (error: any) {
    console.error('Security duty reminder cron error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
