import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, getDeckForEdit, updateDeckBrandData } from '@/db/queries';
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

    // Check plan - must be starter or growth
    if (user.plan === 'free') {
      return NextResponse.json(
        { error: 'Deck editing requires a Starter or Growth plan' },
        { status: 403 }
      );
    }

    // Get deck (with ownership check)
    const deck = await getDeckForEdit(deckId, user.id);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

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

    if (user.plan === 'free') {
      return NextResponse.json(
        { error: 'Deck editing requires a Starter or Growth plan' },
        { status: 403 }
      );
    }

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
    const updates = body.brandData as Partial<BrandData>;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid brandData' }, { status: 400 });
    }

    // Cast existing brandData for validation and merging
    const existingBrandData = deck.brandData as BrandData;

    // Validate colors if provided
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

    // Validate fonts if provided - only reject if changing to an unknown font
    // (existing fonts from AI generation are allowed even if not in curated list)
    if (updates.fonts) {
      const { headingFont, bodyFont } = updates.fonts;
      const existingHeading = existingBrandData.fonts?.headingFont;
      const existingBody = existingBrandData.fonts?.bodyFont;

      // Only validate if the font is different from existing AND not in our list
      if (headingFont && headingFont !== existingHeading &&
          !HEADING_FONTS.includes(headingFont as typeof HEADING_FONTS[number])) {
        return NextResponse.json({ error: 'Invalid heading font' }, { status: 400 });
      }
      if (bodyFont && bodyFont !== existingBody &&
          !BODY_FONTS.includes(bodyFont as typeof BODY_FONTS[number])) {
        return NextResponse.json({ error: 'Invalid body font' }, { status: 400 });
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

    // Regenerate deck HTML
    let deckUrl: string;
    try {
      deckUrl = await regenerateDeckHtml(deck.slug, updatedBrandData);
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
