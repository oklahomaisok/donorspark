'use client';

import type { Deck } from '@/db/schema';

interface AnalyticsSectionProps {
  decks: Deck[];
}

export function AnalyticsSection({ decks }: AnalyticsSectionProps) {
  // Aggregate stats across all decks
  const totalViews = decks.reduce((sum, deck) => sum + deck.viewCount, 0);
  const totalClicks = decks.reduce((sum, deck) => sum + deck.clickCount, 0);
  const totalShares = decks.reduce((sum, deck) => sum + deck.shareCount, 0);
  const clickRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  const stats = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Donate Clicks',
      value: totalClicks.toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      ),
      color: 'rose',
    },
    {
      label: 'Click Rate',
      value: `${clickRate}%`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" x2="12" y1="20" y2="10"/>
          <line x1="18" x2="18" y1="20" y2="4"/>
          <line x1="6" x2="6" y1="20" y2="16"/>
        </svg>
      ),
      color: 'green',
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
        </svg>
      ),
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-neutral-800 mb-4">Analytics</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                {stat.icon}
              </div>
              <span className="text-sm text-neutral-500">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-neutral-800">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Simple activity feed */}
      {decks.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-medium text-neutral-500 mb-4">Recent Decks</h4>
          <div className="space-y-3">
            {decks.slice(0, 5).map((deck) => (
              <div key={deck.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="7" height="9" x="3" y="3" rx="1"/>
                      <rect width="7" height="5" x="14" y="3" rx="1"/>
                      <rect width="7" height="9" x="14" y="12" rx="1"/>
                      <rect width="7" height="5" x="3" y="16" rx="1"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800 text-sm">{deck.orgName}</div>
                    <div className="text-xs text-neutral-400">
                      {deck.deckType} • {new Date(deck.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neutral-700">{deck.viewCount} views</div>
                  <div className="text-xs text-neutral-400">{deck.clickCount} clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
