import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDeckBySlug } from '@/db/queries';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import { uploadDeckHtml } from '@/lib/services/blob-storage';
import type { BrandData } from '@/lib/types';

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { slug, programs, directHtmlUpdate } = body;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Fetch deck from database
  const result = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  const deck = result[0];

  // If deck exists in DB and has brand data, use the normal regeneration flow
  if (deck?.brandData) {
    const updatedBrandData: BrandData = {
      ...(deck.brandData as unknown as BrandData),
      programs: programs || (deck.brandData as unknown as BrandData).programs,
    };

    const newHtml = generateDeckHtml(slug, updatedBrandData);
    const deckUrl = await uploadDeckHtml(slug, newHtml);

    await db.update(decks)
      .set({
        brandData: updatedBrandData as unknown as Record<string, unknown>,
        deckUrl,
        updatedAt: new Date(),
      })
      .where(eq(decks.slug, slug));

    return NextResponse.json({
      success: true,
      slug,
      deckUrl,
      programs: updatedBrandData.programs
    });
  }

  // If deck doesn't exist or no brand data, try direct HTML modification
  if (directHtmlUpdate && programs) {
    try {
      // Fetch current HTML from the live deck URL
      const deckResponse = await fetch(`https://donorspark.app/decks/${slug}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!deckResponse.ok) {
        return NextResponse.json({
          error: 'Could not fetch deck HTML',
          status: deckResponse.status
        }, { status: 404 });
      }

      let html = await deckResponse.text();

      // Find and replace the programs section
      // The programs are in a flex-wrap div with specific span patterns
      const programsPattern = /<div class="flex flex-wrap gap-2">([\s\S]*?)<\/div><\/div><\/div>\s*<\/section>\s*<!-- Slide/;
      const match = html.match(programsPattern);

      if (match) {
        const newProgramsHtml = programs.map((p: string) =>
          `\n<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">${escapeHtml(p)}</span>`
        ).join('');

        html = html.replace(
          programsPattern,
          `<div class="flex flex-wrap gap-2">${newProgramsHtml}\n</div></div></div>\n            </section>\n        <!-- Slide`
        );
      }

      // Upload modified HTML to Blob
      const deckUrl = await uploadDeckHtml(slug, html);

      // Create or update database entry
      if (deck) {
        await db.update(decks)
          .set({ deckUrl, updatedAt: new Date() })
          .where(eq(decks.slug, slug));
      } else {
        await db.insert(decks).values({
          slug,
          orgName: extractOrgName(html) || slug,
          orgUrl: `https://donorspark.app/decks/${slug}`,
          status: 'complete',
          deckUrl,
        });
      }

      return NextResponse.json({
        success: true,
        slug,
        deckUrl,
        programs,
        method: 'directHtmlUpdate'
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to update deck HTML',
        details: String(error)
      }, { status: 500 });
    }
  }

  // List available slugs for debugging
  const allDecks = await db.select({ slug: decks.slug }).from(decks).limit(20);
  return NextResponse.json({
    error: 'Deck not found in database. Use directHtmlUpdate: true to modify HTML directly.',
    searchedSlug: slug,
    availableSlugs: allDecks.map(d => d.slug)
  }, { status: 404 });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function extractOrgName(html: string): string | null {
  const match = html.match(/<title>([^|]+)\s*\|/);
  return match ? match[1].trim() : null;
}
