import puppeteer from 'puppeteer';

export async function discoverAboutPage(url: string, domain: string, origin: string): Promise<string> {
  let aboutPageContent = '';
  let aboutPageUrl: string | null = null;

  // Step 1: Scrape nav links for About page
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    });
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      aboutPageUrl = await page.evaluate((origin: string, domain: string) => {
        const aboutKeywords = ['about', 'who we are', 'our story', 'our mission', 'mission', 'what we do', 'who-we-are', 'our-story', 'our-mission'];
        const links = document.querySelectorAll('nav a, header a, .nav a, .navigation a, .menu a, #menu a, [role="navigation"] a');

        for (const link of Array.from(links)) {
          const a = link as HTMLAnchorElement;
          const href = a.href || a.getAttribute('href') || '';
          const text = (a.textContent || '').toLowerCase().trim();
          const hrefLower = href.toLowerCase();

          const isAboutLink = aboutKeywords.some(kw =>
            text.includes(kw) || hrefLower.includes(kw.replace(/ /g, '-')) || hrefLower.includes(kw.replace(/ /g, ''))
          );

          if (isAboutLink && href) {
            let aboutUrl = href;
            if (aboutUrl.startsWith('//')) aboutUrl = 'https:' + aboutUrl;
            else if (aboutUrl.startsWith('/')) aboutUrl = origin + aboutUrl;
            else if (!aboutUrl.startsWith('http')) aboutUrl = origin + '/' + aboutUrl;

            if (!aboutUrl.includes(domain)) continue;
            return aboutUrl;
          }
        }
        return null;
      }, origin, domain);
    } finally {
      await page.close();
      await browser.close();
    }
  } catch {}

  // Step 2: Fetch the About page content
  if (aboutPageUrl) {
    const content = await fetchPageText(aboutPageUrl);
    if (content && content.length > 200) {
      aboutPageContent = `=== ABOUT PAGE (${aboutPageUrl}) ===\n${content.substring(0, 8000)}`;
    }
  }

  // Step 3: Try common URLs as fallback
  if (!aboutPageContent) {
    const commonUrls = [
      `${origin}/about`, `${origin}/about/`, `${origin}/about-us`,
      `${origin}/about-us/`, `${origin}/who-we-are`, `${origin}/our-mission`,
    ];

    for (const tryUrl of commonUrls) {
      const content = await fetchPageText(tryUrl);
      if (content && content.length > 200) {
        aboutPageContent = `=== ABOUT PAGE (${tryUrl}) ===\n${content.substring(0, 8000)}`;
        break;
      }
    }
  }

  // Step 4: Always fetch homepage for impact stats
  const homepageContent = await fetchPageText(url);
  if (homepageContent && homepageContent.length > 200) {
    if (aboutPageContent) {
      aboutPageContent += '\n\n=== HOMEPAGE IMPACT DATA ===\n' + homepageContent.substring(0, 6000);
    } else {
      aboutPageContent = '=== HOMEPAGE ===\n' + homepageContent.substring(0, 6000);
    }
  }

  return aboutPageContent;
}

async function fetchPageText(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    let html = await res.text();

    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    html = html.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    html = html.replace(/<[^>]+>/g, ' ');
    html = html.replace(/\s+/g, ' ').trim();
    html = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    return html;
  } catch {
    return null;
  }
}
