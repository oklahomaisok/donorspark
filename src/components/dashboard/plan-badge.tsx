'use client';

import type { Plan, User } from '@/db/schema';

interface PlanBadgeProps {
  user: User;
}

const planConfig: Record<Plan, { label: string; color: string; bgColor: string }> = {
  free: {
    label: 'Free',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  growth: {
    label: 'Growth',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
};

export function PlanBadge({ user }: PlanBadgeProps) {
  const plan = user.plan as Plan;
  const config = planConfig[plan] || planConfig.free;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {plan !== 'free' && (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )}
      {config.label} Plan
    </div>
  );
}
