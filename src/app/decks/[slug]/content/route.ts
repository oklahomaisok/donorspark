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
 * Inject preview mode: popup modal that appears when user reaches the last slide
 */
function injectPreviewMode(html: string, claimUrl: string, expiresAt: string): string {
  const popupHtml = `
    <!-- Preview Mode Popup -->
    <div id="preview-popup" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:1rem;">
      <div style="background:white;border-radius:1rem;max-width:400px;width:100%;padding:2rem;text-align:center;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);animation:popupIn 0.3s ease-out;">
        <button onclick="document.getElementById('preview-popup').style.display='none'" style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;padding:0.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#C15A36,#E07A50);border-radius:50%;margin:0 auto 1.5rem;display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;margin-bottom:0.5rem;font-family:system-ui,sans-serif;">Love Your Deck?</h2>
        <p style="color:#666;margin-bottom:1rem;font-size:0.95rem;font-family:system-ui,sans-serif;">This preview expires in:</p>
        <div id="countdown-timer" data-expires="${expiresAt}" style="font-size:2.5rem;font-weight:700;font-family:ui-monospace,monospace;background:linear-gradient(135deg,#C15A36,#E07A50);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem;">--:--:--</div>
        <p style="color:#888;font-size:0.875rem;margin-bottom:1.5rem;font-family:system-ui,sans-serif;">Create a free account to save & share it forever</p>
        <a href="${claimUrl}" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 1.75rem;background:linear-gradient(135deg,#C15A36,#E07A50);color:white;border-radius:9999px;font-weight:600;font-size:0.95rem;text-decoration:none;box-shadow:0 4px 14px rgba(193,90,54,0.4);transition:transform 0.2s,box-shadow 0.2s;font-family:system-ui,sans-serif;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 20px rgba(193,90,54,0.5)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 14px rgba(193,90,54,0.4)'">
          Create Free Account
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    </div>
    <style>
      @keyframes popupIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    </style>`;

  const popupScript = `
    <script>
    (function() {
      var popup = document.getElementById('preview-popup');
      var timer = document.getElementById('countdown-timer');
      var shown = false;

      // Countdown timer
      if (timer) {
        var expires = timer.dataset.expires;
        if (expires) {
          var expiryTime = new Date(expires).getTime();
          function updateTimer() {
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
          updateTimer();
          setInterval(updateTimer, 1000);
        }
      }

      // Show popup when reaching last slide
      function checkLastSlide() {
        if (shown) return;
        var container = document.getElementById('slider');
        if (!container) return;
        var scrollLeft = container.scrollLeft;
        var maxScroll = container.scrollWidth - container.clientWidth;
        // Show when scrolled 85% or more to the end
        if (scrollLeft >= maxScroll * 0.85 && maxScroll > 0) {
          shown = true;
          popup.style.display = 'flex';
        }
      }

      var container = document.getElementById('slider');
      if (container) {
        container.addEventListener('scroll', checkLastSlide);
        // Also check after a delay in case user is already at the end
        setTimeout(checkLastSlide, 1000);
      }

      // Close on backdrop click
      popup.addEventListener('click', function(e) {
        if (e.target === popup) {
          popup.style.display = 'none';
        }
      });
    })();
    </script>`;

  // Inject popup HTML before closing body tag
  html = html.replace('</body>', popupHtml + popupScript + '</body>');

  return html;
}
