import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';
import { slugify } from '@/lib/slugify';
import { createDeck, getUserByClerkId, createOrganization, getUserOrganizations } from '@/db/queries';
import { generateOrgSlug } from '@/lib/utils/slug';
import type { generateDeckTask } from '@/trigger/tasks/generate-deck';

// Simple in-memory rate limiter (10 requests per hour per IP)
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Anonymous deck TTL: 48 hours
const ANONYMOUS_TTL_MS = 48 * 60 * 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + RATE_WINDOW_MS;
    requestCounts.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetAt: record.resetAt };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // Clean every minute

// Get geolocation from IP using ip-api.com (free, no key required)
async function getGeoFromIp(ip: string): Promise<{
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
} | null> {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return null;
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`, {
      signal: AbortSignal.timeout(2000), // 2s timeout
    });
    const data = await res.json();
    if (data.status === 'success') {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
        lat: data.lat,
        lng: data.lon,
      };
    }
  } catch {
    // Silently fail - geolocation is not critical
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for geolocation (and fallback rate limiting)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check if user is authenticated first (for rate limiting)
    const { userId: clerkId } = await auth();
    let dbUserId: number | null = null;
    let organizationId: number | null = null;
    let dbUser: Awaited<ReturnType<typeof getUserByClerkId>> | null = null;

    if (clerkId) {
      dbUser = await getUserByClerkId(clerkId);
      if (dbUser) {
        dbUserId = dbUser.id;
      }
    }

    // Rate limit by user ID (if authenticated) or IP (if anonymous)
    // This prevents IP spoofing bypass for authenticated users
    const rateLimitKey = dbUserId ? `user:${dbUserId}` : `ip:${ip}`;

    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minutes.` },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    const body = await req.json();
    let url = (body.url || '').trim();
    const orgName = body.orgName || '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL: add https:// if no protocol specified
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Please enter a valid website URL.' }, { status: 400 });
    }

    // Continue with user/org setup if authenticated
    if (dbUser) {
      // Check if user already has an org for this website
      const existingOrgs = await getUserOrganizations(dbUser.id);
      const existingOrg = existingOrgs.find(
        (org) => org.websiteUrl === url || org.name === orgName
      );

      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        // Create new organization
        const orgSlug = await generateOrgSlug(orgName || url);
        const newOrg = await createOrganization({
          userId: dbUser.id,
          name: orgName || new URL(url).hostname.replace('www.', ''),
          slug: orgSlug,
          websiteUrl: url,
        });
        organizationId = newOrg.id;
      }
    }

    // Generate unique slug
    const baseSlug = slugify(orgName || url.replace(/^https?:\/\//, '').split('/')[0]);
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Generate temp token for anonymous claim flow (only if not logged in)
    const tempToken = dbUserId ? undefined : nanoid(32);
    const expiresAt = dbUserId ? undefined : new Date(Date.now() + ANONYMOUS_TTL_MS);

    // Get geolocation (non-blocking, don't wait too long)
    const geo = await getGeoFromIp(ip);

    // Trigger the generation task
    const handle = await tasks.trigger<typeof generateDeckTask>('generate-deck', {
      url,
      orgName,
      deckSlug: slug,
    });

    // Create DB record with location data
    await createDeck({
      userId: dbUserId,
      organizationId,
      slug,
      orgName: orgName || url,
      orgUrl: url,
      triggerRunId: handle.id,
      tempToken,
      expiresAt,
      city: geo?.city,
      region: geo?.region,
      country: geo?.country,
      lat: geo?.lat,
      lng: geo?.lng,
    });

    // Build response with cookie
    const response = NextResponse.json(
      {
        slug,
        runId: handle.id,
        publicAccessToken: handle.publicAccessToken,
        tempToken, // Return token for client-side use
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
        }
      }
    );

    // Set httpOnly cookie for temp token (only for anonymous users)
    if (tempToken) {
      response.cookies.set('ds_temp_token', tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 48 * 60 * 60, // 48 hours in seconds
        path: '/',
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start generation';
    console.error('Generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
