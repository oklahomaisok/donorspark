import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck || !deck.deckUrl) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  // Proxy the deck HTML from Vercel Blob
  try {
    const response = await fetch(deck.deckUrl, {
      cache: 'no-store',
    });
    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 502 });
  }
}
