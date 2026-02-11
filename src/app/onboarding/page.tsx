import { Suspense } from 'react';
import { OnboardingForm } from './onboarding-form';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F4] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-800">
            <span className="text-[#C15A36]">Donor</span>Spark
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Tell us about yourself
          </h2>
          <p className="text-neutral-500 mb-6">
            Help us personalize your experience
          </p>

          <Suspense fallback={<OnboardingFormSkeleton />}>
            <OnboardingForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function OnboardingFormSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-neutral-200 rounded w-20 mb-2" />
          <div className="h-12 bg-neutral-100 rounded-lg" />
        </div>
        <div>
          <div className="h-4 bg-neutral-200 rounded w-20 mb-2" />
          <div className="h-12 bg-neutral-100 rounded-lg" />
        </div>
      </div>
      <div>
        <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
      </div>
      <div>
        <div className="h-4 bg-neutral-200 rounded w-28 mb-2" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
      </div>
      <div>
        <div className="h-4 bg-neutral-200 rounded w-32 mb-2" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
      </div>
      <div>
        <div className="h-4 bg-neutral-200 rounded w-28 mb-2" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
      </div>
      <div className="h-12 bg-neutral-200 rounded-lg" />
    </div>
  );
}
