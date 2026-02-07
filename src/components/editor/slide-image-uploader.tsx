'use client';

import { useState } from 'react';
import { Image as ImageIcon, X, Library } from 'lucide-react';
import { PhotoLibrary } from './photo-library';

interface SlideImageUploaderProps {
  label: string;
  currentUrl?: string;
  defaultUrl: string;
  slideType: 'hero' | 'mission' | 'programs' | 'testimonials';
  onChange: (url: string) => void;
}

export function SlideImageUploader({
  label,
  currentUrl,
  defaultUrl,
  slideType,
  onChange,
}: SlideImageUploaderProps) {
  const [showLibrary, setShowLibrary] = useState(false);

  const displayUrl = currentUrl || defaultUrl;
  const isCustom = !!currentUrl;

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400">{label}</label>
          {isCustom && (
            <button
              onClick={() => onChange('')}
              className="text-[10px] text-neutral-500 hover:text-red-400 flex items-center gap-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => setShowLibrary(true)}
          className="w-full relative group rounded-lg overflow-hidden border border-neutral-700 hover:border-neutral-500 transition-all"
        >
          <div className="aspect-video">
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-neutral-900/90 px-3 py-2 rounded-lg">
                <Library className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">Choose Photo</span>
              </div>
            </div>
          </div>
          {isCustom && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#C15A36] rounded text-[9px] font-bold text-white uppercase">
              Custom
            </div>
          )}
        </button>
      </div>

      <PhotoLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(url) => {
          onChange(url);
          setShowLibrary(false);
        }}
        currentUrl={currentUrl}
        slideType={slideType}
      />
    </>
  );
}
