import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, decks } from '@/db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { send30DayStatsEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find users who:
    // 1. Were created approximately 30 days ago (between 29 and 31 days)
    // 2. Are on the free plan
    // 3. Have at least one deck
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

    const eligibleUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.plan, 'free'),
          gte(users.createdAt, thirtyOneDaysAgo),
          lt(users.createdAt, twentyNineDaysAgo)
        )
      )
      .limit(100);

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of eligibleUsers) {
      try {
        // Get user's deck stats
        const userDecks = await db
          .select()
          .from(decks)
          .where(eq(decks.userId, user.id));

        if (userDecks.length === 0) continue;

        const stats = {
          totalViews: userDecks.reduce((sum, d) => sum + d.viewCount, 0),
          totalClicks: userDecks.reduce((sum, d) => sum + d.clickCount, 0),
          totalShares: userDecks.reduce((sum, d) => sum + d.shareCount, 0),
          deckCount: userDecks.length,
        };

        // Only send if they have some activity
        if (stats.totalViews === 0) continue;

        await send30DayStatsEmail(user.email, user.name || undefined, stats);
        sentCount++;
      } catch (error) {
        errors.push(`Failed to send to ${user.email}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      usersFound: eligibleUsers.length,
      emailsSent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('30-day email cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process 30-day emails' },
      { status: 500 }
    );
  }
}
