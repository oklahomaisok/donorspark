'use client';

import { VALID_SECTORS } from '@/lib/data/sectors';

const SECTOR_LABELS: Record<string, string> = {
  'youth-development': 'Youth Development',
  'youth-sports-soccer': 'Youth Sports (Soccer)',
  'youth-sports-basketball': 'Youth Sports (Basketball)',
  'agriculture': 'Agriculture',
  'food-bank': 'Food Bank / Food Pantry',
  'education': 'Education',
  'environment': 'Environment',
  'animal-welfare': 'Animal Welfare',
  'veterans': 'Veterans',
  'seniors': 'Seniors',
  'arts-culture': 'Arts & Culture',
  'healthcare': 'Healthcare',
  'housing': 'Housing',
  'community': 'Community / General',
  'disaster-relief': 'Disaster Relief',
  'disability-services': 'Disability Services',
  'mental-health': 'Mental Health',
  'refugee-immigration': 'Refugee & Immigration',
  'lgbtq': 'LGBTQ+',
};

export interface BasicsData {
  orgName: string;
  description: string;
  beneficiaries: string;
  sector: string;
}

interface StepBasicsProps {
  data: BasicsData;
  onChange: (data: BasicsData) => void;
}

export function StepBasics({ data, onChange }: StepBasicsProps) {
  const update = (field: keyof BasicsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl serif mb-2">About Your Organization</h2>
        <p className="text-sm text-ink/50">Tell us the basics so we can build your story.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Organization Name <span className="text-salmon">*</span>
          </label>
          <input
            type="text"
            value={data.orgName}
            onChange={(e) => update('orgName', e.target.value)}
            placeholder="e.g. Permian Basin Boys & Girls Club"
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            What does your organization do and what problem are you solving? <span className="text-salmon">*</span>
          </label>
          <textarea
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="e.g. We provide after-school programs, mentoring, and academic support to kids in underserved communities across the Permian Basin region..."
            rows={4}
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Who do you serve? <span className="text-salmon">*</span>
          </label>
          <input
            type="text"
            value={data.beneficiaries}
            onChange={(e) => update('beneficiaries', e.target.value)}
            placeholder="e.g. Youth ages 6-18 in the Permian Basin region"
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Sector <span className="text-salmon">*</span>
          </label>
          <select
            value={data.sector}
            onChange={(e) => update('sector', e.target.value)}
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow appearance-none cursor-pointer"
          >
            <option value="">Select your sector...</option>
            {VALID_SECTORS.map((s) => (
              <option key={s} value={s}>{SECTOR_LABELS[s] || s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
