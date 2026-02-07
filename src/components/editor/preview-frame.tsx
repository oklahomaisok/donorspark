'use client';

import { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, ExternalLink } from 'lucide-react';

interface PreviewFrameProps {
  html: string;
  deckUrl?: string;
}

export function PreviewFrame({ html, deckUrl }: PreviewFrameProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for arrow keys and send navigation messages to iframe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', direction: 'next' }, '*');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', direction: 'prev' }, '*');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-neutral-500 ml-2">Live Preview</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {deckUrl && (
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-neutral-500 hover:text-white transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0a]">
        <div
          className={`transition-all duration-300 ${
            viewMode === 'mobile'
              ? 'w-[375px] h-[667px] max-h-full'
              : 'w-full h-full'
          }`}
          style={{
            boxShadow: viewMode === 'mobile'
              ? '0 0 0 8px #1a1a1a, 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              : 'none',
            borderRadius: viewMode === 'mobile' ? '32px' : '0',
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            className="w-full h-full bg-white"
            style={{
              borderRadius: viewMode === 'mobile' ? '24px' : '0',
            }}
            title="Deck Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
