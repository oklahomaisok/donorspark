import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, getDonorUploadById, getPersonalizedDecks, getDeckById, getOrganizationById } from '@/db/queries';
import { config } from '@/lib/config';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;

    // Verify user is authenticated
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get upload
    const upload = await getDonorUploadById(parseInt(uploadId));
    if (!upload || upload.userId !== user.id) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    // If we have a pre-generated results URL, redirect to it
    if (upload.resultsCsvUrl) {
      return NextResponse.redirect(upload.resultsCsvUrl);
    }

    // Otherwise, generate the CSV dynamically
    const baseDeck = await getDeckById(upload.baseDeckId);
    if (!baseDeck) {
      return NextResponse.json({ error: 'Base deck not found' }, { status: 404 });
    }

    const org = baseDeck.organizationId ? await getOrganizationById(baseDeck.organizationId) : null;
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    if (org.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all personalized decks for this base deck
    const personalizedDecks = await getPersonalizedDecks(baseDeck.id);

    // Build CSV
    const rows = [['name', 'email', 'amount', 'deck_url', 'status']];

    for (const deck of personalizedDecks) {
      const url = deck.status === 'complete' && deck.donorSlug
        ? `${config.siteUrl}/s/${org.slug}/thankyou/${deck.donorSlug}`
        : '';

      rows.push([
        deck.donorName || '',
        deck.donorEmail || '',
        deck.donorAmount || '',
        url,
        deck.status,
      ]);
    }

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="donor-decks-${uploadId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to generate download' }, { status: 500 });
  }
}
