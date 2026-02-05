import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'donorspark_beta_auth';

// Paths that skip password check
function isPublicPath(pathname: string): boolean {
  if (pathname === '/password') return true;
  if (pathname.startsWith('/api/password')) return true;
  // Allow static files (but not API routes)
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip password check for public paths
  if (isPublicPath(pathname)) {
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
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
