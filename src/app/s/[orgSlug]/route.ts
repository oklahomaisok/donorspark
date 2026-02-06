import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug, getOrganizationDecks, incrementDeckViews } from '@/db/queries';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const debug = req.nextUrl.searchParams.get('debug') === 'true';
  const claimed = req.nextUrl.searchParams.get('claimed') === 'true';

  // Find organization by slug
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    return NextResponse.json({
      error: 'Organization not found',
      slug: orgSlug,
    }, { status: 404 });
  }

  // Get the organization's decks (primary impact deck)
  const decks = await getOrganizationDecks(org.id);
  const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete') || decks[0];

  if (!primaryDeck || !primaryDeck.deckUrl) {
    return NextResponse.json({
      error: 'No deck found for this organization',
      orgSlug,
    }, { status: 404 });
  }

  // Track view
  await incrementDeckViews(primaryDeck.slug);

  if (debug) {
    return NextResponse.json({
      orgSlug,
      orgId: org.id,
      orgName: org.name,
      deckId: primaryDeck.id,
      deckSlug: primaryDeck.slug,
      deckUrl: primaryDeck.deckUrl,
      claimed,
    });
  }

  // Fetch deck HTML from Vercel Blob
  try {
    const fetchUrl = `${primaryDeck.deckUrl}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    let html = await response.text();

    // If just claimed, inject a success toast
    if (claimed) {
      html = injectClaimSuccessToast(html, org.name);
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

/**
 * Inject a success toast when deck has just been claimed
 */
function injectClaimSuccessToast(html: string, orgName: string): string {
  const toast = `
    <div id="claim-toast" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 60; background: #16A34A; color: white; padding: 12px 24px; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; animation: slideDown 0.3s ease-out, fadeOut 0.3s ease-out 3.7s forwards;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span style="font-weight: 600;">Deck claimed! Welcome to DonorSpark</span>
    </div>
    <style>
        @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
    </style>
    <script>setTimeout(() => document.getElementById('claim-toast')?.remove(), 4000);</script>
  `;

  return html.replace('</body>', `${toast}</body>`);
}
