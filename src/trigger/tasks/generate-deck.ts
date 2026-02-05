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
import { trimAndUploadLogo } from '@/lib/services/logo-processor';

// Helper for timing steps
function timer() {
  const start = Date.now();
  return () => ((Date.now() - start) / 1000).toFixed(1) + 's';
}

export const generateDeckTask = task({
  id: 'generate-deck',
  queue: {
    concurrencyLimit: 100,
  },
  run: async (payload: { url: string; orgName: string; deckSlug: string }) => {
    const { url, orgName, deckSlug } = payload;
    const timings: Record<string, string> = {};
    const totalTimer = timer();

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
      let stepTimer = timer();
      const screenshotBuffer = await captureScreenshot(normalizedUrl);
      const screenshotBase64 = screenshotBuffer.toString('base64');
      timings['01_screenshot'] = stepTimer();
      console.log(`[TIMING] 01_screenshot: ${timings['01_screenshot']}`);

      // Step 2: Logo discovery
      metadata.set('step', 'Finding your logo...');
      metadata.set('progress', 10);
      stepTimer = timer();
      const { logoUrl, logoSource, headerBgColor, detectedFonts } = await discoverLogo(normalizedUrl, domain);
      timings['02_logo'] = stepTimer();
      console.log(`[TIMING] 02_logo: ${timings['02_logo']} (source: ${logoSource})`);

      // Step 3: Color extraction
      metadata.set('step', 'Extracting brand colors...');
      metadata.set('progress', 15);
      stepTimer = timer();
      const { visionColors, logoColors } = await extractColors(domain, screenshotBase64, logoUrl);
      timings['03_colors'] = stepTimer();
      console.log(`[TIMING] 03_colors: ${timings['03_colors']}`);

      // Step 4: About page discovery
      metadata.set('step', 'Reading your mission statement...');
      metadata.set('progress', 20);
      stepTimer = timer();
      const aboutPageContent = await discoverAboutPage(normalizedUrl, domain, origin);
      timings['04_about'] = stepTimer();
      console.log(`[TIMING] 04_about: ${timings['04_about']} (${aboutPageContent.length} chars)`);

      // Step 5: Metric extraction
      metadata.set('step', 'Crunching the numbers...');
      metadata.set('progress', 25);
      stepTimer = timer();
      const extractedMetrics = extractMetrics(aboutPageContent);
      timings['05_metrics'] = stepTimer();
      console.log(`[TIMING] 05_metrics: ${timings['05_metrics']} (${extractedMetrics.length} found)`);

      // Step 6: Claude analysis
      metadata.set('step', 'Analyzing with AI...');
      metadata.set('progress', 35);
      stepTimer = timer();
      const claudeAnalysis = await analyzeWithClaude(
        screenshotBase64,
        normalizedUrl,
        orgName || '',
        logoUrl,
        extractedMetrics,
      );
      timings['06_claude'] = stepTimer();
      console.log(`[TIMING] 06_claude: ${timings['06_claude']}`);

      // Step 7: Process brand data
      metadata.set('step', 'Processing brand identity...');
      metadata.set('progress', 50);
      stepTimer = timer();
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
      timings['07_brand'] = stepTimer();
      console.log(`[TIMING] 07_brand: ${timings['07_brand']}`);

      const slug = deckSlug || slugify(brandData.orgName);

      // Step 7b: Trim logo padding (removes transparent edges)
      metadata.set('step', 'Optimizing logo...');
      metadata.set('progress', 55);
      stepTimer = timer();
      const trimmedLogoUrl = await trimAndUploadLogo(brandData.logoUrl, slug);
      const logoWasTrimmed = trimmedLogoUrl && trimmedLogoUrl !== brandData.logoUrl;
      if (logoWasTrimmed) {
        brandData.logoUrl = trimmedLogoUrl;
      }
      timings['07b_logo_trim'] = stepTimer();
      console.log(`[TIMING] 07b_logo_trim: ${timings['07b_logo_trim']} (trimmed: ${logoWasTrimmed})`);

      // Step 8: Generate deck HTML
      metadata.set('step', 'Building your story deck...');
      metadata.set('progress', 60);
      stepTimer = timer();
      const deckHtml = generateDeck(slug, brandData);
      timings['08_deck_html'] = stepTimer();
      console.log(`[TIMING] 08_deck_html: ${timings['08_deck_html']}`);

      // Step 9: Generate OG HTML
      metadata.set('step', 'Creating social preview...');
      metadata.set('progress', 70);
      stepTimer = timer();
      const ogHtml = generateOg(slug, brandData);
      timings['09_og_html'] = stepTimer();
      console.log(`[TIMING] 09_og_html: ${timings['09_og_html']}`);

      // Step 10: Screenshot OG image
      metadata.set('step', 'Rendering preview image...');
      metadata.set('progress', 80);
      stepTimer = timer();
      const ogPngBuffer = await screenshotOgImage(ogHtml);
      timings['10_og_screenshot'] = stepTimer();
      console.log(`[TIMING] 10_og_screenshot: ${timings['10_og_screenshot']}`);

      // Step 11: Deploy to Vercel Blob
      metadata.set('step', 'Publishing your deck...');
      metadata.set('progress', 90);
      stepTimer = timer();
      const { deckUrl, ogImageUrl } = await deploy(slug, deckHtml, ogPngBuffer);
      timings['11_deploy'] = stepTimer();
      console.log(`[TIMING] 11_deploy: ${timings['11_deploy']}`);

      timings['total'] = totalTimer();
      console.log(`[TIMING] TOTAL: ${timings['total']}`);
      console.log(`[TIMING] Summary:`, JSON.stringify(timings));

      // Mark complete in DB (non-blocking - deck exists even if this fails)
      stepTimer = timer();
      try {
        await completeDeck(slug, {
          deckUrl,
          ogImageUrl,
          sector: brandData.sector,
          brandData,
          orgName: brandData.orgName,
        });
      } catch (dbError) {
        console.error('DB update failed but deck was generated:', dbError);
        // Continue - the deck exists and is accessible
      }
      timings['12_db'] = stepTimer();
      console.log(`[TIMING] 12_db: ${timings['12_db']}`);

      metadata.set('step', 'Complete!');
      metadata.set('progress', 100);
      metadata.set('deckUrl', deckUrl);
      metadata.set('ogImageUrl', ogImageUrl);
      metadata.set('orgName', brandData.orgName);
      metadata.set('timings', timings);
      metadata.set('logoSource', logoSource);
      metadata.set('logoTrimmed', logoWasTrimmed);

      return { deckUrl, ogImageUrl, orgName: brandData.orgName, slug, timings };
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
