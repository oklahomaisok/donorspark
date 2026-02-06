'use client';

import type { Plan } from '@/db/schema';

interface LockedDeckTypesProps {
  currentPlan: Plan;
}

const deckTypes = [
  {
    type: 'thankyou',
    name: 'Thank-You Deck',
    description: 'Personalized decks for individual donors with their name and gift amount',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
    color: 'rose',
  },
  {
    type: 'event',
    name: 'Event Deck',
    description: 'Showcase upcoming events, galas, and fundraisers with RSVP integration',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
    color: 'blue',
  },
  {
    type: 'annual',
    name: 'Annual Report',
    description: 'Comprehensive yearly impact report with financials and achievements',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" x2="8" y1="13" y2="13"/>
        <line x1="16" x2="8" y1="17" y2="17"/>
        <line x1="10" x2="8" y1="9" y2="9"/>
      </svg>
    ),
    requiredPlan: 'growth' as Plan,
    color: 'purple',
  },
];

const planOrder: Plan[] = ['free', 'starter', 'growth'];

export function LockedDeckTypes({ currentPlan }: LockedDeckTypesProps) {
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-neutral-800 mb-4">More Deck Types</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {deckTypes.map((deckType) => {
          const requiredPlanIndex = planOrder.indexOf(deckType.requiredPlan);
          const isLocked = currentPlanIndex < requiredPlanIndex;

          const colorClasses = {
            rose: 'bg-rose-50 text-rose-600 border-rose-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
          };

          return (
            <div
              key={deckType.type}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                isLocked
                  ? 'bg-neutral-50 border-neutral-200 opacity-75'
                  : `${colorClasses[deckType.color as keyof typeof colorClasses]} cursor-pointer hover:shadow-md`
              }`}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-neutral-500 bg-white px-2 py-1 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  {deckType.requiredPlan.charAt(0).toUpperCase() + deckType.requiredPlan.slice(1)}
                </div>
              )}

              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                isLocked ? 'bg-neutral-200 text-neutral-400' : `bg-white/50`
              }`}>
                {deckType.icon}
              </div>

              <h4 className={`font-bold mb-2 ${isLocked ? 'text-neutral-500' : ''}`}>
                {deckType.name}
              </h4>

              <p className={`text-sm ${isLocked ? 'text-neutral-400' : 'opacity-80'}`}>
                {deckType.description}
              </p>

              {!isLocked && (
                <button className="mt-4 w-full py-2 text-sm font-medium bg-white/60 hover:bg-white rounded-lg transition-colors">
                  Create {deckType.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
