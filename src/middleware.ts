import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SITE_PASSWORD = 'donorspark2026';
const AUTH_COOKIE = 'donorspark_beta_auth';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Routes that don't need password protection
const publicPaths = ['/password', '/api/password'];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip password check for public paths and static files
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for beta access cookie
  const authCookie = req.cookies.get(AUTH_COOKIE);
  if (authCookie?.value !== 'authenticated') {
    // Redirect to password page
    const url = req.nextUrl.clone();
    url.pathname = '/password';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Clerk auth for dashboard
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
