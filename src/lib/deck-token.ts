import { createHmac, randomBytes } from 'crypto';

function getTokenSecret(): string {
  const secret = process.env.DECK_getTokenSecret() || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('Missing DECK_getTokenSecret() or CRON_SECRET environment variable.');
  }
  return secret;
}
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a short-lived token for deck content access
 */
export function generateDeckToken(slug: string): string {
  const timestamp = Date.now();
  const nonce = randomBytes(8).toString('hex');
  const data = `${slug}:${timestamp}:${nonce}`;
  const signature = createHmac('sha256', getTokenSecret())
    .update(data)
    .digest('hex')
    .substring(0, 16);

  // Encode as base64 for URL safety
  const token = Buffer.from(`${data}:${signature}`).toString('base64url');
  return token;
}

/**
 * Validate a deck content token
 * Returns the slug if valid, null if invalid or expired
 */
export function validateDeckToken(token: string, expectedSlug: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) return false;

    const [slug, timestampStr, nonce, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Check slug matches
    if (slug !== expectedSlug) return false;

    // Check not expired
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false;

    // Verify signature
    const data = `${slug}:${timestamp}:${nonce}`;
    const expectedSig = createHmac('sha256', getTokenSecret())
      .update(data)
      .digest('hex')
      .substring(0, 16);

    if (signature !== expectedSig) return false;

    return true;
  } catch {
    return false;
  }
}
