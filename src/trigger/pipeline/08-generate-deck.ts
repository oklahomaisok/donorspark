import type { BrandData } from '@/lib/types';
import { generateDeckHtml } from '@/lib/templates/deck-template';

export function generateDeck(slug: string, brandData: BrandData): string {
  return generateDeckHtml(slug, brandData);
}
