'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import type { Deck, Organization } from '@/db/schema';

interface PrimaryDeckCardProps {
  deck: Deck;
  organization: Organization;
  siteUrl: string;
}

export function PrimaryDeckCard({ deck, organization, siteUrl }: PrimaryDeckCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const deckUrl = `${siteUrl}/s/${organization.slug}`;

  // Generate QR code on mount
  useEffect(() => {
    QRCode.toDataURL(deckUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
    }).then(setQrCodeUrl);
  }, [deckUrl]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(deckUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.download = `${organization.slug}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // Pre-populated share messages
  const shareMessage = `Check out ${deck.orgName}'s impact story`;
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(deckUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
    sms: `sms:?body=${encodeURIComponent(`${shareMessage} → ${deckUrl}`)}`,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* OG Image Preview */}
        <div className="lg:w-2/3 aspect-[1200/630] relative bg-neutral-100">
          {deck.ogImageUrl ? (
            <img
              src={deck.ogImageUrl}
              alt={deck.orgName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1D2350] to-[#2d3560]">
              <div className="text-center text-white p-6">
                <h2 className="text-2xl font-bold mb-2">{deck.orgName}</h2>
                <p className="text-white/70 text-sm">Impact Deck</p>
              </div>
            </div>
          )}
          {/* View button overlay */}
          <a
            href={deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group"
          >
            <span className="bg-white text-neutral-800 px-6 py-3 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              View Deck
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </span>
          </a>
        </div>

        {/* Deck Info */}
        <div className="lg:w-1/3 p-6 lg:p-8 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[#C15A36] uppercase tracking-wider mb-1 block">
                Impact Deck
              </span>
              <h2 className="text-2xl font-bold text-neutral-800">{deck.orgName}</h2>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Live
            </div>
          </div>

          {/* Share URL */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 block">
              Share Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 font-mono text-sm text-neutral-600 truncate">
                {deckUrl.replace('https://', '')}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#C15A36] text-white hover:bg-[#a84d2e]'
                }`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Share & QR Row */}
          <div className="mb-6">
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 block">
              Share & Distribute
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Social Share Buttons */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all"
                title="Share on Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all"
                title="Share on LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-black hover:text-white hover:border-black transition-all"
                title="Share on X (Twitter)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href={shareLinks.sms}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                title="Share via SMS"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Check out ${deck.orgName}'s Impact Story`)}&body=${encodeURIComponent(`I thought you'd be interested in this:\n\n${deckUrl}`)}`}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-800 transition-all"
                title="Share via Email"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>

              {/* Divider */}
              <div className="w-px h-8 bg-neutral-200 mx-1" />

              {/* QR Code Download */}
              <button
                onClick={handleDownloadQR}
                disabled={!qrCodeUrl}
                className="h-10 px-3 flex items-center gap-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-all text-sm font-medium text-neutral-700 disabled:opacity-50"
                title="Download QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="5" height="5" x="3" y="3" rx="1"/>
                  <rect width="5" height="5" x="16" y="3" rx="1"/>
                  <rect width="5" height="5" x="3" y="16" rx="1"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                  <path d="M21 21v.01"/>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                  <path d="M3 12h.01"/>
                  <path d="M12 3h.01"/>
                  <path d="M12 16v.01"/>
                  <path d="M16 12h1"/>
                  <path d="M21 12v.01"/>
                  <path d="M12 21v-1"/>
                </svg>
                QR Code
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.viewCount}</div>
              <div className="text-xs text-neutral-500">Views</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.clickCount}</div>
              <div className="text-xs text-neutral-500">Clicks</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-800">{deck.shareCount}</div>
              <div className="text-xs text-neutral-500">Shares</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">
            {/* Edit Deck Button - All users can access editor (free users have limited features inside) */}
            <button
              onClick={() => router.push(`/dashboard/decks/${deck.id}/edit`)}
              className="w-full py-3 text-center rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-neutral-800 text-white hover:bg-neutral-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
              Edit Deck
            </button>

            {/* View Deck Button */}
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center bg-[#C15A36] text-white rounded-lg font-medium hover:bg-[#a84d2e] transition-colors flex items-center justify-center gap-2"
            >
              View Deck
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
