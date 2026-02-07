'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp, Plus, X, Upload } from 'lucide-react';
import { ColorPicker } from '@/components/editor/color-picker';
import { FontSelector } from '@/components/editor/font-selector';
import { LogoUploader } from '@/components/editor/logo-uploader';
import { PreviewFrame } from '@/components/editor/preview-frame';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import type { BrandData, Testimonial, SocialLink } from '@/lib/types';

// Slide configuration - maps slide index to editable fields
const SLIDE_CONFIG: Record<number, { title: string; subtitle: string }> = {
  0: { title: 'Slide 1', subtitle: 'Hero' },
  1: { title: 'Slide 2', subtitle: 'Mission' },
  2: { title: 'Slide 3', subtitle: 'Challenge & Solution' },
  3: { title: 'Slide 4', subtitle: 'Programs' },
  4: { title: 'Slide 5', subtitle: 'Metrics' },
  5: { title: 'Slide 5', subtitle: 'Testimonials' }, // Without metrics
  6: { title: 'Slide 6', subtitle: 'CTA' },
  7: { title: 'Slide 7', subtitle: 'DonorSpark' },
};

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
] as const;

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
  const handleColorChange = useCallback((colorType: 'primary' | 'secondary' | 'accent' | 'text', value: string) => {
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

  // Handle field changes (supports string, string[], boolean)
  const handleFieldChange = useCallback((field: string, value: string | string[] | boolean) => {
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

  // Testimonial helpers
  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string) => {
    if (!brandData) return;
    const testimonials = [...(brandData.testimonials || [])];
    testimonials[index] = { ...testimonials[index], [field]: value };
    updateBrandData({ testimonials });
  };

  const handleAddTestimonial = () => {
    if (!brandData) return;
    const testimonials = [...(brandData.testimonials || [])];
    if (testimonials.length < 5) {
      testimonials.push({ quote: '', author: '', role: '', gender: 'woman', portrait: '' });
      updateBrandData({ testimonials });
    }
  };

  const handleRemoveTestimonial = (index: number) => {
    if (!brandData) return;
    const testimonials = (brandData.testimonials || []).filter((_, i) => i !== index);
    updateBrandData({ testimonials });
  };

  // Social link helpers
  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    if (!brandData) return;
    const socialLinks = [...(brandData.socialLinks || [])];
    socialLinks[index] = { ...socialLinks[index], [field]: value } as SocialLink;
    updateBrandData({ socialLinks });
  };

  const handleAddSocialLink = () => {
    if (!brandData) return;
    const socialLinks = [...(brandData.socialLinks || [])];
    if (socialLinks.length < 6) {
      socialLinks.push({ platform: 'facebook', url: '' });
      updateBrandData({ socialLinks });
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    if (!brandData) return;
    const socialLinks = (brandData.socialLinks || []).filter((_, i) => i !== index);
    updateBrandData({ socialLinks });
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
  const getSlideInfo = () => {
    // Slide mapping depends on whether metrics slide exists
    // With metrics: 0=Hero, 1=Mission, 2=Challenge, 3=Programs, 4=Metrics, 5=Testimonials, 6=CTA, 7=DS
    // Without metrics: 0=Hero, 1=Mission, 2=Challenge, 3=Programs, 4=Testimonials, 5=CTA, 6=DS
    if (hasMetricsSlide) {
      return SLIDE_CONFIG[currentSlide] || { title: 'Unknown', subtitle: '' };
    } else {
      // Map without metrics slide
      const mapping: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 5, 5: 6, 6: 7 };
      return SLIDE_CONFIG[mapping[currentSlide]] || { title: 'Unknown', subtitle: '' };
    }
  };

  const slideInfo = getSlideInfo();

  // Determine which slide type we're on
  const getSlideType = (): 'hero' | 'mission' | 'challenge' | 'programs' | 'metrics' | 'testimonials' | 'cta' | 'donorspark' => {
    if (hasMetricsSlide) {
      const types = ['hero', 'mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta', 'donorspark'] as const;
      return types[currentSlide] || 'hero';
    } else {
      const types = ['hero', 'mission', 'challenge', 'programs', 'testimonials', 'cta', 'donorspark'] as const;
      return types[currentSlide] || 'hero';
    }
  };

  const slideType = getSlideType();

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
                    Save
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
                        label="Highlight Color"
                        value={brandData.colors.accent}
                        onChange={(v) => handleColorChange('accent', v)}
                      />
                      <ColorPicker
                        label="Text Color"
                        value={brandData.colors.text || '#ffffff'}
                        onChange={(v) => handleColorChange('text', v)}
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
                    {slideInfo.title.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-white">{slideInfo.subtitle}</span>
                </div>

                {/* Hero Slide */}
                {slideType === 'hero' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Badge Text"
                      value={brandData.badgeText ?? 'Impact Deck'}
                      onChange={(v) => updateBrandData({ badgeText: v })}
                      placeholder="Impact Deck"
                      hint="Leave empty to hide the badge"
                    />
                    <FieldInput
                      label="Headline"
                      value={brandData.donorHeadline}
                      onChange={(v) => handleFieldChange('donorHeadline', v)}
                      placeholder="Making A Difference"
                    />
                    <FieldTextarea
                      label="Hook / Subheadline"
                      value={brandData.heroHook}
                      onChange={(v) => handleFieldChange('heroHook', v)}
                      placeholder="A brief, engaging description..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Mission Slide */}
                {slideType === 'mission' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Slide Title"
                      value={brandData.missionSlideTitle ?? 'Our Mission'}
                      onChange={(v) => updateBrandData({ missionSlideTitle: v })}
                      placeholder="Our Mission"
                    />
                    <FieldInput
                      label="Section Headline"
                      value={brandData.missionHeadline ?? 'Building A Better Future'}
                      onChange={(v) => updateBrandData({ missionHeadline: v })}
                      placeholder="Building A Better Future"
                    />
                    <FieldTextarea
                      label="Mission Statement"
                      value={brandData.mission}
                      onChange={(v) => handleFieldChange('mission', v)}
                      placeholder="Your organization's mission..."
                      rows={3}
                    />
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
                  </div>
                )}

                {/* Challenge Slide */}
                {slideType === 'challenge' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Slide Title"
                      value={brandData.challengeSlideTitle ?? 'The Challenge'}
                      onChange={(v) => updateBrandData({ challengeSlideTitle: v })}
                      placeholder="The Challenge"
                    />
                    <FieldInput
                      label="Challenge Headline"
                      value={brandData.need.headline}
                      onChange={(v) => handleFieldChange('needHeadline', v)}
                      placeholder="Communities Need Support"
                    />
                    <FieldTextarea
                      label="Challenge Description"
                      value={brandData.need.description}
                      onChange={(v) => handleFieldChange('needDescription', v)}
                      placeholder="Describe the challenge..."
                      rows={3}
                    />
                    <FieldInput
                      label="Solution Headline"
                      value={brandData.solutionHeadline ?? 'Our Solution'}
                      onChange={(v) => updateBrandData({ solutionHeadline: v })}
                      placeholder="Our Solution"
                    />
                    <FieldTextarea
                      label="Solution Description"
                      value={brandData.solution}
                      onChange={(v) => handleFieldChange('solution', v)}
                      placeholder="How your organization addresses this challenge..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Programs Slide */}
                {slideType === 'programs' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Section Headline"
                      value={brandData.programsHeadline ?? 'What We Offer'}
                      onChange={(v) => updateBrandData({ programsHeadline: v })}
                      placeholder="What We Offer"
                    />
                    <FieldTextarea
                      label="Body Copy"
                      value={brandData.programsBody ?? 'We deliver impactful programs designed to create lasting change in our community.'}
                      onChange={(v) => updateBrandData({ programsBody: v })}
                      placeholder="Describe your programs..."
                      rows={3}
                    />
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
                  </div>
                )}

                {/* Metrics Slide */}
                {slideType === 'metrics' && (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500 italic">
                      Metrics editing coming soon.
                    </p>
                  </div>
                )}

                {/* Testimonials Slide */}
                {slideType === 'testimonials' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Slide Title"
                      value={brandData.testimonialsSlideTitle ?? 'Success Stories'}
                      onChange={(v) => updateBrandData({ testimonialsSlideTitle: v })}
                      placeholder="Success Stories"
                    />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-400">Testimonials (up to 5)</label>
                        {(brandData.testimonials?.length || 0) < 5 && (
                          <button
                            onClick={handleAddTestimonial}
                            className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>
                      {(brandData.testimonials || []).map((testimonial, index) => (
                        <div key={index} className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500">#{index + 1}</span>
                            <button
                              onClick={() => handleRemoveTestimonial(index)}
                              className="text-neutral-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={testimonial.quote}
                            onChange={(e) => handleTestimonialChange(index, 'quote', e.target.value)}
                            placeholder="Quote..."
                            rows={2}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white resize-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={testimonial.author}
                              onChange={(e) => handleTestimonialChange(index, 'author', e.target.value)}
                              placeholder="Name"
                              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={testimonial.role}
                              onChange={(e) => handleTestimonialChange(index, 'role', e.target.value)}
                              placeholder="Title/Role"
                              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                            />
                          </div>
                          <input
                            type="text"
                            value={testimonial.portrait || ''}
                            onChange={(e) => handleTestimonialChange(index, 'portrait', e.target.value)}
                            placeholder="Photo URL (optional)"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                      ))}
                      {(brandData.testimonials?.length || 0) === 0 && (
                        <p className="text-xs text-neutral-500 italic">No testimonials added. Default testimonials will be shown.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA Slide */}
                {slideType === 'cta' && (
                  <div className="space-y-4">
                    <FieldInput
                      label="Headline"
                      value={brandData.ctaHeadline ?? 'Join Our Mission'}
                      onChange={(v) => updateBrandData({ ctaHeadline: v })}
                      placeholder="Join Our Mission"
                    />
                    <FieldTextarea
                      label="Subheadline"
                      value={brandData.ctaSubhead ?? 'Your support helps us continue making a difference.'}
                      onChange={(v) => updateBrandData({ ctaSubhead: v })}
                      placeholder="Your support helps us continue..."
                      rows={2}
                    />
                    <FieldInput
                      label="Button Text"
                      value={brandData.ctaButtonText ?? 'Donate Today'}
                      onChange={(v) => updateBrandData({ ctaButtonText: v })}
                      placeholder="Donate Today"
                    />
                    <ColorPicker
                      label="Button Color"
                      value={brandData.colors.secondary}
                      onChange={(v) => handleColorChange('secondary', v)}
                    />
                    <FieldInput
                      label="Button URL"
                      value={brandData.finalDonateUrl}
                      onChange={(v) => updateBrandData({ finalDonateUrl: v })}
                      placeholder="https://your-donate-page.org/donate"
                      type="url"
                    />

                    <div className="pt-3 border-t border-neutral-700 space-y-3">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Social Section</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brandData.showShareButtons !== false}
                          onChange={(e) => updateBrandData({ showShareButtons: e.target.checked })}
                          className="w-4 h-4 rounded bg-neutral-800 border-neutral-600"
                        />
                        <span className="text-sm text-white">Show "Share This Story" buttons</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brandData.showSocialLinks === true}
                          onChange={(e) => updateBrandData({ showSocialLinks: e.target.checked })}
                          className="w-4 h-4 rounded bg-neutral-800 border-neutral-600"
                        />
                        <span className="text-sm text-white">Show "Follow Us Online" links</span>
                      </label>

                      {brandData.showSocialLinks && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-neutral-400">Your Social Links</label>
                            {(brandData.socialLinks?.length || 0) < 6 && (
                              <button
                                onClick={handleAddSocialLink}
                                className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                          {(brandData.socialLinks || []).map((link, index) => (
                            <div key={index} className="flex gap-2">
                              <select
                                value={link.platform}
                                onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                              >
                                {SOCIAL_PLATFORMS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                placeholder="https://..."
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                              />
                              <button
                                onClick={() => handleRemoveSocialLink(index)}
                                className="p-1.5 text-neutral-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DonorSpark Slide */}
                {slideType === 'donorspark' && (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500 italic">
                      This slide cannot be customized.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <p className="text-xs text-neutral-500 text-center">
            Use <span className="font-mono bg-neutral-800 px-1 rounded">←</span> <span className="font-mono bg-neutral-800 px-1 rounded">→</span> arrow keys to navigate slides
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
