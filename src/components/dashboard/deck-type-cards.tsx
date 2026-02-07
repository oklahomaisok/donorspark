'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Plan } from '@/db/schema';
import { ThankYouPreviewModal } from './thankyou-preview-modal';
import type { ThankYouPreviewData } from '@/lib/templates/thankyou-preview-template';

interface DeckTypeCardsProps {
  currentPlan: Plan;
  previewData: ThankYouPreviewData;
}

export function DeckTypeCards({ currentPlan, previewData }: DeckTypeCardsProps) {
  const [showThankYouPreview, setShowThankYouPreview] = useState(false);

  const canAccessStarter = currentPlan === 'starter' || currentPlan === 'growth';
  const canAccessGrowth = currentPlan === 'growth';

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-neutral-800 mb-4">More Ways to Tell Your Story</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thank-You Deck */}
        <div className={`relative bg-white rounded-xl overflow-hidden shadow-sm border ${canAccessStarter ? 'border-green-200' : 'border-neutral-100'}`}>
          {/* Preview mockup */}
          <div
            className="aspect-[4/3] relative"
            style={{
              background: `linear-gradient(135deg, ${previewData.colors.primary} 0%, color-mix(in srgb, ${previewData.colors.primary} 70%, black) 100%)`,
            }}
          >
            <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
              <span className="text-[9px] uppercase tracking-widest opacity-60">Thank-You Deck</span>
              <div>
                <p className="text-[10px] mb-1" style={{ color: previewData.colors.accent }}>Dear [Donor Name],</p>
                <h3 className="text-sm font-bold leading-tight">
                  Thank You For<br />
                  <span style={{ color: previewData.colors.accent }}>Your Support</span>
                </h3>
              </div>
            </div>
            {/* Lock/unlock overlay */}
            {!canAccessStarter && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-neutral-800">Thank-You Deck</h4>
              {canAccessStarter ? (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Unlocked</span>
              ) : (
                <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">Starter</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Send personalized gratitude after every campaign with donor name and gift amount.
            </p>

            {canAccessStarter ? (
              <Link
                href="/dashboard/create/thankyou"
                className="block w-full text-center py-2 bg-[#C15A36] text-white rounded-lg text-sm font-medium hover:bg-[#a84d2e] transition-colors"
              >
                Create Thank-You Deck
              </Link>
            ) : (
              <button
                onClick={() => setShowThankYouPreview(true)}
                className="w-full py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Event Deck */}
        <div className={`relative bg-white rounded-xl overflow-hidden shadow-sm border ${canAccessGrowth ? 'border-green-200' : 'border-neutral-100'}`}>
          {/* Preview mockup */}
          <div
            className="aspect-[4/3] relative"
            style={{
              background: `linear-gradient(135deg, ${previewData.colors.primary} 0%, color-mix(in srgb, ${previewData.colors.primary} 70%, black) 100%)`,
            }}
          >
            <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
              <span className="text-[9px] uppercase tracking-widest opacity-60">Event Deck</span>
              <div>
                <p className="text-[10px] mb-1 opacity-60">You're Invited</p>
                <h3 className="text-sm font-bold leading-tight">
                  {previewData.orgName}<br />
                  <span style={{ color: previewData.colors.accent }}>Annual Gala 2026</span>
                </h3>
              </div>
            </div>
            {/* Lock overlay */}
            {!canAccessGrowth && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-neutral-800">Event Deck</h4>
              {canAccessGrowth ? (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Unlocked</span>
              ) : (
                <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">Growth</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              A shareable deck for your next gala, fundraiser, or community event.
            </p>

            {canAccessGrowth ? (
              <Link
                href="/dashboard/create/event"
                className="block w-full text-center py-2 bg-[#C15A36] text-white rounded-lg text-sm font-medium hover:bg-[#a84d2e] transition-colors"
              >
                Create Event Deck
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="block w-full text-center py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Upgrade to Growth
              </Link>
            )}
          </div>
        </div>

        {/* Annual Report Deck */}
        <div className={`relative bg-white rounded-xl overflow-hidden shadow-sm border ${canAccessGrowth ? 'border-green-200' : 'border-neutral-100'}`}>
          {/* Preview mockup */}
          <div
            className="aspect-[4/3] relative"
            style={{
              background: `linear-gradient(135deg, ${previewData.colors.primary} 0%, color-mix(in srgb, ${previewData.colors.primary} 70%, black) 100%)`,
            }}
          >
            <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
              <span className="text-[9px] uppercase tracking-widest opacity-60">Annual Report</span>
              <div>
                <p className="text-[10px] mb-1 opacity-60">{previewData.orgName}</p>
                <h3 className="text-sm font-bold leading-tight">
                  2025: A Year Of<br />
                  <span style={{ color: previewData.colors.accent }}>Impact</span>
                </h3>
              </div>
            </div>
            {/* Lock overlay */}
            {!canAccessGrowth && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-neutral-800">Annual Report Deck</h4>
              {canAccessGrowth ? (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Unlocked</span>
              ) : (
                <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">Growth</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Your year in review, designed to be shared — not filed away.
            </p>

            {canAccessGrowth ? (
              <Link
                href="/dashboard/create/annual"
                className="block w-full text-center py-2 bg-[#C15A36] text-white rounded-lg text-sm font-medium hover:bg-[#a84d2e] transition-colors"
              >
                Create Annual Report
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="block w-full text-center py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Upgrade to Growth
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Thank-You Preview Modal */}
      <ThankYouPreviewModal
        isOpen={showThankYouPreview}
        onClose={() => setShowThankYouPreview(false)}
        previewData={previewData}
      />
    </section>
  );
}
