import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to ensure Clerk env vars are available
export const dynamic = 'force-dynamic';
import {
  getUserByClerkId,
  getUserDecks,
  getUserOrganizations,
  incrementDashboardVisits,
  upsertUser,
} from '@/db/queries';
import { config } from '@/lib/config';
import { PrimaryDeckCard } from '@/components/dashboard/primary-deck-card';
import { DeckTypeCards } from '@/components/dashboard/deck-type-cards';
import { EditFeatures } from '@/components/dashboard/edit-features';
import { AnalyticsSection } from '@/components/dashboard/analytics-section';
import { VerificationWarning } from '@/components/dashboard/verification-warning';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ClaimedModalWrapper } from '@/components/dashboard/claimed-modal-wrapper';
import { DeckCounter } from '@/components/dashboard/deck-counter';
import type { Plan } from '@/db/schema';
import type { PlanType } from '@/lib/stripe';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; claimed?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  let user = await getUserByClerkId(clerkId);

  // If user doesn't exist in DB, create them (fallback for when Clerk webhook hasn't fired)
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) redirect('/sign-in');

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;
    user = await upsertUser(clerkId, email, name);
  }

  // Track dashboard visit
  await incrementDashboardVisits(user.id);

  const decks = await getUserDecks(user.id);
  const organizations = await getUserOrganizations(user.id);

  // Get the primary organization and its deck
  const primaryOrg = organizations[0];
  const primaryDeck = decks.find(
    (d) => d.organizationId === primaryOrg?.id && d.deckType === 'impact' && d.status === 'complete'
  ) || decks.find((d) => d.status === 'complete');

  // Count parent decks (not personalized donor decks) for the deck counter
  const parentDeckCount = decks.filter((d) => !d.parentDeckId && d.status === 'complete').length;

  // Handle query params errors
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    invalid_token: 'Invalid claim link. The deck may have already been claimed.',
    already_claimed: 'This deck has already been claimed.',
    expired: 'This deck has expired and can no longer be claimed.',
    claim_failed: 'Failed to claim deck. Please try again.',
  };
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Error Toast */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Verification Warning */}
      <VerificationWarning user={user} />

      {/* Upgrade Banner (for free users with 3+ dashboard visits) */}
      <UpgradeBanner user={user} />

      {/* Claimed Modal (shows when redirected from claim flow) */}
      {primaryOrg && (
        <ClaimedModalWrapper
          orgName={primaryOrg.name}
          deckUrl={`${config.siteUrl}/s/${primaryOrg.slug}`}
        />
      )}

      {/* Header */}
      <DashboardHeader
        user={user}
        orgName={primaryOrg?.name || null}
        hasExistingDeck={!!primaryDeck}
      />

      {/* Deck Counter */}
      {primaryDeck && (
        <div className="mb-6">
          <DeckCounter
            currentCount={parentDeckCount}
            plan={user.plan as PlanType}
          />
        </div>
      )}

      {/* Main Content */}
      {primaryDeck && primaryOrg ? (
        <>
          {/* Primary Deck Card */}
          <PrimaryDeckCard
            deck={primaryDeck}
            organization={primaryOrg}
            siteUrl={config.siteUrl}
            userPlan={user.plan as Plan}
          />

          {/* Deck Type Cards with Preview Modal */}
          <DeckTypeCards
            currentPlan={user.plan as Plan}
            previewData={{
              orgName: primaryOrg.name,
              sector: primaryDeck.sector || 'community',
              colors: {
                primary: (primaryDeck.brandData as Record<string, unknown>)?.colors
                  ? ((primaryDeck.brandData as Record<string, unknown>).colors as { primary?: string })?.primary || '#1D2350'
                  : '#1D2350',
                accent: (primaryDeck.brandData as Record<string, unknown>)?.colors
                  ? ((primaryDeck.brandData as Record<string, unknown>).colors as { accent?: string })?.accent || '#FFC303'
                  : '#FFC303',
              },
              fonts: {
                headingFont: (primaryDeck.brandData as Record<string, unknown>)?.fonts
                  ? ((primaryDeck.brandData as Record<string, unknown>).fonts as { headingFont?: string })?.headingFont || 'Montserrat'
                  : 'Montserrat',
                bodyFont: (primaryDeck.brandData as Record<string, unknown>)?.fonts
                  ? ((primaryDeck.brandData as Record<string, unknown>).fonts as { bodyFont?: string })?.bodyFont || 'Roboto'
                  : 'Roboto',
              },
              logoUrl: (primaryDeck.brandData as Record<string, unknown>)?.logoUrl as string | undefined,
            }}
          />

          {/* Edit Features */}
          <EditFeatures currentPlan={user.plan as Plan} />

          {/* Analytics */}
          <AnalyticsSection decks={decks} />
        </>
      ) : decks.length > 0 ? (
        // User has decks but none are complete or no org
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Deck Generating...</h2>
          <p className="text-neutral-500 mb-6">
            Your deck is still being generated. This usually takes 1-2 minutes.
          </p>
          <RefreshButton />
        </div>
      ) : (
        // Empty state - no decks
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#C15A36]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">No Decks Yet</h2>
          <p className="text-neutral-500 mb-6">
            Generate your first impact deck to get started.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors"
          >
            Generate Your First Deck
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
