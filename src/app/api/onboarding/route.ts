import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, completeOnboarding } from '@/db/queries';

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

    // Validate required fields
    const { firstName, lastName, role, organizationName, organizationSize, primaryGoal, primaryGoalOther } = body;

    if (!firstName?.trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }
    if (!organizationName?.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Save onboarding data
    await completeOnboarding(user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      organizationName: organizationName.trim(),
      organizationSize: organizationSize || undefined,
      primaryGoal: primaryGoal || undefined,
      primaryGoalOther: primaryGoal === 'other' ? primaryGoalOther?.trim() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
  }
}
