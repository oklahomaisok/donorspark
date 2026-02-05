import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks, deckEvents } from '@/db/schema';
import { desc, sql, eq } from 'drizzle-orm';

// Simple auth - require a secret key for stats access
const STATS_API_KEY = process.env.STATS_API_KEY;

export async function GET(req: NextRequest) {
  // Support both header auth and query param for easy browser access
  const authHeader = req.headers.get('authorization');
  const headerKey = authHeader?.replace('Bearer ', '');
  const queryKey = req.nextUrl.searchParams.get('key');
  const providedKey = headerKey || queryKey;

  if (!STATS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized', reason: 'env_not_set', v: 2 }, { status: 401 });
  }

  if (providedKey !== STATS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized', reason: 'key_mismatch', v: 2 }, { status: 401 });
  }

  try {
    // Get overall stats
    const totalDecks = await db.select({ count: sql<number>`count(*)` }).from(decks);
    const completedDecks = await db.select({ count: sql<number>`count(*)` })
      .from(decks)
      .where(eq(decks.status, 'complete'));

    // Get aggregate views and clicks
    const aggregates = await db.select({
      totalViews: sql<number>`coalesce(sum(${decks.viewCount}), 0)`,
      totalClicks: sql<number>`coalesce(sum(${decks.clickCount}), 0)`,
    }).from(decks);

    // Get DonorSpark-specific clicks (clicks on the "Made with DonorSpark" links)
    const donorsparkClicks = await db.select({ count: sql<number>`count(*)` })
      .from(deckEvents)
      .where(eq(deckEvents.eventType, 'donorspark_click'));

    // Get top 20 decks by views
    const topDecks = await db.select({
      slug: decks.slug,
      orgName: decks.orgName,
      viewCount: decks.viewCount,
      clickCount: decks.clickCount,
      createdAt: decks.createdAt,
    })
      .from(decks)
      .where(eq(decks.status, 'complete'))
      .orderBy(desc(decks.viewCount))
      .limit(20);

    // Get recent DonorSpark clicks with deck info
    const recentDonorsparkClicks = await db.select({
      slug: deckEvents.slug,
      createdAt: deckEvents.createdAt,
      referrer: deckEvents.referrer,
    })
      .from(deckEvents)
      .where(eq(deckEvents.eventType, 'donorspark_click'))
      .orderBy(desc(deckEvents.createdAt))
      .limit(50);

    return NextResponse.json({
      overview: {
        totalDecks: totalDecks[0]?.count || 0,
        completedDecks: completedDecks[0]?.count || 0,
        totalViews: aggregates[0]?.totalViews || 0,
        totalDonateClicks: aggregates[0]?.totalClicks || 0,
        donorsparkClicks: donorsparkClicks[0]?.count || 0,
      },
      topDecks,
      recentDonorsparkClicks,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
