'use client';

import { isValidHexColor } from '@/lib/editor-utils';
import { useState, useEffect } from 'react';

interface CtaEditorProps {
  donateUrl: string;
  accentColor: string;
  onDonateUrlChange: (url: string) => void;
  onAccentColorChange: (color: string) => void;
}

export function CtaEditor({
  donateUrl,
  accentColor,
  onDonateUrlChange,
  onAccentColorChange,
}: CtaEditorProps) {
  const [urlValue, setUrlValue] = useState(donateUrl);
  const [colorValue, setColorValue] = useState(accentColor);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isValidColor, setIsValidColor] = useState(true);

  useEffect(() => {
    setUrlValue(donateUrl);
  }, [donateUrl]);

  useEffect(() => {
    setColorValue(accentColor);
  }, [accentColor]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrlValue(value);

    // Basic URL validation
    let isValid = true;
    if (value) {
      try {
        new URL(value);
      } catch {
        isValid = false;
      }
    }
    setIsValidUrl(isValid);

    if (isValid) {
      onDonateUrlChange(value);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    setColorValue(value);

    const valid = isValidHexColor(value);
    setIsValidColor(valid);

    if (valid) {
      onAccentColorChange(value);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setColorValue(value);
    setIsValidColor(true);
    onAccentColorChange(value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white mb-2">Call to Action</h3>

      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Donate Button URL
          </label>
          <input
            type="url"
            value={urlValue}
            onChange={handleUrlChange}
            placeholder="https://your-donate-page.org/donate"
            className={`w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white
              ${isValidUrl ? 'border-neutral-700 focus:border-[#C15A36]' : 'border-red-500'}
              focus:outline-none transition-colors`}
          />
          {!isValidUrl && (
            <p className="text-xs text-red-400">Enter a valid URL</p>
          )}
          <p className="text-xs text-neutral-500">Where should the "Donate Today" button link to?</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Button Color (Accent)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor}
              onChange={handleColorPickerChange}
              className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-700 bg-transparent"
              style={{ padding: 0 }}
            />
            <input
              type="text"
              value={colorValue}
              onChange={handleColorChange}
              placeholder="#FFC303"
              maxLength={7}
              className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white font-mono
                ${isValidColor ? 'border-neutral-700 focus:border-[#C15A36]' : 'border-red-500'}
                focus:outline-none transition-colors`}
            />
          </div>
          {!isValidColor && (
            <p className="text-xs text-red-400">Enter a valid HEX color</p>
          )}
        </div>

        {/* Preview */}
        <div className="pt-3 border-t border-neutral-700">
          <p className="text-xs text-neutral-500 mb-2">Button Preview:</p>
          <button
            className="inline-flex items-center justify-center px-6 py-3 font-bold rounded text-sm"
            style={{ backgroundColor: accentColor, color: getBestTextColor(accentColor) }}
          >
            Donate Today
            <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to determine text color based on background
function getBestTextColor(bgColor: string): string {
  try {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}
