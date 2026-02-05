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
    headingFont = claudeData.fonts?.headingFont || (claudeData.fonts?.headingStyle === 'serif' ? 'Playfair Display' : 'Oswald');
  }
  if (!bodyFont) {
    bodyFont = isSerifFont(headingFont) ? 'Source Serif 4' : 'Roboto';
  }

  const colors = resolveColors(claudeData, visionColors, logoColors);
  const images = getSectorImages(sector);
  const testimonials = getTestimonials(sector);
  const coreValues = claudeData.coreValues?.length === 4 ? claudeData.coreValues : ['Integrity', 'Compassion', 'Excellence', 'Community'];
  const metrics = processMetrics(extractedMetrics, claudeData);

  let finalDonateUrl = claudeData.donateUrl || '';
  finalDonateUrl = normalizeUrl(finalDonateUrl, originalUrl);

  const resolvedHeaderBg = resolveHeaderBg(claudeData, headerBgColor);
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

  // Only use logo colors if they're not too light or too dark
  const isUsable = (hex: string | null) => hex && !isLightHex(hex) && !isDarkHex(hex);
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
  const accent = extractedAccent || logoAccent || claudeAccent || '#78A22F';

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

  return { primary, secondary, accent };
}

function colorDistance(hex1: string, hex2: string): number {
  if (!hex1 || !hex2) return 999;
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function isLightHex(hex: string | null): boolean {
  if (!hex) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Threshold 0.75 catches light grays that would look bad as backgrounds
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.75;
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

  if (metrics.length === 0) {
    const year = claudeData.yearFounded;
    if (year && year > 1800 && year < 2025) {
      metrics.push({ value: String(new Date().getFullYear() - year), label: 'Years of Service' });
    } else {
      metrics.push({ value: 'Dedicated', label: 'To Community Impact' });
    }
  }

  const numericValues = metrics.map(m => {
    const val = String(m.value || '').replace(/[,$%+]/g, '');
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  });

  return { items: metrics, numericValues };
}

function resolveHeaderBg(claudeData: ClaudeAnalysis, scrapedBg: string | null): string {
  const claudeHeaderBg = claudeData.colors?.headerBackground;
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
