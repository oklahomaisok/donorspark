'use client';

import { useState, useCallback } from 'react';
import { Nav } from '@/components/nav';
import { GenerationProgress } from '@/components/generation-progress';
import { WizardProgress } from '@/components/manual-wizard/wizard-progress';
import { WizardNav } from '@/components/manual-wizard/wizard-nav';
import { StepBasics, type BasicsData } from '@/components/manual-wizard/step-basics';
import { StepDetails, type DetailsData } from '@/components/manual-wizard/step-details';
import { StepMetrics, type MetricsData } from '@/components/manual-wizard/step-metrics';
import { StepBrand, type BrandData } from '@/components/manual-wizard/step-brand';

type Phase = 'wizard' | 'generating' | 'complete' | 'error';

export default function StartPage() {
  const [phase, setPhase] = useState<Phase>('wizard');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [runId, setRunId] = useState('');
  const [publicAccessToken, setPublicAccessToken] = useState('');
  const [result, setResult] = useState<{ deckUrl: string; ogImageUrl: string; orgName: string; slug: string } | null>(null);
  const [ogFailed, setOgFailed] = useState(false);

  // Form state
  const [basics, setBasics] = useState<BasicsData>({
    orgName: '',
    description: '',
    beneficiaries: '',
    sector: '',
  });
  const [details, setDetails] = useState<DetailsData>({
    location: '',
    yearFounded: '',
    programs: [''],
    contactEmail: '',
    donateUrl: '',
  });
  const [metrics, setMetrics] = useState<MetricsData>({
    metrics: [],
  });
  const [brand, setBrand] = useState<BrandData>({
    logoUrl: '',
    primaryColor: '',
    accentColor: '',
  });

  const canProceed = (): boolean => {
    if (step === 1) {
      return !!(basics.orgName.trim() && basics.description.trim() && basics.beneficiaries.trim() && basics.sector);
    }
    return true; // Steps 2-4 are all optional
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        orgName: basics.orgName.trim(),
        description: basics.description.trim(),
        beneficiaries: basics.beneficiaries.trim(),
        sector: basics.sector,
        location: details.location.trim() || undefined,
        yearFounded: details.yearFounded ? Number(details.yearFounded) : undefined,
        programs: details.programs.filter(p => p.trim()),
        contactEmail: details.contactEmail.trim() || undefined,
        donateUrl: details.donateUrl.trim() || undefined,
        metrics: metrics.metrics.filter(m => m.value.trim() && m.label.trim()),
        logoUrl: brand.logoUrl || undefined,
        primaryColor: brand.primaryColor || undefined,
        accentColor: brand.accentColor || undefined,
      };

      const res = await fetch('/api/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'deck_limit_reached') {
          throw new Error(`LIMIT_REACHED:${err.message}`);
        }
        if (err.error === 'weekly_limit_reached') {
          throw new Error(`WEEKLY_LIMIT:${err.message}`);
        }
        throw new Error(err.error || 'Failed to start generation');
      }

      const data = await res.json();
      setRunId(data.runId);
      setPublicAccessToken(data.publicAccessToken);
      setPhase('generating');
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = useCallback((data: { deckUrl: string; ogImageUrl: string; orgName: string; slug: string }) => {
    setResult(data);
    setPhase('complete');
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setPhase('error');
  }, []);

  const resetForm = () => {
    setPhase('wizard');
    setStep(1);
    setError('');
    setRunId('');
    setPublicAccessToken('');
    setResult(null);
    setOgFailed(false);
  };

  return (
    <>
      <Nav />
      <main className="w-full max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Wizard Phase */}
        {phase === 'wizard' && (
          <div className="card bg-white p-6 md:p-10 border border-ink/5">
            <WizardProgress currentStep={step} />

            <div className="min-h-[340px]">
              {step === 1 && <StepBasics data={basics} onChange={setBasics} />}
              {step === 2 && <StepDetails data={details} onChange={setDetails} />}
              {step === 3 && <StepMetrics data={metrics} onChange={setMetrics} />}
              {step === 4 && <StepBrand data={brand} onChange={setBrand} />}
            </div>

            <WizardNav
              currentStep={step}
              totalSteps={4}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canProceed={canProceed()}
            />
          </div>
        )}

        {/* Generating Phase */}
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

        {/* Complete Phase */}
        {phase === 'complete' && result && (
          <div className="card bg-white p-6 md:p-10 border border-ink/5 text-center success-spring">
            <style>{`
              @keyframes success-spring {
                0% { transform: scale(0.9); opacity: 0; }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
              }
              .success-spring {
                animation: success-spring 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
              }
            `}</style>

            <p className="text-sm text-ink/60 mb-4">Your deck is ready!</p>
            <a href={`/decks/${result.slug}`} target="_blank" rel="noopener noreferrer" className="block max-w-md mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-lg bg-ink hover:scale-[1.02] transition-transform duration-200">
                {!ogFailed && result.ogImageUrl ? (
                  <img
                    src={result.ogImageUrl}
                    alt="Deck Preview"
                    className="w-full"
                    onError={() => setOgFailed(true)}
                  />
                ) : (
                  <div className="aspect-[1200/630] flex flex-col items-center justify-center text-cream p-8">
                    <div className="text-xl font-medium mb-1">{result.orgName} Impact Deck</div>
                    <div className="text-sm opacity-60">Click to view</div>
                  </div>
                )}
              </div>
            </a>

            <div className="mt-6 space-y-3">
              <a
                href={`/decks/${result.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3 rounded-full font-medium text-sm hover:bg-ink/90 transition-colors"
              >
                View Your Deck
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </a>
              <p className="text-sm text-ink/50">
                Want to save and customize your deck?{' '}
                <a href="/sign-up" className="text-salmon font-medium hover:underline">Create a free account</a>
              </p>
              <button onClick={resetForm} className="text-xs uppercase tracking-widest text-ink/30 hover:text-ink/50 transition-opacity cursor-pointer">
                Generate another deck
              </button>
            </div>
          </div>
        )}

        {/* Error Phase */}
        {phase === 'error' && (
          <div className="card bg-white p-6 md:p-10 border border-ink/5">
            {error.startsWith('LIMIT_REACHED:') ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 text-sm font-medium mb-2">Deck Limit Reached</p>
                  <p className="text-amber-700 text-sm">{error.replace('LIMIT_REACHED:', '')}</p>
                </div>
                <div className="flex gap-3">
                  <a href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-salmon text-white text-sm font-medium rounded-lg hover:bg-salmon/90 transition-colors">
                    Upgrade
                  </a>
                  <a href="/dashboard" className="inline-flex items-center px-4 py-2 text-ink/60 text-sm font-medium hover:text-ink transition-colors">
                    Go to Dashboard
                  </a>
                </div>
              </>
            ) : error.startsWith('WEEKLY_LIMIT:') ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 text-sm font-medium mb-2">Weekly Generation Limit</p>
                  <p className="text-amber-700 text-sm">{error.replace('WEEKLY_LIMIT:', '')}</p>
                </div>
                <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink/90 transition-colors">
                  Go to Dashboard
                </a>
              </>
            ) : (
              <>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-4">
                  <p className="text-ink text-sm font-medium mb-2">Something went wrong</p>
                  <p className="text-ink/50 text-sm">{error}</p>
                </div>
                <button onClick={resetForm} className="text-xs uppercase tracking-widest opacity-40 hover:opacity-60 transition-opacity cursor-pointer">
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
