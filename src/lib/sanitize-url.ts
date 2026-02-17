/**
 * URL sanitization utilities to prevent XSS and SSRF attacks.
 */

/**
 * Sanitize a URL for safe use in HTML href attributes.
 * Only allows http: and https: protocols. Returns empty string for unsafe URLs.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return '';
  } catch {
    // Relative URLs are allowed (they resolve against the page origin)
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return '';
  }
}

/**
 * Check if a URL points to a private/internal network address.
 * Used to prevent SSRF attacks.
 */
export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0'
    ) {
      return true;
    }

    // Block common internal hostnames
    if (
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return true;
    }

    // Block private IPv4 ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      // 10.0.0.0/8
      if (a === 10) return true;
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true;
      // 192.168.0.0/16
      if (a === 192 && b === 168) return true;
      // 169.254.0.0/16 (link-local, includes AWS metadata 169.254.169.254)
      if (a === 169 && b === 254) return true;
      // 127.0.0.0/8
      if (a === 127) return true;
      // 0.0.0.0/8
      if (a === 0) return true;
    }

    return false;
  } catch {
    // If URL can't be parsed, treat as unsafe
    return true;
  }
}
