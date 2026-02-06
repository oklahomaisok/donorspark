'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { PlanType, BillingCycle } from '@/lib/stripe';

interface CheckoutHandlerProps {
  children: ReactNode;
}

export function CheckoutHandler({ children }: CheckoutHandlerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle checkout intent after sign-up redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn || isProcessing) return;

    const checkoutParam = searchParams.get('checkout');
    if (!checkoutParam) return;

    try {
      const intent = JSON.parse(decodeURIComponent(checkoutParam)) as {
        plan: PlanType;
        cycle: BillingCycle;
      };

      if (intent.plan && intent.cycle) {
        setIsProcessing(true);
        // Clear the URL param to prevent double-processing
        router.replace('/pricing');

        // Trigger checkout
        fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: intent.plan, cycle: intent.cycle }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.url) {
              window.location.href = data.url;
            } else {
              setIsProcessing(false);
            }
          })
          .catch(() => setIsProcessing(false));
      }
    } catch {
      // Invalid checkout param, ignore
    }
  }, [isLoaded, isSignedIn, searchParams, router, isProcessing]);

  if (isProcessing) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-ink border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg">Redirecting to checkout...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
