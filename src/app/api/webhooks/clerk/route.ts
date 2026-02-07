import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import QRCode from 'qrcode';
import {
  upsertUser,
  getDeckByTempToken,
  claimDeck,
  createOrganization,
  getOrganizationBySlug,
  getUserByClerkId,
} from '@/db/queries';
import { generateOrgSlug } from '@/lib/utils/slug';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { sendWelcomeEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: { type: string; data: Record<string, unknown> };

  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const data = event.data;
    const clerkId = data.id as string;
    const emailAddresses = data.email_addresses as Array<{ email_address: string }>;
    const email = emailAddresses?.[0]?.email_address || '';
    const firstName = (data.first_name as string) || '';
    const lastName = (data.last_name as string) || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    // Upsert user in database
    await upsertUser(clerkId, email, name);

    // For new users, try to auto-claim a deck if temp token cookie exists
    if (event.type === 'user.created') {
      await tryAutoClaimDeck(clerkId);
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Attempt to auto-claim a deck using the temp token from cookie.
 * This is called after a new user is created.
 */
async function tryAutoClaimDeck(clerkId: string) {
  try {
    // Get temp token from cookie
    const cookieStore = await cookies();
    const tempToken = cookieStore.get('ds_temp_token')?.value;

    if (!tempToken) {
      console.log('No temp token cookie found for auto-claim');
      return;
    }

    // Get deck by temp token
    const deck = await getDeckByTempToken(tempToken);
    if (!deck) {
      console.log('No deck found for temp token');
      return;
    }

    // Check if deck is already claimed
    if (deck.userId) {
      console.log('Deck already claimed');
      return;
    }

    // Check if deck is expired
    if (deck.isExpired || (deck.expiresAt && new Date(deck.expiresAt) < new Date())) {
      console.log('Deck expired, cannot auto-claim');
      return;
    }

    // Get user from database
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      console.log('User not found in database');
      return;
    }

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

    console.log(`Auto-claimed deck ${deck.id} for user ${user.id}, org slug: ${orgSlug}`);

    // Send welcome email with QR code
    const deckUrl = `${config.siteUrl}/s/${orgSlug}`;
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(deckUrl, { width: 512, margin: 2 });
      await sendWelcomeEmail(user.email, user.name || undefined, {
        orgName: deck.orgName,
        deckUrl,
        qrCodeDataUrl,
      });
      console.log(`Sent welcome email to ${user.email}`);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't throw - email failure shouldn't break the claim
    }

    // Note: We can't delete the cookie here because webhooks don't have access to the response
    // The cookie will be cleaned up on the next claim attempt or expire naturally
  } catch (error) {
    console.error('Auto-claim error:', error);
    // Don't throw - auto-claim failure shouldn't break user creation
  }
}
