import { put } from '@vercel/blob';
import { generateDeckHtml } from './templates/deck-template';
import { generateOgHtml } from './templates/og-template';
import type { BrandData } from './types';

// Re-export client-safe utilities from editor-utils
export {
  isValidHexColor,
  HEADING_FONTS,
  BODY_FONTS,
  type HeadingFont,
  type BodyFont,
} from './editor-utils';

export interface RegenerationResult {
  deckUrl: string;
  ogImageUrl: string;
}

export interface RegenerationOptions {
  hideDonorSparkSlide?: boolean;
}

/**
 * Regenerate deck HTML and upload to Vercel Blob
 * Used after deck customization
 */
export async function regenerateDeckHtml(
  slug: string,
  brandData: BrandData,
  options: RegenerationOptions = {}
): Promise<string> {
  const html = generateDeckHtml(slug, brandData, {
    hideDonorSparkSlide: options.hideDonorSparkSlide,
  });

  const blob = await put(`decks/${slug}/index.html`, html, {
    access: 'public',
    contentType: 'text/html',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

/**
 * Regenerate OG image HTML for later screenshot
 * Note: Actual screenshot requires Puppeteer which runs in Trigger.dev
 */
export async function regenerateOgHtml(
  slug: string,
  brandData: BrandData
): Promise<string> {
  const ogHtml = generateOgHtml(slug, brandData);

  const blob = await put(`decks/${slug}/og.html`, ogHtml, {
    access: 'public',
    contentType: 'text/html',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

/**
 * Regenerate all decks for a user (e.g., when plan changes)
 * Used to show/hide DonorSpark branding based on plan
 */
export async function regenerateUserDecks(
  userDecks: Array<{ slug: string; brandData: BrandData | unknown }>,
  options: RegenerationOptions = {}
): Promise<void> {
  // Process decks in parallel with a limit
  const batchSize = 5;
  for (let i = 0; i < userDecks.length; i += batchSize) {
    const batch = userDecks.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (deck) => {
        if (!deck.brandData) return;
        try {
          await regenerateDeckHtml(deck.slug, deck.brandData as BrandData, options);
        } catch (err) {
          console.error(`Failed to regenerate deck ${deck.slug}:`, err);
        }
      })
    );
  }
}
