/**
 * Client-safe utilities for the deck editor
 */

/**
 * Validate HEX color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Font option with category for grouped display
 */
export interface FontOption {
  name: string;
  category: 'sans-serif' | 'serif';
}

/**
 * Curated heading fonts (15 total)
 */
export const HEADING_FONT_OPTIONS: FontOption[] = [
  // Sans Serif
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Oswald', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Jost', category: 'sans-serif' },
  // Serif
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Source Serif 4', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
];

/**
 * Curated body fonts (13 total)
 */
export const BODY_FONT_OPTIONS: FontOption[] = [
  // Sans Serif
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Source Sans 3', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  // Serif
  { name: 'Source Serif 4', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'PT Serif', category: 'serif' },
  { name: 'Noto Serif', category: 'serif' },
];

/**
 * Backward-compatible flat arrays
 */
export const HEADING_FONTS = HEADING_FONT_OPTIONS.map((f) => f.name) as readonly string[];
export const BODY_FONTS = BODY_FONT_OPTIONS.map((f) => f.name) as readonly string[];

export type HeadingFont = string;
export type BodyFont = string;

/**
 * Get all unique curated font names (for loading Google Fonts)
 */
export function getAllCuratedFontNames(): string[] {
  const all = new Set<string>();
  for (const f of HEADING_FONT_OPTIONS) all.add(f.name);
  for (const f of BODY_FONT_OPTIONS) all.add(f.name);
  return Array.from(all);
}

/**
 * Build a Google Fonts <link> URL for all curated fonts plus optional extras
 */
export function getCuratedFontsLinkUrl(extraFonts?: string[]): string {
  const allFonts = getAllCuratedFontNames();
  if (extraFonts) {
    for (const f of extraFonts) {
      if (!allFonts.includes(f)) allFonts.push(f);
    }
  }
  const families = allFonts
    .map((name) => `family=${name.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
