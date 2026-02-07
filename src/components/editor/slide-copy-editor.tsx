'use client';

import { Plus, X } from 'lucide-react';

interface SlideCopyEditorProps {
  donorHeadline: string;
  heroHook: string;
  missionHeadline: string;
  mission: string;
  coreValues: string[];
  needHeadline: string;
  needDescription: string;
  solution: string;
  programs: string[];
  ctaButtonText: string;
  onChange: (field: string, value: string | string[]) => void;
}

export function SlideCopyEditor({
  donorHeadline,
  heroHook,
  missionHeadline,
  mission,
  coreValues,
  needHeadline,
  needDescription,
  solution,
  programs,
  ctaButtonText,
  onChange,
}: SlideCopyEditorProps) {

  const handleArrayItemChange = (field: string, index: number, value: string, arr: string[]) => {
    const newArr = [...arr];
    newArr[index] = value;
    onChange(field, newArr);
  };

  const handleAddArrayItem = (field: string, arr: string[]) => {
    onChange(field, [...arr, '']);
  };

  const handleRemoveArrayItem = (field: string, index: number, arr: string[]) => {
    const newArr = arr.filter((_, i) => i !== index);
    onChange(field, newArr);
  };

  return (
    <div className="space-y-4">
      {/* Hero Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Slide 1: Hero</p>

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
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Slide 2: Mission</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Section Headline</label>
          <input
            type="text"
            value={missionHeadline}
            onChange={(e) => onChange('missionHeadline', e.target.value)}
            placeholder="Building A Better Future"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors"
          />
        </div>

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

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Core Values (up to 4)</label>
          <div className="space-y-2">
            {coreValues.slice(0, 4).map((value, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleArrayItemChange('coreValues', index, e.target.value, coreValues)}
                  placeholder={`Value ${index + 1}`}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
                    focus:outline-none focus:border-[#C15A36] transition-colors"
                />
                {coreValues.length > 1 && (
                  <button
                    onClick={() => handleRemoveArrayItem('coreValues', index, coreValues)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {coreValues.length < 4 && (
              <button
                onClick={() => handleAddArrayItem('coreValues', coreValues)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Value
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Challenge Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Slide 3: Challenge</p>

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

      {/* Programs Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">Slide 4: Programs</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Programs / Services (up to 6)</label>
          <div className="space-y-2">
            {programs.slice(0, 6).map((program, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={program}
                  onChange={(e) => handleArrayItemChange('programs', index, e.target.value, programs)}
                  placeholder={`Program ${index + 1}`}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
                    focus:outline-none focus:border-[#C15A36] transition-colors"
                />
                {programs.length > 1 && (
                  <button
                    onClick={() => handleRemoveArrayItem('programs', index, programs)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {programs.length < 6 && (
              <button
                onClick={() => handleAddArrayItem('programs', programs)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Program
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CTA Slide */}
      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-xs font-medium text-[#C15A36] uppercase tracking-wider">CTA Slide</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Button Text</label>
          <input
            type="text"
            value={ctaButtonText}
            onChange={(e) => onChange('ctaButtonText', e.target.value)}
            placeholder="Donate Today"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#C15A36] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
