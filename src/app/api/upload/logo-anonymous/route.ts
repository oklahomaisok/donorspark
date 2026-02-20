import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const UPLOAD_RATE_LIMIT = 5;

/**
 * POST /api/upload/logo-anonymous
 * Anonymous logo upload for the manual wizard flow.
 * Rate-limited to 5 uploads/hour per IP.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    const { allowed } = checkRateLimit(`upload:${ip}`, UPLOAD_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, WebP, SVG' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 4MB.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `logos/anon-${nanoid(12)}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('POST /api/upload/logo-anonymous error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
