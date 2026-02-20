'use client';

const steps = [
  { label: 'Basics', number: 1 },
  { label: 'Details', number: 2 },
  { label: 'Impact', number: 3 },
  { label: 'Brand', number: 4 },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isActive = currentStep === step.number;
        const isComplete = currentStep > step.number;

        return (
          <div key={step.number} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isComplete
                    ? 'bg-ink text-cream'
                    : isActive
                    ? 'bg-salmon text-white'
                    : 'bg-ink/10 text-ink/40'
                }`}
              >
                {isComplete ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'text-ink font-medium' : 'text-ink/40'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${isComplete ? 'bg-ink' : 'bg-ink/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
