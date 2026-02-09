import { redirect } from 'next/navigation';
import { getDeckByTempToken } from '@/db/queries';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { CountdownTimer } from './countdown-timer';

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ tempToken: string }>;
}) {
  const { tempToken } = await params;

  // Verify the temp token exists and deck is valid
  const deck = await getDeckByTempToken(tempToken);

  if (!deck) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6"/>
              <path d="m9 9 6 6"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Invalid Claim Link</h1>
          <p className="text-neutral-500 mb-6">
            This claim link is invalid or has already been used.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full font-semibold hover:bg-[#a84d2e] transition-colors"
          >
            Generate a New Deck
          </Link>
        </div>
      </div>
    );
  }

  // Check if deck is expired
  if (deck.isExpired || (deck.expiresAt && new Date(deck.expiresAt) < new Date())) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Deck Expired</h1>
          <p className="text-neutral-500 mb-6">
            This deck preview has expired. Generate a new deck and create an account to keep it forever.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full font-semibold hover:bg-[#a84d2e] transition-colors"
          >
            Generate a New Deck
          </Link>
        </div>
      </div>
    );
  }

  // Check if already claimed
  if (deck.userId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Already Claimed</h1>
          <p className="text-neutral-500 mb-6">
            This deck has already been claimed by an account.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full font-semibold hover:bg-[#a84d2e] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is already signed in
  const { userId: clerkId } = await auth();

  if (clerkId) {
    // User is signed in, redirect to the claim API to process the claim
    redirect(`/api/claim?tempToken=${tempToken}`);
  }

  // Calculate time remaining
  const expiresAt = deck.expiresAt ? new Date(deck.expiresAt) : null;
  const now = new Date();
  const hoursRemaining = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
    : null;

  // Show claim page with deck preview and signup prompt
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src="/donorsparklogo.png" alt="DonorSpark" className="h-8" />
          </Link>
          {expiresAt && (
            <CountdownTimer expiresAt={expiresAt.toISOString()} />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Deck Preview */}
        <div className="flex-1 bg-neutral-100 p-6 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            {deck.ogImageUrl ? (
              <img
                src={deck.ogImageUrl}
                alt={deck.orgName}
                className="w-full h-auto rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[1200/630] flex items-center justify-center bg-gradient-to-br from-[#1D2350] to-[#2d3560] rounded-xl shadow-2xl">
                <div className="text-center text-white p-6">
                  <h2 className="text-2xl font-bold mb-2">{deck.orgName}</h2>
                  <p className="text-white/70 text-sm">Impact Deck</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claim Form */}
        <div className="w-full lg:w-[480px] bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Your deck is ready
            </div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              Save Your Deck
            </h1>
            <p className="text-neutral-500 mb-8">
              One quick step to keep it forever and unlock sharing.
            </p>

            <div className="space-y-4">
              <Link
                href={`/sign-up?redirect_url=${encodeURIComponent(`/claim/${tempToken}`)}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors text-lg"
              >
                Get Started Free
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Link>
              <p className="text-center text-xs text-neutral-400">Sign up with Google or email. No credit card required.</p>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-neutral-400">already have an account?</span>
                </div>
              </div>

              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(`/claim/${tempToken}`)}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-[#C15A36] font-semibold hover:bg-neutral-50 transition-colors rounded-lg"
              >
                Sign in instead
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">What you&apos;ll get</p>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Your deck saved permanently
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Shareable link for donors
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                View analytics & engagement
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
