import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserByClerkId, getUserOrganizations } from '@/db/queries';
import { WelcomeContent } from './welcome-content';

export const dynamic = 'force-dynamic';

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect('/sign-in');

  // If onboarding is already completed, go to dashboard
  if (user.onboardingCompletedAt) {
    redirect('/dashboard');
  }

  // Get org name from query param or from user's organizations
  const params = await searchParams;
  let orgName = params.org;

  if (!orgName) {
    const orgs = await getUserOrganizations(user.id);
    orgName = orgs[0]?.name;
  }

  return (
    <Suspense fallback={<WelcomeSkeleton />}>
      <WelcomeContent orgName={orgName} />
    </Suspense>
  );
}

function WelcomeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F4] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-32 mx-auto mb-8" />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="h-20 w-20 bg-neutral-100 rounded-full mx-auto mb-6" />
          <div className="h-8 bg-neutral-200 rounded w-3/4 mx-auto mb-4" />
          <div className="h-4 bg-neutral-100 rounded w-1/2 mx-auto mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-neutral-100 rounded-lg" />
            <div className="h-12 bg-neutral-100 rounded-lg" />
            <div className="h-12 bg-neutral-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
