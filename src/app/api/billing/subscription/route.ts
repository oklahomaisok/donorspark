import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe, getPriceId } from '@/lib/stripe';
import { getUserByClerkId } from '@/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const body = await req.json();
    const { action, targetPlan } = body;
    const stripe = getStripe();

    switch (action) {
      case 'cancel': {
        // Set subscription to cancel at period end (keeps access until then)
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        return NextResponse.json({ success: true, message: 'Subscription will cancel at period end' });
      }

      case 'reactivate': {
        // Remove scheduled cancellation
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        return NextResponse.json({ success: true, message: 'Subscription reactivated' });
      }

      case 'pause': {
        // Pause subscription for 3 months
        const pauseEndDate = new Date();
        pauseEndDate.setMonth(pauseEndDate.getMonth() + 3);

        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          pause_collection: { behavior: 'void' },
          metadata: { paused_until: pauseEndDate.toISOString() },
        });
        return NextResponse.json({ success: true, message: 'Subscription paused for 3 months' });
      }

      case 'change_plan': {
        if (!targetPlan || !['starter', 'growth'].includes(targetPlan)) {
          return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 });
        }

        // Get current subscription to find the item ID
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const itemId = subscription.items.data[0]?.id;
        if (!itemId) {
          return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 });
        }

        // Get the new price ID
        const billingCycle = user.planBillingCycle || 'monthly';
        const newPriceId = getPriceId(targetPlan, billingCycle);
        if (!newPriceId) {
          return NextResponse.json({ error: 'Price not found for plan' }, { status: 400 });
        }

        // Update subscription with proration
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          items: [{ id: itemId, price: newPriceId }],
          proration_behavior: 'create_prorations',
        });

        return NextResponse.json({ success: true, message: `Plan changed to ${targetPlan}` });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing subscription error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update subscription', debug: message }, { status: 500 });
  }
}
