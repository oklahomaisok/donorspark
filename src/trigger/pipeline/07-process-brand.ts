import type { ClaudeAnalysis, VisionColor, LogoColors, ExtractedMetric, BrandData } from '@/lib/types';
import { mapToGoogleFont, isSerifFont } from '@/lib/data/fonts';
import { resolveSector } from '@/lib/data/sectors';
import { getSectorImages } from '@/lib/data/image-library';
import { getTestimonials } from '@/lib/templates/testimonials';

export function processBrandData(
  claudeData: ClaudeAnalysis,
  visionColors: VisionColor[],
  logoColors: LogoColors,
  extractedMetrics: ExtractedMetric[],
  detectedFonts: { heading: string | null; body: string | null },
  logoUrl: string | null,
  logoSource: string,
  headerBgColor: string | null,
  originalUrl: string,
): BrandData {
  const orgName = claudeData.orgName || 'Organization';
  const sector = resolveSector(claudeData.sector || 'community', orgName);

  let headingFont = mapToGoogleFont(detectedFonts.heading);
  let bodyFont = mapToGoogleFont(detectedFonts.body);

  if (!headingFont) {
    // Try mapping Claude's font suggestion through the Google Font mapper
    const claudeHeading = claudeData.fonts?.headingFont;
    headingFont = mapToGoogleFont(claudeHeading);

    if (!headingFont) {
      // Final fallback: use style hint or default to sans-serif
      headingFont = claudeData.fonts?.headingStyle === 'serif' ? 'Lora' : 'Montserrat';
    }
  }
  if (!bodyFont) {
    bodyFont = isSerifFont(headingFont) ? 'Source Serif 4' : 'Inter';
  }

  const colors = resolveColors(claudeData, visionColors, logoColors);
  const images = getSectorImages(sector);
  const testimonials = getTestimonials(sector);
  const coreValues = claudeData.coreValues?.length === 4 ? claudeData.coreValues : ['Integrity', 'Compassion', 'Excellence', 'Community'];
  const metrics = processMetrics(extractedMetrics, claudeData);

  let finalDonateUrl = claudeData.donateUrl || '';
  finalDonateUrl = normalizeUrl(finalDonateUrl, originalUrl);

  const resolvedHeaderBg = resolveHeaderBg(claudeData, headerBgColor, logoColors);
  const headerTextDark = isLightHex(resolvedHeaderBg);

  return {
    orgName,
    logoUrl,
    logoSource,
    colors,
    fonts: { headingFont, bodyFont },
    images,
    testimonials,
    coreValues,
    metrics: metrics.items,
    hasValidMetrics: metrics.items.length > 0,
    useBarChart: false,
    numericValues: metrics.numericValues,
    donorHeadline: claudeData.donorHeadline || 'Making A Difference',
    heroHook: claudeData.heroHook || claudeData.tagline || 'Your support transforms lives and builds stronger communities.',
    tagline: claudeData.tagline,
    mission: claudeData.mission || 'Making a difference in our community.',
    yearFounded: claudeData.yearFounded,
    need: claudeData.need || { headline: 'Communities Need Support', description: 'Many face challenges that require dedicated assistance.' },
    solution: claudeData.solution || 'We provide programs and services that create lasting change.',
    programs: claudeData.programs || [],
    contactEmail: claudeData.contactEmail || '',
    originalUrl,
    finalDonateUrl,
    headerBgColor: resolvedHeaderBg,
    headerTextDark,
    sector,
  };
}

function resolveColors(
  claudeData: ClaudeAnalysis,
  extractedColors: VisionColor[],
  logoColors: LogoColors,
) {
  const cleanHex = (hex: string | undefined): string | null =>
    hex?.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/)?.[0] || null;

  const claudePrimary = cleanHex(claudeData.colors?.primary);
  const claudeSecondary = cleanHex(claudeData.colors?.secondary);
  const claudeAccent = cleanHex(claudeData.colors?.accent);

  // Only use logo colors if they're not too light, too dark, or too gray (low saturation)
  const isUsable = (hex: string | null) => {
    if (!hex) return false;
    if (isLightHex(hex) || isDarkHex(hex)) return false;
    // Filter out grays - require minimum saturation
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation > 0.15; // Require at least 15% saturation to avoid grays
  };
  const usableLogoPrimary = logoColors.dominant?.find(c => isUsable(c.hex))?.hex;
  const logoAccent = logoColors.vibrant || logoColors.dominant?.find(c => c.hex !== usableLogoPrimary && isUsable(c.hex))?.hex;

  const usableColors = extractedColors.filter(c => c.hex && isUsable(c.hex));
  const darkColors = extractedColors.filter(c => c.hex && !isLightHex(c.hex));
  const buttonColors = usableColors.filter(c => c.source === 'button');
  const linkColors = usableColors.filter(c => c.source === 'link');

  const extractedPrimary = darkColors.find(c => c.source === 'footer')?.hex || darkColors[0]?.hex;
  const extractedAccent = buttonColors[0]?.hex || linkColors[0]?.hex;

  const validateColor = (claude: string | null, extracted: string | undefined, fallback: string): string => {
    if (!claude) return extracted || fallback;
    const closeMatch = extractedColors.find(c => c.hex && colorDistance(claude, c.hex) < 50);
    if (closeMatch) return claude;
    return extracted || claude || fallback;
  };

  const primary = usableLogoPrimary || validateColor(claudePrimary, extractedPrimary, '#1D2350');

  // Fallback accent: white for dark backgrounds, dark gray for light backgrounds
  const primaryIsDark = !isLightHex(primary);
  const fallbackAccent = primaryIsDark ? '#FFFFFF' : '#1A1A1A';

  // Log color sources for debugging
  console.log('[Colors] extractedAccent:', extractedAccent, '| logoAccent:', logoAccent, '| claudeAccent:', claudeAccent, '| fallback:', fallbackAccent);
  console.log('[Colors] buttonColors:', extractedColors.filter(c => c.source === 'button').map(c => c.hex));
  console.log('[Colors] linkColors:', extractedColors.filter(c => c.source === 'link').map(c => c.hex));

  const accent = extractedAccent || logoAccent || claudeAccent || fallbackAccent;
  console.log('[Colors] Final accent chosen:', accent);

  let secondary: string | null = null;
  const logoSecondary = logoColors.dominant?.find(c => c.hex !== usableLogoPrimary && isUsable(c.hex))?.hex;
  if (logoSecondary && colorDistance(logoSecondary, primary) > 60) secondary = logoSecondary;
  if (!secondary && claudeSecondary && colorDistance(claudeSecondary, primary) > 40) secondary = claudeSecondary;
  if (!secondary) {
    const other = usableColors.find(c =>
      colorDistance(c.hex, primary) > 100 && colorDistance(c.hex, accent) > 100
    );
    if (other) secondary = other.hex;
  }
  if (!secondary) secondary = accent;

  // Ensure accent has enough contrast against primary (background)
  const adjustedAccent = ensureAccentContrast(accent, primary);

  return { primary, secondary, accent: adjustedAccent };
}

function colorDistance(hex1: string, hex2: string): number {
  if (!hex1 || !hex2) return 999;
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Calculate WCAG contrast ratio between two colors
function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Adjust accent color to ensure readable contrast
// Note: Deck backgrounds are always effectively dark due to image overlays,
// so we only lighten accents, never darken them
function ensureAccentContrast(accent: string, background: string): string {
  const minContrast = 3; // WCAG AA for large text

  // Check contrast against actual background
  const contrast = getContrastRatio(accent, background);
  if (contrast >= minContrast) {
    return accent; // Already has enough contrast
  }

  // Also check against near-black (what the deck actually looks like with overlays)
  const darkOverlay = '#1a1a1a';
  const darkContrast = getContrastRatio(accent, darkOverlay);
  if (darkContrast >= minContrast) {
    return accent; // Works against dark overlays
  }

  // Parse the accent color
  let r = parseInt(accent.slice(1, 3), 16);
  let g = parseInt(accent.slice(3, 5), 16);
  let b = parseInt(accent.slice(5, 7), 16);

  // Always lighten (deck backgrounds are dark due to overlays)
  for (let i = 0; i < 20; i++) {
    const step = 15;
    r = Math.min(255, r + step);
    g = Math.min(255, g + step);
    b = Math.min(255, b + step);

    const adjusted = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    if (getContrastRatio(adjusted, darkOverlay) >= minContrast) {
      return adjusted;
    }
  }

  // Fallback: bright gold
  return '#FFD700';
}

function isLightHex(hex: string | null): boolean {
  if (!hex) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Threshold 0.55 - more aggressive to catch grays/light colors that look bad as backgrounds
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function isDarkHex(hex: string | null): boolean {
  if (!hex) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.12;
}

function processMetrics(preExtracted: ExtractedMetric[], claudeData: ClaudeAnalysis) {
  let metrics: { value: string; label: string }[] = [];

  for (const m of preExtracted) {
    let label = m.label;
    let value = m.value;

    if (m.label === 'Founded') {
      const year = parseInt(m.value);
      if (year > 1900 && year < 2027) {
        value = String(new Date().getFullYear() - year);
        label = 'Years of Impact';
      }
    }

    metrics.push({ value, label });
  }

  if (metrics.length < 3 && claudeData.metrics) {
    const claudeMetrics = (claudeData.metrics || []).filter(m => {
      const val = String(m.value || '').trim();
      const lbl = String(m.label || '').toLowerCase();
      return /\d/.test(val) && val.length > 0 && !lbl.includes('success rate');
    });

    for (const cm of claudeMetrics) {
      const isDupe = metrics.some(m =>
        m.label.toLowerCase().includes(cm.label?.toLowerCase()?.split(' ')[0] || 'xxx')
      );
      if (!isDupe && metrics.length < 5) {
        metrics.push(cm);
      }
    }
  }

  metrics = metrics.slice(0, 5);

  // Only add year-based metric if we have a valid founding year - skip generic fallbacks entirely
  if (metrics.length === 0) {
    const year = claudeData.yearFounded;
    if (year && year > 1800 && year < 2025) {
      metrics.push({ value: String(new Date().getFullYear() - year), label: 'Years of Service' });
    }
    // Don't add "Dedicated to Community Impact" fallback - better to skip metrics slide
  }

  const numericValues = metrics.map(m => {
    const val = String(m.value || '').replace(/[,$%+]/g, '');
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  });

  return { items: metrics, numericValues };
}

function resolveHeaderBg(claudeData: ClaudeAnalysis, scrapedBg: string | null, logoColors: LogoColors): string {
  // First, check if logo has predominantly light/white colors
  const logoIsLight = logoColors.dominant?.some(c => {
    if (!c.hex) return false;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.85 && c.count > 100; // White/very light color that's significant
  });

  const claudeHeaderBg = claudeData.colors?.headerBackground;

  // If we have a scraped background, use it (it's the actual website header color)
  if (scrapedBg && scrapedBg !== '#ffffff' && scrapedBg !== '#000000') {
    return scrapedBg;
  }

  // If logo is light/white and we'd default to white, use a dark background instead
  if (logoIsLight) {
    // Use the primary brand color (usually dark) as the header background
    const primary = claudeData.colors?.primary;
    if (primary && !isLightHex(primary)) {
      return primary;
    }
    // Fallback to a safe dark color
    return '#2D3436';
  }

  if (claudeHeaderBg) {
    if (['white', '#fff', '#ffffff'].includes(claudeHeaderBg.toLowerCase())) return '#ffffff';
    if (claudeHeaderBg.toLowerCase() === 'transparent') return '#ffffff';
    if (claudeHeaderBg.startsWith('#')) return claudeHeaderBg;
  }

  return scrapedBg || claudeData.colors?.primary || '#2D3436';
}

function normalizeUrl(url: string, originalUrl: string): string {
  if (!url || url.trim() === '') return '';
  url = url.trim();

  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (url.startsWith('//')) return 'https:' + url;

  const originMatch = originalUrl.match(/^(https?:\/\/[^\/]+)/);
  const origin = originMatch ? originMatch[1] : originalUrl;

  if (url.startsWith('/')) return origin.replace(/\/+$/, '') + url;
  if (url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/)) return 'https://' + url;
  return origin.replace(/\/+$/, '') + '/' + url;
}
