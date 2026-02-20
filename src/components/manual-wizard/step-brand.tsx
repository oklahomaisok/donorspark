'use client';

import { useState, useCallback } from 'react';

export interface BrandData {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

interface StepBrandProps {
  data: BrandData;
  onChange: (data: BrandData) => void;
}

export function StepBrand({ data, onChange }: StepBrandProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const update = (field: keyof BrandData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const uploadFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Use PNG, JPEG, WebP, or SVG.');
      }
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 4MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/logo-anonymous', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      update('logoUrl', result.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl serif mb-2">Brand & Logo</h2>
        <p className="text-sm text-ink/50">
          No logo or colors? No problem — we&apos;ll choose something that looks great.
        </p>
      </div>

      <div className="space-y-5">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Logo</label>
          {data.logoUrl ? (
            <div className="bg-cream border border-ink/10 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 border border-ink/5">
                  <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink/60 mb-2">Logo uploaded</p>
                  <div className="flex gap-2">
                    <label className="cursor-pointer text-xs bg-ink/10 hover:bg-ink/20 text-ink px-3 py-1.5 rounded-lg transition-colors">
                      Replace
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                    </label>
                    <button
                      onClick={() => update('logoUrl', '')}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                isDragging ? 'border-salmon bg-salmon/5' : 'border-ink/15 hover:border-ink/30'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-salmon border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-ink/50">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                    <p className="text-sm text-ink/60">Drag and drop your logo</p>
                    <label className="cursor-pointer text-sm bg-ink text-cream px-4 py-2 rounded-lg hover:bg-ink/90 transition-colors flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                      </svg>
                      Choose File
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-ink/30">PNG, JPEG, WebP, or SVG. Max 4MB.</p>
                  </>
                )}
              </div>
            </div>
          )}
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.primaryColor || '#1D2350'}
                onChange={(e) => update('primaryColor', e.target.value)}
                className="w-10 h-10 rounded-lg border border-ink/10 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.primaryColor}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="#1D2350"
                className="flex-1 bg-cream border border-ink/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
              />
            </div>
            <p className="text-xs text-ink/30 mt-1">Your main brand color</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.accentColor || '#FF9678'}
                onChange={(e) => update('accentColor', e.target.value)}
                className="w-10 h-10 rounded-lg border border-ink/10 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.accentColor}
                onChange={(e) => update('accentColor', e.target.value)}
                placeholder="#FF9678"
                className="flex-1 bg-cream border border-ink/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
              />
            </div>
            <p className="text-xs text-ink/30 mt-1">For buttons and highlights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
