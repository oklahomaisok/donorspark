import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';
import { slugify } from '@/lib/slugify';
import { createDeck, getUserByClerkId, getUserDecks, countRecentDeckGenerations } from '@/db/queries';
import { getDeckLimit, type PlanType } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rate-limit';
import type { generateManualDeckTask } from '@/trigger/tasks/generate-manual-deck';

const RATE_LIMIT = 10;
const ANONYMOUS_TTL_MS = 24 * 60 * 60 * 1000;

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
      signal: AbortSignal.timeout(2000),
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
    // Geolocation is not critical
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check auth
    const { userId: clerkId } = await auth();
    let dbUserId: number | null = null;
    let dbUser: Awaited<ReturnType<typeof getUserByClerkId>> | null = null;

    if (clerkId) {
      dbUser = await getUserByClerkId(clerkId);
      if (dbUser) {
        dbUserId = dbUser.id;

        // Check deck limit
        const userDecks = await getUserDecks(dbUser.id);
        const parentDeckCount = userDecks.filter(d => !d.parentDeckId && d.status === 'complete').length;
        const deckLimit = getDeckLimit(dbUser.plan as PlanType);

        if (parentDeckCount >= deckLimit) {
          return NextResponse.json(
            {
              error: 'deck_limit_reached',
              message: `You've reached your limit of ${deckLimit} deck${deckLimit === 1 ? '' : 's'}. Upgrade your plan to create more.`,
              currentCount: parentDeckCount,
              limit: deckLimit,
              plan: dbUser.plan,
            },
            { status: 403 }
          );
        }

        // Check weekly limit
        const WEEKLY_GENERATION_LIMIT = 5;
        const recentGenerations = await countRecentDeckGenerations(dbUser.id, 7);

        if (recentGenerations >= WEEKLY_GENERATION_LIMIT) {
          const oldestInWindow = userDecks
            .filter(d => !d.parentDeckId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .find(d => {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return d.createdAt > sevenDaysAgo;
            });

          const resetDate = oldestInWindow
            ? new Date(oldestInWindow.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);

          const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

          return NextResponse.json(
            {
              error: 'weekly_limit_reached',
              message: `You've reached the limit of ${WEEKLY_GENERATION_LIMIT} deck generations per week. You can generate a new deck in ${daysUntilReset} day${daysUntilReset === 1 ? '' : 's'}.`,
              recentGenerations,
              limit: WEEKLY_GENERATION_LIMIT,
              resetDate: resetDate.toISOString(),
              daysUntilReset,
            },
            { status: 429 }
          );
        }
      }
    }

    // Rate limit
    const rateLimitKey = dbUserId ? `user:${dbUserId}` : `ip:${ip}`;
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, RATE_LIMIT);

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
    const {
      orgName,
      description,
      beneficiaries,
      sector,
      location,
      yearFounded,
      programs,
      metrics,
      contactEmail,
      donateUrl,
      logoUrl,
      primaryColor,
      accentColor,
    } = body;

    // Validate required fields
    if (!orgName?.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!beneficiaries?.trim()) {
      return NextResponse.json({ error: 'Beneficiaries information is required' }, { status: 400 });
    }
    if (!sector?.trim()) {
      return NextResponse.json({ error: 'Sector is required' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slugify(orgName.trim());
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Generate temp token for anonymous claim
    const tempToken = dbUserId ? undefined : nanoid(32);
    const expiresAt = dbUserId ? undefined : new Date(Date.now() + ANONYMOUS_TTL_MS);

    // Get geolocation
    const geo = await getGeoFromIp(ip);

    // Trigger the manual generation task
    const handle = await tasks.trigger<typeof generateManualDeckTask>('generate-manual-deck', {
      deckSlug: slug,
      orgName: orgName.trim(),
      description: description.trim(),
      beneficiaries: beneficiaries.trim(),
      sector: sector.trim(),
      location: location?.trim() || undefined,
      yearFounded: yearFounded ? Number(yearFounded) : undefined,
      programs: programs?.filter((p: string) => p.trim()) || undefined,
      metrics: metrics?.filter((m: { value: string; label: string }) => m.value?.trim() && m.label?.trim()) || undefined,
      contactEmail: contactEmail?.trim() || undefined,
      donateUrl: donateUrl?.trim() || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor: primaryColor || undefined,
      accentColor: accentColor || undefined,
    });

    // Create DB record
    await createDeck({
      userId: dbUserId,
      slug,
      orgName: orgName.trim(),
      orgUrl: '',
      triggerRunId: handle.id,
      tempToken,
      expiresAt,
      source: 'manual',
      city: geo?.city,
      region: geo?.region,
      country: geo?.country,
      lat: geo?.lat,
      lng: geo?.lng,
    });

    // Build response
    const response = NextResponse.json(
      {
        slug,
        runId: handle.id,
        publicAccessToken: handle.publicAccessToken,
        tempToken,
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
        }
      }
    );

    if (tempToken) {
      response.cookies.set('ds_temp_token', tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 48 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start generation';
    console.error('Generate-manual error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
