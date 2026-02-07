'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { ColorPicker } from '@/components/editor/color-picker';
import { FontSelector } from '@/components/editor/font-selector';
import { LogoUploader } from '@/components/editor/logo-uploader';
import { PreviewFrame } from '@/components/editor/preview-frame';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import type { BrandData } from '@/lib/types';

// Slide configuration - maps slide index to editable fields
const SLIDE_CONFIG: Record<number, { title: string; fields: string[] }> = {
  0: { title: 'Hero Slide', fields: ['donorHeadline', 'heroHook', 'badgeText'] },
  1: { title: 'Mission Slide', fields: ['missionHeadline', 'mission', 'coreValues'] },
  2: { title: 'Challenge Slide', fields: ['needHeadline', 'needDescription', 'solution'] },
  3: { title: 'Programs Slide', fields: ['programs'] },
  4: { title: 'Metrics Slide', fields: [] }, // Phase 2
  5: { title: 'Testimonials Slide', fields: [] }, // Phase 2
  6: { title: 'CTA Slide', fields: ['ctaButtonText', 'finalDonateUrl'] },
  7: { title: 'DonorSpark Slide', fields: [] },
};

export default function EditDeckPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [globalSettingsExpanded, setGlobalSettingsExpanded] = useState(true);

  const [deckSlug, setDeckSlug] = useState<string>('');
  const [deckUrl, setDeckUrl] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [originalBrandData, setOriginalBrandData] = useState<BrandData | null>(null);
  const [hasMetricsSlide, setHasMetricsSlide] = useState(false);

  // Listen for slide changes from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'slideChange') {
        setCurrentSlide(event.data.slideIndex);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch deck data on mount
  useEffect(() => {
    async function fetchDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          if (response.status === 403) {
            setError('Deck editing requires a Starter or Growth plan. Please upgrade to edit your deck.');
          } else if (response.status === 404) {
            setError('Deck not found');
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to load deck');
          }
          return;
        }

        const data = await response.json();
        if (!data.brandData) {
          setError('This deck cannot be edited yet. Please wait for generation to complete.');
          return;
        }

        setDeckSlug(data.slug);
        setDeckUrl(data.deckUrl);
        setBrandData(data.brandData);
        setOriginalBrandData(JSON.parse(JSON.stringify(data.brandData)));
        // Check if deck has metrics slide
        setHasMetricsSlide(data.brandData.hasValidMetrics && data.brandData.metrics?.length > 0);
      } catch (err) {
        setError('Failed to load deck');
      } finally {
        setLoading(false);
      }
    }

    fetchDeck();
  }, [deckId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update brandData helper
  const updateBrandData = useCallback((updates: Partial<BrandData>) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle color changes
  const handleColorChange = useCallback((colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        colors: { ...prev.colors, [colorType]: value },
      };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle font changes
  const handleFontChange = useCallback((fontType: 'headingFont' | 'bodyFont', value: string) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fonts: { ...prev.fonts, [fontType]: value },
      };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle logo changes
  const handleLogoChange = useCallback((url: string) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, logoUrl: url, logoSource: 'custom' };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  const handleLogoRemove = useCallback(() => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, logoUrl: null, logoSource: 'none' };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle field changes (supports string and string[])
  const handleFieldChange = useCallback((field: string, value: string | string[]) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;

      if (field === 'needHeadline') {
        return { ...prev, need: { ...prev.need, headline: value as string } };
      }
      if (field === 'needDescription') {
        return { ...prev, need: { ...prev.need, description: value as string } };
      }

      return { ...prev, [field]: value };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Array field helpers
  const handleArrayItemChange = (field: string, index: number, value: string, arr: string[]) => {
    const newArr = [...arr];
    newArr[index] = value;
    handleFieldChange(field, newArr);
  };

  const handleAddArrayItem = (field: string, arr: string[]) => {
    handleFieldChange(field, [...arr, '']);
  };

  const handleRemoveArrayItem = (field: string, index: number, arr: string[]) => {
    const newArr = arr.filter((_, i) => i !== index);
    handleFieldChange(field, newArr);
  };

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    if (!brandData || !deckSlug) return '';
    return generateDeckHtml(deckSlug, brandData);
  }, [brandData, deckSlug]);

  // Save changes
  const handleSave = async () => {
    if (!brandData) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      const data = await response.json();
      setDeckUrl(data.deckUrl);
      setOriginalBrandData(JSON.parse(JSON.stringify(brandData)));
      setHasUnsavedChanges(false);
      setSuccessMessage('Changes saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    if (originalBrandData) {
      setBrandData(JSON.parse(JSON.stringify(originalBrandData)));
      setHasUnsavedChanges(false);
    }
  };

  // Get current slide config (adjust for metrics slide presence)
  const getSlideConfig = () => {
    // Without metrics: slides 4+ shift down by 1
    // With metrics: use normal config
    let adjustedIndex = currentSlide;
    if (!hasMetricsSlide && currentSlide >= 4) {
      adjustedIndex = currentSlide + 1;
    }
    return SLIDE_CONFIG[adjustedIndex] || { title: 'Unknown Slide', fields: [] };
  };

  const slideConfig = getSlideConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C15A36] animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading deck editor...</p>
        </div>
      </div>
    );
  }

  if (error && !brandData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Unable to Edit Deck</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Editor Panel */}
      <div className="w-[400px] flex-shrink-0 border-r border-neutral-800 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    router.push('/dashboard');
                  }
                } else {
                  router.push('/dashboard');
                }
              }}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <button
                  onClick={handleReset}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${hasUnsavedChanges
                    ? 'bg-[#C15A36] hover:bg-[#a84d2e] text-white'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-900 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-900/30 border border-green-900 rounded-lg text-sm text-green-300">
            {successMessage}
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          {brandData && (
            <>
              {/* Global Settings Section */}
              <div className="border-b border-neutral-800">
                <button
                  onClick={() => setGlobalSettingsExpanded(!globalSettingsExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-white">Global Settings</span>
                  {globalSettingsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {globalSettingsExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Colors */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Colors</p>
                      <ColorPicker
                        label="Background Color"
                        value={brandData.colors.primary}
                        onChange={(v) => handleColorChange('primary', v)}
                      />
                      <ColorPicker
                        label="Button Color"
                        value={brandData.colors.secondary}
                        onChange={(v) => handleColorChange('secondary', v)}
                      />
                      <ColorPicker
                        label="Highlight Color"
                        value={brandData.colors.accent}
                        onChange={(v) => handleColorChange('accent', v)}
                      />
                      <ColorPicker
                        label="Header Background"
                        value={brandData.headerBgColor || brandData.colors.primary}
                        onChange={(v) => updateBrandData({ headerBgColor: v })}
                      />
                    </div>

                    {/* Fonts */}
                    <div className="space-y-3 pt-3 border-t border-neutral-700">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Fonts</p>
                      <FontSelector
                        label="Heading Font"
                        value={brandData.fonts.headingFont}
                        onChange={(v) => handleFontChange('headingFont', v)}
                        type="heading"
                      />
                      <FontSelector
                        label="Body Font"
                        value={brandData.fonts.bodyFont}
                        onChange={(v) => handleFontChange('bodyFont', v)}
                        type="body"
                      />
                    </div>

                    {/* Logo */}
                    <div className="pt-3 border-t border-neutral-700">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Logo</p>
                      <LogoUploader
                        currentLogoUrl={brandData.logoUrl}
                        onUpload={handleLogoChange}
                        onRemove={handleLogoRemove}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slide-Specific Settings */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold text-[#C15A36] bg-[#C15A36]/10 px-2 py-1 rounded">
                    SLIDE {currentSlide + 1}
                  </span>
                  <span className="text-sm font-semibold text-white">{slideConfig.title}</span>
                </div>

                {slideConfig.fields.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">
                    No editable options for this slide yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Hero Slide Fields */}
                    {slideConfig.fields.includes('donorHeadline') && (
                      <FieldInput
                        label="Headline"
                        value={brandData.donorHeadline}
                        onChange={(v) => handleFieldChange('donorHeadline', v)}
                        placeholder="Making A Difference"
                      />
                    )}
                    {slideConfig.fields.includes('heroHook') && (
                      <FieldTextarea
                        label="Hook / Subheadline"
                        value={brandData.heroHook}
                        onChange={(v) => handleFieldChange('heroHook', v)}
                        placeholder="A brief, engaging description..."
                        rows={2}
                      />
                    )}
                    {slideConfig.fields.includes('badgeText') && (
                      <FieldInput
                        label="Badge Text"
                        value={brandData.badgeText ?? 'Impact Deck'}
                        onChange={(v) => updateBrandData({ badgeText: v })}
                        placeholder="Impact Deck"
                        hint="Leave empty to hide the badge"
                      />
                    )}

                    {/* Mission Slide Fields */}
                    {slideConfig.fields.includes('missionHeadline') && (
                      <FieldInput
                        label="Section Headline"
                        value={brandData.missionHeadline ?? 'Building A Better Future'}
                        onChange={(v) => updateBrandData({ missionHeadline: v })}
                        placeholder="Building A Better Future"
                      />
                    )}
                    {slideConfig.fields.includes('mission') && (
                      <FieldTextarea
                        label="Mission Statement"
                        value={brandData.mission}
                        onChange={(v) => handleFieldChange('mission', v)}
                        placeholder="Your organization's mission..."
                        rows={3}
                      />
                    )}
                    {slideConfig.fields.includes('coreValues') && (
                      <ArrayField
                        label="Core Values"
                        values={brandData.coreValues || ['Integrity', 'Compassion', 'Excellence', 'Community']}
                        onChange={(arr) => handleFieldChange('coreValues', arr)}
                        onItemChange={(idx, val) => handleArrayItemChange('coreValues', idx, val, brandData.coreValues || [])}
                        onAdd={() => handleAddArrayItem('coreValues', brandData.coreValues || [])}
                        onRemove={(idx) => handleRemoveArrayItem('coreValues', idx, brandData.coreValues || [])}
                        maxItems={4}
                        itemLabel="Value"
                      />
                    )}

                    {/* Challenge Slide Fields */}
                    {slideConfig.fields.includes('needHeadline') && (
                      <FieldInput
                        label="Challenge Headline"
                        value={brandData.need.headline}
                        onChange={(v) => handleFieldChange('needHeadline', v)}
                        placeholder="Communities Need Support"
                      />
                    )}
                    {slideConfig.fields.includes('needDescription') && (
                      <FieldTextarea
                        label="Challenge Description"
                        value={brandData.need.description}
                        onChange={(v) => handleFieldChange('needDescription', v)}
                        placeholder="Describe the challenge..."
                        rows={3}
                      />
                    )}
                    {slideConfig.fields.includes('solution') && (
                      <FieldTextarea
                        label="Your Solution"
                        value={brandData.solution}
                        onChange={(v) => handleFieldChange('solution', v)}
                        placeholder="How your organization addresses this challenge..."
                        rows={3}
                      />
                    )}

                    {/* Programs Slide Fields */}
                    {slideConfig.fields.includes('programs') && (
                      <ArrayField
                        label="Programs / Services"
                        values={brandData.programs || []}
                        onChange={(arr) => handleFieldChange('programs', arr)}
                        onItemChange={(idx, val) => handleArrayItemChange('programs', idx, val, brandData.programs || [])}
                        onAdd={() => handleAddArrayItem('programs', brandData.programs || [])}
                        onRemove={(idx) => handleRemoveArrayItem('programs', idx, brandData.programs || [])}
                        maxItems={6}
                        itemLabel="Program"
                      />
                    )}

                    {/* CTA Slide Fields */}
                    {slideConfig.fields.includes('ctaButtonText') && (
                      <FieldInput
                        label="Button Text"
                        value={brandData.ctaButtonText ?? 'Donate Today'}
                        onChange={(v) => updateBrandData({ ctaButtonText: v })}
                        placeholder="Donate Today"
                      />
                    )}
                    {slideConfig.fields.includes('finalDonateUrl') && (
                      <FieldInput
                        label="Button URL"
                        value={brandData.finalDonateUrl}
                        onChange={(v) => updateBrandData({ finalDonateUrl: v })}
                        placeholder="https://your-donate-page.org/donate"
                        type="url"
                      />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <p className="text-xs text-neutral-500 text-center">
            Navigate slides in the preview to see editing options for each slide.
          </p>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 h-screen overflow-hidden p-4">
        <PreviewFrame html={previewHtml} deckUrl={deckUrl} />
      </div>
    </div>
  );
}

// Reusable field components
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
          focus:outline-none focus:border-[#C15A36] transition-colors"
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
          focus:outline-none focus:border-[#C15A36] transition-colors resize-none"
      />
    </div>
  );
}

function ArrayField({
  label,
  values,
  onChange,
  onItemChange,
  onAdd,
  onRemove,
  maxItems,
  itemLabel,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  onItemChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxItems: number;
  itemLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400">{label} (up to {maxItems})</label>
      <div className="space-y-2">
        {values.slice(0, maxItems).map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onItemChange(index, e.target.value)}
              placeholder={`${itemLabel} ${index + 1}`}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white
                focus:outline-none focus:border-[#C15A36] transition-colors"
            />
            {values.length > 1 && (
              <button
                onClick={() => onRemove(index)}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {values.length < maxItems && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" /> Add {itemLabel}
          </button>
        )}
      </div>
    </div>
  );
}
