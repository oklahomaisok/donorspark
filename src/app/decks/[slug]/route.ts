import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug, getOrganizationById } from '@/db/queries';
import { config } from '@/lib/config';
import { generateDeckToken } from '@/lib/deck-token';

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

  if (!deck) {
    return NextResponse.json({
      error: 'Deck not found',
      slug,
    }, { status: 404 });
  }

  // Check if deck is expired (anonymous + past expiration)
  if (deck.isExpired || (deck.expiresAt && !deck.userId && new Date(deck.expiresAt) < new Date())) {
    return new NextResponse(generateExpiredPage(deck.orgName), {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  // If deck is claimed (has userId and organizationId), redirect to new URL structure
  if (deck.userId && deck.organizationId) {
    const org = await getOrganizationById(deck.organizationId);
    if (org) {
      // Redirect to new /s/[orgSlug] URL
      const newUrl = `${config.siteUrl}/s/${org.slug}`;
      return NextResponse.redirect(newUrl, 301);
    }
  }

  if (!deck.deckUrl) {
    return NextResponse.json({
      error: 'Deck not ready',
      slug,
      status: deck.status,
    }, { status: 202 });
  }

  if (debug) {
    return NextResponse.json({
      slug,
      deckUrl: deck.deckUrl,
      isAnonymous: !deck.userId,
      tempToken: deck.tempToken ? '[present]' : null,
      expiresAt: deck.expiresAt,
    });
  }

  // Generate a short-lived token for content access
  const token = generateDeckToken(slug);

  // For anonymous decks, pass preview mode params
  const isAnonymous = !deck.userId;
  let contentUrl = `${config.siteUrl}/decks/${slug}/content?token=${token}`;

  if (isAnonymous && deck.tempToken && deck.expiresAt) {
    const claimUrl = encodeURIComponent(`${config.siteUrl}/claim/${deck.tempToken}`);
    const expiresAt = new Date(deck.expiresAt).toISOString();
    contentUrl += `&preview=true&claimUrl=${claimUrl}&expires=${expiresAt}`;
  }

  // Serve iframe wrapper page
  const wrapperHtml = generateIframeWrapper(deck.orgName, contentUrl);

  return new NextResponse(wrapperHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Generate iframe wrapper page that loads deck content
 */
function generateIframeWrapper(orgName: string, contentUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${escapeHtml(orgName)} | Impact Deck</title>
    <meta name="robots" content="noindex, nofollow">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
        iframe { width: 100%; height: 100%; border: none; display: block; }
    </style>
</head>
<body>
    <iframe src="${contentUrl}"
            title="${escapeHtml(orgName)} Impact Deck"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            loading="eager"
            referrerpolicy="no-referrer"></iframe>
    <script>
        // Prevent iframe URL inspection via dev tools console
        Object.defineProperty(document.querySelector('iframe'), 'src', {
            get: function() { return 'about:blank'; },
            configurable: false
        });
    </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate a page for expired decks
 */
function generateExpiredPage(orgName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deck Expired | DonorSpark</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="min-h-screen bg-neutral-50 flex items-center justify-center p-4" style="font-family: 'Outfit', sans-serif;">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-neutral-800 mb-2">Deck Expired</h1>
        <p class="text-neutral-500 mb-6">
            The preview deck for <strong>${orgName}</strong> has expired after 48 hours.
        </p>
        <a href="/" class="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full font-semibold hover:bg-[#a84d2e] transition-colors">
            Generate a New Deck
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <p class="text-sm text-neutral-400 mt-6">
            Create a free account to save your decks permanently.
        </p>
    </div>
</body>
</html>`;
}
