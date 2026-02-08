import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug, getOrganizationDecks } from '@/db/queries';
import { validateDeckToken } from '@/lib/deck-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const token = req.nextUrl.searchParams.get('token');

  // Require valid token
  if (!token || !validateDeckToken(token, orgSlug)) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Access Denied</title></head>
       <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;">
         <div style="text-align:center;padding:2rem;">
           <h1 style="color:#333;margin-bottom:0.5rem;">Access Denied</h1>
           <p style="color:#666;">This content cannot be accessed directly.</p>
         </div>
       </body></html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Find organization by slug
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Get the organization's primary deck
  const decks = await getOrganizationDecks(org.id);
  const primaryDeck = decks.find(d => d.deckType === 'impact' && d.status === 'complete') || decks[0];

  if (!primaryDeck || !primaryDeck.deckUrl) {
    return NextResponse.json({ error: 'No deck found' }, { status: 404 });
  }

  // Fetch deck HTML from Vercel Blob
  try {
    const fetchUrl = `${primaryDeck.deckUrl}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 502 });
  }
}
