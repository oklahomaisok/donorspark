import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import { uploadDeckHtml } from '@/lib/services/blob-storage';
import type { BrandData } from '@/lib/types';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'donorspark-admin-2024';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { slug, programs } = body;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Fetch deck from database
  const [deck] = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);

  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  if (!deck.brandData) {
    return NextResponse.json({ error: 'Deck has no brand data' }, { status: 400 });
  }

  // Update brand data with new programs
  const updatedBrandData: BrandData = {
    ...(deck.brandData as unknown as BrandData),
    programs: programs || (deck.brandData as unknown as BrandData).programs,
  };

  // Regenerate HTML
  const newHtml = generateDeckHtml(slug, updatedBrandData);

  // Upload to Blob
  const deckUrl = await uploadDeckHtml(slug, newHtml);

  // Update database
  await db.update(decks)
    .set({
      brandData: updatedBrandData as unknown as Record<string, unknown>,
      deckUrl,
      updatedAt: new Date(),
    })
    .where(eq(decks.slug, slug));

  return NextResponse.json({
    success: true,
    slug,
    deckUrl,
    programs: updatedBrandData.programs
  });
}
