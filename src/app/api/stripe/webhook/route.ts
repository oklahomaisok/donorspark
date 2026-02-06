import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import { getUserById, updateUserPlan } from '@/db/queries';
import type { Plan, BillingCycle } from '@/db/schema';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Webhook handler failed', debug: message }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: any) {
  console.log('handleCheckoutComplete called with session:', JSON.stringify(session.metadata));

  const userId = parseInt(session.metadata?.userId, 10);
  if (!userId || isNaN(userId)) {
    throw new Error(`No userId in checkout session metadata. Got: ${JSON.stringify(session.metadata)}`);
  }

  // Verify user exists before updating
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`User not found for userId: ${userId}`);
  }

  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    throw new Error('No subscription in checkout session');
  }

  // Get the subscription to find the price
  console.log('Retrieving subscription:', subscriptionId);
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // Cast to access the subscription data
  const subscription = subscriptionResponse as unknown as {
    items: { data: Array<{ price: { id: string } }> };
    current_period_end?: number;
  };
  console.log('Subscription current_period_end:', subscription.current_period_end);

  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    throw new Error('No price found in subscription');
  }

  console.log('Got priceId:', priceId);
  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) {
    throw new Error(`Unknown price ID: ${priceId}. Check STRIPE_*_PRICE_ID env vars.`);
  }

  // Handle the period end - it could be a number (unix timestamp) or undefined
  const periodEnd = subscription.current_period_end;
  const periodEndDate = periodEnd ? new Date(periodEnd * 1000) : undefined;

  console.log('Updating user plan:', userId, planInfo);
  await updateUserPlan(userId, {
    plan: planInfo.plan as Plan,
    planBillingCycle: planInfo.cycle as BillingCycle,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: periodEndDate,
  });

  console.log(`User ${userId} upgraded to ${planInfo.plan} (${planInfo.cycle})`);
}

async function handleSubscriptionUpdate(subscription: any) {
  const userId = parseInt(subscription.metadata?.userId);
  if (!userId) {
    // Try to find user by subscription ID
    console.log('No userId in subscription metadata, skipping update');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) return;

  await updateUserPlan(userId, {
    plan: planInfo.plan as Plan,
    planBillingCycle: planInfo.cycle as BillingCycle,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  console.log(`User ${userId} subscription updated to ${planInfo.plan}`);
}

async function handleSubscriptionCanceled(subscription: any) {
  const userId = parseInt(subscription.metadata?.userId);
  if (!userId) return;

  // Revert to free plan but keep the subscription ID for records
  await updateUserPlan(userId, {
    plan: 'free' as Plan,
    planBillingCycle: null,
    stripePriceId: undefined,
    stripeCurrentPeriodEnd: undefined,
  });

  console.log(`User ${userId} subscription canceled, reverted to free`);
}

async function handlePaymentSucceeded(invoice: any) {
  // Could send a receipt email here
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: any) {
  // Could send a payment failure email here
  console.log(`Payment failed for invoice ${invoice.id}`);
}
