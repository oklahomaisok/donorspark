import { DeckPreview } from './deck-preview';

interface Deck {
  id: number;
  slug: string;
  orgName: string;
  deckUrl: string | null;
  ogImageUrl: string | null;
  status: string;
  createdAt: Date;
}

interface DeckListProps {
  decks: Deck[];
}

export function DeckList({ decks }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink/40 text-lg mb-2">No decks yet</p>
        <p className="text-ink/30 text-sm">Generate your first deck from the homepage</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <div key={deck.id}>
          {deck.status === 'complete' && deck.deckUrl ? (
            <DeckPreview
              orgName={deck.orgName}
              deckUrl={deck.deckUrl}
              ogImageUrl={deck.ogImageUrl}
              slug={deck.slug}
              createdAt={deck.createdAt}
            />
          ) : (
            <div className="card bg-white p-6">
              <h3 className="font-bold text-ink truncate">{deck.orgName}</h3>
              <p className="text-xs text-ink/40 mt-1">
                {deck.status === 'generating' ? 'Generating...' : 'Failed'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
