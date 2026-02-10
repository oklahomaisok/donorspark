import type Stripe from 'stripe';
import type { User } from '@/db/schema';
import { PLAN_DETAILS } from './stripe';

/**
 * Format date for display (e.g., "March 9, 2026")
 */
export function formatBillingDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get card display info from Stripe payment method
 */
export function getCardDisplay(paymentMethod: Stripe.PaymentMethod | null): {
  brand: string;
  last4: string;
} {
  if (!paymentMethod?.card) {
    return { brand: 'Card', last4: '****' };
  }
  const card = paymentMethod.card;
  return {
    brand: card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card',
    last4: card.last4 || '****',
  };
}

/**
 * Check if user has active paid subscription
 */
export function hasActiveSubscription(user: User): boolean {
  return (
    user.plan !== 'free' &&
    user.stripeSubscriptionId !== null &&
    (!user.stripeCurrentPeriodEnd || user.stripeCurrentPeriodEnd > new Date())
  );
}

/**
 * Get display price for a plan
 */
export function getPlanDisplayPrice(
  plan: 'free' | 'starter' | 'growth',
  billingCycle: 'monthly' | 'annual' | null
): string {
  const details = PLAN_DETAILS[plan];
  if (plan === 'free') return 'Free';

  if (billingCycle === 'annual') {
    const monthlyEquivalent = Math.round(details.annualPrice / 12);
    return `$${monthlyEquivalent}/month`;
  }
  return `$${details.monthlyPrice}/month`;
}

/**
 * Get features the user will lose on cancel/downgrade
 */
export function getLostFeatures(currentPlan: 'starter' | 'growth'): string[] {
  if (currentPlan === 'growth') {
    return [
      '10 customizable slide decks',
      '50 personalized donor appreciation decks',
      'CSV donor personalization',
      'Annual report decks',
      'API access',
    ];
  }
  // Starter plan
  return [
    '5 customizable slide decks',
    'Edit colors & fonts',
    'Replace images',
    'Remove DonorSpark branding',
    'Advanced analytics',
  ];
}
