import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserByClerkId } from '@/db/queries';
import { getStripe } from '@/lib/stripe';
import { BillingDashboard } from '@/components/dashboard/billing-dashboard';
import { PlanBadge } from '@/components/dashboard/plan-badge';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect('/sign-in');

  // Fetch subscription from Stripe for latest data
  let subscription = null;
  if (user.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      const subResponse = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['default_payment_method'],
      });

      // Cast to access the subscription data (Stripe returns Response wrapper)
      const sub = subResponse as unknown as {
        id: string;
        cancel_at_period_end: boolean;
        current_period_end: number;
        default_payment_method?: {
          card?: { brand: string; last4: string };
        } | null;
      };

      // Extract only the data we need for the client component
      subscription = {
        id: sub.id,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: sub.current_period_end,
        default_payment_method: sub.default_payment_method
          ? {
              card: sub.default_payment_method.card
                ? {
                    brand: sub.default_payment_method.card.brand,
                    last4: sub.default_payment_method.card.last4,
                  }
                : undefined,
            }
          : null,
      };
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-neutral-800">Account</h1>
          <PlanBadge user={user} />
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-bold text-neutral-800 mb-6">Profile</h2>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Name</div>
            <div className="font-medium text-neutral-800">{user.name || 'Not set'}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Email</div>
            <div className="font-medium text-neutral-800">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Member since</div>
            <div className="font-medium text-neutral-800">
              {user.createdAt.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Dashboard */}
      <BillingDashboard user={user} subscription={subscription} />
    </div>
  );
}
