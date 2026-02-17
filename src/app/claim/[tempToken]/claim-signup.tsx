'use client';

import { SignUp } from '@clerk/nextjs';

interface ClaimSignUpProps {
  tempToken: string;
}

export function ClaimSignUp({ tempToken }: ClaimSignUpProps) {
  return (
    <SignUp
      fallbackRedirectUrl={`/claim/${tempToken}`}
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'shadow-none p-0 w-full',
          headerTitle: 'hidden',
          headerSubtitle: 'hidden',
          socialButtonsBlockButton: 'border-neutral-200',
          formButtonPrimary: 'bg-[#C15A36] hover:bg-[#a84d2e]',
          footerAction: 'text-sm',
          footerActionLink: 'text-[#C15A36] hover:text-[#a84d2e]',
        },
      }}
    />
  );
}
