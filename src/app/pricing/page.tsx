'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PricingSection } from '@/components/pricing-section';
import { CheckoutHandler } from './checkout-handler';

function PricingContent() {
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

function LoadingSpinner() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-ink border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg">Loading...</p>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutHandler>
        <PricingContent />
      </CheckoutHandler>
    </Suspense>
  );
}
