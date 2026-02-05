'use client';

import { useState } from 'react';

interface PricingSectionProps {
  onGetFreeClick: () => void;
}

export function PricingSection({ onGetFreeClick }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Try it out with one deck',
      features: [
        '1 story deck',
        'Shareable link',
        'Mobile-optimized design',
        'Linked donate button',
      ],
      cta: 'Get Started',
      ctaAction: onGetFreeClick,
      featured: false,
    },
    {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 279,
      description: 'For organizations ready to grow',
      features: [
        '5 story decks per month',
        'Custom branding',
        'Real testimonial integration',
        'Analytics dashboard',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      ctaAction: () => {}, // TODO: Link to signup
      featured: false,
    },
    {
      name: 'Growth',
      monthlyPrice: 79,
      annualPrice: 749,
      description: 'For teams that need more',
      features: [
        'Unlimited story decks',
        'Everything in Starter',
        'Team collaboration',
        'API access',
        'White-label option',
        'Dedicated account manager',
      ],
      cta: 'Start Free Trial',
      ctaAction: () => {}, // TODO: Link to signup
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

          return (
            <div
              key={plan.name}
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
                {isAnnual && plan.monthlyPrice > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${plan.featured ? 'opacity-70' : 'opacity-50'}`}>
                      Billed ${plan.annualPrice}/year
                    </span>
                    {savings > 0 && (
                      <span className="text-xs font-medium text-sage bg-sage/20 px-2 py-1 rounded-full">
                        Save {savings}%
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
                onClick={plan.ctaAction}
                className={`w-full py-3 px-6 rounded-full font-medium transition-transform hover:scale-105 cursor-pointer ${
                  plan.featured
                    ? 'bg-cream text-ink'
                    : plan.name === 'Free'
                    ? 'bg-ink text-cream'
                    : 'bg-ink/10 text-ink hover:bg-ink/20'
                }`}
              >
                {plan.cta}
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
