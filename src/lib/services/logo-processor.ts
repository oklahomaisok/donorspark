import sharp from 'sharp';
import { put } from '@vercel/blob';

/**
 * Fetches a logo, trims transparent padding, and uploads to Vercel Blob.
 * Returns the new URL or the original if trimming fails/isn't needed.
 */
export async function trimAndUploadLogo(
  logoUrl: string | null,
  slug: string,
): Promise<string | null> {
  if (!logoUrl) return null;

  // Skip data URLs and SVGs - they don't have the padding problem
  if (logoUrl.startsWith('data:')) return logoUrl;
  if (logoUrl.toLowerCase().includes('.svg')) return logoUrl;

  try {
    // Fetch the logo (longer timeout for slow APIs like Apistemic)
    const response = await fetch(logoUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return logoUrl;

    const buffer = Buffer.from(await response.arrayBuffer());

    // Get metadata to check if trimming is worthwhile
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return logoUrl;

    // Trim transparent pixels
    const trimmed = await sharp(buffer)
      .trim() // Removes "boring" pixels from edges
      .toBuffer();

    const trimmedMeta = await sharp(trimmed).metadata();
    if (!trimmedMeta.width || !trimmedMeta.height) return logoUrl;

    // Calculate how much was trimmed
    const originalArea = metadata.width * metadata.height;
    const trimmedArea = trimmedMeta.width * trimmedMeta.height;
    const reduction = 1 - (trimmedArea / originalArea);

    // Only upload if we removed significant padding (>20% of image area)
    if (reduction < 0.2) {
      return logoUrl;
    }

    console.log(`Logo trimmed: ${metadata.width}x${metadata.height} -> ${trimmedMeta.width}x${trimmedMeta.height} (${Math.round(reduction * 100)}% reduction)`);

    // Determine output format (prefer PNG for transparency support)
    const format = metadata.format === 'webp' ? 'webp' : 'png';
    const contentType = format === 'webp' ? 'image/webp' : 'image/png';
    const filename = `logos/${slug}-trimmed.${format}`;

    // Upload trimmed logo to Vercel Blob
    const blob = await put(filename, trimmed, {
      access: 'public',
      contentType,
    });

    return blob.url;
  } catch (error) {
    console.error('Logo trim failed, using original:', error);
    return logoUrl;
  }
}
