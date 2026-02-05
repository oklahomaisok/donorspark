import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserByClerkId, getUserDecks } from '@/db/queries';
import { DeckList } from '@/components/deck-list';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect('/sign-in');

  const decks = await getUserDecks(user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl">Your Decks</h1>
          <p className="text-sm text-ink/50 mt-2">{decks.length} deck{decks.length !== 1 ? 's' : ''} generated</p>
        </div>
        <Link
          href="/"
          className="bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ink/80 transition-colors"
        >
          New Deck
        </Link>
      </div>
      <DeckList decks={decks} />
    </div>
  );
}
