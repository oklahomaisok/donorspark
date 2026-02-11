'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteDeckModalProps {
  deckId: number;
  deckName: string;
  deckUrl: string;
  onClose: () => void;
}

export function DeleteDeckModal({ deckId, deckName, deckUrl, onClose }: DeleteDeckModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete deck');
      }

      // Refresh the page to show updated deck list
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Warning Icon */}
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        </div>

        <h2 className="text-xl font-bold text-neutral-800 text-center mb-2">
          Delete {deckName}?
        </h2>

        <div className="text-neutral-600 text-sm text-center mb-6 space-y-3">
          <p>
            This action <span className="font-semibold text-red-600">cannot be undone</span>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <p className="text-amber-800 text-sm">
              <strong>Warning:</strong> Anyone with the link below will no longer be able to access this deck:
            </p>
            <p className="font-mono text-xs text-amber-700 mt-1 break-all">
              {deckUrl}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Deck'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
