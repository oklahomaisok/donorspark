'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: 'starter' | 'growth';
}

export function UpgradeModal({ isOpen, onClose, feature, requiredPlan }: UpgradeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    // Track the edit attempt
    setLoading(true);
    try {
      await fetch('/api/upgrade-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'edit_attempt',
          metadata: { feature, requiredPlan },
        }),
      });
    } catch {
      // Ignore tracking errors
    }
    router.push('/pricing');
  };

  const planName = requiredPlan === 'growth' ? 'Growth' : 'Starter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#C15A36]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Unlock {feature}
          </h2>
          <p className="text-neutral-500">
            This feature is available on the {planName} plan and above.
          </p>
        </div>

        <div className="bg-neutral-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-neutral-800 mb-2">
            {planName} includes:
          </h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            {requiredPlan === 'starter' ? (
              <>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Unlimited Impact Decks
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Custom colors & fonts
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Remove DonorSpark branding
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Thank-You & Event Decks
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Everything in Starter
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  CSV donor personalization
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Annual Report Decks
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  API access
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-neutral-200 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'View Plans'}
          </button>
        </div>
      </div>
    </div>
  );
}
