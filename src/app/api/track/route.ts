import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks, deckEvents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, event, sessionId } = body;

    if (!slug || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const referrer = req.headers.get('referer') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Insert event
    await db.insert(deckEvents).values({
      slug,
      eventType: event,
      sessionId: sessionId || 'unknown',
      referrer,
      userAgent,
    });

    // Update deck counters
    if (event === 'view') {
      await db.update(decks)
        .set({ viewCount: sql`${decks.viewCount} + 1` })
        .where(eq(decks.slug, slug));
    } else if (event === 'click' || event === 'donorspark_click') {
      await db.update(decks)
        .set({ clickCount: sql`${decks.clickCount} + 1` })
        .where(eq(decks.slug, slug));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    // Don't fail silently - tracking errors shouldn't break the user experience
    return NextResponse.json({ success: true });
  }
}
