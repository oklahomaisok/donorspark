import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, getUserOrganizations, getOrganizationDecks, updateOrganizationWebsite } from '@/db/queries';
import { regenerateWebsiteHtml } from '@/lib/website-regeneration';
import type { BrandData } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/website/generate
 * Generate a one-page website from existing deck brandData
 * Requires Starter+ plan
 */
export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check plan
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.plan === 'free') {
      return NextResponse.json({ error: 'Website generation requires a paid plan' }, { status: 403 });
    }

    // Get user's primary organization
    const organizations = await getUserOrganizations(user.id);
    const org = organizations[0];
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get primary impact deck for brandData
    const decks = await getOrganizationDecks(org.id);
    const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete');
    if (!primaryDeck || !primaryDeck.brandData) {
      return NextResponse.json({ error: 'No completed deck found. Generate a deck first.' }, { status: 404 });
    }

    const brandData = primaryDeck.brandData as BrandData;

    // Parse optional websiteData from request body
    let websiteData;
    try {
      const body = await req.json();
      websiteData = body.websiteData;
    } catch {
      // No body is fine - use defaults
    }

    // Generate website HTML and upload to Blob
    const blobUrl = await regenerateWebsiteHtml(org.slug, brandData, websiteData);

    // Update organization with website URL
    await updateOrganizationWebsite(org.id, blobUrl, websiteData || null);

    return NextResponse.json({
      success: true,
      websiteUrl: `/s/${org.slug}/site`,
      blobUrl,
    });
  } catch (error) {
    console.error('POST /api/website/generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
