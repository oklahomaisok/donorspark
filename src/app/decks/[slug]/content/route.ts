import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';
import { validateDeckToken } from '@/lib/deck-token';
import { config } from '@/lib/config';
import { sanitizeUrl } from '@/lib/sanitize-url';

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
      const safeClaimUrl = sanitizeUrl(decodeURIComponent(claimUrl));
      if (safeClaimUrl) {
        html = injectPreviewMode(html, safeClaimUrl, expiresAt);
      }
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
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}

function injectPreviewMode(html: string, claimUrl: string, expiresAt: string): string {
  const safeClaimUrl = escAttr(claimUrl);
  const safeExpiresAt = escAttr(expiresAt);
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
        <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;margin-bottom:0.5rem;font-family:system-ui,sans-serif;">Keep Your Deck</h2>
        <p style="color:#666;margin-bottom:0.75rem;font-size:0.95rem;font-family:system-ui,sans-serif;">This preview expires tomorrow.</p>
        <div id="countdown-timer" data-expires="${safeExpiresAt}" style="font-size:1.25rem;font-weight:600;color:#888;font-family:ui-monospace,SFMono-Regular,monospace;margin-bottom:1.25rem;letter-spacing:0.05em;"></div>
        <p style="color:#888;font-size:0.875rem;margin-bottom:1.5rem;font-family:system-ui,sans-serif;">Create a free account to save it permanently.</p>
        <a href="${safeClaimUrl}" target="_top" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 1.75rem;background:linear-gradient(135deg,#C15A36,#E07A50);color:white;border-radius:9999px;font-weight:600;font-size:0.95rem;text-decoration:none;box-shadow:0 4px 14px rgba(193,90,54,0.4);transition:transform 0.2s,box-shadow 0.2s;font-family:system-ui,sans-serif;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 20px rgba(193,90,54,0.5)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 14px rgba(193,90,54,0.4)'">
          Save My Deck
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
      var bannerTimer = document.getElementById('banner-countdown');
      var shown = false;

      // Countdown timer function (updates both popup and banner timers)
      var expires = timer ? timer.dataset.expires : (bannerTimer ? bannerTimer.dataset.expires : null);
      if (expires) {
        var expiryTime = new Date(expires).getTime();
        function updateTimers() {
          var now = Date.now();
          var diff = expiryTime - now;
          var text = '00:00:00';
          if (diff > 0) {
            var hours = Math.floor(diff / (1000 * 60 * 60));
            var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((diff % (1000 * 60)) / 1000);
            text = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
          }
          if (timer) timer.textContent = text;
          if (bannerTimer) bannerTimer.textContent = text;
        }
        updateTimers();
        setInterval(updateTimers, 1000);
      }

      // Inject banner on CTA slide
      var ctaSlide = document.getElementById('slide-cta');
      if (ctaSlide) {
        var donateBtn = ctaSlide.querySelector('#ds-donate-btn');
        if (donateBtn && donateBtn.parentElement) {
          var banner = document.createElement('div');
          banner.innerHTML = \`
            <div style="margin-top:1.5rem;padding:1rem 1.25rem;background:linear-gradient(135deg,#C15A36,#E07A50);border-radius:0.75rem;text-align:center;">
              <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style="color:rgba(255,255,255,0.9);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;font-family:system-ui,sans-serif;">Preview expires tomorrow</span>
                <span id="banner-countdown" data-expires="${safeExpiresAt}" style="display:none;"></span>
              </div>
              <a href="${safeClaimUrl}" target="_top" style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;background:white;color:#C15A36;border-radius:9999px;font-weight:600;font-size:0.8rem;text-decoration:none;transition:transform 0.2s;font-family:system-ui,sans-serif;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Save My Deck
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
          \`;
          donateBtn.parentElement.appendChild(banner);
          // Update banner timer reference
          bannerTimer = document.getElementById('banner-countdown');
          if (bannerTimer && expires) {
            updateTimers();
          }
        }
      }

      // Show popup when reaching last slide
      function checkLastSlide() {
        if (shown) return;
        var container = document.getElementById('slider');
        if (!container) return;
        var scrollLeft = container.scrollLeft;
        var maxScroll = container.scrollWidth - container.clientWidth;
        // Show when scrolled 95% or more to the end (last slide)
        if (scrollLeft >= maxScroll * 0.95 && maxScroll > 0) {
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
