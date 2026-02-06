import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import {
  getDeckByTempToken,
  getUserByClerkId,
  claimDeck,
  createOrganization,
} from '@/db/queries';
import { generateOrgSlug } from '@/lib/utils/slug';
import { config } from '@/lib/config';

export async function GET(req: NextRequest) {
  const tempToken = req.nextUrl.searchParams.get('tempToken');

  if (!tempToken) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard`);
  }

  // Verify user is authenticated
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.redirect(`${config.siteUrl}/sign-in?redirect_url=/api/claim?tempToken=${tempToken}`);
  }

  // Get user from database
  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.redirect(`${config.siteUrl}/sign-in?redirect_url=/api/claim?tempToken=${tempToken}`);
  }

  // Get deck by temp token
  const deck = await getDeckByTempToken(tempToken);
  if (!deck) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard?error=invalid_token`);
  }

  // Check if deck is already claimed
  if (deck.userId) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard?error=already_claimed`);
  }

  // Check if deck is expired
  if (deck.isExpired || (deck.expiresAt && new Date(deck.expiresAt) < new Date())) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard?error=expired`);
  }

  try {
    // Generate a unique org slug (handles collision checking)
    const orgSlug = await generateOrgSlug(deck.orgName);

    // Create organization from deck data
    const org = await createOrganization({
      userId: user.id,
      name: deck.orgName,
      slug: orgSlug,
      websiteUrl: deck.orgUrl,
      brandData: deck.brandData as Record<string, unknown> | undefined,
    });

    // Claim the deck
    await claimDeck(deck.id, user.id, org.id);

    // Clear the temp token cookie
    const cookieStore = await cookies();
    cookieStore.delete('ds_temp_token');

    // Redirect to new deck URL
    return NextResponse.redirect(`${config.siteUrl}/s/${orgSlug}?claimed=true`);
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.redirect(`${config.siteUrl}/dashboard?error=claim_failed`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tempToken } = body;

  if (!tempToken) {
    return NextResponse.json({ error: 'Missing tempToken' }, { status: 400 });
  }

  // Verify user is authenticated
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user from database
  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get deck by temp token
  const deck = await getDeckByTempToken(tempToken);
  if (!deck) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  // Check if deck is already claimed
  if (deck.userId) {
    return NextResponse.json({ error: 'Deck already claimed' }, { status: 400 });
  }

  // Check if deck is expired
  if (deck.isExpired || (deck.expiresAt && new Date(deck.expiresAt) < new Date())) {
    return NextResponse.json({ error: 'Deck expired' }, { status: 410 });
  }

  try {
    // Generate a unique org slug (handles collision checking)
    const orgSlug = await generateOrgSlug(deck.orgName);

    // Create organization from deck data
    const org = await createOrganization({
      userId: user.id,
      name: deck.orgName,
      slug: orgSlug,
      websiteUrl: deck.orgUrl,
      brandData: deck.brandData as Record<string, unknown> | undefined,
    });

    // Claim the deck
    await claimDeck(deck.id, user.id, org.id);

    return NextResponse.json({
      success: true,
      deckId: deck.id,
      organizationSlug: orgSlug,
      redirectUrl: `${config.siteUrl}/s/${orgSlug}`,
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Failed to claim deck' }, { status: 500 });
  }
}
