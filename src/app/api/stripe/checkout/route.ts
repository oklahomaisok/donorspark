import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, getPriceId, type PlanType, type BillingCycle } from '@/lib/stripe';
import { getUserByClerkId, updateUserStripeCustomerId, upsertUser } from '@/db/queries';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId: clerkId } = await auth();
    console.log('Checkout: clerkId =', clerkId);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    let user = await getUserByClerkId(clerkId);
    console.log('Checkout: user =', user ? `id=${user.id}` : 'NOT FOUND');

    // If user doesn't exist, create them now (fallback for when webhook hasn't fired)
    if (!user) {
      console.log('Checkout: Creating user from Clerk data');
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: 'Could not fetch user data' }, { status: 500 });
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;
      user = await upsertUser(clerkId, email, name);
      console.log('Checkout: Created user id =', user.id);
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
    console.log('Checkout: plan =', plan, 'cycle =', cycle, 'priceId =', priceId);
    if (!priceId) {
      return NextResponse.json({
        error: 'Invalid plan or cycle',
        debug: `plan=${plan}, cycle=${cycle}, priceId=${priceId}`
      }, { status: 400 });
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
    const successUrl = `${config.siteUrl}/dashboard?upgraded=true`;
    const cancelUrl = `${config.siteUrl}/pricing?canceled=true`;
    console.log('Checkout: siteUrl =', config.siteUrl);
    console.log('Checkout: successUrl =', successUrl);
    console.log('Checkout: cancelUrl =', cancelUrl);
    console.log('Checkout: priceId =', priceId);

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
      success_url: successUrl,
      cancel_url: cancelUrl,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        debug: message,
        siteUrl: config.siteUrl,
      },
      { status: 500 }
    );
  }
}
