'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl max-w-md w-full text-center border border-ink/5">
        <h1 className="text-3xl md:text-4xl font-medium mb-2">DonorSpark</h1>
        <p className="text-ink/50 mb-8 text-sm">Private Beta Access</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password"
            className={`w-full px-6 py-4 rounded-full bg-cream outline-none text-center text-lg ${error ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-ink'}`}
            autoFocus
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm">Incorrect password</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-cream py-4 rounded-full font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>

        <p className="mt-8 text-xs text-ink/30">Contact us for access</p>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-ink/40">Loading...</div>
      </div>
    }>
      <PasswordForm />
    </Suspense>
  );
}
