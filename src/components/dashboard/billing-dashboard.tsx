'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@/db/schema';
import { PLAN_DETAILS } from '@/lib/stripe';
import { formatBillingDate, getPlanDisplayPrice, getCardDisplay } from '@/lib/billing';
import { CancelModal } from './cancel-modal';

interface BillingDashboardProps {
  user: User;
  subscription: {
    id: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
    default_payment_method?: {
      card?: {
        brand: string;
        last4: string;
      };
    } | null;
  } | null;
}

export function BillingDashboard({ user, subscription }: BillingDashboardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const plan = user.plan as 'free' | 'starter' | 'growth';
  const planDetails = PLAN_DETAILS[plan];
  const billingCycle = user.planBillingCycle as 'monthly' | 'annual' | null;

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setIsReactivating(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Free user view
  if (plan === 'free') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-neutral-800 mb-4">Billing</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Free Plan</h3>
          <p className="text-neutral-500 mb-6">
            Upgrade to manage billing and access premium features.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors"
          >
            Upgrade
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const cardInfo = subscription?.default_payment_method?.card
    ? { brand: subscription.default_payment_method.card.brand, last4: subscription.default_payment_method.card.last4 }
    : null;

  const periodEndDate = subscription
    ? new Date(subscription.current_period_end * 1000)
    : user.stripeCurrentPeriodEnd;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-neutral-800 mb-6">Billing</h2>

        {/* Plan Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Current Plan</div>
            <div className="text-2xl font-bold text-neutral-800">{planDetails.name}</div>
            <div className="text-neutral-600">
              {getPlanDisplayPrice(plan, billingCycle)}
              {billingCycle === 'annual' && (
                <span className="text-sm text-green-600 ml-2">(billed annually)</span>
              )}
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Change Plan
          </Link>
        </div>

        {/* Next Billing / Access End */}
        {periodEndDate && (
          <div className="mb-6 pb-6 border-b border-neutral-100">
            <div className="text-sm text-neutral-500 mb-1">
              {subscription?.cancel_at_period_end || user.cancelAtPeriodEnd
                ? 'Access ends'
                : 'Next billing date'}
            </div>
            <div className="font-medium text-neutral-800">
              {formatBillingDate(periodEndDate)}
            </div>
            {(subscription?.cancel_at_period_end || user.cancelAtPeriodEnd) && (
              <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                Your subscription is set to cancel
              </div>
            )}
          </div>
        )}

        {/* Payment Method */}
        {cardInfo && (
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="text-sm text-neutral-500 mb-1">Payment Method</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-800">
                  {cardInfo.brand.charAt(0).toUpperCase() + cardInfo.brand.slice(1)} ending in {cardInfo.last4}
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenPortal}
              disabled={isPortalLoading}
              className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {isPortalLoading ? 'Loading...' : 'Update'}
            </button>
          </div>
        )}

        {/* Cancel / Reactivate */}
        <div className="flex justify-end">
          {subscription?.cancel_at_period_end || user.cancelAtPeriodEnd ? (
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="px-4 py-2 text-sm font-medium text-[#C15A36] border border-[#C15A36] rounded-lg hover:bg-[#C15A36]/5 transition-colors disabled:opacity-50"
            >
              {isReactivating ? 'Reactivating...' : 'Reactivate Subscription'}
            </button>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Cancel Membership
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && subscription && (
        <CancelModal
          user={user}
          subscription={{
            id: subscription.id,
            current_period_end: subscription.current_period_end,
          }}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
}
