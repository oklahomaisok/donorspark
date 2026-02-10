'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import { PricingSection } from '@/components/pricing-section';

type Phase = 'idle' | 'generating' | 'complete' | 'error';

/* ─────────────────────────────────────────────
   Meng To-style Motion System
   - Micro interactions: scale 1.03 + shadow, 200ms ease-out
   - Entrances: fade + translateY 12px, stagger 60ms
   - Spring for success states only
───────────────────────────────────────────── */

// Hook for scroll-triggered entrance animations
function useScrollReveal(staggerDelay = 60) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible, staggerDelay };
}

// Animated container with staggered children
function AnimatedSection({
  children,
  className = '',
  stagger = 60,
  as: Component = 'div'
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  as?: 'div' | 'section';
}) {
  const { ref, isVisible } = useScrollReveal(stagger);

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        '--stagger': `${stagger}ms`,
      } as React.CSSProperties}
      data-visible={isVisible}
    >
      {children}
    </Component>
  );
}

export default function Home() {
  const [url, setUrl] = useState('www.');
  const [phase, setPhase] = useState<Phase>('idle');
  const [runId, setRunId] = useState('');
  const [publicAccessToken, setPublicAccessToken] = useState('');
  const [result, setResult] = useState<{ deckUrl: string; ogImageUrl: string; orgName: string; slug: string } | null>(null);
  const [error, setError] = useState('');
  const [ogFailed, setOgFailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let trimmed = url.trim();
    if (!trimmed || trimmed === 'www.') return;

    // Normalize URL: remove duplicate www., add https:// if needed
    trimmed = trimmed.replace(/^(https?:\/\/)?(www\.)+/i, '');
    if (!trimmed.startsWith('http')) {
      trimmed = 'https://www.' + trimmed;
    }

    setPhase('generating');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, orgName: '' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start generation');
      }

      const data = await res.json();
      setRunId(data.runId);
      setPublicAccessToken(data.publicAccessToken);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const handleComplete = useCallback((data: { deckUrl: string; ogImageUrl: string; orgName: string; slug: string }) => {
    setResult(data);
    setPhase('complete');
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setPhase('error');
  }, []);

  function resetForm() {
    setUrl('www.');
    setPhase('idle');
    setRunId('');
    setPublicAccessToken('');
    setResult(null);
    setError('');
    setOgFailed(false);
  }

  return (
    <>
      <Nav />

      {/* Global motion styles */}
      <style>{`
        /* Micro interactions: scale 1.03 + shadow, 200ms ease-out */
        .hover-lift {
          transition: transform 200ms ease-out, box-shadow 200ms ease-out;
        }
        .hover-lift:hover {
          transform: scale(1.03);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2);
        }

        /* Entrance animations: fade + translateY 12px */
        .reveal-item {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 350ms ease-out, transform 350ms ease-out;
        }
        [data-visible="true"] .reveal-item {
          opacity: 1;
          transform: translateY(0);
        }

        /* Staggered children */
        [data-visible="true"] .reveal-item:nth-child(1) { transition-delay: 0ms; }
        [data-visible="true"] .reveal-item:nth-child(2) { transition-delay: 60ms; }
        [data-visible="true"] .reveal-item:nth-child(3) { transition-delay: 120ms; }
        [data-visible="true"] .reveal-item:nth-child(4) { transition-delay: 180ms; }
        [data-visible="true"] .reveal-item:nth-child(5) { transition-delay: 240ms; }
        [data-visible="true"] .reveal-item:nth-child(6) { transition-delay: 300ms; }

        /* Success state spring animation */
        @keyframes success-spring {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-spring {
          animation: success-spring 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Button hover - subtle scale */
        .btn-hover {
          transition: transform 200ms ease-out, box-shadow 200ms ease-out;
        }
        .btn-hover:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.2);
        }
        .btn-hover:active {
          transform: scale(0.98);
        }

        /* Animated blobs */
        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -15px) scale(1.05); }
          50% { transform: translate(-5px, 10px) scale(0.95); }
          75% { transform: translate(-15px, -5px) scale(1.02); }
        }
        .blob {
          animation: blob-float 20s ease-in-out infinite;
        }

        /* Scroll-triggered parallax sections */
        .parallax-section {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 600ms ease-out, transform 600ms ease-out;
        }
        .parallax-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <main className="w-full max-w-[1400px] mx-auto px-4 pt-20 pb-12 flex flex-col gap-4">

        {/* Hero Section — Side by side with animated phone */}
        <AnimatedSection as="section" className="relative card bg-white/40 p-6 md:p-10 lg:p-12 border border-ink/5 overflow-hidden">
          {/* Animated Blobs */}
          <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-salmon rounded-full blur-[80px] opacity-40 blob" />
          <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-sage rounded-full blur-[80px] opacity-40 blob" style={{ animationDelay: '-7s' }} />
          <div className="absolute top-[50%] left-[30%] w-48 h-48 bg-periwinkle rounded-full blur-[80px] opacity-30 blob" style={{ animationDelay: '-14s' }} />

          <div className="relative z-10 w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center py-8 md:py-12">
            {/* Left — Copy + CTA */}
            <div className="text-center lg:text-left flex-1 max-w-xl">
              <p className="reveal-item text-sm uppercase tracking-widest opacity-60 mb-4">Story Decks for Nonprofits</p>
              <h1 className="reveal-item text-4xl md:text-5xl lg:text-6xl mb-5 leading-[0.95]">
                Donors won&apos;t give to a mission <span className="italic">they don&apos;t understand.</span>
              </h1>

              <p className="reveal-item text-lg md:text-xl opacity-60 max-w-lg mb-6 leading-relaxed mx-auto lg:mx-0">
                We turn your nonprofit&apos;s story into a mobile slide deck that makes your impact instantly clear.
              </p>

              {/* Input Form */}
              {phase === 'idle' && (
                <form onSubmit={handleSubmit} className="reveal-item bg-white p-2 rounded-2xl md:rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 max-w-md flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-ink/10 focus-within:ring-2 focus-within:ring-ink/20 mx-auto lg:mx-0">
                  <TypewriterInput
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourwebsite.org"
                  />
                  <button
                    type="submit"
                    className="btn-hover bg-ink text-cream px-6 py-3 rounded-full font-medium whitespace-nowrap cursor-pointer text-sm"
                  >
                    Get Free Deck &rarr;
                  </button>
                </form>
              )}

              {phase === 'idle' && (
                <p className="reveal-item mt-4 text-xs uppercase tracking-widest opacity-40 text-center lg:text-left max-w-md mx-auto lg:mx-0">Enter your nonprofit&apos;s website.<br />Get a custom story deck instantly.</p>
              )}

              {/* Error State */}
              {phase === 'error' && (
                <div className="mt-6 max-w-md mx-auto lg:mx-0">
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                  <button onClick={resetForm} className="text-xs uppercase tracking-widest opacity-40 hover:opacity-60 transition-opacity duration-200 cursor-pointer">Try again</button>
                </div>
              )}

              {/* Generating State */}
              {phase === 'generating' && runId && publicAccessToken && (
                <div className="mt-6 mx-auto lg:mx-0 max-w-md">
                  <GenerationProgress
                    runId={runId}
                    publicAccessToken={publicAccessToken}
                    onComplete={handleComplete}
                    onError={handleError}
                  />
                </div>
              )}

              {/* Result Preview - with spring animation for success */}
              {phase === 'complete' && result && (
                <div className="mt-6 max-w-md mx-auto lg:mx-0 success-spring">
                  <p className="text-sm opacity-60 mb-4">Your deck is ready!</p>
                  <a href={`/decks/${result.slug}`} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="hover-lift relative rounded-2xl overflow-hidden shadow-lg bg-ink">
                      {!ogFailed && result.ogImageUrl ? (
                        <img
                          src={result.ogImageUrl}
                          alt="Deck Preview"
                          className="w-full"
                          onError={() => setOgFailed(true)}
                        />
                      ) : (
                        <div className="aspect-[1200/630] flex flex-col items-center justify-center text-cream p-8 text-center">
                          <div className="text-xl font-medium mb-1">{result.orgName} Impact Deck</div>
                          <div className="text-sm opacity-60">Click to view</div>
                        </div>
                      )}
                    </div>
                  </a>
                  <button onClick={resetForm} className="mt-4 text-xs uppercase tracking-widest opacity-40 hover:opacity-60 transition-opacity duration-200 cursor-pointer">Generate another deck</button>
                </div>
              )}
            </div>

            {/* Right — Animated deck phone */}
            <div className="reveal-item flex justify-center items-center flex-shrink-0 mt-4 lg:mt-0" style={{ perspective: '1000px' }}>
              <HeroPhone />
            </div>
          </div>
        </AnimatedSection>

        {/* Problem Section (Dark) */}
        <AnimatedSection as="section" className="card bg-ink text-cream p-8 md:p-20 min-h-[70vh] flex flex-col justify-center relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="reveal-item text-5xl md:text-7xl mb-8">
                You&apos;re doing the work. <span className="text-salmon italic">But your story isn&apos;t inspiring others.</span>
              </h2>
              <p className="reveal-item text-lg opacity-70 leading-relaxed max-w-md">
                Just because you&apos;re improving lives doesn&apos;t mean others get it. The problem isn&apos;t your impact — it&apos;s how you package it.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              <div className="reveal-item border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">If you can&apos;t connect with donors in under 60 seconds, they&apos;re gone.</h3>
                <p className="opacity-60">Attention spans are shorter today than ever. TikTok, Instagram, and Facebook have trained your audiences to consume content in bite-sized pieces. Nobody is reading through your website or your 20-page impact report.</p>
              </div>
              <div className="reveal-item border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">We tell your story so donors get it in an instant.</h3>
                <p className="opacity-60">We make the story of your organization scannable, shareable, and emotionally resonant — so donors, volunteers, and staff feel more engaged and inspired.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* How It Works (Bento Grid) */}
        <AnimatedSection as="section" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12">
          <div className="col-span-1 md:col-span-3 text-center py-12">
            <h2 className="reveal-item text-5xl md:text-6xl">From Mission to Movement</h2>
          </div>

          <div className="reveal-item hover-lift card bg-white p-10 flex flex-col justify-between min-h-[320px] border border-ink/5">
            <div className="w-12 h-12 bg-salmon/20 rounded-full flex items-center justify-center mb-6 text-salmon font-serif text-xl italic">1</div>
            <div>
              <h3 className="text-3xl serif mb-4">Share Your Website</h3>
              <p className="text-sm opacity-60 leading-relaxed">Paste your URL. We extract your mission, impact data, beneficiary stories, and translate them into a narrative arc.</p>
            </div>
          </div>

          <div className="reveal-item hover-lift card bg-sage p-10 flex flex-col justify-between min-h-[320px]">
            <div className="w-12 h-12 bg-ink/10 rounded-full flex items-center justify-center mb-6 text-ink font-serif text-xl italic">2</div>
            <div>
              <h3 className="text-3xl serif mb-4">We Build Your Story</h3>
              <p className="text-sm opacity-80 leading-relaxed">A custom 10-slide deck that answers: Why does this org exist? Who do they serve? What changes because of them?</p>
            </div>
          </div>

          <div className="reveal-item hover-lift card bg-white p-10 flex flex-col justify-between min-h-[320px] border border-ink/5">
            <div className="w-12 h-12 bg-periwinkle/40 rounded-full flex items-center justify-center mb-6 text-ink font-serif text-xl italic">3</div>
            <div>
              <h3 className="text-3xl serif mb-4">Your Story Spreads</h3>
              <p className="text-sm opacity-60 leading-relaxed">Send it to donors. Hand it to volunteers. Attach it to grant applications. Use it free or unlock the full version.</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Testimonials */}
        <AnimatedSection as="section" className="card bg-periwinkle mt-4 p-8 md:p-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-ink/10">
            <div className="reveal-item px-4">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;We&apos;ve had a website for five years. This is the first time someone outside our org could explain what we do in under a minute.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Sarah Chen<br />Executive Director, Youth Futures Fund
              </div>
            </div>
            <div className="reveal-item px-4 pt-8 md:pt-0">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;I sent this to three board members asking for connections. All three forwarded it. That&apos;s never happened before.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Marcus Johnson<br />Development Director, CHA
              </div>
            </div>
            <div className="reveal-item px-4 pt-8 md:pt-0">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;Our volunteers used to stumble when recruiting. Now they just pull up the deck. Recruitment is up 40%.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Jennifer Martinez<br />Founder, Arts Access Collective
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Pricing */}
        <PricingSection onGetFreeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        {/* Final CTA */}
        <AnimatedSection as="section" className="card bg-white p-8 md:p-32 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-salmon via-sage to-periwinkle" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="reveal-item text-5xl md:text-7xl mb-6">Ready to give your impact the story it deserves?</h2>
            <p className="reveal-item text-lg opacity-60 mb-12">Get your custom deck instantly. No credit card required.</p>

            <div className="reveal-item flex flex-col md:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                placeholder="What's your nonprofit's website?"
                className="bg-cream px-6 py-4 rounded-full w-full md:w-96 outline-none focus:ring-2 focus:ring-ink/10 transition-shadow duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      setUrl(val);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 500);
                    }
                  }
                }}
              />
              <button
                className="btn-hover bg-ink text-white px-8 py-4 rounded-full w-full md:w-auto cursor-pointer"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Get My Free Deck
              </button>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <footer className="max-w-[1400px] mx-auto px-10 pb-10 flex justify-between items-end opacity-40 uppercase tracking-widest text-[10px]">
        <div>
          <div className="font-bold mb-1">DonorSpark</div>
          <div>Your impact. Finally shareable.</div>
        </div>
        <div>&copy; 2026 DonorSpark. All rights reserved.</div>
      </footer>
    </>
  );
}

/* ─────────────────────────────────────────────
   Hero Phone — Showcase images with swipe animation
───────────────────────────────────────────── */
const heroImages = [
  '/UW01.png',
  '/UW02.png',
  '/UW03.png',
  '/UW04.png',
  '/UW05.png',
  '/UW06.png',
];

/* ─────────────────────────────────────────────
   Typewriter Input — Animated placeholder
───────────────────────────────────────────── */
function TypewriterInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);

  // Typewriter animation effect
  useEffect(() => {
    // Don't animate if user has focused or typed
    if (isFocused || hasTyped) return;

    let charIndex = 0;
    setDisplayedPlaceholder('');

    const typeInterval = setInterval(() => {
      if (charIndex < placeholder.length) {
        setDisplayedPlaceholder(placeholder.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // After completing, wait and restart
        setTimeout(() => {
          if (!isFocused && !hasTyped) {
            setDisplayedPlaceholder('');
            charIndex = 0;
          }
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [placeholder, isFocused, hasTyped]);

  // Restart animation periodically when idle
  useEffect(() => {
    if (isFocused || hasTyped) return;

    const restartInterval = setInterval(() => {
      setDisplayedPlaceholder('');
    }, 5000);

    return () => clearInterval(restartInterval);
  }, [isFocused, hasTyped]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value !== 'www.') {
      setHasTyped(true);
    } else {
      setHasTyped(false);
    }
    onChange(e);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    if (value === 'www.') {
      setHasTyped(false);
    }
  };

  const showPlaceholder = !isFocused && !hasTyped && value === 'www.';

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full bg-transparent pl-4 pr-4 py-3 outline-none text-sm"
      />
      {showPlaceholder && (
        <span className="absolute top-1/2 -translate-y-1/2 text-sm text-ink/40 pointer-events-none" style={{ left: 'calc(1rem + 9ch)' }}>
          {displayedPlaceholder}
          <span className="inline-block w-0.5 h-4 bg-ink/40 ml-0.5 animate-pulse align-middle" />
        </span>
      )}
    </div>
  );
}

function HeroPhone() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [rotateY, setRotateY] = useState(0); // Y-axis rotation (swivel toward text)
  const phoneRef = useRef<HTMLDivElement>(null);

  const nextIndex = (currentIndex + 1) % heroImages.length;

  useEffect(() => {
    const interval = setInterval(() => {
      // Start the slide animation
      setIsSliding(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Scroll-based Y rotation: swivel the phone to face the text on the left
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 800; // How much scroll to complete the rotation
      const maxRotateY = 25; // Max Y rotation (turning toward text)

      // Calculate Y rotation based on scroll progress
      const progress = Math.min(scrollY / maxScroll, 1);
      setRotateY(progress * maxRotateY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle transition end - update index and reset position instantly
  const handleTransitionEnd = () => {
    if (isSliding) {
      setIsSliding(false);
      setCurrentIndex(nextIndex);
    }
  };

  return (
    <div
      ref={phoneRef}
      className="relative transition-transform duration-100 ease-out"
      style={{
        transform: `rotate(8deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Subtle glow behind phone */}
      <div className="absolute -inset-6 rounded-full blur-[60px] opacity-30 bg-sage" />

      {/* Phone frame */}
      <div className="relative w-[220px] md:w-[260px] rounded-[36px] md:rounded-[42px] bg-ink p-2 md:p-2.5 shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute top-2 md:top-2.5 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-ink rounded-full z-20" />

        {/* Screen */}
        <div className="rounded-[28px] md:rounded-[32px] overflow-hidden aspect-[9/19.5] relative bg-black">
          {/* Image carousel container */}
          <div
            className="absolute inset-0 flex"
            style={{
              width: '200%',
              transform: isSliding ? 'translateX(-50%)' : 'translateX(0)',
              transition: isSliding ? 'transform 0.5s ease-out' : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Current image */}
            <div className="w-1/2 h-full flex-shrink-0">
              <img
                src={heroImages[currentIndex]}
                alt="Impact Deck Preview"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Next image */}
            <div className="w-1/2 h-full flex-shrink-0">
              <img
                src={heroImages[nextIndex]}
                alt="Impact Deck Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
