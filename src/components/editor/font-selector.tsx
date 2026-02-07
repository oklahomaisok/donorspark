'use client';

import { HEADING_FONTS, BODY_FONTS } from '@/lib/editor-utils';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'heading' | 'body';
}

export function FontSelector({ label, value, onChange, type }: FontSelectorProps) {
  const fonts = type === 'heading' ? HEADING_FONTS : BODY_FONTS;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white
          focus:outline-none focus:border-[#C15A36] transition-colors cursor-pointer appearance-none"
        style={{ fontFamily: value }}
      >
        {fonts.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>
      <p
        className="text-sm text-neutral-300 mt-2 p-2 bg-neutral-800/50 rounded"
        style={{ fontFamily: value }}
      >
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}
