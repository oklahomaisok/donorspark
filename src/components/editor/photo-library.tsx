'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader2, Check, Image as ImageIcon, Grid } from 'lucide-react';

// Stock photos organized by category
const STOCK_PHOTOS = {
  community: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/community-hero-leader.jpg', label: 'Leader' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/community-action-neighbors.jpg', label: 'Neighbors' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/community-group-gathering.jpg', label: 'Gathering' },
  ],
  education: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/education-hero-classroom.jpg', label: 'Classroom' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/education-action-tutoring.jpg', label: 'Tutoring' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/education-group-graduation.jpg', label: 'Graduation' },
  ],
  health: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/health-hero-care.jpg', label: 'Care' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/health-action-clinic.jpg', label: 'Clinic' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/health-group-support.jpg', label: 'Support' },
  ],
  environment: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/environment-hero-nature.jpg', label: 'Nature' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/environment-action-cleanup.jpg', label: 'Cleanup' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/environment-group-planting.jpg', label: 'Planting' },
  ],
  arts: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/arts-hero-performance.jpg', label: 'Performance' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/arts-action-creating.jpg', label: 'Creating' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/arts-group-exhibition.jpg', label: 'Exhibition' },
  ],
  youth: [
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/youth-hero-activities.jpg', label: 'Activities' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/youth-action-mentoring.jpg', label: 'Mentoring' },
    { url: 'https://oklahomaisok.github.io/nonprofit-decks/images/youth-group-camp.jpg', label: 'Camp' },
  ],
};

interface PhotoLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
  slideType: 'hero' | 'mission' | 'programs' | 'testimonials';
}

export function PhotoLibrary({ isOpen, onClose, onSelect, currentUrl, slideType }: PhotoLibraryProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'upload'>('stock');
  const [selectedCategory, setSelectedCategory] = useState<string>('community');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load user's uploaded photos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ds_user_photos');
      if (saved) {
        setUploadedPhotos(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved photos:', e);
    }
  }, [isOpen]);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (max 4MB - Vercel limit is 4.5MB)
    if (file.size > 4 * 1024 * 1024) {
      alert('File size must be less than 4MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      // Handle non-JSON error responses (e.g., Vercel's "Request Entity Too Large")
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (response.status === 413) {
          throw new Error('File too large. Please use a smaller image (under 4.5MB).');
        }
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const newPhotos = [data.url, ...uploadedPhotos];
      setUploadedPhotos(newPhotos);
      localStorage.setItem('ds_user_photos', JSON.stringify(newPhotos));
      onSelect(data.url);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveUploadedPhoto = (url: string) => {
    const newPhotos = uploadedPhotos.filter(p => p !== url);
    setUploadedPhotos(newPhotos);
    localStorage.setItem('ds_user_photos', JSON.stringify(newPhotos));
  };

  if (!isOpen) return null;

  const categories = Object.keys(STOCK_PHOTOS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C15A36]/10 rounded-lg">
              <ImageIcon className="w-5 h-5 text-[#C15A36]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Photo Library</h2>
              <p className="text-xs text-neutral-400 capitalize">{slideType} Slide Background</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stock'
                ? 'text-[#C15A36] border-b-2 border-[#C15A36]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4 inline-block mr-2" />
            Stock Photos
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-[#C15A36] border-b-2 border-[#C15A36]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Your Photos {uploadedPhotos.length > 0 && `(${uploadedPhotos.length})`}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'stock' ? (
            <>
              {/* Category selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                      selectedCategory === cat
                        ? 'bg-[#C15A36] text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {STOCK_PHOTOS[selectedCategory as keyof typeof STOCK_PHOTOS]?.map((photo) => (
                  <button
                    key={photo.url}
                    onClick={() => {
                      onSelect(photo.url);
                      onClose();
                    }}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                      currentUrl === photo.url
                        ? 'border-[#C15A36] ring-2 ring-[#C15A36]/30'
                        : 'border-transparent hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-xs text-white font-medium">
                      {photo.label}
                    </span>
                    {currentUrl === photo.url && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#C15A36] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Upload area */}
              <label className="block mb-4">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  uploading ? 'border-[#C15A36] bg-[#C15A36]/5' : 'border-neutral-700 hover:border-neutral-500'
                }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-[#C15A36] animate-spin mb-2" />
                      <span className="text-sm text-neutral-400">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                      <p className="text-sm text-neutral-300 mb-1">Click to upload a photo</p>
                      <p className="text-xs text-neutral-500">JPEG, PNG, WebP up to 4MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  disabled={uploading}
                />
              </label>

              {/* Uploaded photos grid */}
              {uploadedPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedPhotos.map((url) => (
                    <div
                      key={url}
                      className="relative group"
                    >
                      <button
                        onClick={() => {
                          onSelect(url);
                          onClose();
                        }}
                        className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          currentUrl === url
                            ? 'border-[#C15A36] ring-2 ring-[#C15A36]/30'
                            : 'border-transparent hover:border-neutral-600'
                        }`}
                      >
                        <img
                          src={url}
                          alt="Uploaded"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {currentUrl === url && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#C15A36] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUploadedPhoto(url);
                        }}
                        className="absolute top-1 left-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-600"
                        title="Remove from library"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-500 py-8">
                  No photos uploaded yet. Upload your first photo above.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-700 bg-neutral-900/80">
          <p className="text-xs text-neutral-500">
            {currentUrl ? 'Click a photo to select it' : 'Select a photo for your slide'}
          </p>
          <div className="flex gap-2">
            {currentUrl && (
              <button
                onClick={() => {
                  onSelect('');
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Reset to Default
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
