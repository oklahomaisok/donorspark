import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug } from '@/db/queries';
import { validateDeckToken } from '@/lib/deck-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const token = req.nextUrl.searchParams.get('token');

  // Require valid token (uses orgSlug + '-site' as the token slug)
  if (!token || !validateDeckToken(token, orgSlug + '-site')) {
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
  if (!org || !org.websiteHtmlUrl) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  }

  // Fetch website HTML from Vercel Blob
  try {
    const fetchUrl = `${org.websiteHtmlUrl}?t=${Date.now()}`;
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
    return NextResponse.json({ error: 'Failed to fetch website' }, { status: 502 });
  }
}
