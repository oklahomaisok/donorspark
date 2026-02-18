import { NextResponse } from 'next/server';

const DECK_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sara's Project | Impact Deck</title>
    <meta name="description" content="To provide education, collaboration and victim advocacy to assist children and adults experiencing crisis resulting from trauma, abuse or loss.">
    <meta property="og:title" content="Sara's Project | Impact Deck">
    <meta property="og:description" content="To provide education, collaboration and victim advocacy to assist children and adults experiencing crisis resulting from trauma, abuse or loss.">
    <meta property="og:image" content="https://donorspark.app/decks/saras-project/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="https://donorspark.app/decks/saras-project/og-image.png">
    <link rel="icon" href="https://sarasprojectok.org/wp-content/themes/sara/img/saras-project-logo.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&family=Source+Serif+4:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #E50058; --secondary: #2BBAB4; --accent: #FFFFFF; --header-bg: #E50058; --header-text: #ffffff; }
        body { font-family: 'Source Serif 4', sans-serif; background-color: color-mix(in srgb, var(--primary) 85%, black); color: white; }
        h1, h2, h3, .font-display { font-family: 'Montserrat', sans-serif; }
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
            <img src="https://sarasprojectok.org/wp-content/themes/sara/img/saras-project-logo.svg" alt="Sara's Project" class="h-10 w-auto object-contain">
        </div>
        <div id="pagination-dots" class="hidden sm:flex items-center justify-center gap-2 w-1/3">
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
<div class="w-2 h-2 rounded-full bg-neutral-400 cursor-pointer hover:bg-[var(--accent)] transition-all"></div>
</div>
        <div class="hidden md:flex items-center justify-end gap-2 w-1/3">
            <button id="prevBtn" class="p-2 rounded-full hover:bg-white/10 hover:text-[var(--accent)] transition-colors" style="color: var(--header-text); opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>
            <button id="nextBtn" class="p-2 rounded-full hover:bg-black/10 hover:text-[var(--accent)] transition-colors" style="color: var(--header-text); opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
        <div class="md:hidden flex items-center justify-end w-auto text-xs gap-1 opacity-80" style="color: var(--header-text);"><span class="font-display font-bold tracking-widest uppercase">SWIPE</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg></div>
    </nav>
    <main id="slider" class="flex flex-row overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full pt-24 md:pt-28 pb-6 md:pb-10 px-4 md:px-10 gap-x-4 md:gap-x-12 scroll-smooth" style="mask-image: linear-gradient(90deg, transparent, black 5%, black 95%, transparent);">
        <!-- Slide 1: Hero -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><video autoplay muted loop playsinline poster="https://oklahomaisok.github.io/nonprofit-decks/images/youth-dev-hero-reading-girl.jpg" class="w-full h-full object-cover"><source src="https://donorspark-videos.vercel.app/youth-dev-hero-reading-girl.mp4" type="video/mp4"></video><div class="absolute inset-0 bg-black/40"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div></div>
            <div class="flex flex-col z-10 p-6 md:p-10 h-full justify-between">
                <div class="flex animate-on-scroll items-start justify-between"><span class="text-[10px] text-[var(--accent)] uppercase tracking-widest font-bold border border-[var(--accent)]/30 px-2 py-1 rounded bg-[var(--primary)]/80 backdrop-blur-md">Impact Deck</span></div>
                <div class="mt-auto"><h1 class="leading-[0.9] animate-on-scroll text-4xl md:text-5xl tracking-wide font-display uppercase text-white mb-4 drop-shadow-lg">Help Communities<br><span class="text-[var(--accent)]">Heal Together</span></h1><div class="animate-on-scroll"><p class="text-sm text-neutral-100 max-w-[90%] border-l-4 border-[var(--accent)] pl-4 font-medium">Sara's Project provides crisis intervention and advocacy for children and families in Southern Oklahoma</p></div></div>
                <div class="pt-4 border-t border-white/10 flex justify-between items-end animate-on-scroll"><div class="flex flex-col"><span class="text-[10px] text-neutral-300 uppercase mb-1 tracking-wider">Established</span><span class="font-display text-sm text-white">Since 1991</span></div><div class="text-[var(--accent)] flex items-center gap-2 text-xs uppercase tracking-widest font-bold">Scroll <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div></div>
            </div>
        </section>
        <!-- Slide 2: Mission -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="https://oklahomaisok.github.io/nonprofit-decks/images/youth-dev-action-mentor-bench.jpg" class="w-full h-full object-cover" alt="Action"><div class="absolute inset-0 bg-black/60"></div><div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex animate-on-scroll items-center justify-between mb-6"><span class="font-mono text-xs text-[var(--accent)] font-bold">[02]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-white/70">Our Mission</span></header>
                <div class="flex-grow flex flex-col justify-center space-y-6"><div class="animate-on-scroll"><h2 class="text-2xl md:text-3xl text-white font-display font-black uppercase tracking-tight leading-none mb-3">Building A<br><span class="text-[var(--accent)]">Better Future</span></h2><div class="w-12 h-1 bg-[var(--accent)] mb-4"></div><p class="text-sm text-neutral-100 leading-relaxed font-medium">To provide education, collaboration and victim advocacy to assist children and adults experiencing crisis resulting from trauma, abuse or loss.</p></div><div class="grid grid-cols-2 gap-3 animate-on-scroll">
<div class="bg-white/10 border border-white/10 p-3 rounded text-center backdrop-blur-sm"><div class="text-[var(--accent)] font-black uppercase text-xs tracking-wider">Compassionate Advocacy</div></div>
<div class="bg-white/10 border border-white/10 p-3 rounded text-center backdrop-blur-sm"><div class="text-[var(--accent)] font-black uppercase text-xs tracking-wider">Community Collaboration</div></div>
<div class="bg-white/10 border border-white/10 p-3 rounded text-center backdrop-blur-sm"><div class="text-[var(--accent)] font-black uppercase text-xs tracking-wider">Healing Through Support</div></div>
<div class="bg-white/10 border border-white/10 p-3 rounded text-center backdrop-blur-sm"><div class="text-[var(--accent)] font-black uppercase text-xs tracking-wider">Crisis Intervention</div></div>
</div></div>
            </div>
        </section>
        <!-- Slide 3: Challenge & Solution -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex animate-on-scroll items-center justify-between mb-6"><span class="font-mono text-xs text-[var(--accent)] font-bold">[03]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-white/70">The Challenge</span></header>
                <div class="flex-grow flex flex-col justify-center"><div class="animate-on-scroll bg-white/5 border border-white/10 rounded-lg p-6"><div class="flex items-center gap-3 mb-4"><div class="p-2 bg-[var(--accent)]/20 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h2 class="text-xl md:text-2xl text-white font-display font-black uppercase">Oklahoma's Children Need Protection</h2></div><p class="text-sm text-neutral-200 leading-relaxed">1 in 3 girls and 1 in 5 boys in Oklahoma will be victims of sexual abuse before their 18th birthday. Additionally, one person dies by suicide every 11 hours in our state.</p></div><div class="flex justify-center my-4 animate-on-scroll text-white/30"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v15"/><path d="m19 12-7 7-7-7"/></svg></div><div class="animate-on-scroll bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-lg p-6"><div class="flex items-center gap-3 mb-4"><div class="p-2 bg-[var(--accent)] rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3 class="text-xl text-[var(--accent)] font-display font-black uppercase">Our Solution</h3></div><p class="text-sm text-neutral-200 leading-relaxed">Sara's Project provides a coordinated, multidisciplinary approach bringing together law enforcement, social services, medical professionals, and advocacy staff to ensure comprehensive crisis intervention and support for children and families affected by trauma.</p></div></div>
            </div>
        </section>
        <!-- Slide 4: Programs -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="https://oklahomaisok.github.io/nonprofit-decks/images/youth-dev-group-circle.jpg" class="w-full h-full object-cover" alt="Programs"><div class="absolute inset-0 bg-black/60"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex animate-on-scroll items-center justify-between mb-6"><span class="font-mono text-xs text-[var(--accent)] font-bold">[04]</span><div class="p-2 bg-white/10 rounded-full backdrop-blur-md"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg></div></header>
                <div class="flex-grow flex flex-col justify-center"><div class="mb-6 animate-on-scroll"><h2 class="text-3xl md:text-4xl text-white font-display font-black tracking-tighter uppercase leading-none drop-shadow-xl">What We<br><span class="text-[var(--accent)]">Offer</span></h2></div><div class="animate-on-scroll bg-[var(--primary)]/70 p-4 rounded-lg backdrop-blur-md border border-white/10"><p class="leading-relaxed text-sm text-neutral-100 mb-4 font-medium">We deliver comprehensive programs designed to protect children and support families experiencing crisis in Southern Oklahoma.</p><div class="flex flex-wrap gap-2">
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Child &amp; Family Advocacy</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Forensic Interviews</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Medical Examinations</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Trauma-Focused Therapy</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Suicide Prevention Trainings</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Internet Safety Training</span>
<span class="px-2 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--accent)]">Emergency Clothing &amp; Supplies</span>
</div></div></div>
            </section>
        <!-- Slide 6: Testimonials -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-white/10 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 z-0"><img src="https://oklahomaisok.github.io/nonprofit-decks/images/youth-dev-action-mentor-bench.jpg" class="w-full h-full object-cover" alt="Background"><div class="absolute inset-0 bg-black/70"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div></div>
            <div class="flex flex-col h-full p-6 md:p-10 z-10">
                <header class="flex justify-between items-center mb-4 animate-on-scroll"><span class="font-mono text-xs text-[var(--accent)] font-bold">[06]</span><span class="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-400">Success Stories</span></header>
                <div class="flex-grow flex flex-col animate-on-scroll items-center justify-center relative"><div class="absolute top-0 right-0 p-2 opacity-70 text-[10px] font-mono text-[var(--accent)] z-30 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13a4 4 0 0 1-7.7 2.3l-2.6-7.5a1.7 1.7 0 0 0-3.3 1L9 18.2a5.3 5.3 0 0 0 2.2 4.1l6.3 3.6c2.4 1.4 5.3-.2 5.5-2.9l.6-9.1a4 4 0 0 0-5-4.1z"/></svg>TAP CARDS</div><div id="testimonial-stack" class="relative w-full max-w-[280px] md:max-w-[320px] aspect-square cursor-pointer"><div class="testimonial-card card-pos-0 w-full h-full rounded-2xl bg-white p-6 shadow-xl flex flex-col overflow-hidden"><div class="mb-2"><span class="text-5xl font-bold leading-none text-[var(--primary)]" style="font-family:Georgia,serif">&ldquo;</span></div><p class="text-[var(--primary)] text-sm leading-relaxed flex-grow">They were very kind and open, made me feel welcome and safe. I feel like I could tell them anything and they wouldn&#39;t judge me and would help me.&rdquo;</p></div>
<div class="testimonial-card card-pos-1 w-full h-full rounded-2xl bg-white p-6 shadow-xl flex flex-col overflow-hidden"><div class="mb-2"><span class="text-5xl font-bold leading-none text-[var(--primary)]" style="font-family:Georgia,serif">&ldquo;</span></div><p class="text-[var(--primary)] text-sm leading-relaxed flex-grow">The Sara&#39;s Project team answered our questions, spoke so kindly and provided us with so many different resources. My daughter and I both got the help and support we needed right when we needed it most.&rdquo;</p></div>
<div class="testimonial-card card-pos-2 w-full h-full rounded-2xl bg-white p-6 shadow-xl flex flex-col overflow-hidden"><div class="mb-2"><span class="text-5xl font-bold leading-none text-[var(--primary)]" style="font-family:Georgia,serif">&ldquo;</span></div><p class="text-[var(--primary)] text-sm leading-relaxed flex-grow">It&#39;s a very welcoming place with very friendly staff, which helps ease the anxiety of an unknown situation.&rdquo;</p></div>
</div></div>
            </div>
        </section>
        <!-- Slide 7: CTA -->
        <section class="slide-container flex-shrink-0 flex flex-col overflow-hidden snap-center bg-[var(--primary)] border-[var(--accent)]/50 border relative shadow-2xl rounded-xl">
            <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div class="flex flex-col h-full z-10 p-6 md:p-10 justify-center items-center">
                <div class="animate-on-scroll text-center flex flex-col items-center"><img src="https://sarasprojectok.org/wp-content/themes/sara/img/saras-project-logo.svg" alt="Sara's Project" class="h-12 w-auto object-contain mb-4 opacity-80"><h2 class="uppercase leading-tight text-3xl md:text-4xl font-black font-display mb-4 text-white">Join Our<br><span class="text-[var(--accent)]">Mission</span></h2><p class="leading-relaxed text-sm text-neutral-200 max-w-[90%] mx-auto mb-8">Your support helps us continue protecting children and empowering families across Southern Oklahoma.</p><a href="https://www.zeffy.com/en-US/donation-form/2ec5d711-5135-4009-be89-5e0f1044849a?utm_source=donorspark&utm_medium=deck&utm_campaign=saras-project" target="_blank" id="ds-donate-btn" class="inline-flex items-center justify-center px-8 py-4 bg-[var(--accent)] text-[var(--primary)] font-black rounded hover:bg-white transition-all hover:scale-105 shadow-lg shadow-[var(--accent)]/20"><span class="font-display uppercase tracking-widest text-sm">Donate Today</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></div>
            </div>
        </section>
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
        var updateDots = function(idx) { Array.from(dots).forEach(function(d, i) { d.className = i === idx ? 'w-2.5 h-2.5 rounded-full bg-[var(--accent)] cursor-pointer' : 'w-2 h-2 rounded-full bg-neutral-400 hover:bg-[var(--accent)]/70 cursor-pointer'; }); };
        var slideIO = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) updateDots(Array.from(slides).indexOf(e.target)); }); }, { root: slider, threshold: 0.6 });
        slides.forEach(function(s) { slideIO.observe(s); });
        Array.from(dots).forEach(function(d, i) { d.addEventListener('click', function() { slides[i] && slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center' }); }); });
        var scrollAmt = function() { return window.innerWidth < 768 ? window.innerWidth * 0.85 : 548; };
        var nextBtn = document.getElementById('nextBtn');
        var prevBtn = document.getElementById('prevBtn');
        if (nextBtn) nextBtn.addEventListener('click', function() { slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' }); });
        if (prevBtn) prevBtn.addEventListener('click', function() { slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); });
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
      var T='https://www.donorspark.app/api/track',S='saras-project';
      var sid;
      try{sid=sessionStorage.getItem('ds_sid');if(!sid){sid='ds_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);sessionStorage.setItem('ds_sid',sid);}}catch(e){sid='ds_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);}
      function t(e){var d=JSON.stringify({slug:S,event:e,sessionId:sid});if(navigator.sendBeacon){navigator.sendBeacon(T,new Blob([d],{type:'application/json'}));}else{fetch(T,{method:'POST',headers:{'Content-Type':'application/json'},body:d,keepalive:true});}}
      t('view');
      var b=document.getElementById('ds-donate-btn');if(b)b.addEventListener('click',function(){t('click');});
    })();
    </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(DECK_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
