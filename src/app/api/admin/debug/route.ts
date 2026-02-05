import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks } from '@/db/schema';
import { eq, like } from 'drizzle-orm';
import { getDeckBySlug } from '@/db/queries';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'donorspark-admin-2024';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    // Return all decks
    const allDecks = await db.select({
      id: decks.id,
      slug: decks.slug,
      orgName: decks.orgName,
      deckUrl: decks.deckUrl,
      status: decks.status,
      createdAt: decks.createdAt,
    }).from(decks).limit(50);

    return NextResponse.json({ decks: allDecks });
  }

  // Search for deck using getDeckBySlug
  const deckFromFunction = await getDeckBySlug(slug);

  // Also search directly
  const directResult = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  const deckFromDirect = directResult[0];

  // Search with LIKE for partial matches
  const likeResults = await db.select({
    id: decks.id,
    slug: decks.slug,
    deckUrl: decks.deckUrl,
  }).from(decks).where(like(decks.slug, `%${slug}%`)).limit(10);

  return NextResponse.json({
    searchedSlug: slug,
    fromGetDeckBySlug: deckFromFunction ? {
      id: deckFromFunction.id,
      slug: deckFromFunction.slug,
      deckUrl: deckFromFunction.deckUrl,
      orgName: deckFromFunction.orgName,
    } : null,
    fromDirectQuery: deckFromDirect ? {
      id: deckFromDirect.id,
      slug: deckFromDirect.slug,
      deckUrl: deckFromDirect.deckUrl,
      orgName: deckFromDirect.orgName,
    } : null,
    partialMatches: likeResults,
  });
}
