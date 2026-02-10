'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ClaimedModalProps {
  orgName: string;
  deckUrl: string;
}

export function ClaimedModal({ orgName, deckUrl }: ClaimedModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('claimed') === 'true') {
      setIsOpen(true);
      // Remove the query param from URL without refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Confetti container */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#C15A36', '#FFC303', '#16A34A', '#3B82F6', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 6)],
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          You&apos;ve claimed your impact story deck!
        </h2>

        <p className="text-neutral-600 mb-6">
          Your deck for <span className="font-semibold">{orgName}</span> is now saved to your account forever.
        </p>

        {/* View Deck Button */}
        <Link
          href={deckUrl}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors mb-4"
        >
          View Your Deck
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </Link>

        {/* Upgrade Pitch */}
        <div className="bg-neutral-50 rounded-xl p-4 text-left">
          <p className="text-sm text-neutral-600 mb-3">
            <span className="font-semibold text-neutral-800">Unlock more with DonorSpark:</span>
          </p>
          <ul className="text-sm text-neutral-600 space-y-2 mb-3">
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Remove DonorSpark branding
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Create additional deck styles
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Personalized donor thank-you decks
            </li>
          </ul>
          <Link
            href="/pricing"
            className="text-sm font-medium text-[#C15A36] hover:text-[#a84d2e]"
          >
            View pricing &rarr;
          </Link>
        </div>
      </div>

      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 51;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: confetti-fall 4s ease-in-out forwards;
        }
        .confetti:nth-child(odd) {
          border-radius: 50%;
        }
        .confetti:nth-child(even) {
          transform: rotate(45deg);
        }
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            top: -10px;
            transform: translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            top: 100vh;
            transform: translateX(100px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
