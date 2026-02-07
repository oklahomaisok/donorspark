'use client';

import { useState, useRef } from 'react';
import { X, Library, Move } from 'lucide-react';
import { PhotoLibrary } from './photo-library';
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

const PRESET_POSITIONS: { label: string; x: number; y: number }[] = [
  { label: 'Top', x: 50, y: 20 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Bottom', x: 50, y: 80 },
];

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
  const [showFocalPicker, setShowFocalPicker] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const displayUrl = currentUrl || defaultUrl;
  const isCustom = !!currentUrl;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showFocalPicker || !imageRef.current || !onFocalPointChange) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    onFocalPointChange({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handlePresetClick = (x: number, y: number) => {
    if (onFocalPointChange) {
      onFocalPointChange({ x, y });
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400">{label}</label>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Image preview with focal point indicator */}
        <div
          ref={imageRef}
          onClick={handleImageClick}
          className={`relative rounded-lg overflow-hidden border transition-all ${
            showFocalPicker
              ? 'border-[#C15A36] cursor-crosshair'
              : 'border-neutral-700 hover:border-neutral-500'
          }`}
        >
          <div className="aspect-video relative">
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
              style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
            />

            {/* Focal point indicator */}
            {showFocalPicker && (
              <>
                <div className="absolute inset-0 bg-black/30" />
                <div
                  className="absolute w-6 h-6 -ml-3 -mt-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                  style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                >
                  <div className="absolute inset-1 bg-[#C15A36] rounded-full" />
                </div>
                <p className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-2 py-1 rounded">
                  Click to set focal point
                </p>
              </>
            )}

            {/* Hover overlay for library button */}
            {!showFocalPicker && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLibrary(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-neutral-900/90 px-3 py-2 rounded-lg"
                >
                  <Library className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">Choose Photo</span>
                </button>
              </div>
            )}

            {/* Custom badge */}
            {isCustom && !showFocalPicker && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#C15A36] rounded text-[9px] font-bold text-white uppercase">
                Custom
              </div>
            )}
          </div>
        </div>

        {/* Focal point controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFocalPicker(!showFocalPicker)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              showFocalPicker
                ? 'bg-[#C15A36] text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <Move className="w-3 h-3" />
            {showFocalPicker ? 'Done' : 'Adjust Focus'}
          </button>

          {showFocalPicker && (
            <div className="flex items-center gap-1">
              {PRESET_POSITIONS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.x, preset.y)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    focalPoint.x === preset.x && focalPoint.y === preset.y
                      ? 'bg-neutral-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
