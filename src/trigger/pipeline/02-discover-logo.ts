import puppeteer from 'puppeteer';

export interface LogoResult {
  logoUrl: string | null;
  logoSource: string;
  headerBgColor: string | null;
  detectedFonts: { heading: string | null; body: string | null };
}

export async function discoverLogo(url: string, domain: string): Promise<LogoResult> {
  let logoUrl: string | null = null;
  let logoSource = 'none';
  let headerBgColor: string | null = null;
  let detectedFonts: { heading: string | null; body: string | null } = { heading: null, body: null };

  // Method 1: Try Apistemic API first - require at least 2KB for a real logo
  const apistemicUrl = `https://logos-api.apistemic.com/domain:${domain}`;
  try {
    const res = await fetch(apistemicUrl);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2000) {
      logoUrl = apistemicUrl;
      logoSource = 'apistemic';
    }
  } catch {}

  // Method 2: DOM scrape - always run to get header color and potentially better logo
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      const result = await page.evaluate(() => {
        const rgbToHex = (r: number, g: number, b: number) =>
          '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        const parseRgb = (bg: string) => {
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            const [, r, g, b, a] = match;
            return { r: Number(r), g: Number(g), b: Number(b), a: a !== undefined ? Number(a) : 1 };
          }
          return null;
        };

        const isTransparent = (bg: string) => {
          const parsed = parseRgb(bg);
          if (!parsed) return true;
          // Check if alpha is 0 or color is black with potential transparency
          return parsed.a === 0 || (parsed.r === 0 && parsed.g === 0 && parsed.b === 0 && bg.includes('rgba'));
        };

        // Extract header background color
        let headerBg: string | null = null;
        let headerIsTransparent = true;

        const headerSelectors = ['header', '.header', 'nav', '.navbar', '.fl-page-header', '[role="banner"]'];
        for (const sel of headerSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            if (!isTransparent(bg)) {
              const parsed = parseRgb(bg);
              if (parsed) {
                headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                headerIsTransparent = false;
                break;
              }
            }
          }
        }

        // If header is transparent, check containers inside it
        if (headerIsTransparent) {
          const containers = document.querySelectorAll('header > div, .header > div, nav > div, [role="banner"] > div');
          for (const el of Array.from(containers)) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            if (!isTransparent(bg)) {
              const parsed = parseRgb(bg);
              if (parsed && (parsed.r > 0 || parsed.g > 0 || parsed.b > 0)) {
                headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                headerIsTransparent = false;
                break;
              }
            }
          }
        }

        // If still transparent, check what's visually behind the header
        // This could be a hero section, body background, or an image
        if (headerIsTransparent) {
          // Check hero/banner sections that might be behind the header
          const heroSelectors = [
            '.hero', '.banner', '[class*="hero"]', '[class*="banner"]',
            'main > section:first-child', 'main > div:first-child',
            '#hero', '.home-hero', '.site-hero'
          ];
          for (const sel of heroSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              const style = window.getComputedStyle(el);
              const bg = style.backgroundColor;
              if (!isTransparent(bg)) {
                const parsed = parseRgb(bg);
                if (parsed) {
                  headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
                  break;
                }
              }
              // Check for background image - if there's one, assume dark overlay
              if (style.backgroundImage && style.backgroundImage !== 'none') {
                headerBg = '#333333'; // Assume dark for hero images
                break;
              }
            }
          }
        }

        // Check body background as last resort
        if (headerIsTransparent && !headerBg) {
          const bodyStyle = window.getComputedStyle(document.body);
          const bg = bodyStyle.backgroundColor;
          if (!isTransparent(bg)) {
            const parsed = parseRgb(bg);
            if (parsed) {
              headerBg = rgbToHex(parsed.r, parsed.g, parsed.b);
            }
          }
        }

        // Default to white if we truly can't determine
        if (!headerBg) {
          headerBg = '#ffffff';
        }

        // Extract fonts from headings and body (do this early so all returns have it)
        const extractFont = (el: Element | null): string | null => {
          if (!el) return null;
          const style = window.getComputedStyle(el);
          const fontFamily = style.fontFamily;
          if (!fontFamily) return null;
          // Get the first font in the stack, remove quotes
          const firstFont = fontFamily.split(',')[0].trim().replace(/["']/g, '');
          // Skip generic families
          if (['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont'].includes(firstFont.toLowerCase())) {
            return null;
          }
          return firstFont;
        };

        let headingFont: string | null = null;
        let bodyFont: string | null = null;

        // Try to find heading font from h1, h2, or prominent text
        const headingSelectors = ['h1', 'h2', '.hero h1', '.hero h2', 'header h1', '[class*="heading"]', '[class*="title"]'];
        for (const sel of headingSelectors) {
          const el = document.querySelector(sel);
          const font = extractFont(el);
          if (font) {
            headingFont = font;
            break;
          }
        }

        // Try to find body font from paragraphs
        const bodySelectors = ['p', 'body', 'main p', 'article p', '.content p'];
        for (const sel of bodySelectors) {
          const el = document.querySelector(sel);
          const font = extractFont(el);
          if (font) {
            bodyFont = font;
            break;
          }
        }

        // Find logo - SVG first
        const svgSelectors = [
          'a[href="/"] svg, a[href*="home"] svg',
          '[class*="logo"] svg, #logo svg, .site-logo svg',
          'header svg:first-of-type, nav svg:first-of-type',
        ];

        for (const selector of svgSelectors) {
          const svgs = document.querySelectorAll(selector);
          for (const svg of Array.from(svgs)) {
            const rect = svg.getBoundingClientRect();
            if (rect.width >= 40 && rect.height >= 20 && rect.width <= 400) {
              const svgElement = svg as SVGSVGElement;
              const serializer = new XMLSerializer();
              const svgString = serializer.serializeToString(svgElement);
              const encodedSvg = encodeURIComponent(svgString);
              return { logoUrl: `data:image/svg+xml,${encodedSvg}`, headerBg, headingFont, bodyFont };
            }
          }
        }

        // Then try image selectors
        const imgSelectors = [
          'img[alt*="boys" i][alt*="girls" i], img[alt*="bgc" i]',
          'img[src*="logo" i]',
          'img[alt*="logo" i]',
          'a[href="/"] img, a[href*="home"] img',
          'header a img, .header a img',
          '[class*="logo" i] img, #logo img, .site-logo img',
          '[class*="photo"] img',
          'header img, nav img, .header img, .navbar img',
        ];

        for (const selector of imgSelectors) {
          const els = document.querySelectorAll(selector);
          for (const el of Array.from(els)) {
            const img = el as HTMLImageElement;
            let src = img.src || img.dataset.src || img.dataset.lazySrc || img.getAttribute('data-lazy-src');
            if (!src) continue;

            // Try to get highest quality from srcset
            const srcset = img.srcset || img.getAttribute('data-srcset');
            if (srcset) {
              const sources = srcset.split(',').map(s => {
                const parts = s.trim().split(/\s+/);
                const srcUrl = parts[0];
                const width = parseInt(parts[1]?.replace('w', '') || '0', 10);
                return { url: srcUrl, width };
              }).filter(s => s.url && !s.url.includes('data:image'));

              const best = sources.filter(s => s.width <= 1200 && s.width > 0)
                .sort((a, b) => b.width - a.width)[0];
              if (best) {
                src = best.url;
              }
            }

            const srcLower = src.toLowerCase();
            const skip = ['data:image/gif', '1x1', 'pixel', 'spacer', 'blank', 'tracking', 'spinner'];
            const banner = ['banner', 'alert', 'promo', 'hero', 'slide', 'carousel', 'background'];
            if (skip.some(p => srcLower.includes(p))) continue;
            if (banner.some(p => srcLower.includes(p))) continue;
            if (img.naturalWidth > 0 && img.naturalWidth < 30) continue;
            return { logoUrl: src, headerBg, headingFont, bodyFont };
          }
        }

        return { logoUrl: null, headerBg, headingFont, bodyFont };
      });

      headerBgColor = result.headerBg;
      detectedFonts = { heading: result.headingFont, body: result.bodyFont };

      // Prefer scraped logo over apistemic if found
      if (result.logoUrl) {
        logoUrl = result.logoUrl;
        logoSource = 'scraper';
      }
    } finally {
      await page.close();
      await browser.close();
    }
  } catch {}

  // Method 3: Google favicon as last resort (only if no logo found)
  if (!logoUrl) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const res = await fetch(faviconUrl);
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 500) {
        logoUrl = faviconUrl;
        logoSource = 'google-favicon';
      }
    } catch {}
  }

  return { logoUrl, logoSource, headerBgColor, detectedFonts };
}
