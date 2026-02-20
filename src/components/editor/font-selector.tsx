'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  HEADING_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
  HEADING_FONTS,
  BODY_FONTS,
  type FontOption,
} from '@/lib/editor-utils';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'heading' | 'body';
  lightMode?: boolean;
}

export function FontSelector({ label, value, onChange, type, lightMode = false }: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fontOptions = type === 'heading' ? HEADING_FONT_OPTIONS : BODY_FONT_OPTIONS;
  const flatFonts = type === 'heading' ? HEADING_FONTS : BODY_FONTS;

  // Check if the current value is a non-curated font
  const isNonCurated = !flatFonts.includes(value);

  // Group fonts by category
  const sansSerif = fontOptions.filter((f) => f.category === 'sans-serif');
  const serif = fontOptions.filter((f) => f.category === 'serif');

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function selectFont(name: string) {
    onChange(name);
    setOpen(false);
  }

  if (lightMode) {
    return (
      <div className="space-y-1.5" ref={containerRef}>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 text-left
              focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] transition-colors cursor-pointer flex items-center justify-between"
          >
            <span style={{ fontFamily: value }}>{value}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {isNonCurated && (
                <OptionGroup label="Current Font" lightMode>
                  <FontItem name={value} selected lightMode onSelect={selectFont} />
                </OptionGroup>
              )}
              <OptionGroup label="Sans Serif" lightMode>
                {sansSerif.map((f) => (
                  <FontItem key={f.name} name={f.name} selected={f.name === value} lightMode onSelect={selectFont} />
                ))}
              </OptionGroup>
              <OptionGroup label="Serif" lightMode>
                {serif.map((f) => (
                  <FontItem key={f.name} name={f.name} selected={f.name === value} lightMode onSelect={selectFont} />
                ))}
              </OptionGroup>
            </div>
          )}
        </div>
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
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white text-left
            focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer flex items-center justify-between"
        >
          <span style={{ fontFamily: value }}>{value}</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {isNonCurated && (
              <OptionGroup label="Current Font">
                <FontItem name={value} selected onSelect={selectFont} />
              </OptionGroup>
            )}
            <OptionGroup label="Sans Serif">
              {sansSerif.map((f) => (
                <FontItem key={f.name} name={f.name} selected={f.name === value} onSelect={selectFont} />
              ))}
            </OptionGroup>
            <OptionGroup label="Serif">
              {serif.map((f) => (
                <FontItem key={f.name} name={f.name} selected={f.name === value} onSelect={selectFont} />
              ))}
            </OptionGroup>
          </div>
        )}
      </div>
      <p
        className="text-sm text-neutral-300 mt-2 p-2 bg-neutral-800/50 rounded"
        style={{ fontFamily: value }}
      >
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}

function OptionGroup({ label, children, lightMode }: { label: string; children: React.ReactNode; lightMode?: boolean }) {
  return (
    <div>
      <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0 ${
        lightMode
          ? 'text-gray-400 bg-white border-b border-gray-100'
          : 'text-zinc-500 bg-zinc-900 border-b border-zinc-800'
      }`}>
        {label}
      </div>
      {children}
    </div>
  );
}

function FontItem({ name, selected, lightMode, onSelect }: { name: string; selected: boolean; lightMode?: boolean; onSelect: (name: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
        lightMode
          ? selected
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-700 hover:bg-gray-50'
          : selected
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-300 hover:bg-zinc-800/60'
      }`}
    >
      <span style={{ fontFamily: name }}>{name}</span>
      {selected && <Check className={`w-3.5 h-3.5 flex-shrink-0 ${lightMode ? 'text-[#C15A36]' : 'text-[#C15A36]'}`} />}
    </button>
  );
}
