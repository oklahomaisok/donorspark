'use client';

interface SlideCopyEditorProps {
  donorHeadline: string;
  heroHook: string;
  mission: string;
  needHeadline: string;
  needDescription: string;
  solution: string;
  onChange: (field: string, value: string) => void;
}

export function SlideCopyEditor({
  donorHeadline,
  heroHook,
  mission,
  needHeadline,
  needDescription,
  solution,
  onChange,
}: SlideCopyEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white mb-2">Slide Copy</h3>

      {/* Hero Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Hero Slide</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Headline</label>
          <input
            type="text"
            value={donorHeadline}
            onChange={(e) => onChange('donorHeadline', e.target.value)}
            placeholder="Making A Difference"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Hook / Subheadline</label>
          <textarea
            value={heroHook}
            onChange={(e) => onChange('heroHook', e.target.value)}
            placeholder="A brief, engaging description..."
            rows={2}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Mission Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Mission Slide</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Mission Statement</label>
          <textarea
            value={mission}
            onChange={(e) => onChange('mission', e.target.value)}
            placeholder="Your organization's mission..."
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Challenge Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Challenge Slide</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Challenge Headline</label>
          <input
            type="text"
            value={needHeadline}
            onChange={(e) => onChange('needHeadline', e.target.value)}
            placeholder="Communities Need Support"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Challenge Description</label>
          <textarea
            value={needDescription}
            onChange={(e) => onChange('needDescription', e.target.value)}
            placeholder="Describe the challenge your organization addresses..."
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Your Solution</label>
          <textarea
            value={solution}
            onChange={(e) => onChange('solution', e.target.value)}
            placeholder="How your organization addresses this challenge..."
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
