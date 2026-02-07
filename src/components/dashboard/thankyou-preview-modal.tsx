'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateThankYouPreviewSlides, type ThankYouPreviewData } from '@/lib/templates/thankyou-preview-template';

interface ThankYouPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: ThankYouPreviewData;
}

export function ThankYouPreviewModal({ isOpen, onClose, previewData }: ThankYouPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const slides = generateThankYouPreviewSlides(previewData);

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>

        {/* Preview label */}
        <div className="absolute -top-12 left-0 flex items-center gap-2">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Preview</span>
          <span className="text-xs text-white/40">Thank-You Deck</span>
        </div>

        {/* Slide Container */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
          {/* Slides */}
          {slides.map((slideHtml, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ${
                index === currentSlide
                  ? 'opacity-100 translate-x-0'
                  : index < currentSlide
                  ? 'opacity-0 -translate-x-full'
                  : 'opacity-0 translate-x-full'
              }`}
              dangerouslySetInnerHTML={{ __html: slideHtml }}
            />
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all ${
              currentSlide === 0 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-white/20'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all ${
              currentSlide === slides.length - 1 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-white/20'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Upgrade CTA */}
        <div className="mt-6 bg-white rounded-xl p-5 text-center">
          <h3 className="text-lg font-bold text-neutral-800 mb-2">
            Send personalized thank-you decks to every donor
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Upload a CSV of donors and we'll generate a unique deck for each one, complete with their name and gift amount.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 bg-[#C15A36] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#a84d2e] transition-colors w-full"
          >
            Unlock Thank-You Decks
            <span className="text-white/70 text-sm">$49/mo</span>
          </a>
          <p className="text-xs text-neutral-400 mt-3">
            Included in Starter plan • 5 Thank-You decks/month
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
