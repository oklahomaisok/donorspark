import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrganizationBySlug, getOrganizationDecks, incrementDeckViews, getUserByClerkId } from '@/db/queries';
import { config } from '@/lib/config';
import { generateDeckToken } from '@/lib/deck-token';

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

  // Track view - exclude owner views
  const { userId: clerkId } = await auth();
  let isOwner = false;
  if (clerkId) {
    const user = await getUserByClerkId(clerkId);
    isOwner = user?.id === org.userId;
  }

  if (!isOwner) {
    await incrementDeckViews(primaryDeck.slug);
  }

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

  // Generate a short-lived token for content access
  const token = generateDeckToken(orgSlug);
  const contentUrl = `${config.siteUrl}/s/${orgSlug}/content?token=${token}`;

  // Serve iframe wrapper page
  const wrapperHtml = generateIframeWrapper(org.name, contentUrl, claimed);

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
function generateIframeWrapper(orgName: string, contentUrl: string, showClaimToast: boolean): string {
  const claimToast = showClaimToast ? `
    <div id="claim-toast" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 60; background: #16A34A; color: white; padding: 12px 24px; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; animation: slideDown 0.3s ease-out, fadeOut 0.3s ease-out 3.7s forwards;">
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
  ` : '';

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
    ${claimToast}
    <iframe src="${contentUrl}"
            title="${escapeHtml(orgName)} Impact Deck"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
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
