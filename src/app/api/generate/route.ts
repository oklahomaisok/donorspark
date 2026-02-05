import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/slugify';
import { createDeck, getUserByClerkId, incrementUserDecks } from '@/db/queries';
import type { generateDeckTask } from '@/trigger/tasks/generate-deck';

// Simple in-memory rate limiter
// In production, use Redis/Upstash for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_ANONYMOUS = 5;  // 5 requests per hour for anonymous
const RATE_LIMIT_AUTHENTICATED = 20;  // 20 requests per hour for logged in users
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const body = await req.json();
    const url = body.url || '';
    const orgName = body.orgName || '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check auth (optional - anonymous users can generate)
    let clerkId: string | null = null;
    try {
      const authResult = await auth();
      clerkId = authResult.userId;
    } catch {
      // Clerk not available, treat as anonymous
      clerkId = null;
    }

    // Apply rate limiting
    const rateLimitKey = clerkId || `ip:${ip}`;
    const limit = clerkId ? RATE_LIMIT_AUTHENTICATED : RATE_LIMIT_ANONYMOUS;
    const { allowed, remaining } = checkRateLimit(rateLimitKey, limit);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }
    let dbUserId: number | null = null;

    if (clerkId) {
      const user = await getUserByClerkId(clerkId);
      dbUserId = user?.id ?? null;
    }

    // Generate unique slug
    const baseSlug = slugify(orgName || url.replace(/^https?:\/\//, '').split('/')[0]);
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Trigger the generation task
    const handle = await tasks.trigger<typeof generateDeckTask>('generate-deck', {
      url,
      orgName,
      deckSlug: slug,
    });

    // Create DB record
    await createDeck({
      userId: dbUserId,
      slug,
      orgName: orgName || url,
      orgUrl: url,
      triggerRunId: handle.id,
    });

    // Increment user deck count
    if (clerkId) {
      await incrementUserDecks(clerkId);
    }

    return NextResponse.json({
      slug,
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start generation';
    console.error('Generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
