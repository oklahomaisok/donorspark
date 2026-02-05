import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'donorspark_beta_auth';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Routes that don't need password protection
const isPublicPath = (pathname: string) => {
  return pathname === '/password' ||
         pathname.startsWith('/api/password') ||
         pathname.startsWith('/_next') ||
         pathname.startsWith('/favicon') ||
         pathname.includes('.');  // static files
};

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip password check for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for beta access cookie
  const authCookie = req.cookies.get(AUTH_COOKIE);

  if (authCookie?.value !== 'authenticated') {
    // Redirect to password page
    const url = new URL('/password', req.url);
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
