'use client';

interface WizardNavProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
}

export function WizardNav({ currentStep, totalSteps, onBack, onNext, onSubmit, isSubmitting, canProceed }: WizardNavProps) {
  const isLast = currentStep === totalSteps;

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink/10">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-ink/60 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </button>
      ) : (
        <div />
      )}

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="btn-hover bg-ink text-cream px-8 py-3 rounded-full font-medium cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate My Deck
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-hover bg-ink text-cream px-6 py-3 rounded-full font-medium cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
