import { NextResponse } from 'next/server';

// Password protection removed - site is now public
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
