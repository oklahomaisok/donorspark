'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, Plus, X, Eye, EyeOff, GripVertical, Upload,
  Palette, Type, ImageIcon, Layers, LayoutGrid, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ColorPicker } from '@/components/editor/color-picker';
import { FontSelector } from '@/components/editor/font-selector';
import { LogoUploader } from '@/components/editor/logo-uploader';
import { PreviewFrame } from '@/components/editor/preview-frame';
import { SlideImageUploader } from '@/components/editor/slide-image-uploader';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import type { BrandData, Testimonial, SocialLink, CustomImages, FocalPoint } from '@/lib/types';

// Tool categories for the left rail (Photos removed - now per-slide)
type ToolCategory = 'colors' | 'fonts' | 'logo' | 'slides' | null;

// Slide configuration for content editing
const SLIDE_TYPES = ['hero', 'mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'] as const;
type SlideType = typeof SLIDE_TYPES[number];

// Slide labels now use "Slide 1", "Slide 2", etc. based on visible order

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

  // Canva-style UI state
  const [activeTool, setActiveTool] = useState<ToolCategory>(null);
  const [activeSlideType, setActiveSlideType] = useState<SlideType>('hero');

  const [deckSlug, setDeckSlug] = useState<string>('');
  const [deckUrl, setDeckUrl] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [originalBrandData, setOriginalBrandData] = useState<BrandData | null>(null);
  const [hasMetricsSlide, setHasMetricsSlide] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [canSave, setCanSave] = useState(false);
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);

  // Listen for slide changes from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'slideChange') {
        setCurrentSlide(event.data.slideIndex);
        // Update active slide type based on visible slides
        const visibleTypes = getVisibleSlideTypes();
        if (visibleTypes[event.data.slideIndex]) {
          setActiveSlideType(visibleTypes[event.data.slideIndex] as SlideType);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [brandData, hasMetricsSlide, userPlan]);

  // Fetch deck data on mount
  useEffect(() => {
    async function fetchDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          if (response.status === 404) {
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
        setUserPlan(data.userPlan || 'free');
        setCanSave(data.canSave !== false);
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

  // Handle custom image changes
  const handleCustomImageChange = useCallback((slideType: 'hero' | 'mission' | 'programs' | 'testimonials', url: string) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;
      const customImages = { ...(prev.customImages || {}) } as CustomImages;
      if (url) {
        customImages[slideType] = url;
      } else {
        delete customImages[slideType];
      }
      return { ...prev, customImages };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle focal point changes
  const handleFocalPointChange = useCallback((slideType: 'hero' | 'mission' | 'programs' | 'testimonials', focal: FocalPoint) => {
    if (!brandData) return;

    const focalKey = `${slideType}Focal` as keyof CustomImages;
    setBrandData((prev) => {
      if (!prev) return prev;
      const customImages = { ...(prev.customImages || {}) };
      (customImages as Record<string, FocalPoint>)[focalKey] = focal;
      return { ...prev, customImages };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

  // Handle field changes
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

  const handleTestimonialPhotoUpload = async (index: number, file: File) => {
    if (!brandData) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      handleTestimonialChange(index, 'portrait', data.url);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Failed to upload photo');
    }
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
    return generateDeckHtml(deckSlug, brandData, {
      hideDonorSparkSlide: userPlan !== 'free',
    });
  }, [brandData, deckSlug, userPlan]);

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

  // Build array of visible slide types
  const defaultSlideOrder: ('mission' | 'challenge' | 'programs' | 'metrics' | 'testimonials' | 'cta')[] =
    ['mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'];

  const getVisibleSlideTypes = () => {
    const types: string[] = ['hero'];
    const order = brandData?.slideOrder || defaultSlideOrder;

    for (const slideId of order) {
      if (slideId === 'mission' && brandData?.showMissionSlide !== false) types.push('mission');
      else if (slideId === 'challenge' && brandData?.showChallengeSlide !== false) types.push('challenge');
      else if (slideId === 'programs' && brandData?.showProgramsSlide !== false) types.push('programs');
      else if (slideId === 'metrics' && hasMetricsSlide) types.push('metrics');
      else if (slideId === 'testimonials' && brandData?.showTestimonialsSlide !== false) types.push('testimonials');
      else if (slideId === 'cta' && brandData?.showCtaSlide !== false) types.push('cta');
    }

    if (userPlan === 'free') {
      types.push('donorspark');
    }

    return types;
  };

  // Toggle slide visibility
  const toggleSlideVisibility = (slideKey: 'showMissionSlide' | 'showChallengeSlide' | 'showProgramsSlide' | 'showTestimonialsSlide' | 'showCtaSlide') => {
    if (!brandData) return;
    const currentValue = brandData[slideKey] !== false;
    updateBrandData({ [slideKey]: !currentValue });
  };

  const getSlideOrder = () => brandData?.slideOrder || defaultSlideOrder;

  // Drag and drop handlers
  const handleDragStart = (slideId: string) => {
    setDraggedSlide(slideId);
  };

  const handleDragOver = (e: React.DragEvent, targetSlideId: string) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide === targetSlideId) return;
  };

  const handleDrop = (e: React.DragEvent, targetSlideId: string) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide === targetSlideId || !brandData) return;

    const currentOrder = getSlideOrder();
    const draggedIndex = currentOrder.indexOf(draggedSlide as typeof currentOrder[number]);
    const targetIndex = currentOrder.indexOf(targetSlideId as typeof currentOrder[number]);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSlide as typeof currentOrder[number]);

    updateBrandData({ slideOrder: newOrder });
    setDraggedSlide(null);
  };

  const handleDragEnd = () => {
    setDraggedSlide(null);
  };

  // Slide configuration for the reorder list
  const slideConfig: Record<string, { label: string; visibilityKey?: 'showMissionSlide' | 'showChallengeSlide' | 'showProgramsSlide' | 'showTestimonialsSlide' | 'showCtaSlide' }> = {
    mission: { label: 'Mission', visibilityKey: 'showMissionSlide' },
    challenge: { label: 'Challenge', visibilityKey: 'showChallengeSlide' },
    programs: { label: 'Programs', visibilityKey: 'showProgramsSlide' },
    metrics: { label: 'Metrics' },
    testimonials: { label: 'Testimonials', visibilityKey: 'showTestimonialsSlide' },
    cta: { label: 'CTA', visibilityKey: 'showCtaSlide' },
  };

  const isSlideVisible = (slideId: string) => {
    if (slideId === 'metrics') return hasMetricsSlide;
    const key = slideConfig[slideId]?.visibilityKey;
    if (!key || !brandData) return true;
    return brandData[key] !== false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C15A36] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error && !brandData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Edit Deck</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Tool panels content
  const renderToolPanel = () => {
    if (!brandData || !activeTool) return null;

    return (
      <div className="w-72 bg-white border-r border-gray-200 h-full overflow-y-auto">
        <div className="p-4">
          {/* Colors Panel */}
          {activeTool === 'colors' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Colors</h3>
              <ColorPicker
                label="Background"
                value={brandData.colors.primary}
                onChange={(v) => handleColorChange('primary', v)}
                lightMode
              />
              <ColorPicker
                label="Primary Text"
                value={brandData.colors.text || '#ffffff'}
                onChange={(v) => handleColorChange('text', v)}
                lightMode
              />
              <ColorPicker
                label="Accent"
                value={brandData.colors.accent}
                onChange={(v) => handleColorChange('accent', v)}
                lightMode
              />
              <ColorPicker
                label="Button"
                value={brandData.colors.secondary}
                onChange={(v) => handleColorChange('secondary', v)}
                lightMode
              />
              <ColorPicker
                label="Header BG"
                value={brandData.headerBgColor || brandData.colors.primary}
                onChange={(v) => updateBrandData({ headerBgColor: v })}
                lightMode
              />
            </div>
          )}

          {/* Fonts Panel */}
          {activeTool === 'fonts' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Typography</h3>
              <FontSelector
                label="Heading Font"
                value={brandData.fonts.headingFont}
                onChange={(v) => handleFontChange('headingFont', v)}
                type="heading"
                lightMode
              />
              <FontSelector
                label="Body Font"
                value={brandData.fonts.bodyFont}
                onChange={(v) => handleFontChange('bodyFont', v)}
                type="body"
                lightMode
              />
            </div>
          )}

          {/* Logo Panel */}
          {activeTool === 'logo' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Logo</h3>
              <LogoUploader
                currentLogoUrl={brandData.logoUrl}
                onUpload={handleLogoChange}
                onRemove={handleLogoRemove}
                lightMode
              />
            </div>
          )}

          {/* Slides Panel */}
          {activeTool === 'slides' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Slide Order</h3>
              <p className="text-xs text-gray-500">Drag to reorder, click eye to show/hide</p>

              <div className="space-y-1">
                {/* Hero is always first */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 text-sm opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4" />
                    <span className="text-gray-500">Hero</span>
                  </div>
                  <Eye className="w-4 h-4 text-green-500" />
                </div>

                {/* Draggable slides */}
                {getSlideOrder().map((slideId) => {
                  const config = slideConfig[slideId];
                  if (!config) return null;
                  if (slideId === 'metrics' && !hasMetricsSlide) return null;

                  const visible = isSlideVisible(slideId);
                  const isDragging = draggedSlide === slideId;

                  return (
                    <div
                      key={slideId}
                      draggable
                      onDragStart={() => handleDragStart(slideId)}
                      onDragOver={(e) => handleDragOver(e, slideId)}
                      onDrop={(e) => handleDrop(e, slideId)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-2 bg-white rounded border transition-all text-sm cursor-grab active:cursor-grabbing ${
                        isDragging ? 'border-[#C15A36] opacity-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{config.label}</span>
                      </div>
                      {config.visibilityKey ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSlideVisibility(config.visibilityKey!);
                          }}
                          className={visible ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-400'}
                        >
                          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      ) : (
                        <Eye className="w-4 h-4 text-green-500/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Slide content editor (bento box style)
  const renderSlideContent = () => {
    if (!brandData) return null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-lg">
        {/* Slide tabs - compact to fit all */}
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
          {(() => {
            // Build array of visible slides with their numbers
            const visibleSlides: { type: SlideType; number: number }[] = [];
            let slideNumber = 1;

            for (const type of SLIDE_TYPES) {
              if (type === 'metrics' && !hasMetricsSlide) continue;
              if (type === 'mission' && brandData.showMissionSlide === false) continue;
              if (type === 'challenge' && brandData.showChallengeSlide === false) continue;
              if (type === 'programs' && brandData.showProgramsSlide === false) continue;
              if (type === 'testimonials' && brandData.showTestimonialsSlide === false) continue;
              if (type === 'cta' && brandData.showCtaSlide === false) continue;

              visibleSlides.push({ type, number: slideNumber });
              slideNumber++;
            }

            return visibleSlides.map(({ type, number }) => (
              <button
                key={type}
                onClick={() => setActiveSlideType(type)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeSlideType === type
                    ? 'text-[#C15A36] bg-white border-b-2 border-[#C15A36]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {number}
              </button>
            ));
          })()}
        </div>

        {/* Slide content - auto-sized */}
        <div className="p-4">
          {/* Hero */}
          {activeSlideType === 'hero' && (
            <div className="space-y-3">
              <FieldInput label="Badge Text" value={brandData.badgeText ?? 'Impact Deck'} onChange={(v) => updateBrandData({ badgeText: v })} placeholder="Impact Deck" />
              <FieldInput label="Headline" value={brandData.donorHeadline} onChange={(v) => handleFieldChange('donorHeadline', v)} placeholder="Making A Difference" />
              <FieldTextarea label="Hook" value={brandData.heroHook} onChange={(v) => handleFieldChange('heroHook', v)} placeholder="A brief, engaging description..." rows={2} />

              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Background Photo</label>
                <SlideImageUploader
                  label="Hero"
                  currentUrl={brandData.customImages?.hero}
                  defaultUrl={brandData.images?.hero || ''}
                  slideType="hero"
                  focalPoint={brandData.customImages?.heroFocal}
                  onChange={(url) => handleCustomImageChange('hero', url)}
                  onFocalPointChange={(focal) => handleFocalPointChange('hero', focal)}
                />
              </div>
            </div>
          )}

          {/* Mission */}
          {activeSlideType === 'mission' && (
            <div className="space-y-3">
              <FieldInput label="Slide Title" value={brandData.missionSlideTitle ?? 'Our Mission'} onChange={(v) => updateBrandData({ missionSlideTitle: v })} />
              <FieldInput label="Headline" value={brandData.missionHeadline ?? 'Building A Better Future'} onChange={(v) => updateBrandData({ missionHeadline: v })} />
              <FieldTextarea label="Mission Statement" value={brandData.mission} onChange={(v) => handleFieldChange('mission', v)} rows={3} />
              <ArrayField label="Core Values" values={brandData.coreValues || []} onItemChange={(idx, val) => handleArrayItemChange('coreValues', idx, val, brandData.coreValues || [])} onAdd={() => handleAddArrayItem('coreValues', brandData.coreValues || [])} onRemove={(idx) => handleRemoveArrayItem('coreValues', idx, brandData.coreValues || [])} maxItems={4} />

              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Background Photo</label>
                <SlideImageUploader
                  label="Mission"
                  currentUrl={brandData.customImages?.mission}
                  defaultUrl={brandData.images?.action || ''}
                  slideType="mission"
                  focalPoint={brandData.customImages?.missionFocal}
                  onChange={(url) => handleCustomImageChange('mission', url)}
                  onFocalPointChange={(focal) => handleFocalPointChange('mission', focal)}
                />
              </div>
            </div>
          )}

          {/* Challenge */}
          {activeSlideType === 'challenge' && (
            <div className="space-y-3">
              <FieldInput label="Slide Title" value={brandData.challengeSlideTitle ?? 'The Challenge'} onChange={(v) => updateBrandData({ challengeSlideTitle: v })} />
              <FieldInput label="Challenge Headline" value={brandData.need.headline} onChange={(v) => handleFieldChange('needHeadline', v)} />
              <FieldTextarea label="Challenge Description" value={brandData.need.description} onChange={(v) => handleFieldChange('needDescription', v)} rows={2} />
              <FieldInput label="Solution Headline" value={brandData.solutionHeadline ?? 'Our Solution'} onChange={(v) => updateBrandData({ solutionHeadline: v })} />
              <FieldTextarea label="Solution Description" value={brandData.solution} onChange={(v) => handleFieldChange('solution', v)} rows={2} />
            </div>
          )}

          {/* Programs */}
          {activeSlideType === 'programs' && (
            <div className="space-y-3">
              <FieldInput label="Headline" value={brandData.programsHeadline ?? 'What We Offer'} onChange={(v) => updateBrandData({ programsHeadline: v })} />
              <FieldTextarea label="Description" value={brandData.programsBody ?? ''} onChange={(v) => updateBrandData({ programsBody: v })} rows={2} />
              <ArrayField label="Programs" values={brandData.programs || []} onItemChange={(idx, val) => handleArrayItemChange('programs', idx, val, brandData.programs || [])} onAdd={() => handleAddArrayItem('programs', brandData.programs || [])} onRemove={(idx) => handleRemoveArrayItem('programs', idx, brandData.programs || [])} maxItems={6} />

              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Background Photo</label>
                <SlideImageUploader
                  label="Programs"
                  currentUrl={brandData.customImages?.programs}
                  defaultUrl={brandData.images?.group || ''}
                  slideType="programs"
                  focalPoint={brandData.customImages?.programsFocal}
                  onChange={(url) => handleCustomImageChange('programs', url)}
                  onFocalPointChange={(focal) => handleFocalPointChange('programs', focal)}
                />
              </div>
            </div>
          )}

          {/* Metrics */}
          {activeSlideType === 'metrics' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Impact Metrics</span>
                {(brandData.metrics?.length || 0) < 5 && (
                  <button
                    onClick={() => {
                      const metrics = [...(brandData.metrics || [])];
                      metrics.push({ value: '', label: '' });
                      updateBrandData({ metrics, hasValidMetrics: true });
                    }}
                    className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              {(brandData.metrics || []).map((metric, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => {
                      const metrics = [...(brandData.metrics || [])];
                      metrics[index] = { ...metrics[index], value: e.target.value };
                      updateBrandData({ metrics });
                    }}
                    placeholder="10,000+"
                    className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => {
                      const metrics = [...(brandData.metrics || [])];
                      metrics[index] = { ...metrics[index], label: e.target.value };
                      updateBrandData({ metrics });
                    }}
                    placeholder="People Served"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                  <button
                    onClick={() => {
                      const metrics = (brandData.metrics || []).filter((_, i) => i !== index);
                      updateBrandData({ metrics, hasValidMetrics: metrics.length > 0 });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Testimonials */}
          {activeSlideType === 'testimonials' && (
            <div className="space-y-3">
              <FieldInput label="Slide Title" value={brandData.testimonialsSlideTitle ?? 'Success Stories'} onChange={(v) => updateBrandData({ testimonialsSlideTitle: v })} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Testimonials</span>
                {(brandData.testimonials?.length || 0) < 5 && (
                  <button onClick={handleAddTestimonial} className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              {(brandData.testimonials || []).map((testimonial, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <button onClick={() => handleRemoveTestimonial(index)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <textarea
                    value={testimonial.quote}
                    onChange={(e) => handleTestimonialChange(index, 'quote', e.target.value)}
                    placeholder="Quote..."
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={testimonial.author} onChange={(e) => handleTestimonialChange(index, 'author', e.target.value)} placeholder="Name" className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]" />
                    <input type="text" value={testimonial.role} onChange={(e) => handleTestimonialChange(index, 'role', e.target.value)} placeholder="Title" className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" value={testimonial.portrait || ''} onChange={(e) => handleTestimonialChange(index, 'portrait', e.target.value)} placeholder="Photo URL" className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]" />
                    <label className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded cursor-pointer">
                      <Upload className="w-3 h-3 text-gray-500" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleTestimonialPhotoUpload(index, file); }} />
                    </label>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Background Photo</label>
                <SlideImageUploader
                  label="Testimonials"
                  currentUrl={brandData.customImages?.testimonials}
                  defaultUrl={brandData.images?.action || ''}
                  slideType="testimonials"
                  focalPoint={brandData.customImages?.testimonialsFocal}
                  onChange={(url) => handleCustomImageChange('testimonials', url)}
                  onFocalPointChange={(focal) => handleFocalPointChange('testimonials', focal)}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          {activeSlideType === 'cta' && (
            <div className="space-y-3">
              <FieldInput label="Headline" value={brandData.ctaHeadline ?? 'Join Our Mission'} onChange={(v) => updateBrandData({ ctaHeadline: v })} />
              <FieldTextarea label="Subheadline" value={brandData.ctaSubhead ?? ''} onChange={(v) => updateBrandData({ ctaSubhead: v })} rows={2} />
              <FieldInput label="Button Text" value={brandData.ctaButtonText ?? 'Donate Today'} onChange={(v) => updateBrandData({ ctaButtonText: v })} />
              <FieldInput label="Button URL" value={brandData.finalDonateUrl} onChange={(v) => updateBrandData({ finalDonateUrl: v })} type="url" />

              <div className="pt-2 border-t border-gray-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={brandData.showShareButtons !== false} onChange={(e) => updateBrandData({ showShareButtons: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#C15A36] focus:ring-[#C15A36]" />
                  <span className="text-sm text-gray-700">Show share buttons</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={brandData.showSocialLinks === true} onChange={(e) => updateBrandData({ showSocialLinks: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#C15A36] focus:ring-[#C15A36]" />
                  <span className="text-sm text-gray-700">Show social links</span>
                </label>

                {brandData.showSocialLinks && (
                  <div className="space-y-2 pt-2">
                    {(brandData.socialLinks || []).map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <select value={link.platform} onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900">
                          {SOCIAL_PLATFORMS.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                        </select>
                        <input type="url" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900" />
                        <button onClick={() => handleRemoveSocialLink(index)} className="p-1.5 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(brandData.socialLinks?.length || 0) < 6 && (
                      <button onClick={handleAddSocialLink} className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1"><Plus className="w-3 h-3" /> Add Link</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Tool Rail */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1">
        <ToolButton icon={<Palette className="w-5 h-5" />} label="Colors" active={activeTool === 'colors'} onClick={() => setActiveTool(activeTool === 'colors' ? null : 'colors')} />
        <ToolButton icon={<Type className="w-5 h-5" />} label="Fonts" active={activeTool === 'fonts'} onClick={() => setActiveTool(activeTool === 'fonts' ? null : 'fonts')} />
        <ToolButton icon={<LayoutGrid className="w-5 h-5" />} label="Logo" active={activeTool === 'logo'} onClick={() => setActiveTool(activeTool === 'logo' ? null : 'logo')} />
        <ToolButton icon={<Layers className="w-5 h-5" />} label="Slides" active={activeTool === 'slides'} onClick={() => setActiveTool(activeTool === 'slides' ? null : 'slides')} />
      </div>

      {/* Expandable Tool Panel */}
      {activeTool && renderToolPanel()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                if (confirm('You have unsaved changes. Leave anyway?')) router.push('/dashboard');
              } else {
                router.push('/dashboard');
              }
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            {successMessage && <span className="text-xs text-green-600">{successMessage}</span>}

            {hasUnsavedChanges && (
              <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700">
                Reset
              </button>
            )}

            <div className="relative group">
              <button
                onClick={canSave ? handleSave : undefined}
                disabled={saving || !hasUnsavedChanges || !canSave}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !canSave
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : hasUnsavedChanges
                      ? 'bg-[#C15A36] hover:bg-[#a84d2e] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              {!canSave && (
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                  <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap">
                    <a href="/pricing" className="text-[#C15A36] hover:underline font-medium">Upgrade</a> to save changes
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview + Slide Content */}
        <div className="flex-1 flex overflow-hidden bg-[#141414]">
          {/* Preview - shifted left, scaled to fit */}
          <div className="w-[340px] flex-shrink-0 p-4 flex items-center justify-center">
            <div className="w-full h-full max-h-[calc(100vh-120px)]">
              <PreviewFrame html={previewHtml} deckUrl={deckUrl} />
            </div>
          </div>

          {/* Slide Content Panel (Bento Box) - auto-sized to content */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {renderSlideContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tool Button Component
function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-violet-100 text-violet-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="text-[9px] mt-0.5 font-medium">{label}</span>
    </button>
  );
}

// Field Components (Light Mode)
function FieldInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] transition-colors"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] transition-colors resize-none"
      />
    </div>
  );
}

function ArrayField({ label, values, onItemChange, onAdd, onRemove, maxItems }: { label: string; values: string[]; onItemChange: (index: number, value: string) => void; onAdd: () => void; onRemove: (index: number) => void; maxItems: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {values.length < maxItems && (
          <button onClick={onAdd} className="text-xs text-[#C15A36] hover:text-[#a84d2e] flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      <div className="space-y-2">
        {values.slice(0, maxItems).map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onItemChange(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
            />
            {values.length > 1 && (
              <button onClick={() => onRemove(index)} className="p-2 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
