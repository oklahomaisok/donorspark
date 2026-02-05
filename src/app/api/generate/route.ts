import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/slugify';
import { createDeck, getUserByClerkId, incrementUserDecks } from '@/db/queries';
import type { generateDeckTask } from '@/trigger/tasks/generate-deck';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url || '';
    const orgName = body.orgName || '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check auth (optional - anonymous users can generate)
    const { userId: clerkId } = await auth();
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
