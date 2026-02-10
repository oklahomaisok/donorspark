'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

function CreditCardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 h-16 bg-white/80 backdrop-blur-md border-b border-ink/5">
      <Link href="/" className="flex items-center">
        <img src="/donorsparklogo.png" alt="DonorSpark" className="h-8" />
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
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Billing"
                labelIcon={<CreditCardIcon />}
                href="/dashboard/account"
              />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
      </div>
    </nav>
  );
}
