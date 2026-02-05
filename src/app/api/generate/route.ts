import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/slugify';
import { createDeck } from '@/db/queries';
import type { generateDeckTask } from '@/trigger/tasks/generate-deck';

// Rate limiting disabled for beta testing
// TODO: Re-enable before public launch

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url || '';
    const orgName = body.orgName || '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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
      userId: null,
      slug,
      orgName: orgName || url,
      orgUrl: url,
      triggerRunId: handle.id,
    });

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
