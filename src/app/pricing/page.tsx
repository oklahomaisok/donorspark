'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { PricingSection } from '@/components/pricing-section';
import type { PlanType, BillingCycle } from '@/lib/stripe';

export default function PricingPage() {
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

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="p-4 md:p-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">
            DonorSpark
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm opacity-60 hover:opacity-100">
              Dashboard
            </Link>
            <Link
              href="/"
              className="bg-ink text-white px-4 py-2 rounded-full text-sm hover:scale-105 transition-transform"
            >
              Generate Deck
            </Link>
          </div>
        </nav>
      </header>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <PricingSection onGetFreeClick={() => window.location.href = '/'} />
      </div>
    </main>
  );
}
