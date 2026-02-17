'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/db/schema';

interface UpgradeBannerProps {
  user: User;
}

export function UpgradeBanner({ user }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  // Only show for free users who have visited the dashboard 3+ times
  if (user.plan !== 'free' || user.dashboardVisitCount < 3 || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-[#C15A36] to-[#e07a50] rounded-xl p-6 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Ready to grow your impact?</h3>
          <p className="text-white/80 text-sm">
            Upgrade to Starter and unlock custom branding, thank-you decks, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/pricing')}
            className="px-6 py-2.5 bg-white text-[#C15A36] rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Upgrade
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" x2="6" y1="6" y2="18"/>
              <line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
