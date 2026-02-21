import type { BrandData, WebsiteData } from '../types';
import { config } from '../config';
import { sanitizeUrl } from '../sanitize-url';

export function generateSiteHtml(
  orgSlug: string,
  brandData: BrandData,
  websiteData?: WebsiteData
): string {
  const {
    orgName = 'Organization',
    mission = 'Making a difference in our community.',
    yearFounded = null,
    coreValues = [],
    programs = [],
    metrics = [],
    hasValidMetrics = false,
    logoUrl = '',
    logoSource = '',
    contactEmail = '',
    donorHeadline = 'Making A Difference',
    heroHook = '',
    need = { headline: 'Communities Need Support', description: 'Many face challenges that require dedicated assistance.' },
    solution = 'We provide programs and services that create lasting change.',
    finalDonateUrl = '',
    originalUrl = '',
    colors = { primary: '#1D2350', secondary: '#FFC303', accent: '#FFC303' },
    fonts = { headingFont: 'Montserrat', bodyFont: 'Roboto' },
    images,
    testimonials = [],
    ctaHeadline: brandCtaHeadline = 'Join Our Mission',
    ctaButtonText: brandCtaButtonText = 'Donate Today',
  } = brandData;

  // WebsiteData overrides
  const heroHeadline = websiteData?.heroHeadline || donorHeadline;
  const heroSubheadline = websiteData?.heroSubheadline || heroHook;
  const aboutText = websiteData?.aboutText || mission;
  const ctaHeadline = websiteData?.ctaHeadline || brandCtaHeadline;
  const ctaButtonText = websiteData?.ctaButtonText || brandCtaButtonText;
  const ctaButtonUrl = sanitizeUrl(websiteData?.ctaButtonUrl) || sanitizeUrl(finalDonateUrl) || sanitizeUrl(originalUrl) || '#';
  const footerText = websiteData?.footerText || '';
  const showTestimonials = websiteData?.showTestimonials !== false && testimonials.length > 0;
  const showPrograms = websiteData?.showPrograms !== false && programs.length > 0;
  const showMetrics = websiteData?.showMetrics !== false && hasValidMetrics && metrics.length > 0;
  const showChallenge = websiteData?.showChallenge !== false;

  const primary = colors.primary || '#1D2350';
  const secondary = colors.secondary || '#FFC303';
  const accent = colors.accent || secondary;
  const headingFont = fonts.headingFont || 'Montserrat';
  const bodyFont = fonts.bodyFont || 'Roboto';

  const useTextLogo = !logoUrl || logoSource === 'none';
  const effectiveLogoUrl = useTextLogo ? '' : sanitizeUrl(logoUrl);

  const heroImg = images?.hero || `${config.imageBaseUrl}/community-hero-leader.jpg`;
  const siteUrl = config.siteUrl;

  // Button text color based on luminance of secondary
  const btnTextColor = getButtonTextColor(secondary);

  // Generate section nav links
  const navLinks: { label: string; href: string }[] = [
    { label: 'About', href: '#about' },
  ];
  if (showChallenge) navLinks.push({ label: 'Our Work', href: '#challenge' });
  if (showPrograms) navLinks.push({ label: 'Programs', href: '#programs' });
  if (showMetrics) navLinks.push({ label: 'Impact', href: '#impact' });
  if (showTestimonials) navLinks.push({ label: 'Stories', href: '#testimonials' });
  navLinks.push({ label: 'Contact', href: '#contact' });

  const navLinksHtml = navLinks.map(l =>
    `<a href="${l.href}" class="nav-link text-sm font-medium text-neutral-600 hover:text-[var(--primary)] transition-colors">${esc(l.label)}</a>`
  ).join('\n');

  const mobileNavLinksHtml = navLinks.map(l =>
    `<a href="${l.href}" class="mobile-nav-link block px-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 transition-colors" onclick="closeMobileMenu()">${esc(l.label)}</a>`
  ).join('\n');

  // Core values
  const valuesHtml = coreValues.slice(0, 4).map(v =>
    `<div class="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
      <div class="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <span class="text-sm font-semibold text-neutral-800">${esc(v)}</span>
    </div>`
  ).join('\n');

  // Programs
  const programsHtml = programs.slice(0, 6).map((p, i) =>
    `<div class="animate-on-scroll bg-white rounded-xl shadow-sm border border-neutral-100 p-6 hover:shadow-md transition-shadow" style="animation-delay: ${i * 0.1}s">
      <div class="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
        <span class="text-lg font-bold text-[var(--primary)]">${i + 1}</span>
      </div>
      <h3 class="font-semibold text-neutral-800 mb-2">${esc(p)}</h3>
    </div>`
  ).join('\n');

  // Metrics
  const metricsHtml = metrics.slice(0, 5).map((m, i) =>
    `<div class="animate-on-scroll text-center" style="animation-delay: ${i * 0.15}s">
      <div class="text-4xl md:text-5xl font-black text-white mb-2">
        <span class="count-up" data-target="${escAttr(m.value)}">${esc(m.value)}</span>
      </div>
      <div class="text-sm text-white/70 uppercase tracking-wider font-medium">${esc(m.label)}</div>
    </div>`
  ).join('\n');

  // Testimonials
  const testimonialsHtml = testimonials.slice(0, 3).map((t, i) =>
    `<div class="animate-on-scroll bg-white rounded-2xl shadow-sm border border-neutral-100 p-8" style="animation-delay: ${i * 0.15}s">
      <svg class="w-8 h-8 text-[var(--accent)] mb-4 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
      <p class="text-neutral-600 mb-6 leading-relaxed italic">"${esc(t.quote)}"</p>
      <div class="flex items-center gap-3">
        ${t.portrait ? `<img src="${sanitizeUrl(t.portrait)}" alt="${escAttr(t.author)}" class="w-10 h-10 rounded-full object-cover"/>` : `<div class="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--primary)]">${esc(t.author.charAt(0))}</div>`}
        <div>
          <div class="font-semibold text-neutral-800 text-sm">${esc(t.author)}</div>
          <div class="text-xs text-neutral-500">${esc(t.role)}</div>
        </div>
      </div>
    </div>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(orgName)} | Official Website</title>
  <meta name="description" content="${escAttr(aboutText.slice(0, 160))}">
  <meta property="og:title" content="${escAttr(orgName)}">
  <meta property="og:description" content="${escAttr(aboutText.slice(0, 160))}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/s/${orgSlug}/site">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;600;700;800;900&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: ${primary};
      --secondary: ${secondary};
      --accent: ${accent};
    }
    html { scroll-behavior: smooth; }
    body { font-family: '${bodyFont}', sans-serif; }
    .font-display { font-family: '${headingFont}', sans-serif; }

    /* Animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
    }
    .animate-on-scroll.animate {
      animation: fadeInUp 0.7s ease-out forwards;
    }

    /* Mobile menu */
    .mobile-menu { transform: translateX(100%); transition: transform 0.3s ease-in-out; }
    .mobile-menu.open { transform: translateX(0); }
    .mobile-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
    .mobile-overlay.open { opacity: 1; pointer-events: auto; }

    /* Navbar scroll effect */
    .navbar { transition: background-color 0.3s ease, box-shadow 0.3s ease; }
    .navbar.scrolled { background-color: rgba(255,255,255,0.95); backdrop-filter: blur(12px); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  </style>
</head>
<body class="bg-white text-neutral-800 antialiased">

  <!-- Navigation -->
  <nav class="navbar fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="#" class="flex items-center gap-3 flex-shrink-0">
          ${effectiveLogoUrl
            ? `<img src="${effectiveLogoUrl}" alt="${escAttr(orgName)}" class="h-8 w-auto max-w-[160px] object-contain"/>`
            : `<span class="text-lg font-bold font-display text-[var(--primary)]">${esc(orgName)}</span>`
          }
        </a>
        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-6">
          ${navLinksHtml}
          <a href="${ctaButtonUrl}" target="_blank" rel="noopener noreferrer" class="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90" style="background-color: var(--secondary); color: ${btnTextColor};">
            ${esc(ctaButtonText)}
          </a>
        </div>
        <!-- Mobile hamburger -->
        <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Menu">
          <svg id="menu-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile menu overlay -->
  <div id="mobile-overlay" class="mobile-overlay fixed inset-0 bg-black/40 z-40" onclick="closeMobileMenu()"></div>
  <div id="mobile-menu" class="mobile-menu fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl">
    <div class="flex items-center justify-between p-4 border-b border-neutral-100">
      <span class="font-semibold text-neutral-800">${esc(orgName)}</span>
      <button onclick="closeMobileMenu()" class="p-2 rounded-lg hover:bg-neutral-100">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="py-2">
      ${mobileNavLinksHtml}
      <div class="px-4 pt-4">
        <a href="${ctaButtonUrl}" target="_blank" rel="noopener noreferrer" class="block w-full text-center px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style="background-color: var(--secondary); color: ${btnTextColor};">
          ${esc(ctaButtonText)}
        </a>
      </div>
    </div>
  </div>

  <!-- Hero Section -->
  <section class="relative min-h-screen flex items-center overflow-hidden">
    <div class="absolute inset-0">
      <img src="${heroImg}" alt="" class="w-full h-full object-cover"/>
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
    </div>
    <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div class="max-w-2xl">
        ${yearFounded ? `<div class="animate-on-scroll inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-6 backdrop-blur-sm">Est. ${yearFounded}</div>` : ''}
        <h1 class="animate-on-scroll font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
          ${esc(heroHeadline)}
        </h1>
        ${heroSubheadline ? `<p class="animate-on-scroll text-lg md:text-xl text-white/80 mb-8 max-w-lg leading-relaxed">${esc(heroSubheadline)}</p>` : ''}
        <div class="animate-on-scroll flex flex-wrap gap-4">
          <a href="${ctaButtonUrl}" target="_blank" rel="noopener noreferrer" class="px-8 py-3.5 rounded-full text-base font-semibold transition-all hover:opacity-90 hover:scale-105" style="background-color: var(--secondary); color: ${btnTextColor};">
            ${esc(ctaButtonText)}
          </a>
          <a href="#about" class="px-8 py-3.5 rounded-full text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-all">
            Learn More
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- About / Mission Section -->
  <section id="about" class="py-20 md:py-28 bg-neutral-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <div class="animate-on-scroll text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">About Us</div>
          <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-6 leading-tight">
            Our Mission
          </h2>
          <p class="animate-on-scroll text-neutral-600 leading-relaxed text-lg mb-8">
            ${esc(aboutText)}
          </p>
          ${coreValues.length > 0 ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${valuesHtml}</div>` : ''}
        </div>
        <div class="animate-on-scroll relative">
          <div class="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <img src="${brandData.customImages?.mission || images?.action || `${config.imageBaseUrl}/community-action-neighbors.jpg`}" alt="Our mission" class="w-full h-full object-cover"/>
          </div>
          ${yearFounded ? `<div class="absolute -bottom-4 -left-4 bg-[var(--primary)] text-white px-5 py-3 rounded-xl shadow-lg">
            <div class="text-2xl font-bold font-display">${new Date().getFullYear() - yearFounded}+</div>
            <div class="text-xs text-white/70">Years of Impact</div>
          </div>` : ''}
        </div>
      </div>
    </div>
  </section>

  ${showChallenge ? `
  <!-- Challenge & Solution Section -->
  <section id="challenge" class="py-20 md:py-28">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="animate-on-scroll text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Our Work</div>
        <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
          The Challenge & Our Response
        </h2>
      </div>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="animate-on-scroll bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-5">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
          </div>
          <h3 class="text-xl font-bold text-neutral-900 mb-3 font-display">${esc(need.headline)}</h3>
          <p class="text-neutral-600 leading-relaxed">${esc(need.description)}</p>
        </div>
        <div class="animate-on-scroll bg-[var(--primary)] rounded-2xl p-8 text-white" style="animation-delay: 0.15s">
          <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-3 font-display">Our Solution</h3>
          <p class="text-white/80 leading-relaxed">${esc(solution)}</p>
        </div>
      </div>
    </div>
  </section>` : ''}

  ${showPrograms ? `
  <!-- Programs Section -->
  <section id="programs" class="py-20 md:py-28 ${showChallenge ? 'bg-neutral-50' : ''}">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="animate-on-scroll text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Programs</div>
        <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
          What We Offer
        </h2>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${programsHtml}
      </div>
    </div>
  </section>` : ''}

  ${showMetrics ? `
  <!-- Impact / Metrics Section -->
  <section id="impact" class="py-20 md:py-28 relative overflow-hidden" style="background-color: var(--primary);">
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);"></div>
    </div>
    <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="animate-on-scroll text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Impact</div>
        <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-white leading-tight">
          By The Numbers
        </h2>
      </div>
      <div class="grid grid-cols-2 ${metrics.length >= 4 ? 'lg:grid-cols-4' : metrics.length === 3 ? 'lg:grid-cols-3' : ''} gap-8 md:gap-12 max-w-4xl mx-auto">
        ${metricsHtml}
      </div>
    </div>
  </section>` : ''}

  ${showTestimonials ? `
  <!-- Testimonials Section -->
  <section id="testimonials" class="py-20 md:py-28 ${(showMetrics || (!showChallenge && !showPrograms)) ? '' : 'bg-neutral-50'}">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="animate-on-scroll text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Testimonials</div>
        <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
          Success Stories
        </h2>
      </div>
      <div class="grid md:grid-cols-${Math.min(testimonials.length, 3)} gap-8 max-w-5xl mx-auto">
        ${testimonialsHtml}
      </div>
    </div>
  </section>` : ''}

  <!-- CTA / Contact Section -->
  <section id="contact" class="py-20 md:py-28 relative overflow-hidden" style="background-color: var(--primary);">
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%);"></div>
    </div>
    <div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="animate-on-scroll font-display text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
        ${esc(ctaHeadline)}
      </h2>
      <p class="animate-on-scroll text-lg text-white/70 mb-10 max-w-xl mx-auto">
        Your support helps us continue making a difference in our community.
      </p>
      <div class="animate-on-scroll flex flex-wrap justify-center gap-4">
        <a href="${ctaButtonUrl}" target="_blank" rel="noopener noreferrer" class="px-10 py-4 rounded-full text-lg font-semibold transition-all hover:opacity-90 hover:scale-105 shadow-lg" style="background-color: var(--secondary); color: ${btnTextColor};">
          ${esc(ctaButtonText)}
        </a>
      </div>
      ${contactEmail ? `<p class="animate-on-scroll mt-8 text-white/50 text-sm">
        Or reach us at <a href="mailto:${escAttr(contactEmail)}" class="text-white/70 underline hover:text-white transition-colors">${esc(contactEmail)}</a>
      </p>` : ''}
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-neutral-900 text-neutral-400 py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          ${effectiveLogoUrl
            ? `<img src="${effectiveLogoUrl}" alt="${escAttr(orgName)}" class="h-6 w-auto max-w-[120px] object-contain brightness-0 invert opacity-70"/>`
            : `<span class="text-sm font-semibold text-neutral-300 font-display">${esc(orgName)}</span>`
          }
        </div>
        <div class="text-center text-sm">
          ${footerText ? `<p class="mb-2">${esc(footerText)}</p>` : ''}
          <p>&copy; ${new Date().getFullYear()} ${esc(orgName)}. All rights reserved.</p>
        </div>
        <div class="text-xs">
          <a href="https://donorspark.app?ref=${orgSlug}" target="_blank" rel="noopener noreferrer" class="text-neutral-500 hover:text-neutral-300 transition-colors">
            Made with DonorSpark
          </a>
        </div>
      </div>
    </div>
  </footer>

  <script>
  (function() {
    // Scroll animations
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('animate'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) { io.observe(el); });

    // Navbar scroll effect
    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) { navbar.classList.add('scrolled'); }
      else { navbar.classList.remove('scrolled'); }
    });

    // Count-up animation for metrics
    var countUpElements = document.querySelectorAll('.count-up');
    var countUpObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = el.dataset.target || el.textContent;
          var numMatch = target.replace(/,/g, '').match(/[\\d.]+/);
          if (numMatch) {
            var targetNum = parseFloat(numMatch[0]);
            var prefix = target.match(/^[^\\d]*/)[0] || '';
            var suffix = target.match(/[^\\d]*$/)[0] || '';
            var hasCommas = target.indexOf(',') >= 0;
            var duration = 2000;
            var startTime = performance.now();
            var anim = function(currentTime) {
              var elapsed = currentTime - startTime;
              var progress = Math.min(elapsed / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var current = Math.floor(targetNum * eased);
              if (hasCommas) current = current.toLocaleString();
              el.textContent = prefix + current + suffix;
              if (progress < 1) { requestAnimationFrame(anim); }
              else { el.textContent = target; }
            };
            requestAnimationFrame(anim);
          }
          countUpObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    countUpElements.forEach(function(el) { countUpObserver.observe(el); });
  })();

  // Mobile menu
  function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
    document.getElementById('mobile-overlay').classList.toggle('open');
    document.body.style.overflow = document.getElementById('mobile-menu').classList.contains('open') ? 'hidden' : '';
  }
  function closeMobileMenu() {
    document.getElementById('mobile-menu').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  </script>
</body>
</html>`;
}

function esc(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str: string): string {
  return esc(str).replace(/'/g, '&#39;');
}

function getButtonTextColor(bgHex: string): string {
  try {
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}
