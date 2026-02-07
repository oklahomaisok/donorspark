'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function LogoUploader({ currentLogoUrl, onUpload, onRemove }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Use PNG, JPEG, WebP, or SVG.');
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 2MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
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
    if (file) {
      uploadFile(file);
    }
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        Logo
      </label>

      {currentLogoUrl ? (
        <div className="relative bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-2">
              <img
                src={currentLogoUrl}
                alt="Current logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-300 mb-2">Current logo</p>
              <div className="flex gap-2">
                <label className="cursor-pointer text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors">
                  Replace
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <button
                  onClick={onRemove}
                  className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
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
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-[#C15A36] bg-[#C15A36]/10' : 'border-neutral-700 hover:border-neutral-600'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-[#C15A36] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-400">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neutral-500" />
                </div>
                <p className="text-sm text-neutral-300">Drag and drop your logo here</p>
                <p className="text-xs text-neutral-500">or</p>
                <label className="cursor-pointer text-sm bg-[#C15A36] hover:bg-[#a84d2e] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPEG, WebP, or SVG. Max 2MB.</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
