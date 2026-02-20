import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';
import {
  getDeckByTempToken,
  getUserByClerkId,
  getUserDecks,
  upsertUser,
  claimDeck,
  createOrganization,
} from '@/db/queries';
import { getDeckLimit } from '@/lib/stripe';
import type { PlanType } from '@/lib/stripe';
import { generateOrgSlug } from '@/lib/utils/slug';
import { config } from '@/lib/config';
import { sendWelcomeEmail } from '@/lib/resend';

export async function GET(req: NextRequest) {
  const tempToken = req.nextUrl.searchParams.get('tempToken');

  if (!tempToken) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard`);
  }

  // Verify user is authenticated
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    const redirectUrl = encodeURIComponent(`/api/claim?tempToken=${tempToken}`);
    return NextResponse.redirect(`${config.siteUrl}/sign-in?redirect_url=${redirectUrl}`);
  }

  // Get user from database (fallback: create from Clerk data if webhook hasn't fired yet)
  let user = await getUserByClerkId(clerkId);
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      const redirectUrl = encodeURIComponent(`/api/claim?tempToken=${tempToken}`);
      return NextResponse.redirect(`${config.siteUrl}/sign-in?redirect_url=${redirectUrl}`);
    }
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;
    user = await upsertUser(clerkId, email, name);
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

  // Check if user has reached their plan's deck limit
  const userDecks = await getUserDecks(user.id);
  const parentDeckCount = userDecks.filter((d) => !d.parentDeckId && d.status === 'complete').length;
  const deckLimit = getDeckLimit((user.plan || 'free') as PlanType);
  if (parentDeckCount >= deckLimit) {
    return NextResponse.redirect(`${config.siteUrl}/dashboard?error=deck_limit`);
  }

  try {
    // Generate a unique org slug (handles collision checking)
    const orgSlug = await generateOrgSlug(deck.orgName);

    // Create organization from deck data
    const org = await createOrganization({
      userId: user.id,
      name: deck.orgName,
      slug: orgSlug,
      websiteUrl: deck.orgUrl || undefined,
      brandData: deck.brandData as Record<string, unknown> | undefined,
    });

    // Claim the deck
    await claimDeck(deck.id, user.id, org.id);

    // Clear the temp token cookie
    const cookieStore = await cookies();
    cookieStore.delete('ds_temp_token');

    // Send welcome email (async, don't block redirect)
    const deckUrl = `${config.siteUrl}/s/${orgSlug}`;
    QRCode.toDataURL(deckUrl, { width: 512, margin: 2 })
      .then((qrCodeDataUrl) => {
        sendWelcomeEmail(user.email, user.name || undefined, {
          orgName: deck.orgName,
          deckUrl,
          qrCodeDataUrl,
        }).catch((err) => console.error('Welcome email failed:', err));
      })
      .catch((err) => console.error('QR code generation failed:', err));

    // Redirect to welcome page with org name for onboarding
    return NextResponse.redirect(`${config.siteUrl}/welcome?org=${encodeURIComponent(deck.orgName)}`);
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

  // Get user from database (fallback: create from Clerk data if webhook hasn't fired yet)
  let user = await getUserByClerkId(clerkId);
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;
    user = await upsertUser(clerkId, email, name);
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

  // Check if user has reached their plan's deck limit
  const userDecks = await getUserDecks(user.id);
  const parentDeckCount = userDecks.filter((d) => !d.parentDeckId && d.status === 'complete').length;
  const deckLimit = getDeckLimit((user.plan || 'free') as PlanType);
  if (parentDeckCount >= deckLimit) {
    return NextResponse.json({ error: 'Deck limit reached. Delete an existing deck or upgrade your plan.' }, { status: 403 });
  }

  try {
    // Generate a unique org slug (handles collision checking)
    const orgSlug = await generateOrgSlug(deck.orgName);

    // Create organization from deck data
    const org = await createOrganization({
      userId: user.id,
      name: deck.orgName,
      slug: orgSlug,
      websiteUrl: deck.orgUrl || undefined,
      brandData: deck.brandData as Record<string, unknown> | undefined,
    });

    // Claim the deck
    await claimDeck(deck.id, user.id, org.id);

    // Send welcome email (async, don't block response)
    const deckUrl = `${config.siteUrl}/s/${orgSlug}`;
    QRCode.toDataURL(deckUrl, { width: 512, margin: 2 })
      .then((qrCodeDataUrl) => {
        sendWelcomeEmail(user.email, user.name || undefined, {
          orgName: deck.orgName,
          deckUrl,
          qrCodeDataUrl,
        }).catch((err) => console.error('Welcome email failed:', err));
      })
      .catch((err) => console.error('QR code generation failed:', err));

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
