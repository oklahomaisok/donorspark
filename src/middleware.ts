import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'donorspark_beta_auth';

// Paths that skip password check
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/password' ||
    pathname.startsWith('/api/password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
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

  // Continue with Clerk auth available
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
