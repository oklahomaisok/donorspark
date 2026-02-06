'use client';

import { useState } from 'react';
import type { User } from '@/db/schema';

interface VerificationWarningProps {
  user: User;
}

export function VerificationWarning({ user }: VerificationWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already verified or dismissed
  if (user.emailVerified || dismissed) {
    return null;
  }

  // Check if user is more than 7 days old (show warning after 7 days)
  const userAge = Date.now() - new Date(user.createdAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (userAge < sevenDays) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-4">
      <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full text-amber-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-amber-800 mb-1">Verify your email</h4>
        <p className="text-sm text-amber-700">
          Please verify your email address ({user.email}) to ensure you can recover your account and receive important updates.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button className="text-sm font-medium text-amber-800 hover:underline">
            Resend verification email
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-sm text-amber-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
