'use client';

import { useRouter } from 'next/navigation';
import type { Plan } from '@/db/schema';

interface EditFeaturesProps {
  currentPlan: Plan;
}

const editFeatures = [
  {
    name: 'Edit Colors',
    description: 'Customize your brand colors',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a10 10 0 0 0 0 20"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
  },
  {
    name: 'Edit Fonts',
    description: 'Choose custom typography',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7"/>
        <line x1="9" x2="15" y1="20" y2="20"/>
        <line x1="12" x2="12" y1="4" y2="20"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
  },
  {
    name: 'Edit Content',
    description: 'Update text and messaging',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
  },
  {
    name: 'Replace Images',
    description: 'Upload custom photos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
  },
  {
    name: 'Remove Branding',
    description: 'Hide DonorSpark attribution',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
      </svg>
    ),
    requiredPlan: 'starter' as Plan,
  },
  {
    name: 'CSV Personalization',
    description: 'Bulk create donor decks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 22h2a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M4.04 11.71a5.84 5.84 0 1 0 8.2 8.29"/>
        <path d="M13.83 16A5.83 5.83 0 0 0 8 10.17V16h5.83Z"/>
      </svg>
    ),
    requiredPlan: 'growth' as Plan,
  },
];

const planOrder: Plan[] = ['free', 'starter', 'growth'];

export function EditFeatures({ currentPlan }: EditFeaturesProps) {
  const router = useRouter();
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  return (
    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-800">Edit Features</h3>
        {currentPlan === 'free' && (
          <button
            onClick={handleUpgradeClick}
            className="text-sm font-medium text-[#C15A36] hover:underline"
          >
            Upgrade to unlock
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {editFeatures.map((feature) => {
          const requiredPlanIndex = planOrder.indexOf(feature.requiredPlan);
          const isLocked = currentPlanIndex < requiredPlanIndex;

          return (
            <button
              key={feature.name}
              disabled={isLocked}
              onClick={isLocked ? handleUpgradeClick : undefined}
              className={`p-4 rounded-lg text-left transition-all ${
                isLocked
                  ? 'bg-neutral-50 cursor-pointer hover:bg-neutral-100'
                  : 'bg-neutral-50 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isLocked ? 'bg-neutral-200 text-neutral-400' : 'bg-[#C15A36]/10 text-[#C15A36]'}`}>
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${isLocked ? 'text-neutral-400' : 'text-neutral-700'}`}>
                      {feature.name}
                    </span>
                    {isLocked && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isLocked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
