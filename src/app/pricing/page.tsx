'use client';

import Link from 'next/link';
import { PricingSection } from '@/components/pricing-section';

export default function PricingPage() {
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
