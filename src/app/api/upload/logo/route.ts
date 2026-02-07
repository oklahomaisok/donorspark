import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { getUserByClerkId } from '@/db/queries';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limit is 4.5MB)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/upload/logo
 * Upload an image to Vercel Blob (logos, slide backgrounds, testimonial photos)
 * Note: All authenticated users can upload. Saving edits requires paid plan (enforced in PATCH /api/decks/[id]).
 */
export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user (needed for unique filename)
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Note: We allow all authenticated users to upload for preview purposes.
    // Saving changes to the deck still requires a paid plan.

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `logos/user-${user.id}-${Date.now()}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error('POST /api/upload/logo error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
