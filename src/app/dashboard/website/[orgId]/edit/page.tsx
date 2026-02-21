'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { WebsiteData } from '@/lib/types';

export default function WebsiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [websiteData, setWebsiteData] = useState<WebsiteData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

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
        setWebsiteData(data.websiteData || {});
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgId, router]);

  const updateField = useCallback((field: keyof WebsiteData, value: string | boolean) => {
    setWebsiteData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

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
        setPreviewKey(prev => prev + 1);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C15A36]"></div>
      </div>
    );
  }

  const websiteUrl = `/s/${orgSlug}/site`;

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
          <div className="p-6 space-y-6">
            {/* Hero Section */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-3 uppercase tracking-wider">Hero</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Headline</label>
                  <input
                    type="text"
                    value={websiteData.heroHeadline || ''}
                    onChange={e => updateField('heroHeadline', e.target.value)}
                    placeholder="Main hero headline..."
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Subheadline</label>
                  <input
                    type="text"
                    value={websiteData.heroSubheadline || ''}
                    onChange={e => updateField('heroSubheadline', e.target.value)}
                    placeholder="Supporting text..."
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* About Section */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-3 uppercase tracking-wider">About</h3>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Mission Text</label>
                <textarea
                  value={websiteData.aboutText || ''}
                  onChange={e => updateField('aboutText', e.target.value)}
                  placeholder="Your organization's mission..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36] resize-none"
                />
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Section Visibility */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-3 uppercase tracking-wider">Sections</h3>
              <div className="space-y-3">
                <ToggleField
                  label="Challenge & Solution"
                  checked={websiteData.showChallenge !== false}
                  onChange={v => updateField('showChallenge', v)}
                />
                <ToggleField
                  label="Programs"
                  checked={websiteData.showPrograms !== false}
                  onChange={v => updateField('showPrograms', v)}
                />
                <ToggleField
                  label="Impact Metrics"
                  checked={websiteData.showMetrics !== false}
                  onChange={v => updateField('showMetrics', v)}
                />
                <ToggleField
                  label="Testimonials"
                  checked={websiteData.showTestimonials !== false}
                  onChange={v => updateField('showTestimonials', v)}
                />
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* CTA Section */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-3 uppercase tracking-wider">Call to Action</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">CTA Headline</label>
                  <input
                    type="text"
                    value={websiteData.ctaHeadline || ''}
                    onChange={e => updateField('ctaHeadline', e.target.value)}
                    placeholder="Join Our Mission"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Button Text</label>
                  <input
                    type="text"
                    value={websiteData.ctaButtonText || ''}
                    onChange={e => updateField('ctaButtonText', e.target.value)}
                    placeholder="Donate Today"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Button URL</label>
                  <input
                    type="url"
                    value={websiteData.ctaButtonUrl || ''}
                    onChange={e => updateField('ctaButtonUrl', e.target.value)}
                    placeholder="https://donate.example.com"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                  />
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Footer */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-3 uppercase tracking-wider">Footer</h3>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Footer Text</label>
                <input
                  type="text"
                  value={websiteData.footerText || ''}
                  onChange={e => updateField('footerText', e.target.value)}
                  placeholder="Optional footer message..."
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 focus:border-[#C15A36]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <iframe
              ref={iframeRef}
              key={previewKey}
              src={websiteUrl}
              className="w-full h-full"
              title="Website Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-neutral-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[#C15A36]' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}
