import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';
import { validateDeckToken } from '@/lib/deck-token';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get('token');
  const isPreview = req.nextUrl.searchParams.get('preview') === 'true';
  const expiresAt = req.nextUrl.searchParams.get('expires');
  const claimUrl = req.nextUrl.searchParams.get('claimUrl');

  // Require valid token
  if (!token || !validateDeckToken(token, slug)) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Access Denied</title></head>
       <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;">
         <div style="text-align:center;padding:2rem;">
           <h1 style="color:#333;margin-bottom:0.5rem;">Access Denied</h1>
           <p style="color:#666;">This content cannot be accessed directly.</p>
         </div>
       </body></html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  const deck = await getDeckBySlug(slug);

  if (!deck || !deck.deckUrl) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  // Fetch deck HTML from Vercel Blob
  try {
    const fetchUrl = `${deck.deckUrl}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    let html = await response.text();

    // Inject preview mode for anonymous decks
    if (isPreview && claimUrl && expiresAt) {
      html = injectPreviewMode(html, decodeURIComponent(claimUrl), expiresAt);
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 502 });
  }
}

/**
 * Inject preview mode: full-width countdown banner on CTA slide (replaces share buttons)
 */
function injectPreviewMode(html: string, claimUrl: string, expiresAt: string): string {
  // Pattern matches the share buttons section - flexible whitespace matching
  // Structure: <div class="mb-4"><p>Share This Story</p> ... <div class="flex...gap-3">...</div></div>
  const shareButtonsPattern = /<div class="mb-4">\s*<p class="text-xs text-neutral-400 uppercase tracking-widest mb-3">Share This Story<\/p>\s*<div class="flex[^"]*gap-3">[\s\S]*?<\/div>\s*<\/div>/;

  const countdownBanner = `
                    <!-- Full-width countdown banner on CTA slide -->
                    <div class="w-[calc(100%+3rem)] md:w-[calc(100%+5rem)] -mx-6 md:-mx-10 mt-4 px-6 py-5 bg-gradient-to-r from-[#C15A36] to-[#E07A50] text-white text-center">
                        <div class="text-white/80 text-xs uppercase tracking-widest mb-1">This Slide Deck Expires In</div>
                        <div id="countdown-timer" class="text-white text-2xl md:text-3xl font-mono font-bold mb-2" data-expires="${expiresAt}">--:--:--</div>
                        <div class="text-white text-sm font-medium mb-3">Want to Save & Share It?</div>
                        <a href="${claimUrl}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#C15A36] rounded-full text-sm font-bold hover:bg-neutral-100 transition-all shadow-lg hover:scale-105">
                            Create Your Free Account
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                    </div>`;

  html = html.replace(shareButtonsPattern, countdownBanner);

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
