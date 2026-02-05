import { task, metadata } from '@trigger.dev/sdk/v3';
import { slugify } from '@/lib/slugify';
import { completeDeck, failDeck } from '@/db/queries';

import { captureScreenshot } from '../pipeline/01-screenshot';
import { discoverLogo } from '../pipeline/02-discover-logo';
import { extractColors } from '../pipeline/03-extract-colors';
import { discoverAboutPage } from '../pipeline/04-discover-about';
import { extractMetrics } from '../pipeline/05-scrape-content';
import { analyzeWithClaude } from '../pipeline/06-analyze-claude';
import { processBrandData } from '../pipeline/07-process-brand';
import { generateDeck } from '../pipeline/08-generate-deck';
import { generateOg } from '../pipeline/09-generate-og';
import { screenshotOgImage } from '../pipeline/10-screenshot-og';
import { deploy } from '../pipeline/11-deploy';

export const generateDeckTask = task({
  id: 'generate-deck',
  queue: {
    concurrencyLimit: 100,
  },
  run: async (payload: { url: string; orgName: string; deckSlug: string }) => {
    const { url, orgName, deckSlug } = payload;

    try {
      // Parse URL parts
      let normalizedUrl = url;
      if (normalizedUrl && !normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const originMatch = normalizedUrl.match(/^(https?:\/\/[^\/]+)/);
      const origin = originMatch ? originMatch[1] : normalizedUrl;

      // Step 1: Screenshot
      metadata.set('step', 'Taking screenshot...');
      metadata.set('progress', 5);
      const screenshotBuffer = await captureScreenshot(normalizedUrl);
      const screenshotBase64 = screenshotBuffer.toString('base64');

      // Step 2: Logo discovery
      metadata.set('step', 'Finding your logo...');
      metadata.set('progress', 10);
      const { logoUrl, logoSource, headerBgColor, detectedFonts } = await discoverLogo(normalizedUrl, domain);

      // Step 3: Color extraction
      metadata.set('step', 'Extracting brand colors...');
      metadata.set('progress', 15);
      const { visionColors, logoColors } = await extractColors(domain, screenshotBase64, logoUrl);

      // Step 4: About page discovery
      metadata.set('step', 'Reading your mission statement...');
      metadata.set('progress', 20);
      const aboutPageContent = await discoverAboutPage(normalizedUrl, domain, origin);

      // Step 5: Metric extraction
      metadata.set('step', 'Crunching the numbers...');
      metadata.set('progress', 25);
      const extractedMetrics = extractMetrics(aboutPageContent);

      // Step 6: Claude analysis
      metadata.set('step', 'Analyzing with AI...');
      metadata.set('progress', 35);
      const claudeAnalysis = await analyzeWithClaude(
        screenshotBase64,
        normalizedUrl,
        orgName || '',
        logoUrl,
        extractedMetrics,
      );

      // Step 7: Process brand data
      metadata.set('step', 'Processing brand identity...');
      metadata.set('progress', 50);
      const brandData = processBrandData(
        claudeAnalysis,
        visionColors,
        logoColors,
        extractedMetrics,
        detectedFonts,
        logoUrl,
        logoSource,
        headerBgColor,
        normalizedUrl,
      );

      const slug = deckSlug || slugify(brandData.orgName);

      // Step 8: Generate deck HTML
      metadata.set('step', 'Building your story deck...');
      metadata.set('progress', 60);
      const deckHtml = generateDeck(slug, brandData);

      // Step 9: Generate OG HTML
      metadata.set('step', 'Creating social preview...');
      metadata.set('progress', 70);
      const ogHtml = generateOg(slug, brandData);

      // Step 10: Screenshot OG image
      metadata.set('step', 'Rendering preview image...');
      metadata.set('progress', 80);
      const ogPngBuffer = await screenshotOgImage(ogHtml);

      // Step 11: Deploy to Vercel Blob
      metadata.set('step', 'Publishing your deck...');
      metadata.set('progress', 90);
      const { deckUrl, ogImageUrl } = await deploy(slug, deckHtml, ogPngBuffer);

      // Mark complete in DB (non-blocking - deck exists even if this fails)
      try {
        await completeDeck(slug, {
          deckUrl,
          ogImageUrl,
          sector: brandData.sector,
          brandData,
        });
      } catch (dbError) {
        console.error('DB update failed but deck was generated:', dbError);
        // Continue - the deck exists and is accessible
      }

      metadata.set('step', 'Complete!');
      metadata.set('progress', 100);
      metadata.set('deckUrl', deckUrl);
      metadata.set('ogImageUrl', ogImageUrl);
      metadata.set('orgName', brandData.orgName);

      return { deckUrl, ogImageUrl, orgName: brandData.orgName, slug };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Pipeline failed for deck ${deckSlug}:`, message);

      metadata.set('step', 'Failed');
      metadata.set('error', message);

      await failDeck(deckSlug, message);
      throw error;
    }
  },
});
