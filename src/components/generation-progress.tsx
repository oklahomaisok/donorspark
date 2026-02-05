'use client';

import { useRealtimeRun } from '@trigger.dev/react-hooks';
import { useState, useEffect, useRef } from 'react';

const loadingPhrases = [
  "Warming up the engines...",
  "Understanding your vibe...",
  "Twiddling our thumbs...",
  "Brewing some magic...",
  "Consulting the design gods...",
  "Polishing the pixels...",
  "Sprinkling in some sparkle...",
  "Making it look pretty...",
  "Adding that chef's kiss...",
  "Almost there, promise...",
  "Worth the wait...",
  "Crafting your story...",
  "Mixing colors like a DJ...",
  "Teaching robots to feel...",
  "Channeling your energy...",
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
  const [currentPhrase, setCurrentPhrase] = useState(loadingPhrases[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll into view when component mounts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Cycle through phrases with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      // After roll-out animation, change phrase
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
        setCurrentPhrase(loadingPhrases[(phraseIndex + 1) % loadingPhrases.length]);
        setIsAnimating(false);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [phraseIndex]);

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
  const progress = (meta?.progress as number) || 0;

  return (
    <div ref={containerRef} className="card bg-cream p-8 md:p-16 text-center max-w-lg mx-auto">
      <style jsx>{`
        @keyframes rollOut {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes rollIn {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .roll-out {
          animation: rollOut 0.4s ease-in forwards;
        }
        .roll-in {
          animation: rollIn 0.4s ease-out forwards;
        }
      `}</style>

      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-salmon rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-3 h-3 bg-periwinkle rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
        <p className="text-lg font-medium text-ink mb-4">Building your story deck...</p>
        <div className="h-6 overflow-hidden">
          <p
            className={`text-sm text-ink/60 ${isAnimating ? 'roll-out' : 'roll-in'}`}
          >
            {currentPhrase}
          </p>
        </div>
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
