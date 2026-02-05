import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';

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
    const response = await fetch(deck.deckUrl);
    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 502 });
  }
}
