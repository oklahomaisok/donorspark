import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, getDeckForEdit, updateDeckBrandData, deleteDeckById, getOrganizationById } from '@/db/queries';
import { del } from '@vercel/blob';
import { regenerateDeckHtml, regenerateOgHtml, isValidHexColor, HEADING_FONTS, BODY_FONTS } from '@/lib/deck-regeneration';
import type { BrandData } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/decks/[id]
 * Get deck details for editing
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

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

    // Get deck (with ownership check)
    const deck = await getDeckForEdit(deckId, user.id);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Return deck data with plan info
    // Free users can save limited changes (logo, metrics, testimonials, visibility)
    return NextResponse.json({
      id: deck.id,
      slug: deck.slug,
      orgName: deck.orgName,
      status: deck.status,
      deckUrl: deck.deckUrl,
      ogImageUrl: deck.ogImageUrl,
      brandData: deck.brandData as BrandData | null,
      isCustomized: deck.isCustomized,
      customizedAt: deck.customizedAt,
      userPlan: user.plan, // Include plan so UI can show upgrade prompts
      canSave: true, // All users can save (free users have restricted fields)
    });
  } catch (error) {
    console.error('GET /api/decks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/decks/[id]
 * Update deck brandData and regenerate HTML
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

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

    const isFreeUser = user.plan === 'free';

    // Get deck (with ownership check)
    const deck = await getDeckForEdit(deckId, user.id);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (!deck.brandData) {
      return NextResponse.json({ error: 'Deck has no brand data to edit' }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    let updates = body.brandData as Partial<BrandData>;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid brandData' }, { status: 400 });
    }

    // Cast existing brandData for validation and merging
    const existingBrandData = deck.brandData as BrandData;

    // For free users, only allow specific field updates
    if (isFreeUser) {
      const allowedUpdates: Partial<BrandData> = {};

      // Logo changes allowed
      if (updates.logoUrl !== undefined) allowedUpdates.logoUrl = updates.logoUrl;
      if (updates.logoSource !== undefined) allowedUpdates.logoSource = updates.logoSource;

      // Metrics changes allowed
      if (updates.metrics !== undefined) allowedUpdates.metrics = updates.metrics;
      if (updates.hasValidMetrics !== undefined) allowedUpdates.hasValidMetrics = updates.hasValidMetrics;

      // Testimonials changes allowed
      if (updates.testimonials !== undefined) allowedUpdates.testimonials = updates.testimonials;
      if (updates.testimonialsSlideTitle !== undefined) allowedUpdates.testimonialsSlideTitle = updates.testimonialsSlideTitle;

      // Slide visibility changes allowed
      if (updates.showMissionSlide !== undefined) allowedUpdates.showMissionSlide = updates.showMissionSlide;
      if (updates.showChallengeSlide !== undefined) allowedUpdates.showChallengeSlide = updates.showChallengeSlide;
      if (updates.showProgramsSlide !== undefined) allowedUpdates.showProgramsSlide = updates.showProgramsSlide;
      if (updates.showTestimonialsSlide !== undefined) allowedUpdates.showTestimonialsSlide = updates.showTestimonialsSlide;
      if (updates.showCtaSlide !== undefined) allowedUpdates.showCtaSlide = updates.showCtaSlide;

      // Replace updates with only allowed fields
      updates = allowedUpdates;
    } else {
      // Paid users: Validate colors if provided
      if (updates.colors) {
        const { primary, secondary, accent } = updates.colors;
        if (primary && !isValidHexColor(primary)) {
          return NextResponse.json({ error: 'Invalid primary color format' }, { status: 400 });
        }
        if (secondary && !isValidHexColor(secondary)) {
          return NextResponse.json({ error: 'Invalid secondary color format' }, { status: 400 });
        }
        if (accent && !isValidHexColor(accent)) {
          return NextResponse.json({ error: 'Invalid accent color format' }, { status: 400 });
        }
      }

      // Paid users: Validate fonts if provided
      if (updates.fonts) {
        const { headingFont, bodyFont } = updates.fonts;
        const existingHeading = existingBrandData.fonts?.headingFont;
        const existingBody = existingBrandData.fonts?.bodyFont;

        if (headingFont && headingFont !== existingHeading &&
            !HEADING_FONTS.includes(headingFont as typeof HEADING_FONTS[number])) {
          return NextResponse.json({ error: 'Invalid heading font' }, { status: 400 });
        }
        if (bodyFont && bodyFont !== existingBody &&
            !BODY_FONTS.includes(bodyFont as typeof BODY_FONTS[number])) {
          return NextResponse.json({ error: 'Invalid body font' }, { status: 400 });
        }
      }
    }

    // Merge updates with existing brandData
    const updatedBrandData: BrandData = {
      ...existingBrandData,
      ...updates,
      colors: {
        ...existingBrandData.colors,
        ...(updates.colors || {}),
      },
      fonts: {
        ...existingBrandData.fonts,
        ...(updates.fonts || {}),
      },
      need: {
        ...existingBrandData.need,
        ...(updates.need || {}),
      },
    };

    // Regenerate deck HTML (hide DonorSpark slide for paid users only)
    let deckUrl: string;
    try {
      deckUrl = await regenerateDeckHtml(deck.slug, updatedBrandData, {
        hideDonorSparkSlide: !isFreeUser, // Free users see DonorSpark branding
      });
    } catch (blobError) {
      console.error('Failed to regenerate deck HTML:', blobError);
      return NextResponse.json({ error: 'Failed to save deck HTML' }, { status: 500 });
    }

    // Regenerate OG HTML (will be screenshotted by background job)
    try {
      await regenerateOgHtml(deck.slug, updatedBrandData);
    } catch (ogError) {
      console.error('Failed to regenerate OG HTML:', ogError);
      // Non-fatal - continue without OG update
    }

    // Update database
    try {
      await updateDeckBrandData(deckId, updatedBrandData, deckUrl, deck.ogImageUrl || undefined);
    } catch (dbError) {
      console.error('Failed to update database:', dbError);
      return NextResponse.json({ error: 'Failed to save changes to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deckUrl,
      brandData: updatedBrandData,
    });
  } catch (error) {
    console.error('PATCH /api/decks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/decks/[id]
 * Delete a deck and its associated blob files
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    // Verify auth
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get deck (with ownership check)
    const deck = await getDeckForEdit(deckId, user.id);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Delete blob files (deck HTML and OG image)
    const blobUrlsToDelete: string[] = [];
    if (deck.deckUrl) blobUrlsToDelete.push(deck.deckUrl);
    if (deck.ogImageUrl) blobUrlsToDelete.push(deck.ogImageUrl);

    // Also try to delete the OG HTML file
    const ogHtmlUrl = deck.deckUrl?.replace('/decks/', '/og/').replace('.html', '.html');
    if (ogHtmlUrl && ogHtmlUrl !== deck.deckUrl) {
      blobUrlsToDelete.push(ogHtmlUrl);
    }

    // Delete blobs (don't fail if blob delete fails)
    for (const url of blobUrlsToDelete) {
      try {
        await del(url);
      } catch (blobError) {
        console.error('Failed to delete blob:', url, blobError);
        // Continue anyway
      }
    }

    // Delete from database
    await deleteDeckById(deckId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/decks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
