import puppeteer, { Browser } from 'puppeteer';

export interface LogoResult {
  logoUrl: string | null;
  logoSource: string;
  headerBgColor: string | null;
  detectedFonts: { heading: string | null; body: string | null };
}

// Wrapper to enforce hard timeout on any async operation
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function discoverLogo(url: string, domain: string): Promise<LogoResult> {
  let logoUrl: string | null = null;
  let logoSource = 'none';
  let headerBgColor: string | null = null;
  let detectedFonts: { heading: string | null; body: string | null } = { heading: null, body: null };

  // Method 1: Try Apistemic API first - require at least 2KB for a real logo
  const apistemicUrl = `https://logos-api.apistemic.com/domain:${domain}`;
  try {
    const res = await fetch(apistemicUrl, { signal: AbortSignal.timeout(8000) });
    const buf = await res.arrayBuffer();
    console.log('[Logo Discovery] Apistemic response size:', buf.byteLength, 'bytes');
    if (buf.byteLength > 2000) {
      logoUrl = apistemicUrl;
      logoSource = 'apistemic';
      console.log('[Logo Discovery] Using Apistemic logo');
    } else {
      console.log('[Logo Discovery] Apistemic logo too small, skipping');
    }
  } catch (e) {
    console.log('[Logo Discovery] Apistemic error:', e instanceof Error ? e.message : 'unknown');
  }

  // Method 2: DOM scrape - get header color, fonts, and potentially better logo
  // Hard timeout of 20s to prevent hanging on slow sites (like Wix)
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    });
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      // Use domcontentloaded instead of networkidle2 - much faster on JS-heavy sites
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      // Give a brief moment for initial JS to execute
      await new Promise(r => setTimeout(r, 1500));

      // Wrap evaluate in timeout to prevent hanging
      // Use string-based evaluate to avoid esbuild __name injection issues
      const result = await withTimeout(page.evaluate(`
        (function() {
          function rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
          }

          function parseRgb(bg) {
            var match = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
            if (match) {
              return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] !== undefined ? Number(match[4]) : 1 };
            }
            return null;
          }

          function isTransparent(bg) {
            var parsed = parseRgb(bg);
            if (!parsed) return true;
            return parsed.a === 0 || (parsed.r === 0 && parsed.g === 0 && parsed.b === 0 && bg.includes('rgba'));
          }

          var headerBg = null;
          var headerIsTransparent = true;

          var headerSelectors = ['header', '.header', 'nav', '.navbar', '.fl-page-header', '[role="banner"]'];
          for (var i = 0; i < headerSelectors.length; i++) {
            var el = document.querySelector(headerSelectors[i]);
            if (el) {
              var style = window.getComputedStyle(el);
              var bg = style.backgroundColor;
              if (!isTransparent(bg)) {
                var parsed = parseRgb(bg);
                if (parsed) {
                  headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                  headerIsTransparent = false;
                  break;
                }
              }
            }
          }

          if (headerIsTransparent) {
            var containers = document.querySelectorAll('header > div, .header > div, nav > div, [role="banner"] > div');
            for (var j = 0; j < containers.length; j++) {
              var style = window.getComputedStyle(containers[j]);
              var bg = style.backgroundColor;
              if (!isTransparent(bg)) {
                var parsed = parseRgb(bg);
                if (parsed && (parsed.r > 0 || parsed.g > 0 || parsed.b > 0)) {
                  headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                  headerIsTransparent = false;
                  break;
                }
              }
            }
          }

          if (headerIsTransparent) {
            var heroSelectors = ['.hero', '.banner', '[class*="hero"]', '[class*="banner"]', 'main > section:first-child', 'main > div:first-child', '#hero', '.home-hero', '.site-hero'];
            for (var k = 0; k < heroSelectors.length; k++) {
              var el = document.querySelector(heroSelectors[k]);
              if (el) {
                var style = window.getComputedStyle(el);
                var bg = style.backgroundColor;
                if (!isTransparent(bg)) {
                  var parsed = parseRgb(bg);
                  if (parsed) {
                    headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                    break;
                  }
                }
                if (style.backgroundImage && style.backgroundImage !== 'none') {
                  headerBg = '#333333';
                  break;
                }
              }
            }
          }

          if (headerIsTransparent && !headerBg) {
            var bodyStyle = window.getComputedStyle(document.body);
            var bg = bodyStyle.backgroundColor;
            if (!isTransparent(bg)) {
              var parsed = parseRgb(bg);
              if (parsed) {
                headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
              }
            }
          }

          if (!headerBg) {
            headerBg = '#ffffff';
          }

          function extractFont(el) {
            if (!el) return null;
            var style = window.getComputedStyle(el);
            var fontFamily = style.fontFamily;
            if (!fontFamily) return null;
            var firstFont = fontFamily.split(',')[0].trim().replace(/["']/g, '');
            var generics = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'blinkmacystemfont'];
            if (generics.indexOf(firstFont.toLowerCase()) !== -1) return null;
            return firstFont;
          }

          var headingFont = null;
          var bodyFont = null;

          var headingSelectors = ['h1', 'h2', '.hero h1', '.hero h2', 'header h1', '[class*="heading"]', '[class*="title"]'];
          for (var m = 0; m < headingSelectors.length; m++) {
            var el = document.querySelector(headingSelectors[m]);
            var font = extractFont(el);
            if (font) { headingFont = font; break; }
          }

          var bodySelectors = ['p', 'body', 'main p', 'article p', '.content p'];
          for (var n = 0; n < bodySelectors.length; n++) {
            var el = document.querySelector(bodySelectors[n]);
            var font = extractFont(el);
            if (font) { bodyFont = font; break; }
          }

          var svgSelectors = ['a[href="/"] svg, a[href*="home"] svg', '[class*="logo"] svg, #logo svg, .site-logo svg', 'header svg:first-of-type, nav svg:first-of-type'];
          for (var p = 0; p < svgSelectors.length; p++) {
            var svgs = document.querySelectorAll(svgSelectors[p]);
            for (var q = 0; q < svgs.length; q++) {
              var rect = svgs[q].getBoundingClientRect();
              if (rect.width >= 40 && rect.height >= 20 && rect.width <= 400) {
                // Check viewBox - skip tiny icon SVGs (hamburger menus, arrows, etc.)
                var vb = svgs[q].getAttribute('viewBox');
                if (vb) {
                  var vbParts = vb.trim().split(/[\s,]+/);
                  var vbW = parseFloat(vbParts[2]) || 0;
                  var vbH = parseFloat(vbParts[3]) || 0;
                  if (vbW > 0 && vbH > 0 && vbW < 40 && vbH < 40) continue;
                }
                var serializer = new XMLSerializer();
                var svgString = serializer.serializeToString(svgs[q]);
                // Skip simple icon SVGs (real logos are typically 1KB+)
                if (svgString.length < 1000) continue;
                var encodedSvg = encodeURIComponent(svgString);
                return { logoUrl: 'data:image/svg+xml,' + encodedSvg, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
              }
            }
          }

          var imgSelectors = [
            'img[alt*="boys" i][alt*="girls" i], img[alt*="bgc" i]',
            'img.custom-logo, .custom-logo-link img, .site-branding img',
            'img[src*="logo" i]',
            'img[alt*="logo" i]',
            'img[class*="logo" i]',
            '#logo img, .logo img, [id*="logo" i] img',
            'a[href="/"] img, a[href*="home"] img',
            'header a img, .header a img, nav a:first-child img',
            '[class*="logo" i] img, .site-logo img, .navbar-brand img',
            'header img, nav img, .header img, .navbar img'
          ];

          // Helper to convert relative URL to absolute
          function toAbsoluteUrl(url) {
            if (!url || url.indexOf('data:') === 0) return url;
            if (url.indexOf('http') === 0 || url.indexOf('//') === 0) return url;
            var a = document.createElement('a');
            a.href = url;
            return a.href;
          }

          for (var r = 0; r < imgSelectors.length; r++) {
            var els = document.querySelectorAll(imgSelectors[r]);
            for (var s = 0; s < els.length; s++) {
              var img = els[s];
              var src = img.src || img.dataset.src || img.dataset.lazySrc || img.getAttribute('data-lazy-src');
              if (!src) continue;

              var srcset = img.srcset || img.getAttribute('data-srcset');
              if (srcset) {
                var sources = srcset.split(',').map(function(str) {
                  var parts = str.trim().split(/\\s+/);
                  var w = parts[1] ? parseInt(parts[1].replace('w', ''), 10) : 0;
                  return { url: parts[0], width: w };
                }).filter(function(x) { return x.url && x.url.indexOf('data:image') === -1; });
                var best = sources.filter(function(x) { return x.width <= 1200 && x.width > 0; }).sort(function(a,b) { return b.width - a.width; })[0];
                if (best) src = best.url;
              }

              // Convert relative URLs to absolute
              src = toAbsoluteUrl(src);

              var srcLower = src.toLowerCase();
              var skip = ['data:image/gif', '1x1', 'pixel', 'spacer', 'blank', 'tracking', 'spinner'];
              var banner = ['banner', 'alert', 'promo', 'hero', 'slide', 'carousel', 'background'];
              var shouldSkip = false;
              for (var t = 0; t < skip.length; t++) { if (srcLower.indexOf(skip[t]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              for (var u = 0; u < banner.length; u++) { if (srcLower.indexOf(banner[u]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              if (img.naturalWidth > 0 && img.naturalWidth < 30) continue;
              return { logoUrl: src, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
            }
          }

          return { logoUrl: null, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
        })()
      `) as Promise<{ logoUrl: string | null; headerBg: string | null; headingFont: string | null; bodyFont: string | null }>, 8000, { logoUrl: null as string | null, headerBg: '#ffffff', headingFont: null as string | null, bodyFont: null as string | null });

      headerBgColor = result.headerBg;
      detectedFonts = { heading: result.headingFont, body: result.bodyFont };

      // Prefer scraped logo over apistemic if found
      if (result.logoUrl) {
        logoUrl = result.logoUrl;
        logoSource = 'scraper';
        console.log('[Logo Discovery] Found via DOM scrape:', logoUrl?.substring(0, 100));
      } else {
        console.log('[Logo Discovery] DOM scrape found no logo');
      }
    } finally {
      await page.close().catch(() => {});
    }
  } catch (e) {
    console.log('[Logo Discovery] DOM scrape error:', e instanceof Error ? e.message : 'unknown');
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // Method 3: Try common high-res icon paths (better than Google favicon)
  if (!logoUrl) {
    const iconPaths = [
      `/apple-touch-icon.png`,
      `/apple-touch-icon-precomposed.png`,
      `/apple-touch-icon-180x180.png`,
      `/favicon-192x192.png`,
      `/android-chrome-192x192.png`,
    ];
    for (const path of iconPaths) {
      try {
        const iconUrl = `https://${domain}${path}`;
        const res = await fetch(iconUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const contentLength = res.headers.get('content-length');
          // Only use if it's a decent size (>5KB suggests a real icon, not a tiny placeholder)
          if (contentLength && parseInt(contentLength) > 5000) {
            logoUrl = iconUrl;
            logoSource = 'apple-touch-icon';
            console.log('[Logo Discovery] Found apple-touch-icon:', iconUrl);
            break;
          }
        }
      } catch {
        // Continue to next path
      }
    }
  }

  // Method 4: Google favicon as absolute last resort
  if (!logoUrl) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const res = await fetch(faviconUrl);
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 500) {
        logoUrl = faviconUrl;
        logoSource = 'google-favicon';
        console.log('[Logo Discovery] Using Google favicon as fallback');
      }
    } catch {}
  }

  return { logoUrl, logoSource, headerBgColor, detectedFonts };
}
