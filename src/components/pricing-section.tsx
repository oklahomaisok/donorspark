'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { PLAN_DETAILS, type PlanType, type BillingCycle } from '@/lib/stripe';

interface PricingSectionProps {
  onGetFreeClick: () => void;
  currentPlan?: PlanType;
}

export function PricingSection({ onGetFreeClick, currentPlan = 'free' }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleUpgrade = async (plan: PlanType) => {
    console.log('handleUpgrade called with plan:', plan, 'isSignedIn:', isSignedIn);

    if (plan === 'free') {
      onGetFreeClick();
      return;
    }

    if (!isSignedIn) {
      // Store checkout intent so we can resume after sign-up
      const cycle: BillingCycle = isAnnual ? 'annual' : 'monthly';
      const checkoutIntent = encodeURIComponent(JSON.stringify({ plan, cycle }));
      // Need to encode the full redirect_url since it contains query params
      const redirectUrl = `/sign-up?redirect_url=${encodeURIComponent(`/pricing?checkout=${checkoutIntent}`)}`;
      console.log('Redirecting to:', redirectUrl);
      router.push(redirectUrl);
      return;
    }

    setLoading(plan);

    try {
      const cycle: BillingCycle = isAnnual ? 'annual' : 'monthly';
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cycle }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setLoading(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(null);
    }
  };

  const plans: Array<{
    key: PlanType;
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: readonly string[];
    cta: string;
    featured: boolean;
  }> = [
    {
      key: 'free',
      name: PLAN_DETAILS.free.name,
      monthlyPrice: PLAN_DETAILS.free.monthlyPrice,
      annualPrice: PLAN_DETAILS.free.annualPrice,
      description: PLAN_DETAILS.free.description,
      features: PLAN_DETAILS.free.features,
      cta: currentPlan === 'free' ? 'Current Plan' : 'Get Started',
      featured: false,
    },
    {
      key: 'starter',
      name: PLAN_DETAILS.starter.name,
      monthlyPrice: PLAN_DETAILS.starter.monthlyPrice,
      annualPrice: PLAN_DETAILS.starter.annualPrice,
      description: PLAN_DETAILS.starter.description,
      features: PLAN_DETAILS.starter.features,
      cta: currentPlan === 'starter' ? 'Current Plan' : 'Start Free Trial',
      featured: false,
    },
    {
      key: 'growth',
      name: PLAN_DETAILS.growth.name,
      monthlyPrice: PLAN_DETAILS.growth.monthlyPrice,
      annualPrice: PLAN_DETAILS.growth.annualPrice,
      description: PLAN_DETAILS.growth.description,
      features: PLAN_DETAILS.growth.features,
      cta: currentPlan === 'growth' ? 'Current Plan' : 'Start Free Trial',
      featured: true,
    },
  ];

  const annualSavingsPercent = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = ((monthlyTotal - plan.annualPrice) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  return (
    <section className="card bg-cream p-8 md:p-20 mt-4">
      <div className="text-center mb-12">
        <h2 className="text-5xl md:text-6xl mb-4">Simple, Transparent Pricing</h2>
        <p className="text-lg opacity-60 max-w-2xl mx-auto">
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Monthly/Annual Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'opacity-100' : 'opacity-50'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
              isAnnual ? 'bg-ink' : 'bg-ink/30'
            }`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isAnnual ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'opacity-100' : 'opacity-50'}`}>
            Annual
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const savings = annualSavingsPercent(plan);
          const isCurrentPlan = plan.key === currentPlan;
          const isLoading = loading === plan.key;

          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.featured
                  ? 'bg-ink text-cream ring-4 ring-salmon/50 shadow-xl'
                  : 'bg-white border border-ink/10'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-salmon text-ink text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
                <p className={`text-sm ${plan.featured ? 'opacity-70' : 'opacity-60'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">
                    ${isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className={`text-sm ${plan.featured ? 'opacity-70' : 'opacity-50'}`}>
                      /month
                    </span>
                  )}
                </div>
                {plan.monthlyPrice > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isAnnual ? (
                      <>
                        <span className={`text-sm ${plan.featured ? 'opacity-70' : 'opacity-50'}`}>
                          Billed ${plan.annualPrice}/year
                        </span>
                        {savings > 0 && (
                          <span className="text-xs font-medium text-sage bg-sage/20 px-2 py-1 rounded-full">
                            Save {savings}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={`text-sm ${plan.featured ? 'opacity-70' : 'opacity-50'}`}>
                        or ${Math.round(plan.annualPrice / 12)}/mo billed annually
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="flex-grow space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.featured ? 'text-salmon' : 'text-sage'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`text-sm ${plan.featured ? 'opacity-90' : 'opacity-70'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-3 px-6 rounded-full font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  plan.featured
                    ? 'bg-cream text-ink hover:scale-105'
                    : plan.key === 'free'
                    ? 'bg-ink text-cream hover:scale-105'
                    : 'bg-ink/10 text-ink hover:bg-ink/20'
                } ${isLoading ? 'opacity-75' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mt-12 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-sm opacity-60">
          All plans include a shareable link, mobile-optimized design, and a donate button linked to your organization&apos;s giving page.
        </p>
        <p className="text-sm opacity-60 italic">
          We never generate fake testimonials. Every quote comes directly from your community.
        </p>
      </div>
    </section>
  );
}
