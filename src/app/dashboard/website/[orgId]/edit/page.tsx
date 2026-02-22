'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BrandData, WebsiteData } from '@/lib/types';
import { generateSiteHtml } from '@/lib/templates/site-template';
import { PhotoLibrary } from '@/components/editor/photo-library';

type SectionId = 'hero' | 'about' | 'challenge' | 'programs' | 'metrics' | 'testimonials' | 'cta' | 'footer';

const SECTION_SCROLL_MAP: Record<SectionId, string | null> = {
  hero: null, // scroll to top
  about: 'about',
  challenge: 'challenge',
  programs: 'programs',
  metrics: 'impact',
  testimonials: 'testimonials',
  cta: 'contact',
  footer: null, // scroll to bottom
};

export default function WebsiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('hero');
  const [photoLibraryTarget, setPhotoLibraryTarget] = useState<'hero' | 'about' | null>(null);

  // Load website data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/website/${orgId}`);
        if (!res.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await res.json();
        setOrgName(data.orgName);
        setOrgSlug(data.orgSlug);
        setBrandData(data.brandData || null);
        setWebsiteData(data.websiteData || {});
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgId, router]);

  const updateField = useCallback((field: keyof WebsiteData, value: unknown) => {
    setWebsiteData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Generate preview HTML via srcDoc
  const previewHtml = useMemo(() => {
    if (!brandData || !orgSlug) return '';
    return generateSiteHtml(orgSlug, brandData, websiteData);
  }, [brandData, websiteData, orgSlug]);

  // Scroll iframe to section when expanded
  useEffect(() => {
    if (!expandedSection) return;
    const timer = setTimeout(() => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      if (expandedSection === 'hero') {
        doc.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (expandedSection === 'footer') {
        doc.documentElement.scrollTo({ top: doc.documentElement.scrollHeight, behavior: 'smooth' });
      } else {
        const sectionAnchor = SECTION_SCROLL_MAP[expandedSection];
        if (sectionAnchor) {
          const el = doc.getElementById(sectionAnchor);
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [expandedSection]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/website/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteData }),
      });
      if (res.ok) {
        setHasChanges(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id: SectionId) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C15A36]"></div>
      </div>
    );
  }

  const websiteUrl = `/s/${orgSlug}/site`;

  // Derive effective values for placeholders
  const bd = brandData;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-800">Edit Website</h1>
            <p className="text-xs text-neutral-500">{orgName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" x2="21" y1="14" y2="3"/>
            </svg>
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2 bg-[#C15A36] text-white rounded-lg text-sm font-semibold hover:bg-[#a84d2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-96 bg-white border-r border-neutral-200 overflow-y-auto flex-shrink-0">
          <div className="divide-y divide-neutral-100">
            {/* Hero Section */}
            <AccordionSection
              id="hero"
              title="Hero"
              expanded={expandedSection === 'hero'}
              onToggle={() => toggleSection('hero')}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Headline"
                  value={websiteData.heroHeadline || ''}
                  onChange={v => updateField('heroHeadline', v)}
                  placeholder={bd?.donorHeadline || 'Main hero headline...'}
                />
                <FieldInput
                  label="Subheadline"
                  value={websiteData.heroSubheadline || ''}
                  onChange={v => updateField('heroSubheadline', v)}
                  placeholder={bd?.heroHook || 'Supporting text...'}
                />
                <ImageField
                  label="Hero Image"
                  currentUrl={websiteData.heroImage}
                  onChangeClick={() => setPhotoLibraryTarget('hero')}
                  onClear={() => updateField('heroImage', undefined)}
                />
              </div>
            </AccordionSection>

            {/* About Section */}
            <AccordionSection
              id="about"
              title="About"
              expanded={expandedSection === 'about'}
              onToggle={() => toggleSection('about')}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Section Title"
                  value={websiteData.aboutTitle || ''}
                  onChange={v => updateField('aboutTitle', v)}
                  placeholder="Our Mission"
                />
                <FieldTextarea
                  label="Mission Text"
                  value={websiteData.aboutText || ''}
                  onChange={v => updateField('aboutText', v)}
                  placeholder={bd?.mission || 'Your organization\'s mission...'}
                  rows={4}
                />
                <ListEditor
                  label="Core Values"
                  items={websiteData.coreValues || bd?.coreValues || []}
                  onChange={v => updateField('coreValues', v)}
                  placeholder="Add a core value..."
                />
                <ImageField
                  label="About Image"
                  currentUrl={websiteData.aboutImage}
                  onChangeClick={() => setPhotoLibraryTarget('about')}
                  onClear={() => updateField('aboutImage', undefined)}
                />
              </div>
            </AccordionSection>

            {/* Challenge & Solution */}
            <AccordionSection
              id="challenge"
              title="Challenge & Solution"
              expanded={expandedSection === 'challenge'}
              onToggle={() => toggleSection('challenge')}
              toggle={{
                checked: websiteData.showChallenge !== false,
                onChange: v => updateField('showChallenge', v),
              }}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Challenge Headline"
                  value={websiteData.challengeHeadline || ''}
                  onChange={v => updateField('challengeHeadline', v)}
                  placeholder={bd?.need?.headline || 'Communities Need Support'}
                />
                <FieldTextarea
                  label="Challenge Description"
                  value={websiteData.challengeDescription || ''}
                  onChange={v => updateField('challengeDescription', v)}
                  placeholder={bd?.need?.description || 'Describe the challenge...'}
                  rows={3}
                />
                <FieldTextarea
                  label="Solution Text"
                  value={websiteData.solutionText || ''}
                  onChange={v => updateField('solutionText', v)}
                  placeholder={bd?.solution || 'Describe your solution...'}
                  rows={3}
                />
              </div>
            </AccordionSection>

            {/* Programs */}
            <AccordionSection
              id="programs"
              title="Programs"
              expanded={expandedSection === 'programs'}
              onToggle={() => toggleSection('programs')}
              toggle={{
                checked: websiteData.showPrograms !== false,
                onChange: v => updateField('showPrograms', v),
              }}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Section Title"
                  value={websiteData.programsTitle || ''}
                  onChange={v => updateField('programsTitle', v)}
                  placeholder="What We Offer"
                />
                <ListEditor
                  label="Programs"
                  items={websiteData.programs || bd?.programs || []}
                  onChange={v => updateField('programs', v)}
                  placeholder="Add a program..."
                />
              </div>
            </AccordionSection>

            {/* Impact Metrics */}
            <AccordionSection
              id="metrics"
              title="Impact Metrics"
              expanded={expandedSection === 'metrics'}
              onToggle={() => toggleSection('metrics')}
              toggle={{
                checked: websiteData.showMetrics !== false,
                onChange: v => updateField('showMetrics', v),
              }}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Section Title"
                  value={websiteData.metricsTitle || ''}
                  onChange={v => updateField('metricsTitle', v)}
                  placeholder="By The Numbers"
                />
                <MetricsEditor
                  metrics={websiteData.metrics || bd?.metrics || []}
                  onChange={v => updateField('metrics', v)}
                />
              </div>
            </AccordionSection>

            {/* Testimonials */}
            <AccordionSection
              id="testimonials"
              title="Testimonials"
              expanded={expandedSection === 'testimonials'}
              onToggle={() => toggleSection('testimonials')}
              toggle={{
                checked: websiteData.showTestimonials !== false,
                onChange: v => updateField('showTestimonials', v),
              }}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Section Title"
                  value={websiteData.testimonialsTitle || ''}
                  onChange={v => updateField('testimonialsTitle', v)}
                  placeholder="Success Stories"
                />
                <TestimonialsEditor
                  testimonials={websiteData.testimonials || bd?.testimonials?.map(t => ({ quote: t.quote, author: t.author, role: t.role, portrait: t.portrait })) || []}
                  onChange={v => updateField('testimonials', v)}
                />
              </div>
            </AccordionSection>

            {/* Call to Action */}
            <AccordionSection
              id="cta"
              title="Call to Action"
              expanded={expandedSection === 'cta'}
              onToggle={() => toggleSection('cta')}
            >
              <div className="space-y-3">
                <FieldInput
                  label="CTA Headline"
                  value={websiteData.ctaHeadline || ''}
                  onChange={v => updateField('ctaHeadline', v)}
                  placeholder="Join Our Mission"
                />
                <FieldInput
                  label="Subtext"
                  value={websiteData.ctaSubtext || ''}
                  onChange={v => updateField('ctaSubtext', v)}
                  placeholder="Your support helps us continue making a difference..."
                />
                <FieldInput
                  label="Button Text"
                  value={websiteData.ctaButtonText || ''}
                  onChange={v => updateField('ctaButtonText', v)}
                  placeholder="Donate Today"
                />
                <FieldInput
                  label="Button URL"
                  value={websiteData.ctaButtonUrl || ''}
                  onChange={v => updateField('ctaButtonUrl', v)}
                  placeholder={bd?.finalDonateUrl || 'https://donate.example.com'}
                  type="url"
                />
                <FieldInput
                  label="Contact Email"
                  value={websiteData.contactEmail || ''}
                  onChange={v => updateField('contactEmail', v)}
                  placeholder={bd?.contactEmail || 'contact@example.com'}
                  type="email"
                />
              </div>
            </AccordionSection>

            {/* Footer */}
            <AccordionSection
              id="footer"
              title="Footer"
              expanded={expandedSection === 'footer'}
              onToggle={() => toggleSection('footer')}
            >
              <div className="space-y-3">
                <FieldInput
                  label="Footer Text"
                  value={websiteData.footerText || ''}
                  onChange={v => updateField('footerText', v)}
                  placeholder="Optional footer message..."
                />
              </div>
            </AccordionSection>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full"
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* Photo Library Modal */}
      {photoLibraryTarget && (
        <PhotoLibrary
          isOpen={true}
          onClose={() => setPhotoLibraryTarget(null)}
          onSelect={(url) => {
            updateField(photoLibraryTarget === 'hero' ? 'heroImage' : 'aboutImage', url || undefined);
            setPhotoLibraryTarget(null);
          }}
          currentUrl={photoLibraryTarget === 'hero' ? websiteData.heroImage : websiteData.aboutImage}
          slideType={photoLibraryTarget === 'hero' ? 'hero' : 'mission'}
        />
      )}
    </div>
  );
}

// --- Accordion Section ---

function AccordionSection({
  id,
  title,
  expanded,
  onToggle,
  toggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  toggle?: { checked: boolean; onChange: (v: boolean) => void };
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">{title}</span>
        </div>
        {toggle && (
          <div
            onClick={e => { e.stopPropagation(); toggle.onChange(!toggle.checked); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              toggle.checked ? 'bg-[#C15A36]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                toggle.checked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-6 pb-5">
          {children}
        </div>
      )}
    </div>
  );
}

// --- Field Components ---

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
      />
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
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] resize-none"
      />
    </div>
  );
}

function ImageField({
  label,
  currentUrl,
  onChangeClick,
  onClear,
}: {
  label: string;
  currentUrl?: string;
  onChangeClick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">{label}</label>
      {currentUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-neutral-200">
          <img src={currentUrl} alt="" className="w-full h-24 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={onChangeClick}
              className="px-3 py-1.5 text-xs font-medium bg-white text-neutral-800 rounded-lg hover:bg-neutral-100"
            >
              Change
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onChangeClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm border-2 border-dashed border-neutral-200 rounded-lg text-neutral-500 hover:border-[#C15A36] hover:text-[#C15A36] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          Choose Image
        </button>
      )}
    </div>
  );
}

// --- List Editor (for core values, programs) ---

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">{label}</label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
            />
            <button
              onClick={() => removeItem(i)}
              className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
        />
        <button
          onClick={addItem}
          className="p-1.5 text-[#C15A36] hover:bg-[#C15A36]/10 rounded-lg transition-colors"
          title="Add"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// --- Metrics Editor ---

function MetricsEditor({
  metrics,
  onChange,
}: {
  metrics: { value: string; label: string }[];
  onChange: (metrics: { value: string; label: string }[]) => void;
}) {
  const addMetric = () => {
    onChange([...metrics, { value: '', label: '' }]);
  };

  const removeMetric = (index: number) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: 'value' | 'label', val: string) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">Metrics</label>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <div className="flex-1 flex gap-1.5">
              <input
                type="text"
                value={m.value}
                onChange={e => updateMetric(i, 'value', e.target.value)}
                placeholder="500+"
                className="w-24 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
              />
              <input
                type="text"
                value={m.label}
                onChange={e => updateMetric(i, 'label', e.target.value)}
                placeholder="People Served"
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
              />
            </div>
            <button
              onClick={() => removeMetric(i)}
              className="p-1.5 mt-0.5 text-neutral-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addMetric}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#C15A36] hover:text-[#a84d2e] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        Add Metric
      </button>
    </div>
  );
}

// --- Testimonials Editor ---

function TestimonialsEditor({
  testimonials,
  onChange,
}: {
  testimonials: { quote: string; author: string; role: string; portrait?: string }[];
  onChange: (testimonials: { quote: string; author: string; role: string; portrait?: string }[]) => void;
}) {
  const addTestimonial = () => {
    onChange([...testimonials, { quote: '', author: '', role: '' }]);
  };

  const removeTestimonial = (index: number) => {
    onChange(testimonials.filter((_, i) => i !== index));
  };

  const updateTestimonial = (index: number, field: string, val: string) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">Testimonials</label>
      <div className="space-y-3">
        {testimonials.map((t, i) => (
          <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">#{i + 1}</span>
              <button
                onClick={() => removeTestimonial(i)}
                className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <textarea
              value={t.quote}
              onChange={e => updateTestimonial(i, 'quote', e.target.value)}
              placeholder="Quote text..."
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] resize-none"
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                value={t.author}
                onChange={e => updateTestimonial(i, 'author', e.target.value)}
                placeholder="Author name"
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
              />
              <input
                type="text"
                value={t.role}
                onChange={e => updateTestimonial(i, 'role', e.target.value)}
                placeholder="Role/Title"
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addTestimonial}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#C15A36] hover:text-[#a84d2e] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        Add Testimonial
      </button>
    </div>
  );
}
