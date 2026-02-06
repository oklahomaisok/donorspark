import { task } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { put } from '@vercel/blob';
import {
  createDeck,
  completeDeck,
  failDeck,
  updateDonorUploadProgress,
  completeDonorUpload,
  failDonorUpload,
  getDeckById,
} from '@/db/queries';
import { generateDonorSlug, generateUniqueDonorSlug } from '@/lib/utils/slug';
import { generateDeckHtml, type DeckOptions } from '@/lib/templates/deck-template';
import type { BrandData } from '@/lib/types';

interface DonorInfo {
  name: string;
  email?: string;
  amount?: string;
}

interface TaskPayload {
  uploadId: number;
  baseDeckId: number;
  organizationId: number;
  organizationSlug: string;
  donors: DonorInfo[];
}

export const generateDonorDecksTask = task({
  id: 'generate-donor-decks',
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 60000,
  },
  run: async (payload: TaskPayload) => {
    const { uploadId, baseDeckId, organizationId, organizationSlug, donors } = payload;

    console.log(`Starting donor deck generation for upload ${uploadId} with ${donors.length} donors`);

    // Get the base deck for brand data
    const baseDeck = await getDeckById(baseDeckId);
    if (!baseDeck || !baseDeck.brandData) {
      await failDonorUpload(uploadId);
      throw new Error('Base deck or brand data not found');
    }

    const brandData = baseDeck.brandData as unknown as BrandData;
    let processedCount = 0;
    const errors: string[] = [];

    for (const donor of donors) {
      try {
        // Generate donor slug
        let donorSlug = generateDonorSlug(donor.name);
        // Add a short suffix to ensure uniqueness
        donorSlug = generateUniqueDonorSlug(donor.name);

        // Create unique deck slug
        const deckSlug = `${organizationSlug}-thankyou-${donorSlug}-${nanoid(4)}`;

        // Create deck record
        const deck = await createDeck({
          userId: baseDeck.userId,
          organizationId,
          slug: deckSlug,
          orgName: baseDeck.orgName,
          orgUrl: baseDeck.orgUrl,
          deckType: 'thankyou',
          donorName: donor.name,
          donorSlug,
          donorEmail: donor.email,
          donorAmount: donor.amount,
          parentDeckId: baseDeckId,
        });

        // Generate personalized deck HTML
        const options: DeckOptions = {
          isPreviewMode: false,
          donorName: donor.name,
          donorAmount: donor.amount,
        };

        // Modify brand data for thank-you deck
        const thankYouBrandData: BrandData = {
          ...brandData,
          donorHeadline: `Thank You, ${donor.name.split(' ')[0]}!`,
          heroHook: donor.amount
            ? `Your generous gift of ${donor.amount} is making a real difference.`
            : `Your generous support is making a real difference in our community.`,
        };

        const html = generateDeckHtml(deckSlug, thankYouBrandData, options);

        // Upload to Vercel Blob
        const deckBlob = await put(`decks/${deckSlug}.html`, html, {
          access: 'public',
          contentType: 'text/html',
        });

        // Mark deck as complete
        await completeDeck(deckSlug, {
          deckUrl: deckBlob.url,
          ogImageUrl: baseDeck.ogImageUrl || '', // Reuse base deck OG for now
          sector: baseDeck.sector || undefined,
          brandData: thankYouBrandData,
        });

        processedCount++;
        await updateDonorUploadProgress(uploadId, processedCount);

        console.log(`Generated deck for ${donor.name}: ${deckSlug}`);
      } catch (error) {
        console.error(`Error generating deck for ${donor.name}:`, error);
        errors.push(`${donor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Complete the upload
    if (errors.length === donors.length) {
      // All failed
      await failDonorUpload(uploadId);
      throw new Error(`All deck generations failed: ${errors.join('; ')}`);
    } else {
      await completeDonorUpload(uploadId, ''); // URL will be generated on download
    }

    return {
      uploadId,
      total: donors.length,
      successful: processedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
