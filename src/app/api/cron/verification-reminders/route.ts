import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { sendVerificationReminder } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find users who:
    // 1. Are not verified
    // 2. Were created more than 48 hours ago
    // 3. Haven't been reminded yet
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const usersToRemind = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerified, false),
          lt(users.createdAt, fortyEightHoursAgo),
          isNull(users.emailVerificationRemindedAt)
        )
      )
      .limit(100); // Process in batches

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of usersToRemind) {
      try {
        await sendVerificationReminder(user.email, user.name || undefined);

        // Mark as reminded
        await db
          .update(users)
          .set({ emailVerificationRemindedAt: new Date() })
          .where(eq(users.id, user.id));

        sentCount++;
      } catch (error) {
        errors.push(`Failed to send to ${user.email}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      usersFound: usersToRemind.length,
      emailsSent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Verification reminder cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification reminders' },
      { status: 500 }
    );
  }
}
