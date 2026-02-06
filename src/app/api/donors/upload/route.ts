import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import {
  getUserByClerkId,
  getDeckById,
  getOrganizationById,
  createDonorUpload,
} from '@/db/queries';
import type { generateDonorDecksTask } from '@/trigger/tasks/generate-donor-decks';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check plan access
    if (user.plan !== 'growth') {
      return NextResponse.json({ error: 'Growth plan required' }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const baseDeckId = parseInt(formData.get('baseDeckId') as string);

    if (!file || !baseDeckId) {
      return NextResponse.json({ error: 'Missing file or baseDeckId' }, { status: 400 });
    }

    // Verify base deck belongs to user
    const baseDeck = await getDeckById(baseDeckId);
    if (!baseDeck || baseDeck.userId !== user.id) {
      return NextResponse.json({ error: 'Invalid base deck' }, { status: 400 });
    }

    // Get organization and verify ownership
    const org = baseDeck.organizationId ? await getOrganizationById(baseDeck.organizationId) : null;
    if (!org) {
      return NextResponse.json({ error: 'No organization found for deck' }, { status: 400 });
    }
    if (org.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'donor_name' || h === 'full_name');
    const emailIndex = headers.findIndex(h => h === 'email' || h === 'donor_email');
    const amountIndex = headers.findIndex(h => h === 'amount' || h === 'donation_amount' || h === 'gift_amount');

    if (nameIndex === -1) {
      return NextResponse.json({ error: 'CSV must have a "name" column' }, { status: 400 });
    }

    // CSV injection prevention - sanitize fields that start with formula characters
    const sanitizeField = (value: string | undefined): string | undefined => {
      if (!value) return undefined;
      // Remove leading characters that could trigger Excel formula injection
      const dangerous = /^[=+\-@\t\r]/;
      if (dangerous.test(value)) {
        return value.replace(dangerous, '');
      }
      return value;
    };

    // Parse donors
    const donors: Array<{ name: string; email?: string; amount?: string }> = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const name = sanitizeField(cols[nameIndex]);
      if (!name) continue;

      donors.push({
        name,
        email: sanitizeField(emailIndex !== -1 ? cols[emailIndex] : undefined),
        amount: sanitizeField(amountIndex !== -1 ? cols[amountIndex] : undefined),
      });
    }

    if (donors.length === 0) {
      return NextResponse.json({ error: 'No valid donors found in CSV' }, { status: 400 });
    }

    // Limit to 500 donors per upload
    if (donors.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 donors per upload' }, { status: 400 });
    }

    // Create donor upload record
    const upload = await createDonorUpload({
      userId: user.id,
      organizationId: org.id,
      baseDeckId: baseDeck.id,
      fileName: file.name,
      donorCount: donors.length,
    });

    // Trigger the batch generation task
    await tasks.trigger<typeof generateDonorDecksTask>('generate-donor-decks', {
      uploadId: upload.id,
      baseDeckId: baseDeck.id,
      organizationId: org.id,
      organizationSlug: org.slug,
      donors,
    });

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      donorCount: donors.length,
    });
  } catch (error) {
    console.error('Donor upload error:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}
