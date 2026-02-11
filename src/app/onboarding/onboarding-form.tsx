'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Role options
const roleOptions = [
  { value: 'executive_director', label: 'Executive Director' },
  { value: 'development_director', label: 'Development Director' },
  { value: 'marketing', label: 'Marketing/Communications' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
];

// Organization size options
const sizeOptions = [
  { value: '1-5', label: '1-5 employees' },
  { value: '6-20', label: '6-20 employees' },
  { value: '21-50', label: '21-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' },
];

// Primary goal options
const goalOptions = [
  { value: 'raising_money', label: 'Raising more money from donors' },
  { value: 'recruiting_volunteers', label: 'Recruiting volunteers' },
  { value: 'recruiting_members', label: 'Recruiting members/clients' },
  { value: 'building_awareness', label: 'Building general awareness' },
  { value: 'engaging_supporters', label: 'Engaging existing supporters' },
  { value: 'other', label: 'Other' },
];

export function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    organizationName: '',
    organizationSize: '',
    primaryGoal: '',
    primaryGoalOther: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill organization name from query param
  useEffect(() => {
    const orgName = searchParams.get('org');
    if (orgName) {
      setFormData((prev) => ({ ...prev, organizationName: orgName }));
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.role) {
      newErrors.role = 'Please select your role';
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
        throw new Error('Failed to save onboarding data');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {errors.form && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors ${
                errors.firstName ? 'border-red-300' : 'border-neutral-200'
              }`}
              placeholder="Jane"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors ${
                errors.lastName ? 'border-red-300' : 'border-neutral-200'
              }`}
              placeholder="Smith"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Your Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors appearance-none bg-white ${
              errors.role ? 'border-red-300' : 'border-neutral-200'
            }`}
          >
            <option value="">Select your role</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-500 text-xs mt-1">{errors.role}</p>
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors ${
              errors.organizationName ? 'border-red-300' : 'border-neutral-200'
            }`}
            placeholder="Your nonprofit's name"
          />
          {errors.organizationName && (
            <p className="text-red-500 text-xs mt-1">{errors.organizationName}</p>
          )}
        </div>

        {/* Organization Size (optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Organization Size
          </label>
          <select
            value={formData.organizationSize}
            onChange={(e) =>
              setFormData({ ...formData, organizationSize: e.target.value })
            }
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors appearance-none bg-white"
          >
            <option value="">Select size (optional)</option>
            {sizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Goal (optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Primary Goal
          </label>
          <select
            value={formData.primaryGoal}
            onChange={(e) =>
              setFormData({
                ...formData,
                primaryGoal: e.target.value,
                primaryGoalOther: e.target.value !== 'other' ? '' : formData.primaryGoalOther,
              })
            }
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors appearance-none bg-white"
          >
            <option value="">Select goal (optional)</option>
            {goalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Show text input when "Other" is selected */}
          {formData.primaryGoal === 'other' && (
            <input
              type="text"
              value={formData.primaryGoalOther}
              onChange={(e) =>
                setFormData({ ...formData, primaryGoalOther: e.target.value })
              }
              className="w-full mt-3 px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] outline-none transition-colors"
              placeholder="Tell us about your goal"
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            'Continue to Dashboard'
          )}
        </button>
      </form>
    </>
  );
}
