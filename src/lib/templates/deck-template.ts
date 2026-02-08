import type { BrandData } from '../types';
import { config } from '../config';

export interface DeckOptions {
  isPreviewMode?: boolean;
  claimUrl?: string;
  donorName?: string;
  donorAmount?: string;
  hideDonorSparkSlide?: boolean; // Hide the branded slide for paid users
}

export function generateDeckHtml(slug: string, brandData: BrandData, options: DeckOptions = {}): string {
  const { isPreviewMode = false, claimUrl = '', donorName = '', donorAmount = '', hideDonorSparkSlide = false } = options;
  const {
    orgName = 'Organization',
    tagline = '',
    mission = 'Making a difference in our community.',
    yearFounded = null,
    coreValues = ['Integrity', 'Compassion', 'Excellence', 'Community'],
    programs = [],
    metrics = [],
    hasValidMetrics = false,
    numericValues = [],
    logoUrl = '',
    logoSource = '',
    contactEmail = '',
    donorHeadline = 'Making A Difference',
    heroHook = '',
    originalUrl = '',
    finalDonateUrl = '',
    headerBgColor = null,
    headerTextDark = false,
    need = { headline: 'Communities Need Support', description: 'Many face challenges that require dedicated assistance.' },
    solution = 'We provide programs and services that create lasting change.',
    colors = { primary: '#1D2350', secondary: '#FFC303', accent: '#FFC303' },
    fonts = { headingFont: 'Montserrat', bodyFont: 'Roboto' },
    images,
    testimonials = [],
    // Slide 1
    badgeText = 'Impact Deck',
    // Slide 2
    missionSlideTitle = 'Our Mission',
    missionHeadline = 'Building A Better Future',
    // Slide 3
    challengeSlideTitle = 'The Challenge',
    solutionHeadline = 'Our Solution',
    // Slide 4
    programsHeadline = 'What We Offer',
    programsBody = 'We deliver impactful programs designed to create lasting change in our community.',
    // Slide 5
    testimonialsSlideTitle = 'Success Stories',
    // Slide 6: CTA
    ctaHeadline = 'Join Our Mission',
    ctaSubhead = 'Your support helps us continue making a difference.',
    ctaButtonText = 'Donate Today',
    showShareButtons = true,
    showSocialLinks = false,
    socialLinks = [],
    // Slide visibility (default all visible)
    showMissionSlide = true,
    showChallengeSlide = true,
    showProgramsSlide = true,
    showTestimonialsSlide = true,
    showCtaSlide = true,
    // Custom slide order
    slideOrder = ['mission', 'challenge', 'programs', 'metrics', 'testimonials', 'cta'],
    // Custom images (user-uploaded overrides)
    customImages = {},
  } = brandData;

  const primary = colors.primary || '#1D2350';
  const secondary = colors.secondary || '#FFC303';
  const accent = colors.accent || secondary;
  const textColor = colors.text || '#ffffff';
  const headingFont = fonts.headingFont || 'Montserrat';
  const bodyFont = fonts.bodyFont || 'Roboto';

  // Check if heading font is serif (serif fonts look bad in all caps)
  const isSerifFont = isSerif(headingFont);
  // Use uppercase for sans-serif, mixed case for serif
  const headlineCase = isSerifFont ? '' : 'uppercase';

  // CTA button uses secondary color directly (user-controlled)
  // Calculate text color based on button background luminance
  const ctaButtonColor = getButtonTextColor(secondary);

  // Use custom images if uploaded, otherwise fall back to sector defaults
  const heroImg = customImages?.hero || images?.hero || `${config.imageBaseUrl}/community-hero-leader.jpg`;
  const heroFocal = customImages?.heroFocal || { x: 50, y: 50 };
  const heroVideoFilename = heroImg.split('/').pop()?.replace(/\.(jpg|jpeg|png|webp)$/i, '.mp4') || '';
  const heroVideo = `${config.videoBaseUrl}/${heroVideoFilename}`;
  // Only use video if it's a sector image (not custom upload)
  const hasVideoHero = !customImages?.hero && heroImg.includes('oklahomaisok.github.io/nonprofit-decks') && /\.(jpg|jpeg|png|webp)$/i.test(heroImg);

  const heroMediaHtml = hasVideoHero
    ? `<video autoplay muted loop playsinline poster="${heroImg}" class="w-full h-full object-cover" style="object-position: ${heroFocal.x}% ${heroFocal.y}%;"><source src="${heroVideo}" type="video/mp4"></video>`
    : `<img src="${heroImg}" class="w-full h-full object-cover" style="object-position: ${heroFocal.x}% ${heroFocal.y}%;" alt="Hero">`;

  const missionImg = customImages?.mission || images?.action || `${config.imageBaseUrl}/community-action-neighbors.jpg`;
  const missionFocal = customImages?.missionFocal || { x: 50, y: 50 };
  const programsImg = customImages?.programs || images?.group || `${config.imageBaseUrl}/community-group-gathering.jpg`;
  const programsFocal = customImages?.programsFocal || { x: 50, y: 50 };
  const testimonialsImg = customImages?.testimonials || images?.action || `${config.imageBaseUrl}/community-action-neighbors.jpg`;
  const testimonialsFocal = customImages?.testimonialsFocal || { x: 50, y: 50 };

  // Keep legacy names for compatibility
  const actionImg = missionImg;
  const groupImg = programsImg;

  // Show logo if we have one, fall back to text if not
  const useTextLogo = !logoUrl || logoSource === 'none';
  const effectiveLogoUrl = useTextLogo ? '' : logoUrl;

  const valuesHtml = coreValues.slice(0, 4).map(v =>
    `<div class="bg-white/10 border border-white/10 p-3 rounded text-center backdrop-blur-sm"><div class="text-[var(--accent)] font-black uppercase text-xs tracking-wider">${escHtml(v)}</div></div>`
  ).join('\n');

  const programsHtml = (programs || []).slice(0, 6).map(p =>
    `<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">${escHtml(p)}</span>`
  ).join('\n');

  const metricsData = (metrics || []).slice(0, 5);
  const showMetricsSlide = hasValidMetrics && metricsData.length > 0;
  let metricsHtml = '';
  if (showMetricsSlide) {
    const cards = metricsData.map((m, i) =>
      `<div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center animate-on-scroll" style="animation-delay: ${i * 0.15}s"><div class="text-3xl md:text-4xl font-black font-display text-[var(--accent)] mb-1"><span class="count-up" data-target="${escAttr(m.value)}">${escHtml(m.value)}</span></div><div class="text-[10px] md:text-xs uppercase tracking-wider text-neutral-300 font-medium">${escHtml(m.label)}</div></div>`
    ).join('\n');
    const gridCols = metricsData.length <= 2 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2';
    metricsHtml = `<h2 class="text-2xl md:text-3xl mb-8 text-[var(--text)] font-display font-black ${headlineCase} tracking-tight animate-on-scroll text-center">By The <span class="text-[var(--accent)]">Numbers</span></h2><div class="${gridCols} grid gap-4">${cards}</div>`;
  }

  const testimonialsData = testimonials.length >= 3 ? testimonials : [
    { quote: 'This organization has made a real difference.', author: 'Sarah M.', role: 'Supporter', portrait: 'https://i.pravatar.cc/200?img=5' },
    { quote: 'The dedication here is truly inspiring.', author: 'James T.', role: 'Volunteer', portrait: 'https://i.pravatar.cc/200?img=52' },
    { quote: "I've seen the impact firsthand.", author: 'Michelle K.', role: 'Board Member', portrait: 'https://i.pravatar.cc/200?img=9' },
  ];

  const testimonialCardsHtml = testimonialsData.slice(0, 5).map((t, i) =>
    `<div class="testimonial-card card-pos-${Math.min(i, 2)} w-full h-full rounded-2xl bg-white p-6 shadow-xl flex flex-col overflow-hidden"><div class="mb-4"><svg class="w-10 h-10 text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg></div><p class="text-[var(--primary)] text-sm leading-relaxed flex-grow mb-6">${escHtml(t.quote)}</p><div class="flex items-center gap-3 pt-4 border-t border-neutral-100"><div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--accent)]/30"><img src="${t.portrait || ''}" alt="${escAttr(t.author)}" class="w-full h-full object-cover"></div><div><div class="text-[var(--primary)] font-bold text-sm">${escHtml(t.author)}</div><div class="text-neutral-400 text-xs">${escHtml(t.role)}</div></div></div></div>`
  ).join('\n');

  // Social links icons by platform
  const socialIcons: Record<string, string> = {
    facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    youtube: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    tiktok: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
  };

  const socialLinksHtml = (socialLinks || []).map(link =>
    `<a href="${escAttr(link.url)}" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="${link.platform}">${socialIcons[link.platform] || ''}</a>`
  ).join('\n');

  // Calculate total slides based on visibility and order
  let totalSlides = 1; // Hero always visible
  const slideVisibility: Record<string, boolean> = {
    mission: showMissionSlide,
    challenge: showChallengeSlide,
    programs: showProgramsSlide,
    metrics: showMetricsSlide,
    testimonials: showTestimonialsSlide,
    cta: showCtaSlide,
  };

  // Count visible slides in order
  for (const slideId of slideOrder) {
    if (slideVisibility[slideId]) totalSlides++;
  }

  // Add DonorSpark slide for non-paid users
  const showDonorSparkSlide = !hideDonorSparkSlide && !isPreviewMode;
  if (showDonorSparkSlide || isPreviewMode) totalSlides++;

  let paginationDots = '';
  for (let i = 0; i < totalSlides; i++) {
    paginationDots += '<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>\n';
  }

  // Calculate dynamic slide numbers based on order
  let slideNum = 1; // Hero is always 01
  const slideNumbers: Record<string, string> = {};
  for (const slideId of slideOrder) {
    if (slideVisibility[slideId]) {
      slideNumbers[slideId] = String(++slideNum).padStart(2, '0');
    }
  }
  const missionSlideNum = slideNumbers.mission || '';
  const challengeSlideNum = slideNumbers.challenge || '';
  const programsSlideNum = slideNumbers.programs || '';
  const metricsSlideNum = slideNumbers.metrics || '';
  const testimonialsSlideNum = slideNumbers.testimonials || '';
  const ctaSlideNum = slideNumbers.cta || '';

  const headlineWords = donorHeadline.split(' ');
  const headlineTop = headlineWords.slice(0, Math.ceil(headlineWords.length / 2)).join(' ');
  const headlineBottom = headlineWords.slice(Math.ceil(headlineWords.length / 2)).join(' ') || '';

  const siteUrl = config.siteUrl;
  const deckUrl = `${siteUrl}/decks/${slug}`;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(orgName)} | Impact Deck</title>
    <meta name="description" content="${escAttr(mission.substring(0, 160))}">
    <meta property="og:title" content="${escAttr(orgName)} | Impact Deck">
    <meta property="og:description" content="${escAttr(mission.substring(0, 160))}">
    <meta property="og:image" content="${siteUrl}/api/og/${slug}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${siteUrl}/api/og/${slug}">
    <link rel="icon" href="${effectiveLogoUrl || `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='${encodeURIComponent(primary)}'/><text x='16' y='22' font-size='18' font-weight='bold' fill='white' text-anchor='middle' font-family='system-ui'>${escHtml(orgName.charAt(0).toUpperCase())}</text></svg>`}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;500;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;700&family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: ${primary}; --secondary: ${secondary}; --accent: ${accent}; --text: ${textColor}; --header-bg: ${headerBgColor || primary}; --header-text: ${headerTextDark ? '#1a1a1a' : '#ffffff'}; }
        body { font-family: '${bodyFont}', sans-serif; background-color: color-mix(in srgb, var(--primary) 85%, black); color: var(--text); }
        h1, h2, h3, .font-display { font-family: '${headingFont}', sans-serif; }
        @keyframes animationIn { 0% { opacity: 0; transform: translateY(30px); filter: blur(8px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0px); } }
        @keyframes grow-up { 0% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
        .animate-bar { transform-origin: bottom; transform: scaleY(0); animation: grow-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-play-state: paused; }
        .bar-stage.animate .animate-bar { animation-play-state: running; }
        .animate-on-scroll { animation: animationIn 0.8s ease-out both; animation-play-state: paused; }
        .animate-on-scroll.animate { animation-play-state: running; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .slide-container { width: 90vw; height: 75vh; min-width: 0; }
        @media (min-width: 768px) { .slide-container { width: 500px; height: auto; aspect-ratio: 3/4; } }
        .bg-grid-pattern { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0); background-size: 32px 32px; }
        .testimonial-card { position: absolute; inset: 0; transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease, filter 0.5s ease; transform-origin: center bottom; will-change: transform; }
        .card-pos-0 { transform: translateY(0) scale(1); z-index: 30; opacity: 1; filter: blur(0px); pointer-events: auto; }
        .card-pos-1 { transform: translateY(-20px) scale(0.94); z-index: 20; opacity: 0.7; filter: blur(0.5px); pointer-events: none; }
        .card-pos-2 { transform: translateY(-40px) scale(0.88); z-index: 10; opacity: 0.4; filter: blur(1px); pointer-events: none; }
        .card-fly-out { transform: translateX(120%) rotate(15deg) scale(1) !important; opacity: 0 !important; z-index: 40 !important; }
        .count-up { display: inline-block; }
        @keyframes countPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .count-up.counting { animation: countPulse 0.1s ease-in-out; }
    </style>
</head>
<body class="min-h-screen flex flex-col items-center selection:bg-[var(--accent)]/30">
    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 backdrop-blur-md border-b border-black/10 h-16" style="background-color: var(--header-bg); color: var(--header-text);">
        <div class="flex items-center gap-3 w-auto md:w-1/3">
            ${effectiveLogoUrl ? `<img src="${effectiveLogoUrl}" alt="${escAttr(orgName)}" class="h-10 md:h-11 max-w-[180px] md:max-w-[240px] w-auto object-contain">` : `<span class="font-display text-lg font-bold" style="color: var(--header-text);">${escHtml(orgName)}</span>`}
        </div>
        <div id="pagination-dots" class="hidden sm:flex items-center justify-center gap-2 w-1/3">${paginationDots}</div>
        <div class="hidden md:flex items-center justify-end gap-2 w-1/3">
            <button id="prevBtn" class="p-2 rounded-full hover:bg-white/10 hover:text-[var(--accent)] transition-colors" style="color: var(--header-text); opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>
            <button id="nextBtn" class="p-2 rounded-full hover:bg-black/10 hover:text-[var(--accent)] transition-colors" style="color: var(--header-text); opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
        <div class="md:hidden flex items-center justify-end w-auto text-xs gap-1 opacity-80" style="color: var(--header-text);"><span class="font-display font-bold tracking-widest uppercase">SWIPE</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg></div>
    </nav>
    <main id="slider" class="flex flex-row overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full pt-24 md:pt-28 pb-6 md:pb-10 px-4 md:px-10 gap-x-4 md:gap-x-12 scroll-smooth" style="mask-image: linear-gradient(90deg, transparent, black 5%, black 95%, transparent);">
        <!-- Slide 1: Hero -->
        <section id="slide-hero" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0">${heroMediaHtml}<div class="absolute inset-0 bg-black/40"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div></div>
            <div class="flex flex-col z-10 p-6 md:p-10 h-full justify-between">
                <div class="flex animate-on-scroll items-start justify-between">${badgeText ? `<span class="text-[10px] text-[var(--accent)] uppercase tracking-widest font-bold border border-[var(--accent)]/30 px-2 py-1 rounded bg-[var(--primary)]/80 backdrop-blur-md">${escHtml(badgeText)}</span>` : '<span></span>'}</div>
                <div class="mt-auto"><h1 class="leading-[0.9] animate-on-scroll text-4xl md:text-5xl tracking-wide font-display ${headlineCase} text-[var(--text)] mb-4 drop-shadow-lg">${escHtml(headlineTop)}<br><span class="text-[var(--accent)]">${escHtml(headlineBottom)}</span></h1><div class="animate-on-scroll"><p class="text-sm text-[var(--text)] max-w-[90%] border-l-4 border-[var(--accent)] pl-4 font-medium">${escHtml(heroHook)}</p></div></div>
                <div class="pt-4 border-t border-white/10 flex justify-between items-end animate-on-scroll">${yearFounded ? `<div class="flex flex-col"><span class="text-[10px] text-[var(--text)]/70 uppercase mb-1 tracking-wider">Established</span><span class="font-display text-sm text-[var(--text)]">Since ${yearFounded}</span></div>` : '<div></div>'}<div class="text-[var(--accent)] flex items-center gap-2 text-xs uppercase tracking-widest font-bold">Scroll <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div></div>
            </div>
        </section>
        ${showMissionSlide ? `<!-- Slide: Mission -->
        <section id="slide-mission" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="${missionImg}" class="w-full h-full object-cover" style="object-position: ${missionFocal.x}% ${missionFocal.y}%;" alt="Action"><div class="absolute inset-0 bg-black/60"></div><div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex animate-on-scroll items-center justify-between mb-6"><span class="font-mono text-xs text-[var(--accent)] font-bold">[${missionSlideNum}]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-white/70">${escHtml(missionSlideTitle)}</span></header>
                <div class="flex-grow flex flex-col justify-center space-y-6"><div class="animate-on-scroll"><h2 class="text-2xl md:text-3xl text-[var(--text)] font-display font-black ${headlineCase} tracking-tight leading-none mb-3">${formatHeadline(missionHeadline, headlineCase)}</h2><div class="w-12 h-1 bg-[var(--accent)] mb-4"></div><p class="text-sm text-[var(--text)] leading-relaxed font-medium">${escHtml(mission)}</p></div><div class="grid grid-cols-2 gap-3 animate-on-scroll">${valuesHtml}</div></div>
            </div>
        </section>` : ''}
        ${showChallengeSlide ? `<!-- Slide: Challenge & Solution -->
        <section id="slide-challenge" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div class="flex flex-col h-full p-4 md:p-10 z-10 overflow-y-auto hide-scrollbar">
                <header class="flex animate-on-scroll items-center justify-between mb-3 md:mb-6 flex-shrink-0"><span class="font-mono text-xs text-[var(--accent)] font-bold">[${challengeSlideNum}]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-white/70">${escHtml(challengeSlideTitle)}</span></header>
                <div class="flex-grow flex flex-col justify-center"><div class="animate-on-scroll bg-white/5 border border-white/10 rounded-lg p-4 md:p-6"><div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-4"><div class="p-1.5 md:p-2 bg-[var(--accent)]/20 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h2 class="text-lg md:text-2xl text-[var(--text)] font-display font-black ${headlineCase}">${escHtml(need.headline)}</h2></div><p class="text-xs md:text-sm text-[var(--text)]/80 leading-relaxed">${escHtml(need.description)}</p></div><div class="flex justify-center my-2 md:my-4 animate-on-scroll text-[var(--text)]/30"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v15"/><path d="m19 12-7 7-7-7"/></svg></div><div class="animate-on-scroll bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-lg p-4 md:p-6"><div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-4"><div class="p-1.5 md:p-2 bg-[var(--accent)] rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3 class="text-lg md:text-xl text-[var(--accent)] font-display font-black ${headlineCase}">${escHtml(solutionHeadline)}</h3></div><p class="text-xs md:text-sm text-[var(--text)]/80 leading-relaxed">${escHtml(solution)}</p></div></div>
            </div>
        </section>` : ''}
        ${showProgramsSlide ? `<!-- Slide: Programs -->
        <section id="slide-programs" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="${programsImg}" class="w-full h-full object-cover" style="object-position: ${programsFocal.x}% ${programsFocal.y}%;" alt="Programs"><div class="absolute inset-0 bg-black/60"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex animate-on-scroll items-center justify-between mb-6"><span class="font-mono text-xs text-[var(--accent)] font-bold">[${programsSlideNum}]</span><div class="p-2 bg-white/10 rounded-full backdrop-blur-md"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg></div></header>
                <div class="flex-grow flex flex-col justify-center"><div class="mb-6 animate-on-scroll"><h2 class="text-3xl md:text-4xl text-[var(--text)] font-display font-black tracking-tighter ${headlineCase} leading-none drop-shadow-xl">${formatHeadline(programsHeadline, headlineCase)}</h2></div><div class="animate-on-scroll bg-[var(--primary)]/70 p-4 rounded-lg backdrop-blur-md border border-white/10"><p class="leading-relaxed text-sm text-[var(--text)] mb-4 font-medium">${escHtml(programsBody)}</p>${programsHtml ? `<div class="flex flex-wrap gap-2">${programsHtml}</div>` : ''}</div></div>
            </div>
        </section>` : ''}
        ${showMetricsSlide ? `<!-- Slide: Metrics -->
        <section id="slide-metrics" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl"><div class="absolute inset-0 bg-grid-pattern opacity-20"></div><div class="p-6 md:p-10 h-full flex flex-col z-10"><header class="flex justify-between items-center mb-6 animate-on-scroll"><span class="font-mono text-xs text-[var(--accent)] font-bold">[${metricsSlideNum}]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-400">Our Impact</span></header><div class="flex-grow flex flex-col justify-center">${metricsHtml}</div></div></section>` : ''}
        ${showTestimonialsSlide ? `<!-- Slide: Testimonials -->
        <section id="slide-testimonials" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="${testimonialsImg}" class="w-full h-full object-cover" style="object-position: ${testimonialsFocal.x}% ${testimonialsFocal.y}%;" alt="Background"><div class="absolute inset-0 bg-black/70"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex justify-between items-center mb-4 animate-on-scroll"><span class="font-mono text-xs text-[var(--accent)] font-bold">[${testimonialsSlideNum}]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-400">${escHtml(testimonialsSlideTitle)}</span></header>
                <div class="flex-grow flex flex-col animate-on-scroll items-center justify-center relative"><div class="absolute top-0 right-0 p-2 opacity-70 text-[10px] font-mono text-[var(--accent)] z-30 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13a4 4 0 0 1-7.7 2.3l-2.6-7.5a1.7 1.7 0 0 0-3.3 1L9 18.2a5.3 5.3 0 0 0 2.2 4.1l6.3 3.6c2.4 1.4 5.3-.2 5.5-2.9l.6-9.1a4 4 0 0 0-5-4.1z"/></svg>TAP CARDS</div><div id="testimonial-stack" class="relative w-full max-w-[280px] md:max-w-[320px] aspect-square cursor-pointer">${testimonialCardsHtml}</div></div>
            </div>
        </section>` : ''}
        ${showCtaSlide ? `<!-- Slide: CTA -->
        <section id="slide-cta" class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-[var(--accent)]/50 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div class="flex flex-col h-full z-10 p-6 md:p-10 justify-center">
                <div class="animate-on-scroll text-center flex flex-col items-center">${effectiveLogoUrl ? `<img src="${effectiveLogoUrl}" alt="${escAttr(orgName)}" class="h-16 md:h-20 max-w-[280px] w-auto object-contain mb-6 opacity-90">` : ''}<h2 class="${headlineCase} leading-tight text-3xl md:text-4xl font-black font-display mb-4 text-[var(--text)]">${formatHeadline(ctaHeadline, headlineCase)}</h2><p class="leading-relaxed text-sm text-[var(--text)]/80 max-w-[90%] mx-auto mb-6">${escHtml(ctaSubhead)}</p><a href="${finalDonateUrl || originalUrl}" target="_blank" id="ds-donate-btn" class="inline-flex items-center justify-center px-8 py-4 font-black rounded hover:scale-105 transition-all shadow-lg mb-6" style="background-color: ${secondary}; color: ${ctaButtonColor};"><span class="font-display uppercase tracking-widest text-sm">${escHtml(ctaButtonText)}</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
                    ${isPreviewMode ? `
                    <!-- Love your deck banner - only on CTA slide -->
                    <div class="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#C15A36] to-[#E07A50] text-white">
                        <p class="text-sm font-bold mb-1">Love your deck?</p>
                        <p class="text-xs opacity-90 mb-3">Create a free account to save & share it</p>
                        <a href="${claimUrl}" class="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#C15A36] rounded-full text-sm font-bold hover:bg-neutral-100 transition-colors">
                            Claim Deck
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                    </div>` : `
                    ${showShareButtons ? `<div class="mb-4"><p class="text-xs text-neutral-400 uppercase tracking-widest mb-3">Share This Story</p>
                    <div class="flex items-center justify-center gap-3">
                        <a href="mailto:?subject=${encodeURIComponent(`Check out ${orgName}'s Impact Story`)}&body=${encodeURIComponent(`I thought you'd be interested in this: https://donorspark.app/decks/${slug}`)}" class="share-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Share via Email">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </a>
                        <a href="sms:?body=${encodeURIComponent(`Check out ${orgName}'s Impact Story: https://donorspark.app/decks/${slug}`)}" class="share-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Share via Text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://donorspark.app/decks/${slug}`)}" target="_blank" rel="noopener" class="share-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Share on Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://donorspark.app/decks/${slug}`)}" target="_blank" rel="noopener" class="share-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Share on LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        <button onclick="navigator.clipboard.writeText('https://donorspark.app/decks/${slug}').then(()=>{this.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><polyline points=\\'20 6 9 17 4 12\\'/></svg>';setTimeout(()=>{this.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><rect width=\\'14\\' height=\\'14\\' x=\\'8\\' y=\\'8\\' rx=\\'2\\' ry=\\'2\\'/><path d=\\'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\\'/></svg>'},2000)})" class="share-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer" title="Copy Link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                    </div></div>` : ''}
                    ${showSocialLinks && socialLinks.length > 0 ? `<div><p class="text-xs text-neutral-400 uppercase tracking-widest mb-3">Follow Us Online</p>
                    <div class="flex items-center justify-center gap-3">${socialLinksHtml}</div></div>` : ''}`}
                    ${contactEmail ? `<p class="mt-4 text-sm text-neutral-400">Contact: ${escHtml(contactEmail)}</p>` : ''}
                </div>
            </div>
        </section>` : ''}
        ${(isPreviewMode || showDonorSparkSlide) ? `<!-- Slide: DonorSpark -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-white border-neutral-200 border relative shadow-2xl rounded-xl">
            <div class="flex flex-col h-full z-10 p-6 md:p-10 justify-center items-center text-center">
                ${isPreviewMode ? `
                <!-- Preview mode: Claim CTA -->
                <div class="animate-on-scroll flex flex-col items-center">
                    <div class="w-16 h-16 rounded-full bg-[#C15A36]/10 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C15A36" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h3 class="text-2xl font-bold text-neutral-800 mb-2" style="font-family: 'Outfit', sans-serif;">Keep This Deck Forever</h3>
                    <p class="text-neutral-500 text-sm mb-6 max-w-xs">Create a free account to save your deck, unlock sharing, and access your dashboard.</p>
                    <a href="${claimUrl}" class="inline-flex items-center gap-2 px-8 py-4 bg-[#C15A36] text-white rounded-full hover:bg-[#a84d2e] transition-colors mb-4 shadow-lg" style="font-family: 'Outfit', sans-serif; font-weight: 600;">
                        Create Free Account
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </a>
                    <p class="text-neutral-400 text-xs">No credit card required</p>
                </div>
                <div class="mt-8 pt-6 border-t border-neutral-200 w-full">
                    <span class="text-neutral-400 text-xs" style="font-family: 'Instrument Serif', serif;">Made with</span>
                    <img src="${siteUrl}/donorsparklogo.png" alt="DonorSpark" class="h-8 w-auto mx-auto mt-1 opacity-60">
                </div>
                ` : `
                <div class="animate-on-scroll flex flex-col items-center">
                    <span class="text-neutral-500 text-base md:text-lg mb-2" style="font-family: 'Instrument Serif', serif;">Made with</span>
                    <a href="https://donorspark.app?ref=${slug}" target="_blank" rel="noopener" class="ds-link mb-6">
                        <img src="${siteUrl}/donorsparklogo.png" alt="DonorSpark" class="h-12 md:h-16 w-auto">
                    </a>
                </div>
                <a href="https://donorspark.app?ref=${slug}" target="_blank" rel="noopener" class="ds-link animate-on-scroll inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full hover:bg-[#a84d2e] transition-colors mb-4" style="font-family: 'Outfit', sans-serif; font-weight: 600;">
                    Get a free story deck
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
                <a href="https://www.donorspark.app?ref=${slug}" target="_blank" rel="noopener" class="ds-link animate-on-scroll text-neutral-500 hover:text-[#C15A36] transition-colors text-base md:text-lg" style="font-family: 'Instrument Serif', serif;">www.donorspark.app</a>
                `}
            </div>
        </section>` : ''}
    </main>
    <script>lucide.createIcons();</script>
    <script>
    (function () {
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('animate'); io.unobserve(e.target); } });
        }, { threshold: 0.2, rootMargin: '0px -10% 0px -10%' });
        document.querySelectorAll('.animate-on-scroll').forEach(function(el) { io.observe(el); });
        var stack = document.getElementById('testimonial-stack');
        if (stack) {
            var animating = false;
            stack.addEventListener('click', function() {
                if (animating) return;
                var cards = Array.from(stack.children);
                if (cards.length > 0) {
                    animating = true;
                    cards[0].classList.add('card-fly-out');
                    setTimeout(function() {
                        cards[0].classList.remove('card-fly-out');
                        stack.appendChild(cards[0]);
                        Array.from(stack.children).forEach(function(c, i) {
                            c.classList.remove('card-pos-0', 'card-pos-1', 'card-pos-2');
                            c.classList.add('card-pos-' + Math.min(i, 2));
                        });
                        animating = false;
                    }, 500);
                }
            });
        }
        var slider = document.getElementById('slider');
        var slides = document.querySelectorAll('.slide-container');
        var dots = document.getElementById('pagination-dots').children;
        var currentSlide = 0;
        var updateDots = function(idx) { currentSlide = idx; try { sessionStorage.setItem('ds_slide', idx); } catch(e) {} Array.from(dots).forEach(function(d, i) { d.className = i === idx ? 'w-2.5 h-2.5 rounded-full bg-[var(--accent)] cursor-pointer' : 'w-2 h-2 rounded-full bg-neutral-400 hover:bg-[var(--accent)]/70 cursor-pointer'; }); try { window.parent.postMessage({ type: 'slideChange', slideIndex: idx }, '*'); } catch(e) {} };
        // Restore scroll position from sessionStorage (for editor preview)
        try { var saved = sessionStorage.getItem('ds_slide'); if (saved && slides[+saved]) { setTimeout(function() { slides[+saved].scrollIntoView({ behavior: 'instant', inline: 'center' }); }, 50); } } catch(e) {}
        var slideIO = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) updateDots(Array.from(slides).indexOf(e.target)); }); }, { root: slider, threshold: 0.6 });
        slides.forEach(function(s) { slideIO.observe(s); });
        Array.from(dots).forEach(function(d, i) { d.addEventListener('click', function() { slides[i] && slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center' }); }); });
        var scrollAmt = function() { return window.innerWidth < 768 ? window.innerWidth * 0.85 : 548; };
        var nextBtn = document.getElementById('nextBtn');
        var prevBtn = document.getElementById('prevBtn');
        if (nextBtn) nextBtn.addEventListener('click', function() { slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' }); });
        if (prevBtn) prevBtn.addEventListener('click', function() { slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); });
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' }); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); }
        });
        // Listen for navigation messages from parent (editor)
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'navigate') {
                if (e.data.direction === 'next') { slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' }); }
                if (e.data.direction === 'prev') { slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); }
            }
        });
        var countUpElements = document.querySelectorAll('.count-up');
        var countUpObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = el.dataset.target || el.textContent;
                    var numMatch = target.replace(/,/g, '').match(/[\d.]+/);
                    if (numMatch) {
                        var targetNum = parseFloat(numMatch[0]);
                        var prefix = target.match(/^[^\d]*/)[0] || '';
                        var suffix = target.match(/[^\d]*$/)[0] || '';
                        var hasCommas = target.indexOf(',') >= 0;
                        var duration = 2000;
                        var startTime = performance.now();
                        var animate = function(currentTime) {
                            var elapsed = currentTime - startTime;
                            var progress = Math.min(elapsed / duration, 1);
                            var eased = 1 - Math.pow(1 - progress, 3);
                            var current = Math.floor(targetNum * eased);
                            if (hasCommas) current = current.toLocaleString();
                            el.textContent = prefix + current + suffix;
                            el.classList.add('counting');
                            if (progress < 1) { requestAnimationFrame(animate); }
                            else { el.textContent = target; el.classList.remove('counting'); }
                        };
                        requestAnimationFrame(animate);
                    }
                    countUpObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        countUpElements.forEach(function(el) { countUpObserver.observe(el); });
    })();
    </script>
    <script>
    (function(){
      var T='${siteUrl}/api/track',S='${slug}';
      var sid;
      try{sid=sessionStorage.getItem('ds_sid');if(!sid){sid='ds_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);sessionStorage.setItem('ds_sid',sid);}}catch(e){sid='ds_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);}
      function t(e){var d=JSON.stringify({slug:S,event:e,sessionId:sid});if(navigator.sendBeacon){navigator.sendBeacon(T,new Blob([d],{type:'application/json'}));}else{fetch(T,{method:'POST',headers:{'Content-Type':'application/json'},body:d,keepalive:true});}}
      t('view');
      var b=document.getElementById('ds-donate-btn');if(b)b.addEventListener('click',function(){t('click');});
      document.querySelectorAll('.ds-link').forEach(function(el){el.addEventListener('click',function(){t('donorspark_click');});});
    })();
    </script>
    <script>
    (function(){
      // Content protection - disable right-click, keyboard shortcuts, text selection
      document.addEventListener('contextmenu',function(e){e.preventDefault();return false;});
      document.addEventListener('keydown',function(e){
        if((e.ctrlKey||e.metaKey)&&['s','u','p','c'].includes(e.key.toLowerCase())){e.preventDefault();return false;}
        if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(e.key.toLowerCase()))){e.preventDefault();return false;}
      });
      document.addEventListener('selectstart',function(e){e.preventDefault();return false;});
      document.addEventListener('dragstart',function(e){e.preventDefault();return false;});
    })();
    </script>
    <style>
      *{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-touch-callout:none;}
      img{pointer-events:none;-webkit-user-drag:none;user-drag:none;}
    </style>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Common serif fonts - these look bad in all caps
const SERIF_FONTS = [
  'playfair', 'lora', 'merriweather', 'garamond', 'baskerville', 'crimson',
  'cormorant', 'spectral', 'source serif', 'pt serif', 'noto serif', 'bitter',
  'vollkorn', 'cardo', 'old standard', 'alike', 'domine', 'newsreader',
  'roboto slab', 'arvo', 'zilla slab', 'libre baskerville', 'eb garamond',
  'dm serif', 'fraunces', 'bodoni', 'didot', 'times', 'georgia', 'palatino',
  'cambria', 'charter', 'iowan', 'new york', 'instrument serif',
];

function isSerif(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return SERIF_FONTS.some(serif => lower.includes(serif)) || lower.includes('serif');
}

// Get best text color (black or white) for a given background color
function getButtonTextColor(bgColor: string): string {
  try {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

// Format headline with last word(s) in accent color
function formatHeadline(headline: string, headlineCase: string): string {
  const words = headline.split(' ');
  if (words.length <= 1) {
    return `<span class="text-[var(--accent)]">${escHtml(headline)}</span>`;
  }
  // Put roughly half the words on each line, with accent on the second part
  const midpoint = Math.ceil(words.length / 2);
  const firstPart = words.slice(0, midpoint).join(' ');
  const secondPart = words.slice(midpoint).join(' ');
  return `${escHtml(firstPart)}<br><span class="text-[var(--accent)]">${escHtml(secondPart)}</span>`;
}
