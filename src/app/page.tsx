'use client';

import { useState, useCallback, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import Link from 'next/link';

const SITE_PASSWORD = 'donorspark2026';

type Phase = 'idle' | 'generating' | 'complete' | 'error';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('donorspark_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === SITE_PASSWORD) {
      localStorage.setItem('donorspark_auth', 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

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

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-ink/40">Loading...</div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl max-w-md w-full text-center border border-ink/5">
          <h1 className="text-3xl md:text-4xl font-medium mb-2">DonorSpark</h1>
          <p className="text-ink/50 mb-8 text-sm">Private Beta Access</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              placeholder="Enter password"
              className={`w-full px-6 py-4 rounded-full bg-cream outline-none text-center text-lg ${passwordError ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-ink'}`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full bg-ink text-cream py-4 rounded-full font-medium hover:scale-105 transition-transform"
            >
              Enter
            </button>
          </form>

          <p className="mt-8 text-xs text-ink/30">Contact us for access</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav />

      <main className="w-full max-w-[1400px] mx-auto px-4 pt-20 pb-12 flex flex-col gap-4">

        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex flex-col justify-center items-center text-center card bg-white/40 p-8 md:p-12 border border-ink/5">
          {/* Animated Blobs */}
          <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-salmon rounded-full blur-[80px] opacity-40 blob" />
          <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-sage rounded-full blur-[80px] opacity-40 blob" style={{ animationDelay: '-5s' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-widest opacity-60 mb-4">Story Decks for Nonprofits</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6">
              Donors won&apos;t give to a mission <br /><span className="italic">they don&apos;t understand.</span>
            </h1>

            <p className="text-xl md:text-2xl opacity-60 max-w-2xl mx-auto mb-8 leading-relaxed text-balance">
              We turn your nonprofit&apos;s story into a mobile slide deck that makes your impact instantly clear.
            </p>

            {/* Input Form */}
            {phase === 'idle' && (
              <form onSubmit={handleSubmit} className="bg-white p-2 rounded-3xl md:rounded-full shadow-lg max-w-lg mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-ink/10 focus-within:ring-2 focus-within:ring-ink">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your nonprofit's website URL..."
                  className="flex-grow bg-transparent px-6 py-3 outline-none text-ink placeholder:text-ink/40 w-full text-center md:text-left"
                />
                <button
                  type="submit"
                  className="bg-ink text-cream px-6 py-3 rounded-full font-medium hover:scale-105 transition-transform whitespace-nowrap cursor-pointer"
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

        {/* Problem Section (Dark) */}
        <section className="card bg-ink text-cream p-8 md:p-20 min-h-[70vh] flex flex-col justify-center relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl md:text-7xl mb-8">
                You&apos;re doing the work. <span className="text-salmon italic">But your story isn&apos;t traveling.</span>
              </h2>
              <p className="text-lg opacity-70 leading-relaxed max-w-md">
                A board member asks for something to share. A volunteer wants to explain your mission. You send your website link or a PDF annual report.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              <div className="border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">Here&apos;s what happens next: Nothing.</h3>
                <p className="opacity-60">Because websites don&apos;t get forwarded. 40-page reports don&apos;t get read. And that Canva doc you made at 11pm doesn&apos;t make anyone feel the weight of what you do.</p>
              </div>
              <div className="border-l border-cream/20 pl-8">
                <h3 className="text-3xl serif mb-3">The gap isn&apos;t your impact.</h3>
                <p className="opacity-60">It&apos;s how you package it. Donors don&apos;t give to missions they don&apos;t understand. You need something scannable, shareable, and emotionally resonant.</p>
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
        <section id="pricing" className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-6xl md:text-7xl mb-4">Pick Your Plan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="card bg-white border border-ink/10 p-10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl serif">Free Forever</h3>
                <p className="text-sm opacity-50 mt-2">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                <li className="flex gap-3 text-sm"><span className="opacity-30">&check;</span> Custom 10-slide impact deck</li>
                <li className="flex gap-3 text-sm"><span className="opacity-30">&check;</span> Built instantly</li>
                <li className="flex gap-3 text-sm"><span className="opacity-30">&check;</span> Light DonorSpark branding</li>
              </ul>
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block w-full py-4 border border-ink/20 rounded-full hover:bg-ink hover:text-white transition-colors text-center">Get Free Deck</a>
            </div>

            {/* Professional */}
            <div className="card bg-salmon p-10 flex flex-col md:-translate-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-ink text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Most Popular</div>
              <div className="mb-8">
                <h3 className="text-3xl serif">Professional</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl">$9.99</span>
                  <span className="opacity-70 text-sm">/mo</span>
                </div>
                <p className="text-xs opacity-70 mt-1">For orgs ready to grow</p>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                <li className="flex gap-3 text-sm font-medium"><span className="text-ink">&check;</span> Remove all branding</li>
                <li className="flex gap-3 text-sm font-medium"><span className="text-ink">&check;</span> 1 revision per month</li>
                <li className="flex gap-3 text-sm font-medium"><span className="text-ink">&check;</span> Make it fully yours</li>
              </ul>
              <button className="w-full py-4 bg-ink text-salmon rounded-full hover:scale-105 transition-transform cursor-pointer">Start Trial</button>
            </div>

            {/* Premium */}
            <div className="card bg-ink text-cream p-10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl serif">Premium</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl">$49</span>
                  <span className="opacity-70 text-sm">/mo</span>
                </div>
                <p className="text-xs opacity-50 mt-1">Your storytelling partner</p>
              </div>
              <ul className="space-y-4 mb-12 flex-grow opacity-80">
                <li className="flex gap-3 text-sm"><span className="opacity-50">&check;</span> Everything in Professional</li>
                <li className="flex gap-3 text-sm"><span className="opacity-50">&check;</span> Unlimited revisions</li>
                <li className="flex gap-3 text-sm"><span className="opacity-50">&check;</span> Individual impact stories</li>
              </ul>
              <button className="w-full py-4 border border-cream/20 rounded-full hover:bg-cream hover:text-ink transition-colors cursor-pointer">Contact Us</button>
            </div>
          </div>
        </section>

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
        <div>&copy; 2025 DonorSpark. All rights reserved.</div>
      </footer>
    </>
  );
}
