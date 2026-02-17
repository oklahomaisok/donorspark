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

// Follow redirects to get the final URL (handles 301/302 redirects)
async function resolveRedirects(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    // res.url contains the final URL after all redirects
    if (res.ok && res.url !== url) {
      console.log('[Logo Discovery] URL redirected:', url.substring(0, 60), '->', res.url.substring(0, 60));
      return res.url;
    }
    return url;
  } catch (e) {
    console.log('[Logo Discovery] Redirect check failed:', e instanceof Error ? e.message : 'unknown');
    return url;
  }
}

// Validate that a URL is likely an image (not a webpage)
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Data URIs for images are always valid
  if (url.startsWith('data:image/')) return true;

  const urlLower = url.toLowerCase();

  // Check for common image extensions
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif'];
  if (imageExtensions.some(ext => urlLower.includes(ext))) return true;

  // Check for image-related paths (CDNs, asset directories)
  const imagePaths = ['/images/', '/img/', '/logo', '/assets/', '/static/', '/media/', '/uploads/',
                      'cloudinary', 'imgix', 'cloudfront', 'wixstatic', 'squarespace', 'shopify'];
  if (imagePaths.some(path => urlLower.includes(path))) return true;

  // Check for common image CDN domains
  const imageCdns = ['logos-api.apistemic.com', 'favicon', 'icon'];
  if (imageCdns.some(cdn => urlLower.includes(cdn))) return true;

  // If URL is just a domain/homepage (no path or just /), it's NOT an image
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (path === '/' || path === '') {
      console.log('[Logo Discovery] Rejecting URL as homepage:', url.substring(0, 80));
      return false;
    }
  } catch {
    // If URL parsing fails, be conservative and reject
    return false;
  }

  // For other URLs, accept them (might be API endpoints that serve images)
  return true;
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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
                // Skip third-party SVG logos
                var svgLower = svgString.toLowerCase();
                var thirdPartySvg = ['superpath', 'hubspot', 'mailchimp', 'intercom', 'drift', 'crisp', 'zendesk', 'calendly', 'typeform'];
                var skipSvg = false;
                for (var tp = 0; tp < thirdPartySvg.length; tp++) { if (svgLower.indexOf(thirdPartySvg[tp]) !== -1) { skipSvg = true; break; } }
                if (skipSvg) continue;
                var encodedSvg = encodeURIComponent(svgString);
                return { logoUrl: 'data:image/svg+xml,' + encodedSvg, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
              }
            }
          }

          var imgSelectors = [
            'img[alt*="boys" i][alt*="girls" i], img[alt*="bgc" i]',
            'img.custom-logo, .custom-logo-link img, .site-branding img',
            'a[href="/"] img, a[href*="home"] img',
            'header a img, .header a img, nav a:first-child img',
            '[class*="logo" i] img, .site-logo img, .navbar-brand img',
            '#logo img, .logo img, [id*="logo" i] img',
            'img[src*="logo" i]',
            'img[alt*="logo" i]',
            'img[class*="logo" i]',
            'header img, nav img, .header img, .navbar img'
          ];

          // Get the current site's domain for validation
          var siteDomain = window.location.hostname.replace(/^www\\./, '');

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

              // First try srcset - often has full CDN URLs (e.g., Wix sites)
              var srcset = img.srcset || img.getAttribute('data-srcset');
              var src = null;
              if (srcset) {
                // Parse srcset properly - URLs can contain commas (like Wix CDN URLs)
                // Format: "url1 descriptor1, url2 descriptor2" where descriptor is like "1x" or "152w"
                // Use regex to match: URL followed by whitespace and descriptor
                var sources = [];
                var srcsetRegex = /(https?:\\/\\/[^\\s]+)\\s+(\\d+(?:\\.\\d+)?[wx])/g;
                var match;
                while ((match = srcsetRegex.exec(srcset)) !== null) {
                  var url = match[1];
                  var descriptor = match[2];
                  var w = 0;
                  if (descriptor.indexOf('w') !== -1) {
                    w = parseInt(descriptor.replace('w', ''), 10) || 0;
                  } else if (descriptor.indexOf('x') !== -1) {
                    var density = parseFloat(descriptor.replace('x', '')) || 1;
                    w = Math.round(density * 200);
                  }
                  if (url.indexOf('data:image') === -1) {
                    sources.push({ url: url, width: w });
                  }
                }
                // Sort by width descending and pick the best one under 1200px, or just the first
                var best = sources.filter(function(x) { return x.width <= 1200; }).sort(function(a,b) { return b.width - a.width; })[0] || sources[0];
                if (best) src = best.url;
              }

              // Fall back to src or data attributes
              if (!src) {
                src = img.src || img.dataset.src || img.dataset.lazySrc || img.getAttribute('data-lazy-src');
              }
              if (!src) continue;

              // Convert relative URLs to absolute
              src = toAbsoluteUrl(src);

              var srcLower = src.toLowerCase();
              var skip = ['data:image/gif', '1x1', 'pixel', 'spacer', 'blank', 'tracking', 'spinner'];
              var banner = ['banner', 'alert', 'promo', 'hero', 'slide', 'carousel', 'background'];
              var badges = ['badge', 'award', 'usnews', 'ranking', 'seal', 'best-', 'top-', 'accredit', 'certif', 'rated', 'winner'];
              var thirdParty = ['superpath', 'hubspot', 'mailchimp', 'constant-contact', 'salesforce', 'zendesk', 'intercom', 'drift', 'crisp', 'tawk', 'livechat', 'freshdesk', 'helpscout', 'calendly', 'typeform', 'jotform', 'formstack', 'wufoo', 'cognito', 'auth0', 'okta', 'stripe', 'paypal', 'square', 'classy', 'bloomerang', 'blackbaud', 'neon', 'givebutter', 'donorbox', 'networkforgood', 'double-the-donation', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat'];
              var shouldSkip = false;
              for (var t = 0; t < skip.length; t++) { if (srcLower.indexOf(skip[t]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              for (var u = 0; u < banner.length; u++) { if (srcLower.indexOf(banner[u]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              for (var v = 0; v < badges.length; v++) { if (srcLower.indexOf(badges[v]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              // Also check alt text for badge-related keywords
              var altText = (img.alt || '').toLowerCase();
              for (var w = 0; w < badges.length; w++) { if (altText.indexOf(badges[w]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              for (var x = 0; x < thirdParty.length; x++) { if (srcLower.indexOf(thirdParty[x]) !== -1) { shouldSkip = true; break; } }
              if (shouldSkip) continue;
              if (img.naturalWidth > 0 && img.naturalWidth < 30) continue;

              // Skip third-party logos (domain doesn't match site or common CDNs)
              try {
                var imgUrl = new URL(src);
                var imgDomain = imgUrl.hostname.replace(/^www\\./, '');
                var allowedCdns = ['cloudinary', 'imgix', 'cloudfront', 'amazonaws', 'squarespace', 'wixstatic', 'shopify', 'wordpress', 'wp.com', 'gravatar'];
                var isOwnDomain = imgDomain.indexOf(siteDomain) !== -1 || siteDomain.indexOf(imgDomain.split('.').slice(-2).join('.')) !== -1;
                var isCdn = allowedCdns.some(function(cdn) { return imgDomain.indexOf(cdn) !== -1; });
                if (!isOwnDomain && !isCdn && imgDomain !== siteDomain) {
                  continue; // Skip third-party logos
                }
              } catch (e) {
                // If URL parsing fails, allow it (might be relative URL)
              }

              return { logoUrl: src, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
            }
          }

          return { logoUrl: null, headerBg: headerBg, headingFont: headingFont, bodyFont: bodyFont };
        })()
      `) as Promise<{ logoUrl: string | null; headerBg: string | null; headingFont: string | null; bodyFont: string | null }>, 8000, { logoUrl: null as string | null, headerBg: '#ffffff', headingFont: null as string | null, bodyFont: null as string | null });

      headerBgColor = result.headerBg;
      detectedFonts = { heading: result.headingFont, body: result.bodyFont };

      // Prefer scraped logo over apistemic if found AND it's a valid image URL
      if (result.logoUrl) {
        // Validate the URL is actually an image (not a webpage)
        if (isValidImageUrl(result.logoUrl)) {
          // Resolve any redirects to get the final URL
          const resolvedUrl = await resolveRedirects(result.logoUrl);
          // Re-validate after redirect resolution (might have redirected to homepage)
          if (isValidImageUrl(resolvedUrl)) {
            logoUrl = resolvedUrl;
            logoSource = 'scraper';
            console.log('[Logo Discovery] Found via DOM scrape:', logoUrl?.substring(0, 100));
          } else {
            console.log('[Logo Discovery] Scraped URL redirected to non-image, keeping Apistemic');
          }
        } else {
          console.log('[Logo Discovery] Scraped URL is not a valid image URL:', result.logoUrl.substring(0, 80));
          // Keep the Apistemic logo if we have one
        }
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
