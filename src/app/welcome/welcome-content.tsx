'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WelcomeContentProps {
  orgName?: string;
}

export function WelcomeContent({ orgName }: WelcomeContentProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    organizationName: orgName || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setErrors({ form: 'Something went wrong. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F4] to-white flex items-center justify-center p-4">
      {/* Confetti - only for claimed deck */}
      {showConfetti && orgName && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#C15A36', '#FFC303', '#16A34A', '#3B82F6', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 6)],
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">
            <span className="text-[#C15A36]">Donor</span>Spark
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {orgName ? (
            <>
              {/* Success Icon - for claimed deck */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-neutral-800 text-center mb-2">
                You&apos;ve claimed your deck!
              </h2>

              <p className="text-neutral-500 text-center mb-6">
                Your deck for <span className="font-semibold text-neutral-700">{orgName}</span> is saved.
              </p>

              {/* Divider with text */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-neutral-500">One last step</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Welcome header - for direct signup */}
              <h2 className="text-2xl font-bold text-neutral-800 text-center mb-2">
                Welcome to DonorSpark
              </h2>

              <p className="text-neutral-500 text-center mb-6">
                Tell us a little about yourself to get started
              </p>
            </>
          )}

          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors ${
                  errors.firstName ? 'border-red-300' : 'border-neutral-200'
                }`}
                placeholder="Jane"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors ${
                  errors.organizationName ? 'border-red-300' : 'border-neutral-200'
                }`}
                placeholder="Your nonprofit's name"
              />
              {errors.organizationName && (
                <p className="text-red-500 text-xs mt-1">{errors.organizationName}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 51;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: confetti-fall 4s ease-in-out forwards;
        }
        .confetti:nth-child(odd) {
          border-radius: 50%;
        }
        .confetti:nth-child(even) {
          transform: rotate(45deg);
        }
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            top: -10px;
            transform: translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            top: 100vh;
            transform: translateX(100px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
