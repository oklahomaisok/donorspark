import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, getPriceId, type PlanType, type BillingCycle } from '@/lib/stripe';
import { getUserByClerkId, updateUserStripeCustomerId } from '@/db/queries';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request
    const body = await req.json();
    const plan = body.plan as PlanType;
    const cycle = body.cycle as BillingCycle;

    if (!plan || !cycle) {
      return NextResponse.json({ error: 'Missing plan or cycle' }, { status: 400 });
    }

    // Get price ID
    const priceId = getPriceId(plan, cycle);
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or cycle' }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id.toString(),
          clerkId: user.clerkId,
        },
      });
      stripeCustomerId = customer.id;
      await updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${config.siteUrl}/dashboard?upgraded=true`,
      cancel_url: `${config.siteUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          plan,
          cycle,
        },
      },
      metadata: {
        userId: user.id.toString(),
        plan,
        cycle,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
