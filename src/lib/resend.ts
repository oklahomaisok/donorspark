import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set - emails will not be sent');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = 'DonorSpark <noreply@donorspark.app>';

/**
 * Send a verification reminder email
 */
export async function sendVerificationReminder(email: string, name?: string) {
  if (!resend) {
    console.log('Resend not configured, skipping verification reminder email');
    return null;
  }

  const firstName = name?.split(' ')[0] || 'there';

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Please verify your email - DonorSpark',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <img src="https://donorspark.app/donorsparklogo.png" alt="DonorSpark" style="height: 40px; margin-bottom: 30px;">

        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hey ${firstName}!</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We noticed you haven't verified your email yet. Verifying ensures you can recover your account and receive important updates about your impact decks.
        </p>

        <a href="https://donorspark.app/verify-email" style="display: inline-block; background-color: #C15A36; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 30px;">
          Verify Email
        </a>

        <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
          If you didn't create an account on DonorSpark, you can ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="color: #9a9a9a; font-size: 12px;">
          DonorSpark - Story decks that inspire donors to give.
        </p>
      </div>
    `,
  });
}

/**
 * Send a 30-day stats email with upgrade CTA
 */
export async function send30DayStatsEmail(
  email: string,
  name: string | undefined,
  stats: {
    totalViews: number;
    totalClicks: number;
    totalShares: number;
    deckCount: number;
  }
) {
  if (!resend) {
    console.log('Resend not configured, skipping 30-day stats email');
    return null;
  }

  const firstName = name?.split(' ')[0] || 'there';
  const clickRate = stats.totalViews > 0
    ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1)
    : '0';

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your DonorSpark Monthly Report: ${stats.totalViews} views`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <img src="https://donorspark.app/donorsparklogo.png" alt="DonorSpark" style="height: 40px; margin-bottom: 30px;">

        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Your monthly impact report is here!</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Hey ${firstName}, here's how your story decks performed this month:
        </p>

        <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #1a1a1a;">${stats.totalViews}</div>
              <div style="font-size: 14px; color: #6a6a6a;">Views</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #1a1a1a;">${stats.totalClicks}</div>
              <div style="font-size: 14px; color: #6a6a6a;">Donate Clicks</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #1a1a1a;">${clickRate}%</div>
              <div style="font-size: 14px; color: #6a6a6a;">Click Rate</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #1a1a1a;">${stats.totalShares}</div>
              <div style="font-size: 14px; color: #6a6a6a;">Shares</div>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #C15A36, #e07a50); border-radius: 12px; padding: 24px; margin-bottom: 30px; color: white;">
          <h2 style="font-size: 20px; margin: 0 0 12px 0;">Ready to grow your impact?</h2>
          <p style="font-size: 14px; margin: 0 0 20px 0; opacity: 0.9;">
            Upgrade to Starter and unlock custom branding, thank-you decks, and advanced analytics.
          </p>
          <a href="https://donorspark.app/pricing" style="display: inline-block; background: white; color: #C15A36; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View Plans
          </a>
        </div>

        <a href="https://donorspark.app/dashboard" style="display: inline-block; color: #C15A36; text-decoration: none; font-weight: 600;">
          View Full Dashboard →
        </a>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="color: #9a9a9a; font-size: 12px;">
          DonorSpark - Story decks that inspire donors to give.
        </p>
      </div>
    `,
  });
}

/**
 * Send upgrade milestone email (e.g., 5+ shares)
 */
/**
 * Send welcome email with deck link and QR code
 * Called when a user claims their first deck
 */
export async function sendWelcomeEmail(
  email: string,
  name: string | undefined,
  deckInfo: {
    orgName: string;
    deckUrl: string;
    qrCodeDataUrl?: string; // base64 data URL
  }
) {
  if (!resend) {
    console.log('Resend not configured, skipping welcome email');
    return null;
  }

  const firstName = name?.split(' ')[0] || 'there';

  // Extract base64 data from data URL if provided
  const qrCodeAttachment = deckInfo.qrCodeDataUrl
    ? [{
        filename: `${deckInfo.orgName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`,
        content: deckInfo.qrCodeDataUrl.split(',')[1], // Remove data:image/png;base64, prefix
      }]
    : [];

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your impact deck is live — here's how to use it`,
    attachments: qrCodeAttachment,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <img src="https://donorspark.app/donorsparklogo.png" alt="DonorSpark" style="height: 40px; margin-bottom: 30px;">

        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Your deck for ${deckInfo.orgName} is ready!</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hey ${firstName}, your impact deck is live and ready to share with donors, board members, and supporters.
        </p>

        <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Your deck link</p>
          <a href="${deckInfo.deckUrl}" style="color: #C15A36; font-size: 16px; word-break: break-all; text-decoration: none;">${deckInfo.deckUrl}</a>
        </div>

        <a href="${deckInfo.deckUrl}" style="display: inline-block; background-color: #C15A36; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 30px;">
          View Your Deck
        </a>

        <h2 style="color: #1a1a1a; font-size: 18px; margin: 30px 0 16px 0;">3 ways to share your deck this week:</h2>

        <ol style="color: #4a4a4a; font-size: 15px; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
          <li><strong>Send to your board</strong> — Forward this email or copy the link above</li>
          <li><strong>Post on social</strong> — Share on LinkedIn, Facebook, or Twitter with a brief intro</li>
          <li><strong>Print the QR code</strong> — We've attached a QR code you can add to flyers, event tables, or newsletters</li>
        </ol>

        ${deckInfo.qrCodeDataUrl ? `
        <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <p style="color: #6a6a6a; font-size: 12px; margin: 0 0 12px 0;">QR CODE ATTACHED</p>
          <p style="color: #4a4a4a; font-size: 13px; margin: 0;">Check your email attachments for a high-res QR code PNG that links directly to your deck.</p>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="color: #6a6a6a; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          <strong>Questions?</strong> Just reply to this email — we read every message.
        </p>

        <p style="color: #9a9a9a; font-size: 12px;">
          DonorSpark - Story decks that inspire donors to give.
        </p>
      </div>
    `,
  });
}

/**
 * Send upgrade milestone email (e.g., 5+ shares)
 */
export async function sendUpgradeMilestoneEmail(
  email: string,
  name: string | undefined,
  milestone: { type: string; value: number }
) {
  if (!resend) {
    console.log('Resend not configured, skipping milestone email');
    return null;
  }

  const firstName = name?.split(' ')[0] || 'there';

  let milestoneMessage = '';
  let benefitMessage = '';

  if (milestone.type === 'shares') {
    milestoneMessage = `Your deck has been shared ${milestone.value} times!`;
    benefitMessage = 'Upgrade to track which shares convert to donations and unlock personalized thank-you decks.';
  } else if (milestone.type === 'views') {
    milestoneMessage = `You've reached ${milestone.value} views!`;
    benefitMessage = 'Upgrade to get detailed analytics and remove DonorSpark branding from your decks.';
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Milestone reached! ${milestoneMessage}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <img src="https://donorspark.app/donorsparklogo.png" alt="DonorSpark" style="height: 40px; margin-bottom: 30px;">

        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
          <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Congratulations!</h1>
        </div>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
          ${milestoneMessage}
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
          ${benefitMessage}
        </p>

        <div style="text-align: center;">
          <a href="https://donorspark.app/pricing" style="display: inline-block; background-color: #C15A36; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Upgrade Now
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
          DonorSpark - Story decks that inspire donors to give.
        </p>
      </div>
    `,
  });
}
