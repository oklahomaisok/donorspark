import { NextRequest, NextResponse } from 'next/server';
import { getDeckBySlug } from '@/db/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck || !deck.ogImageUrl) {
    return NextResponse.json({ error: 'OG image not found' }, { status: 404 });
  }

  // Redirect to the actual Vercel Blob URL
  return NextResponse.redirect(deck.ogImageUrl, 302);
}
