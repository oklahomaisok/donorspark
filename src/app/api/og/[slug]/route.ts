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

  // Proxy the image from Vercel Blob (some platforms don't follow redirects)
  try {
    const response = await fetch(deck.ogImageUrl);
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch OG image' }, { status: 502 });
  }
}
