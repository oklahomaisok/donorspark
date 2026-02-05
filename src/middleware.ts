import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'donorspark_beta_auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow password page and API
  if (pathname === '/password' || pathname.startsWith('/api/password')) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Check for beta access cookie
  const authCookie = req.cookies.get(AUTH_COOKIE);

  if (authCookie?.value !== 'authenticated') {
    const url = new URL('/password', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
