import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug, getOrganizationById } from '@/db/queries';
import { config } from '@/lib/config';

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
    let html = await response.text();

    // For anonymous decks (no userId), inject preview mode
    const isAnonymous = !deck.userId;
    if (isAnonymous && deck.tempToken) {
      const claimUrl = `${config.siteUrl}/claim/${deck.tempToken}`;
      const expiresAt = deck.expiresAt ? new Date(deck.expiresAt).toISOString() : null;
      html = injectPreviewMode(html, claimUrl, expiresAt);
    }

    if (debug) {
      return NextResponse.json({
        slug,
        deckUrl: deck.deckUrl,
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500),
        isAnonymous,
        tempToken: deck.tempToken ? '[present]' : null,
        expiresAt: deck.expiresAt,
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

/**
 * Inject preview mode: full-width countdown banner on CTA slide (replaces share buttons)
 */
function injectPreviewMode(html: string, claimUrl: string, expiresAt: string | null): string {
  // Replace share buttons on CTA slide with full-width countdown banner
  const shareButtonsPattern = /<p class="text-xs text-neutral-400 uppercase tracking-widest mb-3">Share This Story<\/p>\s*<div class="flex items-center gap-3">[\s\S]*?<\/div>/;

  const countdownBanner = `
                    <!-- Full-width countdown banner on CTA slide -->
                    <div class="w-[calc(100%+3rem)] md:w-[calc(100%+5rem)] -mx-6 md:-mx-10 mt-4 px-6 py-5 bg-gradient-to-r from-[#C15A36] to-[#E07A50] text-white text-center">
                        <div class="text-white/80 text-xs uppercase tracking-widest mb-1">This Slide Deck Expires In</div>
                        <div id="countdown-timer" class="text-white text-2xl md:text-3xl font-mono font-bold mb-2" data-expires="${expiresAt || ''}">--:--:--</div>
                        <div class="text-white text-sm font-medium mb-3">Want to Save & Share It?</div>
                        <a href="${claimUrl}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#C15A36] rounded-full text-sm font-bold hover:bg-neutral-100 transition-all shadow-lg hover:scale-105">
                            Create Your Free Account
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                    </div>`;

  html = html.replace(shareButtonsPattern, countdownBanner);

  // Inject countdown timer script before </body>
  const countdownScript = `
    <script>
    (function() {
        var timer = document.getElementById('countdown-timer');
        if (!timer) return;
        var expires = timer.dataset.expires;
        if (!expires) return;
        var expiryTime = new Date(expires).getTime();
        function update() {
            var now = Date.now();
            var diff = expiryTime - now;
            if (diff <= 0) {
                timer.textContent = '00:00:00';
                return;
            }
            var hours = Math.floor(diff / (1000 * 60 * 60));
            var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timer.textContent =
                hours.toString().padStart(2, '0') + ':' +
                minutes.toString().padStart(2, '0') + ':' +
                seconds.toString().padStart(2, '0');
        }
        update();
        setInterval(update, 1000);
    })();
    </script>`;

  html = html.replace('</body>', countdownScript + '</body>');

  return html;
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
