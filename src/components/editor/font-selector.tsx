'use client';

import { HEADING_FONTS, BODY_FONTS } from '@/lib/editor-utils';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'heading' | 'body';
  lightMode?: boolean;
}

export function FontSelector({ label, value, onChange, type, lightMode = false }: FontSelectorProps) {
  const fonts = type === 'heading' ? HEADING_FONTS : BODY_FONTS;

  if (lightMode) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] transition-colors cursor-pointer"
          style={{ fontFamily: value }}
        >
          {fonts.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
        <p
          className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-100"
          style={{ fontFamily: value }}
        >
          The quick brown fox jumps over the lazy dog
        </p>
      </div>
    );
  }

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
