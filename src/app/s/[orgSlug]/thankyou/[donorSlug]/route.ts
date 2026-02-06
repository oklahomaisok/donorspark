import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug, getOrganizationDecks, incrementDeckViews } from '@/db/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; donorSlug: string }> }
) {
  const { orgSlug, donorSlug } = await params;
  const debug = req.nextUrl.searchParams.get('debug') === 'true';

  // Find organization by slug
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    return NextResponse.json({
      error: 'Organization not found',
      orgSlug,
    }, { status: 404 });
  }

  // Get the organization's personalized thank-you deck for this donor
  const decks = await getOrganizationDecks(org.id);
  const donorDeck = decks.find(
    d => d.deckType === 'thankyou' && d.donorSlug === donorSlug && d.status === 'complete'
  );

  if (!donorDeck || !donorDeck.deckUrl) {
    // Fall back to generic thank-you deck if exists
    const genericThankYou = decks.find(d => d.deckType === 'thankyou' && !d.donorSlug && d.status === 'complete');

    if (!genericThankYou || !genericThankYou.deckUrl) {
      return NextResponse.json({
        error: 'Personalized deck not found',
        orgSlug,
        donorSlug,
      }, { status: 404 });
    }

    // Serve generic with donor name injected
    // For now, just serve as-is (personalization will be handled by template)
    return serveDeck(genericThankYou.deckUrl, genericThankYou.slug);
  }

  // Track view
  await incrementDeckViews(donorDeck.slug);

  if (debug) {
    return NextResponse.json({
      orgSlug,
      donorSlug,
      orgId: org.id,
      orgName: org.name,
      deckId: donorDeck.id,
      deckSlug: donorDeck.slug,
      deckUrl: donorDeck.deckUrl,
      donorName: donorDeck.donorName,
      donorAmount: donorDeck.donorAmount,
    });
  }

  return serveDeck(donorDeck.deckUrl, donorDeck.slug);
}

async function serveDeck(deckUrl: string, slug: string) {
  try {
    const fetchUrl = `${deckUrl}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
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
