'use client';

export interface DetailsData {
  location: string;
  yearFounded: string;
  programs: string[];
  contactEmail: string;
  donateUrl: string;
}

interface StepDetailsProps {
  data: DetailsData;
  onChange: (data: DetailsData) => void;
}

export function StepDetails({ data, onChange }: StepDetailsProps) {
  const update = (field: keyof DetailsData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const addProgram = () => {
    if (data.programs.length < 6) {
      update('programs', [...data.programs, '']);
    }
  };

  const removeProgram = (index: number) => {
    update('programs', data.programs.filter((_, i) => i !== index));
  };

  const updateProgram = (index: number, value: string) => {
    const updated = [...data.programs];
    updated[index] = value;
    update('programs', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl serif mb-2">Details</h2>
        <p className="text-sm text-ink/50">Help us personalize your deck with more context. All fields are optional.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Odessa, TX"
              className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Year Founded
            </label>
            <input
              type="number"
              value={data.yearFounded}
              onChange={(e) => update('yearFounded', e.target.value)}
              placeholder="e.g. 1995"
              min="1800"
              max={new Date().getFullYear()}
              className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Programs / Services
          </label>
          <div className="space-y-2">
            {data.programs.map((program, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={program}
                  onChange={(e) => updateProgram(i, e.target.value)}
                  placeholder={`Program ${i + 1}`}
                  className="flex-1 bg-cream border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => removeProgram(i)}
                  className="text-ink/30 hover:text-ink/60 transition-colors px-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {data.programs.length < 6 && (
              <button
                type="button"
                onClick={addProgram}
                className="text-sm text-ink/50 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
                Add a program
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Contact Email
          </label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => update('contactEmail', e.target.value)}
            placeholder="info@yourorg.org"
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Donation URL
          </label>
          <input
            type="url"
            value={data.donateUrl}
            onChange={(e) => update('donateUrl', e.target.value)}
            placeholder="https://donate.yourorg.org"
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
          />
        </div>
      </div>
    </div>
  );
}
