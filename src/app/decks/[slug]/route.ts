import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);
  const debug = req.nextUrl.searchParams.get('debug') === 'true';

  if (!deck || !deck.deckUrl) {
    return NextResponse.json({
      error: 'Deck not found',
      slug,
      deckFound: !!deck,
      hasUrl: deck ? !!deck.deckUrl : false,
    }, { status: 404 });
  }

  // Debug: Log what URL we're fetching
  console.log(`Fetching deck ${slug} from ${deck.deckUrl}`);

  // Proxy the deck HTML from Vercel Blob
  try {
    // Add timestamp to bust any caching
    const fetchUrl = `${deck.deckUrl}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    const html = await response.text();

    if (debug) {
      return NextResponse.json({
        slug,
        deckUrl: deck.deckUrl,
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500),
        containsNewPrograms: html.includes('Child &amp; Family Advocacy'),
      });
    }

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
