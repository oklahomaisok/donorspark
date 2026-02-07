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
 * Curated font lists for the editor
 */
export const HEADING_FONTS = [
  'Playfair Display',
  'Montserrat',
  'Lora',
  'Raleway',
  'Merriweather',
  'Oswald',
  'Poppins',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
] as const;

export const BODY_FONTS = [
  'Inter',
  'Open Sans',
  'Roboto',
  'Lato',
  'Source Sans 3',
  'Nunito',
  'DM Sans',
  'Work Sans',
] as const;

export type HeadingFont = typeof HEADING_FONTS[number];
export type BodyFont = typeof BODY_FONTS[number];
