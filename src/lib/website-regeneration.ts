import { generateSiteHtml } from './templates/site-template';
import { uploadWebsiteHtml } from './services/blob-storage';
import type { BrandData, WebsiteData } from './types';

/**
 * Generate website HTML and upload to Vercel Blob
 */
export async function regenerateWebsiteHtml(
  orgSlug: string,
  brandData: BrandData,
  websiteData?: WebsiteData
): Promise<string> {
  const html = generateSiteHtml(orgSlug, brandData, websiteData);
  const blobUrl = await uploadWebsiteHtml(orgSlug, html);
  return blobUrl;
}
