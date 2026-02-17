'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

interface LockedFeatureProps {
  children: React.ReactNode;
  isLocked: boolean;
  featureName: string;
}

export function LockedFeature({ children, isLocked, featureName }: LockedFeatureProps) {
  const [showModal, setShowModal] = useState(false);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="relative cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {/* Locked overlay */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-zinc-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-medium">Upgrade to edit</span>
          </div>
        </div>
        {/* Grayed out content */}
        <div className="opacity-40 pointer-events-none">
          {children}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-zinc-800">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            </button>

            <div className="w-14 h-14 bg-[#C15A36]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#C15A36]" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Unlock {featureName}
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Make this deck truly yours. Starter plans include:
            </p>

            <div className="text-left space-y-2 mb-6 px-2">
              {['Custom colors & fonts', 'Replace images', 'Edit all slide content', 'Remove DonorSpark branding'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                  <svg className="w-4 h-4 text-[#C15A36] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-500 mb-4">Less than a single direct mail piece.</p>

            <div className="space-y-3">
              <Link
                href="/pricing"
                className="block w-full px-4 py-2.5 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors text-sm"
              >
                Upgrade
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Inline locked badge for smaller elements
export function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded ml-2">
      <Lock className="w-2.5 h-2.5" />
      Pro
    </span>
  );
}
