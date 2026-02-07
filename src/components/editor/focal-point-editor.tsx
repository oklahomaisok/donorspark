'use client';

import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { FocalPoint } from '@/lib/types';

interface FocalPointEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  focalPoint: FocalPoint;
  onChange: (focal: FocalPoint) => void;
  slideType: string;
}

export function FocalPointEditor({
  isOpen,
  onClose,
  imageUrl,
  focalPoint,
  onChange,
  slideType,
}: FocalPointEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localFocal, setLocalFocal] = useState(focalPoint);

  // Sync local state when props change
  useEffect(() => {
    setLocalFocal(focalPoint);
  }, [focalPoint, isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFocalPoint(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateFocalPoint(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const updateFocalPoint = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newFocal = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };

    setLocalFocal(newFocal);
    onChange(newFocal);
  };

  const handleReset = () => {
    const defaultFocal = { x: 50, y: 50 };
    setLocalFocal(defaultFocal);
    onChange(defaultFocal);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Adjust Image Focus</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drag to reposition • The frame shows what's visible on the {slideType} slide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image container */}
        <div className="p-6">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ userSelect: 'none' }}
          >
            {/* Full image */}
            <img
              src={imageUrl}
              alt="Adjust focal point"
              className="absolute w-[150%] h-[150%] object-cover pointer-events-none"
              style={{
                left: `${50 - localFocal.x * 0.75}%`,
                top: `${50 - localFocal.y * 0.75}%`,
              }}
              draggable={false}
            />

            {/* Dark overlay outside visible area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Visible frame indicator */}
              <div
                className="absolute border-2 border-white/80 rounded shadow-lg"
                style={{
                  left: '15%',
                  top: '10%',
                  right: '15%',
                  bottom: '10%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                }}
              />
            </div>

            {/* Focal point indicator */}
            <div
              className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none transition-all duration-75"
              style={{ left: `${localFocal.x}%`, top: `${localFocal.y}%` }}
            >
              <div className="absolute inset-0 border-2 border-white rounded-full shadow-lg" />
              <div className="absolute inset-2 bg-[#C15A36] rounded-full" />
              {/* Crosshairs */}
              <div className="absolute left-1/2 top-0 w-px h-full bg-white/50 -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/50 -translate-y-1/2" />
            </div>

            {/* Instructions overlay */}
            {!isDragging && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-sm text-white font-medium">Click and drag to reposition</p>
              </div>
            )}
          </div>

          {/* Position indicator */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-neutral-500">
              Position: {localFocal.x}% horizontal, {localFocal.y}% vertical
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Center
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-700 bg-neutral-900/80">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium bg-[#C15A36] hover:bg-[#a84d2e] text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
