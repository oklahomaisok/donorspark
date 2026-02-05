import type { BrandData } from '../types';
import { config } from '../config';

export function generateOgHtml(slug: string, brandData: BrandData): string {
  const {
    orgName = 'Organization',
    colors = { primary: '#1D2350', secondary: '#FFC303', accent: '#FFC303' },
    logoUrl = '',
    logoSource = '',
    donorHeadline = 'Making A Difference',
    heroHook = '',
    tagline = '',
    images,
  } = brandData;

  const primary = colors.primary;
  const accent = colors.accent;
  const ogImgUrl = `${config.imageBaseUrl}/og/${images?.sector || 'community'}-og.jpg`;

  const headlineWords = donorHeadline.split(' ');
  const headlineMain = headlineWords.slice(0, -1).join(' ');
  const headlineAccent = headlineWords.slice(-1)[0] || '';

  const showLogo = logoUrl && !logoUrl.includes('favicon') && logoSource !== 'google-favicon';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 1200px;
            height: 630px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            position: relative;
        }
        .bg-image {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .bg-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, ${primary}CC 0%, ${primary}DD 50%, ${primary}EE 100%);
        }
        .container {
            position: relative;
            z-index: 1;
            height: 100%;
            padding: 60px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .logo-area { display: flex; align-items: center; gap: 24px; }
        .logo-area img { height: 160px; width: auto; max-width: 500px; object-fit: contain; }
        .logo-text { font-size: 36px; font-weight: 700; color: white; }
        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        h1 { font-size: 56px; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 20px; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
        h1 span { color: ${accent}; }
        .subtitle { font-size: 24px; color: rgba(255,255,255,0.9); max-width: 700px; text-shadow: 0 1px 10px rgba(0,0,0,0.3); }
        .badge { align-self: flex-end; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 100px; font-size: 14px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    </style>
</head>
<body>
    <img class="bg-image" src="${ogImgUrl}" alt="">
    <div class="bg-overlay"></div>
    <div class="container">
        <div class="logo-area">
            ${showLogo ? `<img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">` : ''}
            <span class="logo-text">${orgName}</span>
        </div>
        <div class="content">
            <h1>${headlineMain} <span>${headlineAccent}</span></h1>
            <div class="subtitle">${heroHook || tagline || ''}</div>
        </div>
        <div class="badge">Impact Story</div>
    </div>
</body>
</html>`;
}
