import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility - use getStripe() for new code
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

// Price IDs from Stripe Dashboard
export const PRICES = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '',
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID || '',
  },
} as const;

// Price display info
export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    description: 'Get started with impact decks',
    monthlyPrice: 0,
    annualPrice: 0,
    deckLimit: 1,
    donorDeckLimit: 0,
    features: [
      '1 Impact Deck',
      'Basic analytics',
      'Share via link',
      'Shareable QR Code',
      'Share Links for Social Media',
      'DonorSpark branding',
    ],
  },
  starter: {
    name: 'Starter',
    description: 'For growing nonprofits',
    monthlyPrice: 49,
    annualPrice: 468,
    deckLimit: 5,
    donorDeckLimit: 0,
    features: [
      '5 Customizable Slide Decks',
      'Edit colors & fonts',
      'Replace images',
      'Remove DonorSpark branding',
      'Advanced analytics',
      'Priority support',
    ],
  },
  growth: {
    name: 'Growth',
    description: 'For fundraising teams',
    monthlyPrice: 99,
    annualPrice: 948,
    deckLimit: 10,
    donorDeckLimit: 50,
    features: [
      'Everything in Starter',
      '10 Customizable Slide Decks',
      '50 Personalized Donor Appreciation Decks',
      'Annual Report Decks',
      'CSV donor personalization',
      'Bulk deck generation',
      'API access',
      'Custom domain (coming soon)',
      'Dedicated support',
    ],
  },
} as const;

/**
 * Get deck limit for a plan
 */
export function getDeckLimit(plan: PlanType): number {
  return PLAN_DETAILS[plan].deckLimit;
}

/**
 * Get donor deck limit for a plan
 */
export function getDonorDeckLimit(plan: PlanType): number {
  return PLAN_DETAILS[plan].donorDeckLimit;
}

export type PlanType = keyof typeof PLAN_DETAILS;
export type BillingCycle = 'monthly' | 'annual';

/**
 * Get the Stripe price ID for a plan and billing cycle
 */
export function getPriceId(plan: PlanType, cycle: BillingCycle): string | null {
  if (plan === 'free') return null;
  return PRICES[plan]?.[cycle] || null;
}

/**
 * Get plan type from a Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): { plan: PlanType; cycle: BillingCycle } | null {
  for (const [plan, prices] of Object.entries(PRICES)) {
    if (prices.monthly === priceId) {
      return { plan: plan as PlanType, cycle: 'monthly' };
    }
    if (prices.annual === priceId) {
      return { plan: plan as PlanType, cycle: 'annual' };
    }
  }
  return null;
}
