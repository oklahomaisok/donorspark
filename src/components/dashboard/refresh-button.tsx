'use client';

import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.refresh()}
      className="px-6 py-3 bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors"
    >
      Refresh Status
    </button>
  );
}
