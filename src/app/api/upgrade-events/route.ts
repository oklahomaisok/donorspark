import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, createUpgradeEvent } from '@/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { eventType, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Missing eventType' }, { status: 400 });
    }

    // Only track for free users
    if (user.plan !== 'free') {
      return NextResponse.json({ success: true, message: 'User already on paid plan' });
    }

    // Create the upgrade event
    await createUpgradeEvent({
      userId: user.id,
      eventType,
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upgrade event error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
