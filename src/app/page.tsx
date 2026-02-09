'use client';

import { useState, useCallback, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import { PricingSection } from '@/components/pricing-section';

type Phase = 'idle' | 'generating' | 'complete' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [runId, setRunId] = useState('');
  const [publicAccessToken, setPublicAccessToken] = useState('');
  const [result, setResult] = useState<{ deckUrl: string; ogImageUrl: string; orgName: string; slug: string } | null>(null);
  const [error, setError] = useState('');
  const [ogFailed, setOgFailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

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
    setUrl('');
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
                    placeholder="Enter your nonprofit's website URL..."
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
                <p className="mt-4 text-xs uppercase tracking-widest opacity-40">Paste your URL. Get a custom story deck instantly.</p>
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
                A board member asks for something to share. A volunteer wants to explain your mission. You send your website link or a PDF annual report. Here&apos;s the problem: Websites don&apos;t get forwarded. 40-page reports don&apos;t get read. And that Canva doc you made at 11pm doesn&apos;t make anyone feel the weight of what you do. The gap isn&apos;t your impact — it&apos;s how you package it.
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
   Hero Phone — Real deck slides with video backgrounds
───────────────────────────────────────────── */
const IMAGE_BASE = 'https://oklahomaisok.github.io/nonprofit-decks/images';
const VIDEO_BASE = 'https://donorspark-videos.vercel.app';

const heroSlides = [
  {
    sector: 'veterans',
    primary: '#1D2350',
    accent: '#FFC303',
    orgName: 'Veterans Alliance',
    headline: 'Honoring Those Who Served',
    badge: 'Impact Deck',
  },
  {
    sector: 'youth-development',
    primary: '#0C2340',
    accent: '#C8102E',
    orgName: 'Sea Cadets',
    headline: 'Building Tomorrow\'s Leaders',
    badge: 'Impact Deck',
  },
  {
    sector: 'food-bank',
    primary: '#2D5A27',
    accent: '#F7941D',
    orgName: 'Community Food Bank',
    headline: 'No One Goes Hungry',
    badge: 'Impact Deck',
  },
  {
    sector: 'animal-welfare',
    primary: '#1E3A5F',
    accent: '#E85D04',
    orgName: 'Rescue League',
    headline: 'Every Life Matters',
    badge: 'Impact Deck',
  },
];

function HeroPhone() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(prev => (prev + 1) % heroSlides.length);
        setIsTransitioning(false);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const slide = heroSlides[activeIndex];
  const videoSrc = `${VIDEO_BASE}/${slide.sector}-hero-leader.mp4`;
  const posterSrc = `${IMAGE_BASE}/${slide.sector}-hero-leader.jpg`;

  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div
        className="absolute -inset-6 rounded-full blur-[60px] opacity-40 transition-all duration-700"
        style={{ backgroundColor: slide.primary }}
      />

      {/* Phone frame */}
      <div className="relative w-[220px] md:w-[260px] rounded-[36px] md:rounded-[42px] bg-ink p-2 md:p-2.5 shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute top-2 md:top-2.5 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-ink rounded-full z-20" />

        {/* Screen */}
        <div className="rounded-[28px] md:rounded-[32px] overflow-hidden aspect-[9/19] relative">
          {/* Video/Image background */}
          <video
            key={slide.sector}
            autoPlay
            muted
            loop
            playsInline
            poster={posterSrc}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

          {/* Slide content */}
          <div
            className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 pt-12 md:pt-14 text-white transition-opacity duration-400"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          >
            {/* Top — badge + logo area */}
            <div>
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: slide.accent, color: slide.primary }}
              >
                {slide.badge}
              </span>
            </div>

            {/* Center — headline */}
            <div className="text-center py-4">
              <h4
                className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-2"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {slide.headline}
              </h4>
              <p className="text-xs opacity-70 italic">{slide.orgName}</p>
            </div>

            {/* Bottom — nav dots */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {heroSlides.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === activeIndex ? '16px' : '6px',
                        backgroundColor: i === activeIndex ? slide.accent : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[8px] uppercase tracking-widest opacity-40">Swipe &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
