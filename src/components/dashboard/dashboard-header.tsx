'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlanBadge } from './plan-badge';
import { UpgradeModal } from './upgrade-modal';
import type { User } from '@/db/schema';

interface DashboardHeaderProps {
  user: User;
  orgName: string | null;
  hasExistingDeck: boolean;
}

export function DashboardHeader({ user, orgName, hasExistingDeck }: DashboardHeaderProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleNewDeckClick = (e: React.MouseEvent) => {
    // Free users with existing deck should see upgrade modal
    if (user.plan === 'free' && hasExistingDeck) {
      e.preventDefault();
      setShowUpgradeModal(true);
    }
    // Otherwise, link works normally and navigates to homepage
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-800">Dashboard</h1>
            <PlanBadge user={user} />
          </div>
          <p className="text-neutral-500">
            {orgName || 'Welcome to DonorSpark'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.plan === 'free' && (
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-[#C15A36] border border-[#C15A36] rounded-lg hover:bg-[#C15A36]/5 transition-colors"
            >
              Upgrade Plan
            </Link>
          )}
          <Link
            href="/"
            onClick={handleNewDeckClick}
            className="px-4 py-2 text-sm font-medium bg-[#C15A36] text-white rounded-lg hover:bg-[#a84d2e] transition-colors"
          >
            New Deck
          </Link>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}
