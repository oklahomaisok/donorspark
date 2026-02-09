'use client';

import { useState, useCallback, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import { PricingSection } from '@/components/pricing-section';
import Link from 'next/link';

type Phase = 'idle' | 'generating' | 'complete' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [runId, setRunId] = useState('');
  const [publicAccessToken, setPublicAccessToken] = useState('');
  const [result, setResult] = useState<{ deckUrl: string; ogImageUrl: string; orgName: string; slug: string } | null>(null);
  const [error, setError] = useState('');
  const [ogFailed, setOgFailed] = useState(false);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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

  function handleBottomSubmit(value: string) {
    if (!value.trim()) return;
    setUrl(value.trim());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 600);
  }

  return (
    <>
      <Nav />

      <main className="w-full max-w-[1400px] mx-auto px-4 pt-20 pb-12 flex flex-col gap-4">

        {/* ═══════════════════════════════════════════
            HERO — One action, one promise
        ═══════════════════════════════════════════ */}
        <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center card bg-white/40 p-8 md:p-12 border border-ink/5 overflow-hidden">
          {/* Organic background shapes */}
          <div className="absolute top-[5%] right-[5%] w-[400px] h-[400px] bg-salmon rounded-full blur-[120px] opacity-30 blob" />
          <div className="absolute bottom-[5%] left-[5%] w-[500px] h-[500px] bg-sage rounded-full blur-[120px] opacity-30 blob" style={{ animationDelay: '-7s' }} />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-periwinkle rounded-full blur-[100px] opacity-20 blob" style={{ animationDelay: '-12s' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl lg:text-9xl mb-8 leading-[0.95]">
              Show donors exactly<br />
              <span className="italic text-ink/80">where their money goes.</span>
            </h1>

            <p className="text-xl md:text-2xl opacity-50 max-w-xl mx-auto mb-10 leading-relaxed">
              Paste your nonprofit&apos;s URL. Get a branded impact deck in 60 seconds.
            </p>

            {/* Input Form */}
            {phase === 'idle' && (
              <form onSubmit={handleSubmit} className="bg-white p-2 rounded-3xl md:rounded-full shadow-lg max-w-lg mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-ink/10 focus-within:ring-2 focus-within:ring-ink transition-shadow">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yournonprofit.org"
                  className="flex-grow bg-transparent px-6 py-3.5 outline-none text-ink placeholder:text-ink/30 w-full text-center md:text-left"
                />
                <button
                  type="submit"
                  className="bg-ink text-cream px-8 py-3.5 rounded-full font-medium hover:scale-105 transition-transform whitespace-nowrap cursor-pointer"
                >
                  Generate Free Deck &rarr;
                </button>
              </form>
            )}

            {phase === 'idle' && (
              <p className="mt-5 text-xs uppercase tracking-widest opacity-30">No sign-up required. Free forever for your first deck.</p>
            )}

            {/* Error State */}
            {phase === 'error' && (
              <div className="mt-8 max-w-md mx-auto">
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button onClick={resetForm} className="text-xs uppercase tracking-widest opacity-40 hover:opacity-60 cursor-pointer">Try again</button>
              </div>
            )}

            {/* Generating State */}
            {phase === 'generating' && runId && publicAccessToken && (
              <div className="mt-8">
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
              <div className="mt-8 max-w-md mx-auto">
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
        </section>

        {/* ═══════════════════════════════════════════
            DECK SHOWCASE — Show the product
        ═══════════════════════════════════════════ */}
        <section className="card bg-white border border-ink/5 py-16 md:py-24 px-8 overflow-hidden">
          <div className="reveal text-center mb-14">
            <p className="text-xs uppercase tracking-widest opacity-40 mb-4">What you get</p>
            <h2 className="text-4xl md:text-6xl">A deck that tells your story<br /><span className="italic">without you saying a word.</span></h2>
          </div>

          {/* Phone Mockups */}
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-4xl mx-auto">
            {/* Phone 1 — Animal Welfare */}
            <div className="reveal reveal-delay-1 hidden md:block flex-shrink-0 translate-y-4 -rotate-3">
              <PhoneMockup
                gradient="from-amber-700 via-amber-600 to-orange-500"
                badge="Impact Deck"
                orgName="Paws & Purpose"
                metric="2,400"
                metricLabel="animals rescued in 2025"
                accentColor="bg-amber-400"
              />
            </div>

            {/* Phone 2 — Center, elevated */}
            <div className="reveal reveal-delay-2 flex-shrink-0 scale-105 md:scale-110 z-10">
              <PhoneMockup
                gradient="from-indigo-800 via-indigo-700 to-blue-600"
                badge="Impact Deck"
                orgName="Youth Forward"
                metric="12,000"
                metricLabel="students served across 8 schools"
                accentColor="bg-blue-400"
              />
            </div>

            {/* Phone 3 — Environmental */}
            <div className="reveal reveal-delay-3 hidden md:block flex-shrink-0 translate-y-4 rotate-3">
              <PhoneMockup
                gradient="from-emerald-800 via-emerald-700 to-green-600"
                badge="Impact Deck"
                orgName="Green Valley Conservancy"
                metric="850"
                metricLabel="acres of habitat preserved"
                accentColor="bg-emerald-400"
              />
            </div>
          </div>

          <p className="reveal text-center mt-12 text-sm opacity-40 max-w-md mx-auto">
            Your brand colors. Your mission. Your metrics. Every deck is unique — generated from your website in seconds.
          </p>
        </section>

        {/* ═══════════════════════════════════════════
            THE PROBLEM — Lead with the pain
        ═══════════════════════════════════════════ */}
        <section className="card bg-ink text-cream p-8 md:p-20 min-h-[60vh] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-salmon rounded-full blur-[200px] opacity-10" />

          <div className="reveal relative z-10 max-w-4xl">
            <p className="text-salmon text-sm uppercase tracking-widest mb-6">The problem</p>
            <h2 className="text-6xl md:text-8xl mb-8 leading-[0.95]">
              68% of first-time donors<br />
              <span className="italic text-cream/60">never give again.</span>
            </h2>
          </div>

          <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 relative z-10">
            <div className="border-l border-cream/15 pl-8">
              <h3 className="text-2xl md:text-3xl serif mb-4">They never hear back.</h3>
              <p className="opacity-50 leading-relaxed">
                No impact report. No story. No proof their donation mattered. They gave once, felt nothing, and moved on. It&apos;s not your impact — it&apos;s your packaging.
              </p>
            </div>
            <div className="border-l border-cream/15 pl-8">
              <h3 className="text-2xl md:text-3xl serif mb-4">60 seconds is all you get.</h3>
              <p className="opacity-50 leading-relaxed">
                Donors won&apos;t read your website. Board prospects won&apos;t open a PDF. If your story isn&apos;t clear in the time it takes to scroll a phone screen, the moment passes — and so does the gift.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — Three steps, spacious
        ═══════════════════════════════════════════ */}
        <section className="py-12">
          <div className="reveal text-center mb-16">
            <h2 className="text-5xl md:text-7xl">From website to impact deck<br /><span className="italic">in 60 seconds.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="reveal reveal-delay-1 card bg-white p-10 md:p-12 flex flex-col justify-between min-h-[380px] hover:shadow-lg border border-ink/5 group">
              <div>
                <div className="w-14 h-14 bg-salmon/15 rounded-2xl flex items-center justify-center mb-8 text-salmon font-serif text-2xl italic group-hover:scale-110 transition-transform">1</div>
                <h3 className="text-3xl md:text-4xl serif mb-4">Paste your URL</h3>
              </div>
              <p className="text-sm opacity-50 leading-relaxed">
                That&apos;s it. We pull your mission, metrics, colors, logo, and story from your website automatically.
              </p>
            </div>

            <div className="reveal reveal-delay-2 card bg-sage p-10 md:p-12 flex flex-col justify-between min-h-[380px] hover:shadow-lg group">
              <div>
                <div className="w-14 h-14 bg-ink/10 rounded-2xl flex items-center justify-center mb-8 text-ink font-serif text-2xl italic group-hover:scale-110 transition-transform">2</div>
                <h3 className="text-3xl md:text-4xl serif mb-4">We build your story</h3>
              </div>
              <p className="text-sm opacity-70 leading-relaxed">
                AI transforms your content into a mobile-first slide deck — branded, beautiful, and ready to share.
              </p>
            </div>

            <div className="reveal reveal-delay-3 card bg-white p-10 md:p-12 flex flex-col justify-between min-h-[380px] hover:shadow-lg border border-ink/5 group">
              <div>
                <div className="w-14 h-14 bg-periwinkle/40 rounded-2xl flex items-center justify-center mb-8 text-ink font-serif text-2xl italic group-hover:scale-110 transition-transform">3</div>
                <h3 className="text-3xl md:text-4xl serif mb-4">Donors get it</h3>
              </div>
              <p className="text-sm opacity-50 leading-relaxed">
                One link. Works on any phone. Share with donors, board members, grantmakers, and volunteers. No app needed.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TESTIMONIAL — One powerful quote
        ═══════════════════════════════════════════ */}
        <section className="reveal card bg-periwinkle p-10 md:p-24 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="serif text-3xl md:text-5xl leading-snug mb-10">
              &ldquo;We&apos;ve had a website for five years. This is the first time someone outside our org could explain what we do in under a minute.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-ink/10 rounded-full flex items-center justify-center text-ink font-serif italic text-lg">S</div>
              <div className="text-left">
                <div className="text-sm font-medium">Sarah Chen</div>
                <div className="text-xs opacity-50">Executive Director, Youth Futures Fund</div>
              </div>
            </div>
          </div>
        </section>

        {/* More testimonials — compact strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="reveal card bg-white border border-ink/5 p-8 md:p-10">
            <p className="serif text-xl md:text-2xl mb-6">
              &ldquo;I sent this to three board members asking for connections. All three forwarded it. That&apos;s never happened before.&rdquo;
            </p>
            <div className="text-xs uppercase tracking-widest opacity-40">
              Marcus Johnson &middot; Development Director, CHA
            </div>
          </div>
          <div className="reveal card bg-white border border-ink/5 p-8 md:p-10">
            <p className="serif text-xl md:text-2xl mb-6">
              &ldquo;Our volunteers used to stumble when recruiting. Now they just pull up the deck. Recruitment is up 40%.&rdquo;
            </p>
            <div className="text-xs uppercase tracking-widest opacity-40">
              Jennifer Martinez &middot; Founder, Arts Access Collective
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════ */}
        <PricingSection onGetFreeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        {/* ═══════════════════════════════════════════
            FINAL CTA — Mirror the hero
        ═══════════════════════════════════════════ */}
        <section className="card bg-white p-8 md:p-28 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-salmon via-sage to-periwinkle" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-salmon rounded-full blur-[150px] opacity-15" />
          <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sage rounded-full blur-[120px] opacity-15" />

          <div className="reveal relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl mb-6">
              Ready to show donors<br /><span className="italic">your impact?</span>
            </h2>
            <p className="text-lg opacity-50 mb-10">Free forever for your first deck. No credit card required.</p>

            <BottomCTA onSubmit={handleBottomSubmit} />
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
   Phone Mockup Component
───────────────────────────────────────────── */
function PhoneMockup({
  gradient,
  badge,
  orgName,
  metric,
  metricLabel,
  accentColor,
}: {
  gradient: string;
  badge: string;
  orgName: string;
  metric: string;
  metricLabel: string;
  accentColor: string;
}) {
  return (
    <div className="relative w-[200px] md:w-[240px] rounded-[36px] bg-ink p-2 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-ink rounded-b-xl z-10" />
      {/* Screen */}
      <div className={`rounded-[28px] overflow-hidden aspect-[9/19] bg-gradient-to-b ${gradient} relative`}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 deck-shimmer" />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5 pt-10 text-white">
          {/* Top */}
          <div>
            <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${accentColor} text-ink/80`}>
              {badge}
            </span>
          </div>
          {/* Bottom */}
          <div>
            <h4 className="font-serif text-lg md:text-xl leading-tight mb-4 italic">{orgName}</h4>
            <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1">{metric}</div>
            <div className="text-[10px] opacity-60 leading-snug mb-4">{metricLabel}</div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
              <span className="text-[9px] uppercase tracking-widest opacity-50">Swipe &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Bottom CTA (separate to avoid state issues)
───────────────────────────────────────────── */
function BottomCTA({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="flex flex-col md:flex-row gap-3 justify-center items-center max-w-lg mx-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="yournonprofit.org"
        className="bg-cream px-6 py-4 rounded-full w-full md:flex-1 outline-none focus:ring-2 focus:ring-ink transition-shadow text-center md:text-left"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit(value);
          }
        }}
      />
      <button
        className="bg-ink text-cream px-8 py-4 rounded-full w-full md:w-auto hover:scale-105 transition-transform cursor-pointer font-medium whitespace-nowrap"
        onClick={() => onSubmit(value)}
      >
        Get My Free Deck
      </button>
    </div>
  );
}
