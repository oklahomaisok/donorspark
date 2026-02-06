import { NextRequest, NextResponse } from 'next/server';
import { markExpiredDecks } from '@/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expiredCount = await markExpiredDecks();

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Expire decks cron error:', error);
    return NextResponse.json(
      { error: 'Failed to expire decks' },
      { status: 500 }
    );
  }
}
