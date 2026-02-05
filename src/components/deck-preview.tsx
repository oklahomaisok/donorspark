'use client';

import Link from 'next/link';

interface DeckPreviewProps {
  orgName: string;
  deckUrl: string;
  ogImageUrl?: string | null;
  slug: string;
  createdAt?: Date;
}

export function DeckPreview({ orgName, deckUrl, ogImageUrl, slug, createdAt }: DeckPreviewProps) {
  return (
    <div className="card bg-white overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-cream relative overflow-hidden">
        {ogImageUrl ? (
          <img
            src={ogImageUrl}
            alt={`${orgName} deck preview`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-salmon/20 to-periwinkle/20">
            <span className="text-ink/30 text-sm font-medium">{orgName}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-ink truncate">{orgName}</h3>
        {createdAt && (
          <p className="text-xs text-ink/40 mt-1">
            {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <Link
            href={`/decks/${slug}`}
            className="text-xs bg-ink text-white px-3 py-1.5 rounded-full hover:bg-ink/80 transition-colors"
          >
            View Deck
          </Link>
          <a
            href={deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-ink/20 text-ink px-3 py-1.5 rounded-full hover:bg-ink/5 transition-colors"
          >
            Direct Link
          </a>
        </div>
      </div>
    </div>
  );
}
