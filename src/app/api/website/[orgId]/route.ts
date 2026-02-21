import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, getOrganizationById, getOrganizationDecks, updateOrganizationWebsite } from '@/db/queries';
import { del } from '@vercel/blob';
import { regenerateWebsiteHtml } from '@/lib/website-regeneration';
import type { BrandData, WebsiteData } from '@/lib/types';

interface RouteParams {
  params: Promise<{ orgId: string }>;
}

/**
 * GET /api/website/[orgId]
 * Return current websiteData + brandData for editor
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { orgId: orgIdStr } = await params;
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const org = await getOrganizationById(orgId);
    if (!org || org.userId !== user.id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get primary deck for brandData
    const decks = await getOrganizationDecks(org.id);
    const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete');

    return NextResponse.json({
      orgId: org.id,
      orgSlug: org.slug,
      orgName: org.name,
      websiteHtmlUrl: org.websiteHtmlUrl,
      websiteData: (org.websiteData as WebsiteData) || {},
      brandData: primaryDeck?.brandData as BrandData | null,
      userPlan: user.plan,
    });
  } catch (error) {
    console.error('GET /api/website/[orgId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/website/[orgId]
 * Update websiteData overrides, regenerate HTML, re-upload to Blob
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { orgId: orgIdStr } = await params;
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.plan === 'free') {
      return NextResponse.json({ error: 'Website editing requires a paid plan' }, { status: 403 });
    }

    const org = await getOrganizationById(orgId);
    if (!org || org.userId !== user.id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get primary deck for brandData
    const decks = await getOrganizationDecks(org.id);
    const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete');
    if (!primaryDeck || !primaryDeck.brandData) {
      return NextResponse.json({ error: 'No completed deck found' }, { status: 404 });
    }

    const brandData = primaryDeck.brandData as BrandData;

    // Parse websiteData updates
    const body = await req.json();
    const websiteDataUpdates = body.websiteData as Partial<WebsiteData>;
    if (!websiteDataUpdates || typeof websiteDataUpdates !== 'object') {
      return NextResponse.json({ error: 'Invalid websiteData' }, { status: 400 });
    }

    // Merge with existing websiteData
    const existingWebsiteData = (org.websiteData as WebsiteData) || {};
    const mergedWebsiteData: WebsiteData = {
      ...existingWebsiteData,
      ...websiteDataUpdates,
    };

    // Regenerate HTML and upload
    const blobUrl = await regenerateWebsiteHtml(org.slug, brandData, mergedWebsiteData);

    // Update DB
    await updateOrganizationWebsite(org.id, blobUrl, mergedWebsiteData as unknown as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      websiteUrl: `/s/${org.slug}/site`,
      blobUrl,
      websiteData: mergedWebsiteData,
    });
  } catch (error) {
    console.error('PATCH /api/website/[orgId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/website/[orgId]
 * Delete the website and clean up blob storage
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { orgId: orgIdStr } = await params;
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const org = await getOrganizationById(orgId);
    if (!org || org.userId !== user.id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete blob file
    if (org.websiteHtmlUrl) {
      try {
        await del(org.websiteHtmlUrl);
      } catch (blobError) {
        console.error('Failed to delete website blob:', blobError);
        // Continue anyway
      }
    }

    // Clear website data from organization
    await updateOrganizationWebsite(org.id, null, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/website/[orgId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
