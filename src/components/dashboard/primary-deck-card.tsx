'use client';

import { useState } from 'react';
import type { Deck, Organization } from '@/db/schema';

interface PrimaryDeckCardProps {
  deck: Deck;
  organization: Organization;
  siteUrl: string;
}

export function PrimaryDeckCard({ deck, organization, siteUrl }: PrimaryDeckCardProps) {
  const [copied, setCopied] = useState(false);

  const deckUrl = `${siteUrl}/s/${organization.slug}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(deckUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* OG Image Preview */}
        <div className="lg:w-1/2 aspect-[1200/630] relative bg-neutral-100">
          {deck.ogImageUrl ? (
            <img
              src={deck.ogImageUrl}
              alt={deck.orgName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1D2350] to-[#2d3560]">
              <div className="text-center text-white p-6">
                <h2 className="text-2xl font-bold mb-2">{deck.orgName}</h2>
                <p className="text-white/70 text-sm">Impact Deck</p>
              </div>
            </div>
          )}
          {/* View button overlay */}
          <a
            href={deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group"
          >
            <span className="bg-white text-neutral-800 px-6 py-3 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              View Deck
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </span>
          </a>
        </div>

        {/* Deck Info */}
        <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[#C15A36] uppercase tracking-wider mb-1 block">
                Impact Deck
              </span>
              <h2 className="text-2xl font-bold text-neutral-800">{deck.orgName}</h2>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Live
            </div>
          </div>

          {/* Share URL */}
          <div className="mb-6">
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 block">
              Share Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 font-mono text-sm text-neutral-600 truncate">
                {deckUrl.replace('https://', '')}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#C15A36] text-white hover:bg-[#a84d2e]'
                }`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.viewCount}</div>
              <div className="text-xs text-neutral-500">Views</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.clickCount}</div>
              <div className="text-xs text-neutral-500">Clicks</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.shareCount}</div>
              <div className="text-xs text-neutral-500">Shares</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-auto">
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 text-center border border-neutral-200 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              View Deck
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Check out ${deck.orgName}'s Impact Story`)}&body=${encodeURIComponent(`I thought you'd be interested in this: ${deckUrl}`)}`}
              className="flex-1 py-3 text-center border border-neutral-200 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Share via Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
