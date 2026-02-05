'use client';

import { useRealtimeRun } from '@trigger.dev/react-hooks';
import { useState, useEffect } from 'react';

const loadingPhrases = [
  "Warming up the engines...",
  "Understanding your vibe...",
  "Twiddling our thumbs...",
  "Brewing some magic...",
  "Consulting the design gods...",
  "Polishing the pixels...",
  "Making it look pretty...",
  "Adding that chef's kiss...",
  "Almost there, promise...",
  "Worth the wait...",
  "Mixing colors like a DJ...",
  "Teaching robots to feel...",
  "Making donors weep (happy tears)...",
];

interface GenerationProgressProps {
  runId: string;
  publicAccessToken: string;
  onComplete: (data: { deckUrl: string; ogImageUrl: string; orgName: string; slug: string }) => void;
  onError: (error: string) => void;
}

export function GenerationProgress({ runId, publicAccessToken, onComplete, onError }: GenerationProgressProps) {
  const { run } = useRealtimeRun(runId, { accessToken: publicAccessToken });
  const [fallbackPhrase, setFallbackPhrase] = useState(loadingPhrases[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFallbackPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!run) return;

    if (run.status === 'COMPLETED' && run.output) {
      const output = run.output as { deckUrl: string; ogImageUrl: string; orgName: string; slug: string };
      onComplete(output);
    }

    if (run.status === 'FAILED') {
      const errorMsg = (run.metadata as Record<string, unknown>)?.error as string || 'Generation failed. Please try again.';
      onError(errorMsg);
    }
  }, [run, onComplete, onError]);

  const meta = run?.metadata as Record<string, unknown> | undefined;
  const step = (meta?.step as string) || fallbackPhrase;
  const progress = (meta?.progress as number) || 0;

  return (
    <div className="card bg-cream p-8 md:p-16 text-center max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-salmon rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-3 h-3 bg-periwinkle rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
        <p className="text-lg font-medium text-ink mb-2">Building your story deck...</p>
        <p className="text-sm text-ink/60 transition-all duration-500">{step}</p>
      </div>

      {progress > 0 && (
        <div className="w-full bg-ink/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-salmon h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
