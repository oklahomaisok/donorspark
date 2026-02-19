'use client';

import Link from 'next/link';

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>

        {/* Icon */}
        <div className="w-20 h-20 bg-[#C15A36]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C15A36" strokeWidth="2">
            <path d="M12 2v20"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          Upgrade to Create More Decks
        </h2>

        <p className="text-neutral-600 mb-6">
          Free accounts are limited to 1 deck. You can delete your current deck to make room for a new one, or upgrade to create additional decks.
        </p>

        {/* Plan comparison */}
        <div className="bg-neutral-50 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="font-semibold text-neutral-800">Starter Plan</div>
              <div className="text-sm text-neutral-500">$29/month</div>
            </div>
            <div className="text-sm text-neutral-600">5 decks</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-800">Growth Plan</div>
              <div className="text-sm text-neutral-500">$79/month</div>
            </div>
            <div className="text-sm text-neutral-600">Unlimited decks</div>
          </div>
        </div>

        {/* Features */}
        <ul className="text-sm text-neutral-600 space-y-2 mb-6 text-left">
          <li className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            No DonorSpark branding on decks
          </li>
          <li className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Additional deck styles (thank you, onboarding, story)
          </li>
          <li className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Priority support
          </li>
        </ul>

        {/* Actions */}
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors"
        >
          Upgrade
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </Link>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-neutral-500 hover:text-neutral-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
