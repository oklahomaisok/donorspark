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
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll into view when component mounts - with delay to ensure render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2);
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cycle through phrases with animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Start exit animation
      setAnimationState('exiting');

      // After exit animation, change phrase and start enter animation
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
        setAnimationState('entering');

        // Reset to visible after enter animation
        setTimeout(() => {
          setAnimationState('visible');
        }, 400);
      }, 400);
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
  const progress = (meta?.progress as number) || 0;

  const getAnimationStyle = (): React.CSSProperties => {
    switch (animationState) {
      case 'exiting':
        return {
          transform: 'translateY(-20px)',
          opacity: 0,
          transition: 'transform 0.4s ease-in, opacity 0.4s ease-in',
        };
      case 'entering':
        return {
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
        };
      default:
        return {
          transform: 'translateY(0)',
          opacity: 1,
        };
    }
  };

  return (
    <div ref={containerRef} className="card bg-cream p-8 md:p-16 text-center max-w-lg mx-auto">
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
            className="text-sm text-ink/60"
            style={getAnimationStyle()}
          >
            {loadingPhrases[phraseIndex]}
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
