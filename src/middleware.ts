import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'donorspark_beta_auth';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip password check for these paths
  if (
    pathname === '/password' ||
    pathname.startsWith('/api/password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
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

  // For dashboard routes, also check Clerk auth
  if (isDashboardRoute(req)) {
    return clerkMiddleware(async (auth) => {
      await auth.protect();
      return NextResponse.next();
    })(req, {} as any);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
