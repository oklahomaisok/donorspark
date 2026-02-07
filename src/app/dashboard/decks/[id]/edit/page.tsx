'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Palette, Type, Image, FileText, MousePointer } from 'lucide-react';
import { ColorPicker } from '@/components/editor/color-picker';
import { FontSelector } from '@/components/editor/font-selector';
import { LogoUploader } from '@/components/editor/logo-uploader';
import { SlideCopyEditor } from '@/components/editor/slide-copy-editor';
import { CtaEditor } from '@/components/editor/cta-editor';
import { PreviewFrame } from '@/components/editor/preview-frame';
import { generateDeckHtml } from '@/lib/templates/deck-template';
import type { BrandData } from '@/lib/types';

type EditorSection = 'colors' | 'fonts' | 'logo' | 'copy' | 'cta';

export default function EditDeckPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<EditorSection>('colors');

  const [deckSlug, setDeckSlug] = useState<string>('');
  const [deckUrl, setDeckUrl] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [originalBrandData, setOriginalBrandData] = useState<BrandData | null>(null);

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

  // Handle copy changes
  const handleCopyChange = useCallback((field: string, value: string) => {
    if (!brandData) return;

    setBrandData((prev) => {
      if (!prev) return prev;

      if (field === 'needHeadline') {
        return { ...prev, need: { ...prev.need, headline: value } };
      }
      if (field === 'needDescription') {
        return { ...prev, need: { ...prev.need, description: value } };
      }

      return { ...prev, [field]: value };
    });
    setHasUnsavedChanges(true);
  }, [brandData]);

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

  const sections: { id: EditorSection; label: string; icon: React.ReactNode }[] = [
    { id: 'colors', label: 'Colors', icon: <Palette className="w-4 h-4" /> },
    { id: 'fonts', label: 'Fonts', icon: <Type className="w-4 h-4" /> },
    { id: 'logo', label: 'Logo', icon: <Image className="w-4 h-4" /> },
    { id: 'copy', label: 'Copy', icon: <FileText className="w-4 h-4" /> },
    { id: 'cta', label: 'CTA', icon: <MousePointer className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Editor Panel */}
      <div className="w-[400px] flex-shrink-0 border-r border-neutral-800 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between mb-3">
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

          {/* Section Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${activeSection === section.id
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                  }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
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
        <div className="flex-1 overflow-y-auto p-4">
          {brandData && (
            <>
              {activeSection === 'colors' && (
                <div className="space-y-4">
                  <ColorPicker
                    label="Primary Color"
                    value={brandData.colors.primary}
                    onChange={(v) => handleColorChange('primary', v)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    value={brandData.colors.secondary}
                    onChange={(v) => handleColorChange('secondary', v)}
                  />
                  <ColorPicker
                    label="Accent Color"
                    value={brandData.colors.accent}
                    onChange={(v) => handleColorChange('accent', v)}
                  />
                </div>
              )}

              {activeSection === 'fonts' && (
                <div className="space-y-4">
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
              )}

              {activeSection === 'logo' && (
                <LogoUploader
                  currentLogoUrl={brandData.logoUrl}
                  onUpload={handleLogoChange}
                  onRemove={handleLogoRemove}
                />
              )}

              {activeSection === 'copy' && (
                <SlideCopyEditor
                  donorHeadline={brandData.donorHeadline}
                  heroHook={brandData.heroHook}
                  mission={brandData.mission}
                  needHeadline={brandData.need.headline}
                  needDescription={brandData.need.description}
                  solution={brandData.solution}
                  onChange={handleCopyChange}
                />
              )}

              {activeSection === 'cta' && (
                <CtaEditor
                  donateUrl={brandData.finalDonateUrl}
                  accentColor={brandData.colors.accent}
                  onDonateUrlChange={(url) => updateBrandData({ finalDonateUrl: url })}
                  onAccentColorChange={(color) => handleColorChange('accent', color)}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <p className="text-xs text-neutral-500 text-center">
            Changes are previewed in real-time. Click "Save Changes" to update your live deck.
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
