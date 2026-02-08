'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save, Loader2, Plus, X, Eye, EyeOff, GripVertical, Upload,
  Palette, Type, Image as ImageIcon, Layers, ChevronRight, ExternalLink
} from 'lucide-react';
import { SlideImageUploader } from '@/components/editor/slide-image-uploader';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import { HEADING_FONTS, BODY_FONTS } from '@/lib/editor-utils';
import type { BrandData, Testimonial, SocialLink, CustomImages, FocalPoint } from '@/lib/types';

// Tool categories for the left rail
type ToolCategory = 'design' | 'slides' | null;

// Slide configuration
const SLIDE_TYPES = ['hero', 'mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'] as const;
type SlideType = typeof SLIDE_TYPES[number];

const SLIDE_NAMES: Record<SlideType, string> = {
  hero: 'Hero',
  mission: 'Mission',
  challenge: 'Challenge',
  programs: 'Programs',
  metrics: 'Metrics',
  testimonials: 'Testimonials',
  cta: 'Call to Action',
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI state
  const [activeTool, setActiveTool] = useState<ToolCategory>(null);
  const [activeSlideType, setActiveSlideType] = useState<SlideType>('hero');

  // Data state
  const [orgName, setOrgName] = useState<string>('');
  const [deckSlug, setDeckSlug] = useState<string>('');
  const [deckUrl, setDeckUrl] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [originalBrandData, setOriginalBrandData] = useState<BrandData | null>(null);
  const [hasMetricsSlide, setHasMetricsSlide] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [canSave, setCanSave] = useState(false);

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

        setOrgName(data.orgName || 'Organization');
        setDeckSlug(data.slug);
        setDeckUrl(data.deckUrl);
        setBrandData(data.brandData);
        setOriginalBrandData(JSON.parse(JSON.stringify(data.brandData)));
        setHasMetricsSlide(data.brandData.hasValidMetrics && data.brandData.metrics?.length > 0);
        setUserPlan(data.userPlan || 'free');
        setCanSave(data.canSave !== false);
      } catch {
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
    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Handle color changes
  const handleColorChange = useCallback((colorType: 'primary' | 'secondary' | 'accent' | 'text', value: string) => {
    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, colors: { ...prev.colors, [colorType]: value } };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Handle font changes
  const handleFontChange = useCallback((fontType: 'headingFont' | 'bodyFont', value: string) => {
    setBrandData((prev) => {
      if (!prev) return prev;
      return { ...prev, fonts: { ...prev.fonts, [fontType]: value } };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Handle logo changes
  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload/logo', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      updateBrandData({ logoUrl: data.url, logoSource: 'custom' });
    } catch {
      setError('Failed to upload logo');
    }
  };

  // Handle custom image changes
  const handleCustomImageChange = useCallback((slideType: 'hero' | 'mission' | 'programs' | 'testimonials', url: string) => {
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
  }, []);

  // Handle focal point changes
  const handleFocalPointChange = useCallback((slideType: 'hero' | 'mission' | 'programs' | 'testimonials', focal: FocalPoint) => {
    const focalKey = `${slideType}Focal` as keyof CustomImages;
    setBrandData((prev) => {
      if (!prev) return prev;
      const customImages = { ...(prev.customImages || {}) };
      (customImages as Record<string, FocalPoint>)[focalKey] = focal;
      return { ...prev, customImages };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string | string[] | boolean) => {
    setBrandData((prev) => {
      if (!prev) return prev;
      if (field === 'needHeadline') return { ...prev, need: { ...prev.need, headline: value as string } };
      if (field === 'needDescription') return { ...prev, need: { ...prev.need, description: value as string } };
      return { ...prev, [field]: value };
    });
    setHasUnsavedChanges(true);
  }, []);

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
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload/logo', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      handleTestimonialChange(index, 'portrait', data.url);
    } catch {
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

  // Slide visibility
  const toggleSlideVisibility = (slideKey: 'showMissionSlide' | 'showChallengeSlide' | 'showProgramsSlide' | 'showTestimonialsSlide' | 'showCtaSlide') => {
    if (!brandData) return;
    const currentValue = brandData[slideKey] !== false;
    updateBrandData({ [slideKey]: !currentValue });
  };

  // Get visible slides
  const getVisibleSlides = useCallback(() => {
    if (!brandData) return [];
    const slides: { type: SlideType; index: number }[] = [{ type: 'hero', index: 0 }];
    let idx = 1;
    const order = brandData.slideOrder || ['mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'];

    for (const slideId of order) {
      if (slideId === 'mission' && brandData.showMissionSlide !== false) { slides.push({ type: 'mission', index: idx++ }); }
      else if (slideId === 'challenge' && brandData.showChallengeSlide !== false) { slides.push({ type: 'challenge', index: idx++ }); }
      else if (slideId === 'programs' && brandData.showProgramsSlide !== false) { slides.push({ type: 'programs', index: idx++ }); }
      else if (slideId === 'metrics' && hasMetricsSlide) { slides.push({ type: 'metrics', index: idx++ }); }
      else if (slideId === 'testimonials' && brandData.showTestimonialsSlide !== false) { slides.push({ type: 'testimonials', index: idx++ }); }
      else if (slideId === 'cta' && brandData.showCtaSlide !== false) { slides.push({ type: 'cta', index: idx++ }); }
    }
    return slides;
  }, [brandData, hasMetricsSlide]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    if (!brandData || !deckSlug) return '';
    return generateDeckHtml(deckSlug, brandData, { hideDonorSparkSlide: userPlan !== 'free' });
  }, [brandData, deckSlug, userPlan]);

  // Scroll to active slide when it changes
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;

    // Wait a tick for the iframe to load/update
    const timer = setTimeout(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const slideElement = iframeDoc.getElementById(`slide-${activeSlideType}`);
        if (slideElement) {
          slideElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      } catch {
        // Cross-origin restrictions may apply
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeSlideType, previewHtml]);

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
      setSuccessMessage('Saved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C15A36] animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !brandData) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-400">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Unable to Edit Deck</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const visibleSlides = getVisibleSlides();

  return (
    <div className="h-screen bg-[#09090b] text-zinc-400 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b] z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <div className="w-7 h-7 rounded bg-[#C15A36] text-white flex items-center justify-center font-bold text-sm">
              D
            </div>
            <span className="text-sm font-medium text-zinc-300">DonorSpark</span>
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          <span className="text-sm text-zinc-300">{orgName}</span>
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          {successMessage && <span className="text-xs text-green-400">{successMessage}</span>}

          {deckUrl && (
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
          )}

          <div className="relative group">
            <button
              onClick={canSave ? handleSave : undefined}
              disabled={saving || !hasUnsavedChanges || !canSave}
              className={`h-8 px-4 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                !canSave
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : hasUnsavedChanges
                    ? 'bg-white hover:bg-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
            {!canSave && (
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                <div className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap border border-zinc-700">
                  <a href="/pricing" className="text-[#C15A36] hover:underline font-medium">Upgrade</a> to save changes
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Tools */}
        <aside className="w-16 border-r border-zinc-800 flex flex-col items-center py-4 gap-2 bg-[#09090b] flex-shrink-0">
          <ToolButton
            icon={<Palette className="w-5 h-5" />}
            label="Design"
            active={activeTool === 'design'}
            onClick={() => setActiveTool(activeTool === 'design' ? null : 'design')}
          />
          <ToolButton
            icon={<Layers className="w-5 h-5" />}
            label="Slides"
            active={activeTool === 'slides'}
            onClick={() => setActiveTool(activeTool === 'slides' ? null : 'slides')}
          />
        </aside>

        {/* Expandable Tool Panel */}
        {activeTool && brandData && (
          <aside className="w-72 border-r border-zinc-800 bg-[#09090b] overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-zinc-800 sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
              <h2 className="text-sm font-semibold text-white">
                {activeTool === 'design' ? 'Design' : 'Slides'}
              </h2>
            </div>

            {activeTool === 'design' && (
              <div className="p-4 space-y-6">
                {/* Colors */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-3">Colors</label>
                  <div className="space-y-3">
                    <ColorInput label="Background" value={brandData.colors.primary} onChange={(v) => handleColorChange('primary', v)} />
                    <ColorInput label="Text" value={brandData.colors.text || '#ffffff'} onChange={(v) => handleColorChange('text', v)} />
                    <ColorInput label="Accent" value={brandData.colors.accent} onChange={(v) => handleColorChange('accent', v)} />
                    <ColorInput label="Button" value={brandData.colors.secondary} onChange={(v) => handleColorChange('secondary', v)} />
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-3">Typography</label>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-zinc-400 block mb-1">Heading Font</span>
                      <select
                        value={brandData.fonts.headingFont}
                        onChange={(e) => handleFontChange('headingFont', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                      >
                        {HEADING_FONTS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 block mb-1">Body Font</span>
                      <select
                        value={brandData.fonts.bodyFont}
                        onChange={(e) => handleFontChange('bodyFont', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                      >
                        {BODY_FONTS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-3">Logo</label>
                  {brandData.logoUrl ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                      <div className="w-full h-16 bg-white rounded flex items-center justify-center p-2 mb-2">
                        <img src={brandData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1 text-center cursor-pointer text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors">
                          Replace
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                        </label>
                        <button
                          onClick={() => updateBrandData({ logoUrl: null, logoSource: 'none' })}
                          className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block cursor-pointer border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg p-6 text-center transition-colors">
                      <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <span className="text-xs text-zinc-500">Click to upload logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTool === 'slides' && (
              <div className="p-4">
                <p className="text-xs text-zinc-500 mb-3">Drag to reorder, click eye to show/hide</p>
                <div className="space-y-1">
                  {/* Hero - always first */}
                  <div className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800 text-sm opacity-60">
                    <span className="text-zinc-400">Hero</span>
                    <Eye className="w-4 h-4 text-green-500" />
                  </div>
                  {/* Other slides */}
                  {(['mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'] as const).map((slideId) => {
                    if (slideId === 'metrics' && !hasMetricsSlide) return null;

                    // Metrics slide doesn't have a visibility toggle - it's based on hasMetricsSlide
                    const visibilityKeyMap: Record<string, 'showMissionSlide' | 'showChallengeSlide' | 'showProgramsSlide' | 'showTestimonialsSlide' | 'showCtaSlide'> = {
                      mission: 'showMissionSlide',
                      challenge: 'showChallengeSlide',
                      programs: 'showProgramsSlide',
                      testimonials: 'showTestimonialsSlide',
                      cta: 'showCtaSlide',
                    };
                    const visibilityKey = slideId !== 'metrics' ? visibilityKeyMap[slideId] : undefined;

                    const isVisible = slideId === 'metrics' ? true : brandData[visibilityKey!] !== false;

                    return (
                      <div key={slideId} className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800 text-sm hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                          <span className="text-zinc-300">{SLIDE_NAMES[slideId]}</span>
                        </div>
                        {visibilityKey && (
                          <button
                            onClick={() => toggleSlideVisibility(visibilityKey)}
                            className={isVisible ? 'text-green-500 hover:text-green-400' : 'text-zinc-600 hover:text-zinc-500'}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Center: Canvas Area */}
        <section className="flex-1 bg-[#050505] relative flex flex-col overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Phone Preview */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <div
              className="relative w-[320px] h-[640px] bg-zinc-950 rounded-[2.5rem] overflow-hidden ring-1 ring-white/10"
              style={{ boxShadow: '0 0 0 8px #18181b, 0 20px 50px -10px rgba(0,0,0,0.5)' }}
            >
              {/* Dynamic Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-900 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <div className="w-8 h-1.5 rounded-full bg-zinc-800/50" />
              </div>

              {/* Iframe */}
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full bg-white"
                style={{ borderRadius: '2rem' }}
                title="Deck Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* Bottom: Slide Thumbnails */}
          <div className="h-32 border-t border-zinc-800 bg-[#09090b]/80 backdrop-blur p-3 overflow-x-auto flex items-center gap-3 flex-shrink-0">
            {visibleSlides.map(({ type, index }) => (
              <button
                key={type}
                onClick={() => setActiveSlideType(type)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg border-2 transition-all overflow-hidden relative group ${
                  activeSlideType === type
                    ? 'border-white ring-2 ring-white/20 scale-105'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {/* Mini slide preview */}
                <SlideThumbnail type={type} brandData={brandData!} />
                {/* Slide number badge */}
                <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  activeSlideType === type ? 'bg-white text-black' : 'bg-black/60 text-white'
                }`}>
                  {index + 1}
                </div>
                {/* Hover label */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white">{SLIDE_NAMES[type]}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Sidebar: Properties */}
        <aside className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-zinc-800 flex-shrink-0">
            <h2 className="text-sm font-semibold text-white">{SLIDE_NAMES[activeSlideType]}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Slide {visibleSlides.findIndex(s => s.type === activeSlideType) + 1} of {visibleSlides.length}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {brandData && (
              <SlideProperties
                slideType={activeSlideType}
                brandData={brandData}
                updateBrandData={updateBrandData}
                handleFieldChange={handleFieldChange}
                handleArrayItemChange={handleArrayItemChange}
                handleAddArrayItem={handleAddArrayItem}
                handleRemoveArrayItem={handleRemoveArrayItem}
                handleCustomImageChange={handleCustomImageChange}
                handleFocalPointChange={handleFocalPointChange}
                handleTestimonialChange={handleTestimonialChange}
                handleAddTestimonial={handleAddTestimonial}
                handleRemoveTestimonial={handleRemoveTestimonial}
                handleTestimonialPhotoUpload={handleTestimonialPhotoUpload}
                handleSocialLinkChange={handleSocialLinkChange}
                handleAddSocialLink={handleAddSocialLink}
                handleRemoveSocialLink={handleRemoveSocialLink}
              />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

// Tool Button Component
function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-11 flex flex-col items-center justify-center rounded-xl transition-all ${
        active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[9px] mt-0.5 font-medium">{label}</span>
    </button>
  );
}

// Color Input Component
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-700">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute -top-1 -left-1 w-[150%] h-[150%] cursor-pointer border-0 p-0"
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 w-16">{value}</span>
      </div>
    </div>
  );
}

// Slide Thumbnail Component - visual mini-preview of each slide type
function SlideThumbnail({ type, brandData }: { type: SlideType; brandData: BrandData }) {
  const primary = brandData.colors.primary || '#1a1a1a';
  const accent = brandData.colors.accent || '#C15A36';
  const text = brandData.colors.text || '#ffffff';
  const heroImage = brandData.customImages?.hero || brandData.images?.hero;
  const missionImage = brandData.customImages?.mission || brandData.images?.action;
  const programsImage = brandData.customImages?.programs || brandData.images?.group;
  const testimonialsImage = brandData.customImages?.testimonials || brandData.images?.action;

  // Hero slide thumbnail
  if (type === 'hero') {
    return (
      <div className="w-full h-full relative" style={{ backgroundColor: primary }}>
        {heroImage && <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-1.5 w-8 rounded mb-1" style={{ backgroundColor: accent }} />
          <div className="h-1 w-12 bg-white/80 rounded mb-0.5" />
          <div className="h-1 w-10 bg-white/60 rounded" />
        </div>
      </div>
    );
  }

  // Mission slide thumbnail
  if (type === 'mission') {
    return (
      <div className="w-full h-full relative" style={{ backgroundColor: primary }}>
        {missionImage && <img src={missionImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-2 flex flex-col justify-center">
          <div className="h-1 w-10 bg-white/80 rounded mb-1" />
          <div className="h-0.5 w-6 rounded mb-2" style={{ backgroundColor: accent }} />
          <div className="grid grid-cols-2 gap-1">
            <div className="h-3 rounded-sm bg-white/10" />
            <div className="h-3 rounded-sm bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // Challenge slide thumbnail
  if (type === 'challenge') {
    return (
      <div className="w-full h-full p-2 flex flex-col gap-1" style={{ backgroundColor: primary }}>
        <div className="flex-1 rounded-sm bg-white/10 p-1">
          <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: accent, opacity: 0.5 }} />
          <div className="h-0.5 w-8 bg-white/50 rounded" />
        </div>
        <div className="flex justify-center text-white/30 text-[6px]">↓</div>
        <div className="flex-1 rounded-sm p-1 border" style={{ borderColor: accent, backgroundColor: `${accent}15` }}>
          <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: accent }} />
          <div className="h-0.5 w-8 bg-white/50 rounded" />
        </div>
      </div>
    );
  }

  // Programs slide thumbnail
  if (type === 'programs') {
    return (
      <div className="w-full h-full relative" style={{ backgroundColor: primary }}>
        {programsImage && <img src={programsImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-2 flex flex-col justify-center">
          <div className="h-1 w-10 bg-white/80 rounded mb-2" />
          <div className="space-y-1">
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full" style={{ backgroundColor: accent }} /><div className="h-0.5 w-6 bg-white/50 rounded" /></div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full" style={{ backgroundColor: accent }} /><div className="h-0.5 w-8 bg-white/50 rounded" /></div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full" style={{ backgroundColor: accent }} /><div className="h-0.5 w-5 bg-white/50 rounded" /></div>
          </div>
        </div>
      </div>
    );
  }

  // Metrics slide thumbnail
  if (type === 'metrics') {
    return (
      <div className="w-full h-full p-2" style={{ backgroundColor: primary }}>
        <div className="grid grid-cols-2 gap-1 h-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-sm bg-white/10 p-1 flex flex-col items-center justify-center">
              <div className="text-[8px] font-bold" style={{ color: accent }}>##</div>
              <div className="h-0.5 w-4 bg-white/40 rounded mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Testimonials slide thumbnail
  if (type === 'testimonials') {
    return (
      <div className="w-full h-full relative" style={{ backgroundColor: primary }}>
        {testimonialsImage && <img src={testimonialsImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="w-12 h-14 bg-white rounded-sm shadow-lg p-1 transform rotate-[-3deg]">
            <div className="text-[6px] leading-tight" style={{ color: primary }}>&ldquo;...&rdquo;</div>
            <div className="mt-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neutral-300" />
              <div className="h-0.5 w-4 bg-neutral-300 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CTA slide thumbnail
  if (type === 'cta') {
    return (
      <div className="w-full h-full p-2 flex flex-col items-center justify-center" style={{ backgroundColor: primary }}>
        {brandData.logoUrl && <img src={brandData.logoUrl} alt="" className="w-8 h-4 object-contain mb-1 opacity-70" />}
        <div className="h-1 w-10 bg-white/80 rounded mb-1" />
        <div className="h-0.5 w-8 bg-white/50 rounded mb-2" />
        <div className="px-2 py-1 rounded text-[6px] font-bold" style={{ backgroundColor: brandData.colors.secondary || accent, color: text }}>
          CTA
        </div>
      </div>
    );
  }

  return <div className="w-full h-full" style={{ backgroundColor: primary }} />;
}

// Slide Properties Component
function SlideProperties({
  slideType,
  brandData,
  updateBrandData,
  handleFieldChange,
  handleArrayItemChange,
  handleAddArrayItem,
  handleRemoveArrayItem,
  handleCustomImageChange,
  handleFocalPointChange,
  handleTestimonialChange,
  handleAddTestimonial,
  handleRemoveTestimonial,
  handleTestimonialPhotoUpload,
  handleSocialLinkChange,
  handleAddSocialLink,
  handleRemoveSocialLink,
}: {
  slideType: SlideType;
  brandData: BrandData;
  updateBrandData: (updates: Partial<BrandData>) => void;
  handleFieldChange: (field: string, value: string | string[] | boolean) => void;
  handleArrayItemChange: (field: string, index: number, value: string, arr: string[]) => void;
  handleAddArrayItem: (field: string, arr: string[]) => void;
  handleRemoveArrayItem: (field: string, index: number, arr: string[]) => void;
  handleCustomImageChange: (slideType: 'hero' | 'mission' | 'programs' | 'testimonials', url: string) => void;
  handleFocalPointChange: (slideType: 'hero' | 'mission' | 'programs' | 'testimonials', focal: FocalPoint) => void;
  handleTestimonialChange: (index: number, field: keyof Testimonial, value: string) => void;
  handleAddTestimonial: () => void;
  handleRemoveTestimonial: (index: number) => void;
  handleTestimonialPhotoUpload: (index: number, file: File) => void;
  handleSocialLinkChange: (index: number, field: keyof SocialLink, value: string) => void;
  handleAddSocialLink: () => void;
  handleRemoveSocialLink: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      {slideType === 'hero' && (
        <>
          <FieldInput label="Badge Text" value={brandData.badgeText ?? 'Impact Deck'} onChange={(v) => updateBrandData({ badgeText: v })} />
          <FieldInput label="Headline" value={brandData.donorHeadline} onChange={(v) => handleFieldChange('donorHeadline', v)} />
          <FieldTextarea label="Hook" value={brandData.heroHook} onChange={(v) => handleFieldChange('heroHook', v)} rows={2} />
          <ImageSection slideType="hero" brandData={brandData} handleCustomImageChange={handleCustomImageChange} handleFocalPointChange={handleFocalPointChange} />
        </>
      )}

      {/* Mission */}
      {slideType === 'mission' && (
        <>
          <FieldInput label="Slide Title" value={brandData.missionSlideTitle ?? 'Our Mission'} onChange={(v) => updateBrandData({ missionSlideTitle: v })} />
          <FieldInput label="Headline" value={brandData.missionHeadline ?? 'Building A Better Future'} onChange={(v) => updateBrandData({ missionHeadline: v })} />
          <FieldTextarea label="Mission Statement" value={brandData.mission} onChange={(v) => handleFieldChange('mission', v)} rows={3} />
          <ArrayFieldDark label="Core Values" values={brandData.coreValues || []} onItemChange={(idx, val) => handleArrayItemChange('coreValues', idx, val, brandData.coreValues || [])} onAdd={() => handleAddArrayItem('coreValues', brandData.coreValues || [])} onRemove={(idx) => handleRemoveArrayItem('coreValues', idx, brandData.coreValues || [])} maxItems={4} />
          <ImageSection slideType="mission" brandData={brandData} handleCustomImageChange={handleCustomImageChange} handleFocalPointChange={handleFocalPointChange} />
        </>
      )}

      {/* Challenge */}
      {slideType === 'challenge' && (
        <>
          <FieldInput label="Slide Title" value={brandData.challengeSlideTitle ?? 'The Challenge'} onChange={(v) => updateBrandData({ challengeSlideTitle: v })} />
          <FieldInput label="Challenge Headline" value={brandData.need.headline} onChange={(v) => handleFieldChange('needHeadline', v)} />
          <FieldTextarea label="Challenge Description" value={brandData.need.description} onChange={(v) => handleFieldChange('needDescription', v)} rows={2} />
          <FieldInput label="Solution Headline" value={brandData.solutionHeadline ?? 'Our Solution'} onChange={(v) => updateBrandData({ solutionHeadline: v })} />
          <FieldTextarea label="Solution Description" value={brandData.solution} onChange={(v) => handleFieldChange('solution', v)} rows={2} />
        </>
      )}

      {/* Programs */}
      {slideType === 'programs' && (
        <>
          <FieldInput label="Headline" value={brandData.programsHeadline ?? 'What We Offer'} onChange={(v) => updateBrandData({ programsHeadline: v })} />
          <FieldTextarea label="Description" value={brandData.programsBody ?? ''} onChange={(v) => updateBrandData({ programsBody: v })} rows={2} />
          <ArrayFieldDark label="Programs" values={brandData.programs || []} onItemChange={(idx, val) => handleArrayItemChange('programs', idx, val, brandData.programs || [])} onAdd={() => handleAddArrayItem('programs', brandData.programs || [])} onRemove={(idx) => handleRemoveArrayItem('programs', idx, brandData.programs || [])} maxItems={6} />
          <ImageSection slideType="programs" brandData={brandData} handleCustomImageChange={handleCustomImageChange} handleFocalPointChange={handleFocalPointChange} />
        </>
      )}

      {/* Metrics */}
      {slideType === 'metrics' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Impact Metrics</span>
            {(brandData.metrics?.length || 0) < 5 && (
              <button onClick={() => updateBrandData({ metrics: [...(brandData.metrics || []), { value: '', label: '' }], hasValidMetrics: true })} className="text-xs text-[#C15A36] hover:text-[#e07050] flex items-center gap-1">
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
                className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600"
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
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
              <button onClick={() => updateBrandData({ metrics: (brandData.metrics || []).filter((_, i) => i !== index), hasValidMetrics: (brandData.metrics || []).length > 1 })} className="p-1.5 text-zinc-600 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </>
      )}

      {/* Testimonials */}
      {slideType === 'testimonials' && (
        <>
          <FieldInput label="Slide Title" value={brandData.testimonialsSlideTitle ?? 'Success Stories'} onChange={(v) => updateBrandData({ testimonialsSlideTitle: v })} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Testimonials</span>
            {(brandData.testimonials?.length || 0) < 5 && (
              <button onClick={handleAddTestimonial} className="text-xs text-[#C15A36] hover:text-[#e07050] flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
          {(brandData.testimonials || []).map((testimonial, index) => (
            <div key={index} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-zinc-500">#{index + 1}</span>
                <button onClick={() => handleRemoveTestimonial(index)} className="text-zinc-600 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <textarea
                value={testimonial.quote}
                onChange={(e) => handleTestimonialChange(index, 'quote', e.target.value)}
                placeholder="Quote..."
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-zinc-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={testimonial.author} onChange={(e) => handleTestimonialChange(index, 'author', e.target.value)} placeholder="Name" className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
                <input type="text" value={testimonial.role} onChange={(e) => handleTestimonialChange(index, 'role', e.target.value)} placeholder="Title" className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="flex items-center gap-2">
                <input type="text" value={testimonial.portrait || ''} onChange={(e) => handleTestimonialChange(index, 'portrait', e.target.value)} placeholder="Photo URL" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600" />
                <label className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded cursor-pointer">
                  <Upload className="w-3 h-3 text-zinc-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleTestimonialPhotoUpload(index, file); }} />
                </label>
              </div>
            </div>
          ))}
          <ImageSection slideType="testimonials" brandData={brandData} handleCustomImageChange={handleCustomImageChange} handleFocalPointChange={handleFocalPointChange} />
        </>
      )}

      {/* CTA */}
      {slideType === 'cta' && (
        <>
          <FieldInput label="Headline" value={brandData.ctaHeadline ?? 'Join Our Mission'} onChange={(v) => updateBrandData({ ctaHeadline: v })} />
          <FieldTextarea label="Subheadline" value={brandData.ctaSubhead ?? ''} onChange={(v) => updateBrandData({ ctaSubhead: v })} rows={2} />
          <FieldInput label="Button Text" value={brandData.ctaButtonText ?? 'Donate Today'} onChange={(v) => updateBrandData({ ctaButtonText: v })} />
          <FieldInput label="Button URL" value={brandData.finalDonateUrl} onChange={(v) => updateBrandData({ finalDonateUrl: v })} />

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={brandData.showShareButtons !== false} onChange={(e) => updateBrandData({ showShareButtons: e.target.checked })} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#C15A36] focus:ring-[#C15A36]" />
              <span className="text-sm text-zinc-300">Show share buttons</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={brandData.showSocialLinks === true} onChange={(e) => updateBrandData({ showSocialLinks: e.target.checked })} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#C15A36] focus:ring-[#C15A36]" />
              <span className="text-sm text-zinc-300">Show social links</span>
            </label>

            {brandData.showSocialLinks && (
              <div className="space-y-2 pt-2">
                {(brandData.socialLinks || []).map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <select value={link.platform} onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white">
                      {SOCIAL_PLATFORMS.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                    <input type="url" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white" />
                    <button onClick={() => handleRemoveSocialLink(index)} className="p-1.5 text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {(brandData.socialLinks?.length || 0) < 6 && (
                  <button onClick={handleAddSocialLink} className="text-xs text-[#C15A36] hover:text-[#e07050] flex items-center gap-1"><Plus className="w-3 h-3" /> Add Link</button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Image Section Component
function ImageSection({
  slideType,
  brandData,
  handleCustomImageChange,
  handleFocalPointChange,
}: {
  slideType: 'hero' | 'mission' | 'programs' | 'testimonials';
  brandData: BrandData;
  handleCustomImageChange: (slideType: 'hero' | 'mission' | 'programs' | 'testimonials', url: string) => void;
  handleFocalPointChange: (slideType: 'hero' | 'mission' | 'programs' | 'testimonials', focal: FocalPoint) => void;
}) {
  const imageMap = { hero: brandData.images?.hero, mission: brandData.images?.action, programs: brandData.images?.group, testimonials: brandData.images?.action };
  const focalKey = `${slideType}Focal` as keyof CustomImages;

  return (
    <div className="pt-3 border-t border-zinc-800">
      <label className="text-xs text-zinc-400 block mb-2">Background Photo</label>
      <SlideImageUploader
        label={slideType.charAt(0).toUpperCase() + slideType.slice(1)}
        currentUrl={brandData.customImages?.[slideType]}
        defaultUrl={imageMap[slideType] || ''}
        slideType={slideType}
        focalPoint={brandData.customImages?.[focalKey] as FocalPoint | undefined}
        onChange={(url) => handleCustomImageChange(slideType, url)}
        onFocalPointChange={(focal) => handleFocalPointChange(slideType, focal)}
      />
    </div>
  );
}

// Dark Mode Field Components
function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors resize-none"
      />
    </div>
  );
}

function ArrayFieldDark({ label, values, onItemChange, onAdd, onRemove, maxItems }: { label: string; values: string[]; onItemChange: (index: number, value: string) => void; onAdd: () => void; onRemove: (index: number) => void; maxItems: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{label}</label>
        {values.length < maxItems && (
          <button onClick={onAdd} className="text-xs text-[#C15A36] hover:text-[#e07050] flex items-center gap-1">
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
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
            {values.length > 1 && (
              <button onClick={() => onRemove(index)} className="p-2 text-zinc-600 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
