import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const ogHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    /* Subtle grid pattern */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
      background-size: 40px 40px;
    }

    /* Accent glow */
    .glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(193, 90, 54, 0.15) 0%, transparent 70%);
      top: -100px;
      right: -100px;
    }

    .glow-2 {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(193, 90, 54, 0.1) 0%, transparent 70%);
      bottom: -50px;
      left: -50px;
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 80px;
    }

    .logo {
      height: 80px;
      margin-bottom: 40px;
    }

    h1 {
      font-family: 'Instrument Serif', serif;
      font-size: 64px;
      font-weight: 400;
      color: white;
      line-height: 1.1;
      margin-bottom: 24px;
    }

    h1 span {
      color: #C15A36;
    }

    p {
      font-size: 24px;
      color: rgba(255,255,255,0.7);
      max-width: 700px;
      line-height: 1.5;
    }

    .badge {
      margin-top: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 12px 24px;
      border-radius: 100px;
    }

    .badge span {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .badge .dot {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="glow-2"></div>
  <div class="content">
    <img src="https://donorspark.app/donorsparklogo.png" alt="DonorSpark" class="logo">
    <h1>Story Decks That <span>Move Donors</span> to Give</h1>
    <p>Turn your nonprofit website into a stunning, shareable impact deck in seconds. Powered by AI.</p>
    <div class="badge">
      <div class="dot"></div>
      <span>Free &bull; No signup required</span>
    </div>
  </div>
</body>
</html>`;

async function generateOgImage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(ogHtml, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await new Promise(r => setTimeout(r, 1000));

  const buffer = await page.screenshot({ type: 'png' });

  await browser.close();

  const outputPath = path.join(process.cwd(), 'public', 'og-image.png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`OG image saved to: ${outputPath}`);
}

generateOgImage().catch(console.error);
