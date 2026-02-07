'use client';

import { useState } from 'react';
import { X, Library, Move } from 'lucide-react';
import { PhotoLibrary } from './photo-library';
import { FocalPointEditor } from './focal-point-editor';
import type { FocalPoint } from '@/lib/types';

interface SlideImageUploaderProps {
  label: string;
  currentUrl?: string;
  defaultUrl: string;
  slideType: 'hero' | 'mission' | 'programs' | 'testimonials';
  focalPoint?: FocalPoint;
  onChange: (url: string) => void;
  onFocalPointChange?: (focal: FocalPoint) => void;
}

const SLIDE_LABELS: Record<string, string> = {
  hero: 'Hero',
  mission: 'Mission',
  programs: 'Programs',
  testimonials: 'Testimonials',
};

export function SlideImageUploader({
  label,
  currentUrl,
  defaultUrl,
  slideType,
  focalPoint = { x: 50, y: 50 },
  onChange,
  onFocalPointChange,
}: SlideImageUploaderProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showFocalEditor, setShowFocalEditor] = useState(false);

  const displayUrl = currentUrl || defaultUrl;
  const isCustom = !!currentUrl;
  const hasCustomFocal = focalPoint.x !== 50 || focalPoint.y !== 50;

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

        {/* Image preview */}
        <div className="relative rounded-lg overflow-hidden border border-neutral-700 hover:border-neutral-500 transition-all group">
          <div className="aspect-video relative">
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
              style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
            />

            {/* Hover overlay with buttons */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-white px-3 py-2 rounded-lg transition-colors"
              >
                <Library className="w-4 h-4 text-neutral-800" />
                <span className="text-xs text-neutral-800 font-medium">Change</span>
              </button>
              <button
                onClick={() => setShowFocalEditor(true)}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-white px-3 py-2 rounded-lg transition-colors"
              >
                <Move className="w-4 h-4 text-neutral-800" />
                <span className="text-xs text-neutral-800 font-medium">Reframe</span>
              </button>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {isCustom && (
                <span className="px-1.5 py-0.5 bg-[#C15A36] rounded text-[9px] font-bold text-white uppercase">
                  Custom
                </span>
              )}
              {hasCustomFocal && (
                <span className="px-1.5 py-0.5 bg-blue-600 rounded text-[9px] font-bold text-white uppercase">
                  Reframed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick action hint */}
        <p className="text-[10px] text-neutral-500">
          Hover to change photo or adjust framing
        </p>
      </div>

      {/* Photo Library Modal */}
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

      {/* Focal Point Editor Modal */}
      <FocalPointEditor
        isOpen={showFocalEditor}
        onClose={() => setShowFocalEditor(false)}
        imageUrl={displayUrl}
        focalPoint={focalPoint}
        onChange={(focal) => {
          if (onFocalPointChange) {
            onFocalPointChange(focal);
          }
        }}
        slideType={SLIDE_LABELS[slideType] || slideType}
      />
    </>
  );
}
