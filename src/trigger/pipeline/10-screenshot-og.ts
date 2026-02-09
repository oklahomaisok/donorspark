import puppeteer from 'puppeteer';

export async function screenshotOgImage(ogHtml: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(ogHtml, { waitUntil: 'networkidle2', timeout: 30000 });
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    return Buffer.from(screenshot);
  } finally {
    await page.close();
    await browser.close();
  }
}
