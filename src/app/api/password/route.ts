import { NextRequest, NextResponse } from 'next/server';

const SITE_PASSWORD = 'donorspark2026';
const AUTH_COOKIE = 'donorspark_beta_auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password === SITE_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // Set secure cookie that expires in 30 days
      response.cookies.set(AUTH_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
