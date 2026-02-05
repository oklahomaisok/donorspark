import { config } from '../config';
import type { VisionColor } from '../types';

interface VisionImagePayload {
  content?: string;
  source?: { imageUri: string };
}

export async function extractColorsFromImage(imagePayload: VisionImagePayload, label: string): Promise<VisionColor[]> {
  const results: VisionColor[] = [];

  try {
    const body = JSON.stringify({
      requests: [{
        image: imagePayload,
        features: [{ type: 'IMAGE_PROPERTIES', maxResults: 10 }],
      }],
    });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${config.googleVisionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }
    );

    const data = await response.json();
    const colors = data?.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors;
    if (!colors) return results;

    for (const c of colors) {
      const r = Math.round(c.color.red || 0);
      const g = Math.round(c.color.green || 0);
      const b = Math.round(c.color.blue || 0);
      const hex = '#' + [r, g, b].map((x: number) => x.toString(16).padStart(2, '0')).join('');
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      results.push({
        source: label,
        hex,
        percent: parseFloat((c.pixelFraction * 100).toFixed(1)),
        score: parseFloat((c.score * 100).toFixed(1)),
        rgb: { r, g, b },
        saturation: sat,
        luminance: lum,
      });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error(`Vision API error (${label}):`, message);
  }

  return results;
}

export function isMonochromatic(colors: VisionColor[]): boolean {
  const chromatic = colors.filter(c => c.saturation > 0.15 && c.luminance > 0.05 && c.luminance < 0.95);
  return chromatic.length === 0;
}
