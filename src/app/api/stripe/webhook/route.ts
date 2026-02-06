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
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: any) {
  const userId = parseInt(session.metadata?.userId);
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.error('No subscription in checkout session');
    return;
  }

  // Get the subscription to find the price
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as unknown as {
    items: { data: Array<{ price: { id: string } }> };
    current_period_end: number;
  };
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price found in subscription');
    return;
  }

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  await updateUserPlan(userId, {
    plan: planInfo.plan as Plan,
    planBillingCycle: planInfo.cycle as BillingCycle,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
