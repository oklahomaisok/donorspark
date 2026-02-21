import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug, getOrganizationDecks } from '@/db/queries';
import { config } from '@/lib/config';
import { generateDeckToken } from '@/lib/deck-token';
import type { BrandData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;

  // Find organization by slug
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Check if website exists
  if (!org.websiteHtmlUrl) {
    return new NextResponse(generate404Page(org.name), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Get OG image from primary deck (reuse)
  const decks = await getOrganizationDecks(org.id);
  const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete');
  const ogImageUrl = primaryDeck?.ogImageUrl || '';
  const brandData = primaryDeck?.brandData as BrandData | null;
  const description = brandData?.mission || `Learn about ${org.name} and how you can make a difference.`;

  // Generate token for content access
  const token = generateDeckToken(orgSlug + '-site');
  const contentUrl = `${config.siteUrl}/s/${orgSlug}/site/content?token=${token}`;
  const sitePageUrl = `${config.siteUrl}/s/${orgSlug}/site`;

  const faviconUrl = org.websiteUrl
    ? `https://www.google.com/s2/favicons?domain=${new URL(org.websiteUrl).hostname}&sz=32`
    : '';

  const wrapperHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(org.name)} | Official Website</title>
    <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
    ${faviconUrl ? `<link rel="icon" href="${faviconUrl}">` : ''}
    <meta property="og:title" content="${escapeHtml(org.name)}">
    <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
    ${ogImageUrl ? `<meta property="og:image" content="${ogImageUrl}">` : ''}
    <meta property="og:url" content="${sitePageUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(org.name)}">
    <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}">
    ${ogImageUrl ? `<meta name="twitter:image" content="${ogImageUrl}">` : ''}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #fff; }
        iframe { width: 100%; height: 100%; border: none; display: block; }
    </style>
</head>
<body>
    <iframe src="${contentUrl}"
            title="${escapeHtml(org.name)}"
            loading="eager"
            referrerpolicy="no-referrer"></iframe>
</body>
</html>`;

  return new NextResponse(wrapperHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

function generate404Page(orgName: string): string {
  return `<!DOCTYPE html>
<html><head><title>Website Not Found</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;padding:2rem;">
    <h1 style="color:#333;margin-bottom:0.5rem;">${escapeHtml(orgName)}</h1>
    <p style="color:#666;">This organization hasn't created a website yet.</p>
  </div>
</body></html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
