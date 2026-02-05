import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { getUserByClerkId, getDeckById } from '@/db/queries';
import Link from 'next/link';

export default async function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect('/sign-in');

  const { id } = await params;
  const deckId = parseInt(id, 10);
  if (isNaN(deckId)) notFound();

  const deckRow = await getDeckById(deckId);
  if (!deckRow || deckRow.userId !== user.id) notFound();

  const deck = {
    ...deckRow,
    brandData: deckRow.brandData as Record<string, unknown> | null,
  };

  return (
    <div>
      <Link href="/dashboard" className="text-xs uppercase tracking-widest text-ink/40 hover:text-ink/60 transition-colors">
        &larr; Back to Decks
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="text-4xl md:text-5xl">{deck.orgName}</h1>
        <p className="text-sm text-ink/50 mt-2">
          Created {new Date(deck.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {deck.orgUrl && (
          <a href={deck.orgUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-ink/40 hover:text-ink/60 transition-colors">
            {deck.orgUrl}
          </a>
        )}
      </div>

      {deck.status === 'complete' && deck.deckUrl ? (
        <div>
          {/* OG Preview */}
          {deck.ogImageUrl && (
            <div className="rounded-2xl overflow-hidden shadow-xl mb-6 max-w-2xl">
              <img src={deck.ogImageUrl} alt={`${deck.orgName} preview`} className="w-full" />
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={`/decks/${deck.slug}`}
              className="bg-ink text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-ink/80 transition-colors"
            >
              View Deck
            </Link>
            <a
              href={deck.deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-ink/20 text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-ink/5 transition-colors"
            >
              Direct Link
            </a>
          </div>

          {/* Brand Data */}
          {deck.brandData && (
            <div className="mt-12">
              <h2 className="text-2xl serif mb-4">Brand Data</h2>
              <pre className="bg-white rounded-2xl p-6 text-xs overflow-x-auto border border-ink/10">
                {JSON.stringify(deck.brandData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : deck.status === 'failed' ? (
        <div className="card bg-white p-8 border border-ink/10">
          <p className="text-red-500 font-medium">Generation failed</p>
          {deck.errorMessage && <p className="text-sm text-ink/50 mt-2">{deck.errorMessage}</p>}
          <Link href="/" className="inline-block mt-4 bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ink/80 transition-colors">
            Try Again
          </Link>
        </div>
      ) : (
        <div className="card bg-white p-8 border border-ink/10">
          <p className="text-ink/60">Deck is still generating...</p>
        </div>
      )}
    </div>
  );
}
