import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { upsertUser } from '@/db/queries';

export async function POST(req: NextRequest) {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: { type: string; data: Record<string, unknown> };

  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const data = event.data;
    const clerkId = data.id as string;
    const emailAddresses = data.email_addresses as Array<{ email_address: string }>;
    const email = emailAddresses?.[0]?.email_address || '';
    const firstName = (data.first_name as string) || '';
    const lastName = (data.last_name as string) || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    await upsertUser(clerkId, email, name);
  }

  return NextResponse.json({ received: true });
}
