'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 h-16 bg-white/80 backdrop-blur-md border-b border-ink/5">
      <Link href="/" className="font-bold text-ink tracking-tight">
        DonorSpark
      </Link>
      <div className="flex items-center gap-4">
        <SignedOut>
          <Link
            href="/sign-in"
            className="text-sm text-ink/60 hover:text-ink transition-colors"
          >
            Sign In
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="text-sm text-ink/60 hover:text-ink transition-colors"
          >
            Dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
