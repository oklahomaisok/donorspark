import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks, deckEvents, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createUpgradeEvent, getDeckBySlug, getUserById } from '@/db/queries';
import { sendUpgradeMilestoneEmail } from '@/lib/resend';

// Share milestones that trigger upgrade emails
const SHARE_MILESTONES = [5, 10, 25, 50, 100];

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

    // Update deck counters and check for milestones
    if (event === 'view') {
      await db.update(decks)
        .set({ viewCount: sql`${decks.viewCount} + 1` })
        .where(eq(decks.slug, slug));
    } else if (event === 'click' || event === 'donorspark_click') {
      await db.update(decks)
        .set({ clickCount: sql`${decks.clickCount} + 1` })
        .where(eq(decks.slug, slug));
    } else if (event === 'share') {
      // Increment share count
      await db.update(decks)
        .set({ shareCount: sql`${decks.shareCount} + 1` })
        .where(eq(decks.slug, slug));

      // Check for share milestones
      await checkShareMilestone(slug);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    // Don't fail silently - tracking errors shouldn't break the user experience
    return NextResponse.json({ success: true });
  }
}

/**
 * Check if the deck's share count has hit a milestone and send upgrade email
 */
async function checkShareMilestone(slug: string) {
  try {
    const deck = await getDeckBySlug(slug);
    if (!deck || !deck.userId) return;

    const user = await getUserById(deck.userId);
    if (!user || user.plan !== 'free') return;

    // Check if we've hit a milestone
    const milestone = SHARE_MILESTONES.find(m => deck.shareCount === m);
    if (!milestone) return;

    // Create upgrade event
    await createUpgradeEvent({
      userId: user.id,
      eventType: 'share_milestone',
      metadata: { milestone, slug, shareCount: deck.shareCount },
    });

    // Send milestone email
    await sendUpgradeMilestoneEmail(user.email, user.name || undefined, {
      type: 'shares',
      value: milestone,
    });
  } catch (error) {
    console.error('Share milestone check error:', error);
    // Don't throw - milestone tracking shouldn't break the main flow
  }
}
