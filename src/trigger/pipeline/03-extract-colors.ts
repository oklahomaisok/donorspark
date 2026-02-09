import puppeteer from 'puppeteer';
import { extractColorsFromImage, isMonochromatic } from '@/lib/services/vision';
import type { VisionColor, LogoColors, LogoColorEntry } from '@/lib/types';

export interface ColorResult {
  visionColors: VisionColor[];
  logoColors: LogoColors;
}

export async function extractColors(
  domain: string,
  screenshotBase64: string,
  logoUrl: string | null,
): Promise<ColorResult> {
  // Step 1: Vision API on favicon
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  let visionColors = await extractColorsFromImage({ source: { imageUri: faviconUrl } }, 'favicon');

  if (visionColors.length === 0 || isMonochromatic(visionColors)) {
    visionColors = await extractColorsFromImage({ content: screenshotBase64 }, 'page');
  }

  let logoColors: LogoColors = { dominant: [], vibrant: null, muted: null, source: 'none' };

  // Try favicon canvas extraction
  try {
    const faviconCols = await extractLogoColorsViaPage(faviconUrl);
    if (faviconCols.length > 0) {
      logoColors.dominant = faviconCols;
      logoColors.vibrant = faviconCols.find((c: LogoColorEntry) => c.isVibrant)?.hex || null;
      logoColors.source = 'favicon';
    }
  } catch {}

  // Try logo URL if favicon was insufficient
  if (logoUrl && logoUrl.startsWith('http') && logoColors.dominant.length < 2) {
    if (logoUrl.toLowerCase().includes('.svg')) {
      try {
        const svgColors = await extractSvgColors(logoUrl);
        if (svgColors.length > 0) {
          logoColors.dominant = svgColors;
          logoColors.vibrant = svgColors[0]?.hex || null;
          logoColors.source = 'svg';
        }
      } catch {}
    } else {
      try {
        const logoCols = await extractLogoColorsViaPage(logoUrl);
        if (logoCols.length > logoColors.dominant.length) {
          logoColors.dominant = logoCols;
          logoColors.vibrant = logoCols.find((c: LogoColorEntry) => c.isVibrant)?.hex || null;
          logoColors.source = 'logo';
        }
      } catch {}
    }
  }

  return { visionColors, logoColors };
}

async function extractLogoColorsViaPage(imageUrl: string): Promise<LogoColorEntry[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });
  const page = await browser.newPage();
  try {
    await page.setContent(`<html><body style="margin:0;background:#fff"><img id="i" crossorigin="anonymous"/></body></html>`);

    return await page.evaluate(async (src: string) => {
      return new Promise<LogoColorEntry[]>((resolve) => {
        const img = document.getElementById('i') as HTMLImageElement;
        img.onload = () => {
          try {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d')!;
            const s = Math.min(100 / img.naturalWidth, 100 / img.naturalHeight, 1);
            c.width = Math.max(1, Math.floor(img.naturalWidth * s));
            c.height = Math.max(1, Math.floor(img.naturalHeight * s));
            ctx.drawImage(img, 0, 0, c.width, c.height);

            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            const counts: Record<string, number> = {};

            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
              if (a < 200) continue;
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              if (lum > 250 || lum < 5) continue;
              const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
              const sat = (mx - mn) / (mx || 1);
              // Only skip truly neutral grays (very low sat AND mid-range luminance)
              if (sat < 0.05 && lum > 50 && lum < 200) continue;
              counts[r + ',' + g + ',' + b] = (counts[r + ',' + g + ',' + b] || 0) + 1;
            }

            const clusters: { r: number; g: number; b: number; count: number }[] = [];
            for (const [rgb, cnt] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
              const [r, g, b] = rgb.split(',').map(Number);
              let merged = false;
              for (const cl of clusters) {
                if (Math.sqrt((cl.r - r) ** 2 + (cl.g - g) ** 2 + (cl.b - b) ** 2) < 25) {
                  cl.count += cnt;
                  merged = true;
                  break;
                }
              }
              if (!merged) clusters.push({ r, g, b, count: cnt });
            }

            clusters.sort((a, b) => b.count - a.count);
            resolve(clusters.slice(0, 8).map(x => {
              const hex = '#' + [x.r, x.g, x.b].map(v => v.toString(16).padStart(2, '0')).join('');
              const mx = Math.max(x.r, x.g, x.b), mn = Math.min(x.r, x.g, x.b);
              const sat = mx ? (mx - mn) / mx : 0;
              const lum = (0.299 * x.r + 0.587 * x.g + 0.114 * x.b) / 255;
              return { hex, count: x.count, saturation: sat, luminance: lum, isVibrant: sat > 0.4 && lum > 0.15 && lum < 0.85 };
            }));
          } catch { resolve([]); }
        };
        img.onerror = () => resolve([]);
        img.src = src;
        setTimeout(() => resolve([]), 8000);
      });
    }, imageUrl);
  } finally {
    await page.close();
    await browser.close();
  }
}

async function extractSvgColors(svgUrl: string): Promise<LogoColorEntry[]> {
  try {
    const res = await fetch(svgUrl, { signal: AbortSignal.timeout(8000) });
    const data = await res.text();
    const hexes = new Set<string>();
    (data.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g) || []).forEach(h => {
      let hex = h.toLowerCase();
      if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      if (hex !== '#ffffff' && hex !== '#000000') hexes.add(hex);
    });
    return [...hexes].map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return { hex, saturation: mx ? (mx - mn) / mx : 0, luminance: (0.299 * r + 0.587 * g + 0.114 * b) / 255, isVibrant: true, count: 100 };
    });
  } catch {
    return [];
  }
}
