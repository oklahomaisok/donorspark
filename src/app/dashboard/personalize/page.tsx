import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserByClerkId, getUserDecks, getUserOrganizations, getUserDonorUploads } from '@/db/queries';
import { DonorUploadForm } from '@/components/dashboard/donor-upload-form';

export default async function PersonalizePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect('/sign-in');

  // Check plan access
  if (user.plan !== 'growth') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Growth Plan Required</h1>
          <p className="text-neutral-500 mb-6">
            CSV donor personalization is available on the Growth plan. Upload a CSV of donors and we'll generate a unique thank-you deck for each one.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors"
          >
            Upgrade to Growth
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const decks = await getUserDecks(user.id);
  const organizations = await getUserOrganizations(user.id);
  const uploads = await getUserDonorUploads(user.id);

  // Get available base decks (impact decks that are complete)
  const baseDecks = decks.filter(d => d.status === 'complete' && d.deckType === 'impact');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Donor Personalization</h1>
        <p className="text-neutral-500">
          Upload a CSV of donors to generate personalized thank-you decks for each one.
        </p>
      </div>

      {baseDecks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">No Base Deck Available</h2>
          <p className="text-neutral-500 mb-6">
            You need at least one completed Impact Deck to create personalized thank-you decks.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors"
          >
            Generate an Impact Deck
          </Link>
        </div>
      ) : (
        <DonorUploadForm
          baseDecks={baseDecks}
          organizations={organizations}
          previousUploads={uploads}
        />
      )}
    </div>
  );
}
