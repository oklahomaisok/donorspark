'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/db/schema';
import { formatBillingDate, getLostFeatures } from '@/lib/billing';

interface CancelModalProps {
  user: User;
  subscription: {
    id: string;
    current_period_end: number;
  };
  onClose: () => void;
}

export function CancelModal({ user, subscription, onClose }: CancelModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const plan = user.plan as 'starter' | 'growth';
  const accessEndDate = new Date(subscription.current_period_end * 1000);
  const lostFeatures = getLostFeatures(plan);

  const handleAction = async (actionType: 'cancel' | 'pause' | 'downgrade') => {
    setIsLoading(true);
    setAction(actionType);

    try {
      const body: Record<string, string> = { action: actionType };
      if (actionType === 'downgrade') {
        body.action = 'change_plan';
        body.targetPlan = 'starter';
      }

      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      }
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
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

        <h2 className="text-xl font-bold text-neutral-800 mb-4">Before you go...</h2>

        <p className="text-neutral-600 mb-4">
          You&apos;ll lose access to:
        </p>

        <ul className="mb-6 space-y-2">
          {lostFeatures.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" x2="9" y1="9" y2="15"/>
                <line x1="9" x2="15" y1="9" y2="15"/>
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* Retention Options */}
        <div className="flex flex-col gap-3 mb-6">
          {plan === 'growth' && (
            <button
              onClick={() => handleAction('downgrade')}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {action === 'downgrade' ? 'Processing...' : 'Downgrade to Starter ($49/mo)'}
            </button>
          )}
          <button
            onClick={() => handleAction('pause')}
            disabled={isLoading}
            className="w-full px-4 py-3 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {action === 'pause' ? 'Processing...' : 'Pause for 3 months'}
          </button>
        </div>

        {/* Cancel anyway - visible but not prominent */}
        <button
          onClick={() => handleAction('cancel')}
          disabled={isLoading}
          className="w-full text-sm text-neutral-500 hover:text-neutral-700 transition-colors py-2 disabled:opacity-50"
        >
          {action === 'cancel' ? 'Canceling...' : 'Cancel anyway'}
        </button>

        <p className="text-sm text-neutral-500 mt-4 text-center">
          Your access continues until {formatBillingDate(accessEndDate)}
        </p>
      </div>
    </div>
  );
}
