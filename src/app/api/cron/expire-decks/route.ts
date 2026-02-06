import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getExpiredAnonymousDecks, deleteDecks } from '@/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all expired anonymous decks
    const expiredDecks = await getExpiredAnonymousDecks();

    if (expiredDecks.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Collect all blob URLs to delete
    const blobUrls: string[] = [];
    for (const deck of expiredDecks) {
      if (deck.deckUrl) blobUrls.push(deck.deckUrl);
      if (deck.ogImageUrl) blobUrls.push(deck.ogImageUrl);
    }

    // Delete blobs (in batches if needed)
    if (blobUrls.length > 0) {
      try {
        await del(blobUrls);
      } catch (blobError) {
        console.error('Error deleting blobs:', blobError);
        // Continue with DB deletion even if blob deletion fails
      }
    }

    // Delete from database
    const deckIds = expiredDecks.map(d => d.id);
    const deletedCount = await deleteDecks(deckIds);

    console.log(`Deleted ${deletedCount} expired anonymous decks and ${blobUrls.length} blob files`);

    return NextResponse.json({
      success: true,
      deletedCount,
      blobsDeleted: blobUrls.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Expire decks cron error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expired decks' },
      { status: 500 }
    );
  }
}
