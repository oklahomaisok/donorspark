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
    <div className="h-full flex flex-col bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-gray-500 ml-2">Preview</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex bg-[#252525] rounded-md p-0.5">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-[#333] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-[#333] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {deckUrl && (
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-500 hover:text-white transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-[#141414]">
        <div
          className={`transition-all duration-300 overflow-hidden ${
            viewMode === 'mobile'
              ? 'w-[280px] h-[500px] max-h-full'
              : 'w-full h-full'
          }`}
          style={{
            boxShadow: viewMode === 'mobile'
              ? '0 0 0 6px #222, 0 20px 40px -10px rgba(0, 0, 0, 0.6)'
              : 'none',
            borderRadius: viewMode === 'mobile' ? '28px' : '0',
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            className="w-full h-full bg-white"
            style={{
              borderRadius: viewMode === 'mobile' ? '22px' : '0',
            }}
            title="Deck Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
