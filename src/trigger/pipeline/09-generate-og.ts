import type { BrandData } from '@/lib/types';
import { generateOgHtml } from '@/lib/templates/og-template';

export function generateOg(slug: string, brandData: BrandData): string {
  return generateOgHtml(slug, brandData);
}
