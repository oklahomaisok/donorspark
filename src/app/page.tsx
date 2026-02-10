'use client';

import { useState, useCallback, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import { PricingSection } from '@/components/pricing-section';

type Phase = 'idle' | 'generating' | 'complete' | 'error';

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

      <main className="w-full max-w-[1400px] mx-auto px-4 pt-20 pb-12 flex flex-col gap-4">

        {/* Hero Section — Side by side with animated phone */}
        <section className="relative card bg-white/40 p-6 md:p-10 lg:p-12 border border-ink/5 overflow-hidden">
          {/* Animated Blobs */}
          <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-salmon rounded-full blur-[80px] opacity-40 blob" />
          <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-sage rounded-full blur-[80px] opacity-40 blob" style={{ animationDelay: '-5s' }} />

          <div className="relative z-10 w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center py-8 md:py-12">
            {/* Left — Copy + CTA */}
            <div className="text-center lg:text-left flex-1 max-w-xl">
              <p className="text-sm uppercase tracking-widest opacity-60 mb-4">Story Decks for Nonprofits</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-5 leading-[0.95]">
                Donors won&apos;t give to a mission <span className="italic">they don&apos;t understand.</span>
              </h1>

              <p className="text-lg md:text-xl opacity-60 max-w-lg mb-6 leading-relaxed mx-auto lg:mx-0">
                We turn your nonprofit&apos;s story into a mobile slide deck that makes your impact instantly clear.
              </p>

              {/* Input Form */}
              {phase === 'idle' && (
                <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl md:rounded-full shadow-lg max-w-md flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-ink/10 focus-within:ring-2 focus-within:ring-ink mx-auto lg:mx-0">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yournonprofit.org"
                    className="flex-grow bg-transparent px-5 py-3 outline-none text-ink placeholder:text-ink/40 w-full text-center md:text-left"
                  />
                  <button
                    type="submit"
                    className="bg-ink text-cream px-6 py-3 rounded-full font-medium hover:scale-105 transition-transform whitespace-nowrap cursor-pointer text-sm"
                  >
                    Get Free Deck &rarr;
                  </button>
                </form>
              )}

              {phase === 'idle' && (
                <p className="mt-4 text-xs uppercase tracking-widest opacity-40 text-center lg:text-left max-w-md mx-auto lg:mx-0">Enter your nonprofit&apos;s website.<br />Get a custom story deck instantly.</p>
              )}

              {/* Error State */}
              {phase === 'error' && (
                <div className="mt-6 max-w-md mx-auto lg:mx-0">
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                  <button onClick={resetForm} className="text-xs uppercase tracking-widest opacity-40 hover:opacity-60 cursor-pointer">Try again</button>
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

              {/* Result Preview */}
              {phase === 'complete' && result && (
                <div className="mt-6 max-w-md mx-auto lg:mx-0">
                  <p className="text-sm opacity-60 mb-4">Your deck is ready!</p>
                  <a href={`/decks/${result.slug}`} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow bg-ink">
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
                      <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-ink px-4 py-2 rounded-full text-sm font-medium">View Deck &rarr;</span>
                      </div>
                    </div>
                  </a>
                  <button onClick={resetForm} className="mt-4 text-xs uppercase tracking-widest opacity-40 hover:opacity-60 cursor-pointer">Generate another deck</button>
                </div>
              )}
            </div>

            {/* Right — Animated deck phone */}
            <div className="flex justify-center items-center flex-shrink-0 mt-4 lg:mt-0">
              <HeroPhone />
            </div>
          </div>
        </section>

        {/* Problem Section (Dark) */}
        <section className="card bg-ink text-cream p-8 md:p-20 min-h-[70vh] flex flex-col justify-center relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl md:text-7xl mb-8">
                You&apos;re doing the work. <span className="text-salmon italic">But your story isn&apos;t inspiring others.</span>
              </h2>
              <p className="text-lg opacity-70 leading-relaxed max-w-md">
                &ldquo;Build it and they will come&rdquo; doesn&apos;t apply to nonprofits attracting donors. Just because you&apos;re improving lives doesn&apos;t mean others get it. The problem isn&apos;t your impact — it&apos;s how you package it.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              <div className="border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">If you can&apos;t connect with donors in under 60 seconds, they&apos;re gone.</h3>
                <p className="opacity-60">Attention spans are shorter today than ever. TikTok, Instagram, and Facebook have trained your audiences to consume content in bite-sized pieces. Nobody is reading through your website or your 20-page impact report.</p>
              </div>
              <div className="border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">We tell your story so donors get it in an instant.</h3>
                <p className="opacity-60">We make the story of your organization scannable, shareable, and emotionally resonant — so donors, volunteers, and staff feel more engaged and inspired.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Bento Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12">
          <div className="col-span-1 md:col-span-3 text-center py-12">
            <h2 className="text-5xl md:text-6xl">From Mission to Movement</h2>
          </div>

          <div className="card bg-white p-10 flex flex-col justify-between min-h-[320px] hover:shadow-lg border border-ink/5 group">
            <div className="w-12 h-12 bg-salmon/20 rounded-full flex items-center justify-center mb-6 text-salmon font-serif text-xl italic group-hover:scale-110 transition-transform">1</div>
            <div>
              <h3 className="text-3xl serif mb-4">Share Your Website</h3>
              <p className="text-sm opacity-60 leading-relaxed">Paste your URL. We extract your mission, impact data, beneficiary stories, and translate them into a narrative arc.</p>
            </div>
          </div>

          <div className="card bg-sage p-10 flex flex-col justify-between min-h-[320px] hover:shadow-lg group">
            <div className="w-12 h-12 bg-ink/10 rounded-full flex items-center justify-center mb-6 text-ink font-serif text-xl italic group-hover:scale-110 transition-transform">2</div>
            <div>
              <h3 className="text-3xl serif mb-4">We Build Your Story</h3>
              <p className="text-sm opacity-80 leading-relaxed">A custom 10-slide deck that answers: Why does this org exist? Who do they serve? What changes because of them?</p>
            </div>
          </div>

          <div className="card bg-white p-10 flex flex-col justify-between min-h-[320px] hover:shadow-lg border border-ink/5 group">
            <div className="w-12 h-12 bg-periwinkle/40 rounded-full flex items-center justify-center mb-6 text-ink font-serif text-xl italic group-hover:scale-110 transition-transform">3</div>
            <div>
              <h3 className="text-3xl serif mb-4">Your Story Spreads</h3>
              <p className="text-sm opacity-60 leading-relaxed">Send it to donors. Hand it to volunteers. Attach it to grant applications. Use it free or unlock the full version.</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="card bg-periwinkle mt-4 p-8 md:p-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-ink/10">
            <div className="px-4">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;We&apos;ve had a website for five years. This is the first time someone outside our org could explain what we do in under a minute.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Sarah Chen<br />Executive Director, Youth Futures Fund
              </div>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;I sent this to three board members asking for connections. All three forwarded it. That&apos;s never happened before.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Marcus Johnson<br />Development Director, CHA
              </div>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <p className="serif text-2xl md:text-3xl mb-6">&ldquo;Our volunteers used to stumble when recruiting. Now they just pull up the deck. Recruitment is up 40%.&rdquo;</p>
              <div className="text-xs uppercase tracking-widest opacity-60">
                Jennifer Martinez<br />Founder, Arts Access Collective
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection onGetFreeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        {/* Final CTA */}
        <section className="card bg-white p-8 md:p-32 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-salmon via-sage to-periwinkle" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl mb-6">Ready to give your impact the story it deserves?</h2>
            <p className="text-lg opacity-60 mb-12">Get your custom deck instantly. No credit card required.</p>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                placeholder="What's your nonprofit's website?"
                className="bg-cream px-6 py-4 rounded-full w-full md:w-96 outline-none focus:ring-1 focus:ring-ink"
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
                className="bg-ink text-white px-8 py-4 rounded-full w-full md:w-auto hover:scale-105 transition-transform cursor-pointer"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Get My Free Deck
              </button>
            </div>
          </div>
        </section>
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

function HeroPhone() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Prepare the next image
      const upcoming = (currentIndex + 1) % heroImages.length;
      setNextIndex(upcoming);

      // Trigger slide animation
      setIsSliding(true);

      // After animation completes, update current and reset
      setTimeout(() => {
        setCurrentIndex(upcoming);
        setIsSliding(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="relative">
      {/* Subtle glow behind phone */}
      <div className="absolute -inset-6 rounded-full blur-[60px] opacity-30 bg-sage" />

      {/* Phone frame */}
      <div className="relative w-[220px] md:w-[260px] rounded-[36px] md:rounded-[42px] bg-ink p-2 md:p-2.5 shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute top-2 md:top-2.5 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-ink rounded-full z-20" />

        {/* Screen */}
        <div className="rounded-[28px] md:rounded-[32px] overflow-hidden aspect-[9/19] relative bg-white">
          {/* Image carousel container */}
          <div
            className="absolute inset-0 flex transition-transform duration-500 ease-out"
            style={{
              width: '200%',
              transform: isSliding ? 'translateX(-50%)' : 'translateX(0)',
            }}
          >
            {/* Current image */}
            <div className="w-1/2 h-full flex-shrink-0">
              <img
                src={heroImages[currentIndex]}
                alt="Impact Deck Preview"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {/* Next image */}
            <div className="w-1/2 h-full flex-shrink-0">
              <img
                src={heroImages[nextIndex]}
                alt="Impact Deck Preview"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
