'use client';

import Link from 'next/link';
import { PLAN_DETAILS, type PlanType } from '@/lib/stripe';

interface DeckCounterProps {
  currentCount: number;
  plan: PlanType;
}

export function DeckCounter({ currentCount, plan }: DeckCounterProps) {
  const limit = PLAN_DETAILS[plan].deckLimit;
  const percentage = Math.min((currentCount / limit) * 100, 100);

  // Determine status
  const isAtLimit = currentCount >= limit;
  const isNearLimit = currentCount >= limit - 1 && !isAtLimit;

  // Color based on status
  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-[#C15A36]';
  const textColor = isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-neutral-600';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700">Decks</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {currentCount} of {limit} used
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning/Action messages */}
      {isAtLimit && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-red-600">
            You&apos;ve reached your deck limit
          </span>
          {plan === 'growth' ? (
            <a
              href="mailto:hello@donorspark.com?subject=Enterprise%20Inquiry"
              className="text-xs font-medium text-[#C15A36] hover:underline"
            >
              Contact us
            </a>
          ) : (
            <Link
              href="/pricing"
              className="text-xs font-medium text-[#C15A36] hover:underline"
            >
              Upgrade
            </Link>
          )}
        </div>
      )}

      {isNearLimit && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-amber-600">
            Almost at your limit
          </span>
          <Link
            href="/pricing"
            className="text-xs font-medium text-[#C15A36] hover:underline"
          >
            Upgrade for more
          </Link>
        </div>
      )}
    </div>
  );
}
