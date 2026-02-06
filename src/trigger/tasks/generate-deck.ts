import { task, metadata } from '@trigger.dev/sdk/v3';
import { slugify } from '@/lib/slugify';
import { completeDeck, failDeck } from '@/db/queries';
import { PipelineLogger, runStep, runStepSafe } from '../lib/logger';

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

export const generateDeckTask = task({
  id: 'generate-deck',
  queue: {
    concurrencyLimit: 100,
  },
  run: async (payload: { url: string; orgName: string; deckSlug: string }) => {
    const { url, orgName, deckSlug } = payload;
    const logger = new PipelineLogger(deckSlug, url);

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
      const screenshotBuffer = await runStep(
        logger,
        '01_screenshot',
        () => captureScreenshot(normalizedUrl),
        (buf) => ({ sizeKb: Math.round(buf.length / 1024) })
      );
      const screenshotBase64 = screenshotBuffer.toString('base64');

      // Step 2: Logo discovery
      metadata.set('step', 'Finding your logo...');
      metadata.set('progress', 10);
      const logoResult = await runStep(
        logger,
        '02_discover_logo',
        () => discoverLogo(normalizedUrl, domain),
        (r) => ({
          source: r.logoSource,
          found: !!r.logoUrl,
          headerBgColor: r.headerBgColor,
          fontsDetected: r.detectedFonts ? Object.keys(r.detectedFonts).length : 0,
        })
      );
      const { logoUrl, logoSource, headerBgColor, detectedFonts } = logoResult;

      // Step 3: Color extraction
      metadata.set('step', 'Extracting brand colors...');
      metadata.set('progress', 15);
      const colorResult = await runStep(
        logger,
        '03_extract_colors',
        () => extractColors(domain, screenshotBase64, logoUrl),
        (r) => ({
          visionColors: r.visionColors?.length || 0,
          logoColors: r.logoColors?.dominant?.length || 0,
        })
      );
      const { visionColors, logoColors } = colorResult;

      // Step 4: About page discovery (safe - use empty string if fails)
      metadata.set('step', 'Reading your mission statement...');
      metadata.set('progress', 20);
      const aboutPageContent = await runStepSafe(
        logger,
        '04_discover_about',
        () => discoverAboutPage(normalizedUrl, domain, origin),
        '',
        (content) => ({ contentLength: content.length })
      );

      // Step 5: Metric extraction
      metadata.set('step', 'Crunching the numbers...');
      metadata.set('progress', 25);
      logger.startStep('05_extract_metrics');
      const extractedMetrics = extractMetrics(aboutPageContent);
      logger.endStep('success', { metricsFound: extractedMetrics.length });

      // Step 6: Claude analysis
      metadata.set('step', 'Analyzing with AI...');
      metadata.set('progress', 35);
      const claudeAnalysis = await runStep(
        logger,
        '06_analyze_claude',
        () => analyzeWithClaude(screenshotBase64, normalizedUrl, orgName || '', logoUrl, extractedMetrics),
        (analysis) => ({
          orgName: analysis.orgName,
          sector: analysis.sector,
          hasTagline: !!analysis.tagline,
          programsFound: analysis.programs?.length || 0,
        })
      );

      // Step 7: Process brand data
      metadata.set('step', 'Processing brand identity...');
      metadata.set('progress', 50);
      logger.startStep('07_process_brand');
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
      logger.endStep('success', {
        orgName: brandData.orgName,
        sector: brandData.sector,
        primaryColor: brandData.colors?.primary,
        headingFont: brandData.fonts?.headingFont,
      });

      const slug = deckSlug || slugify(brandData.orgName);

      // Step 7b: Trim logo padding
      metadata.set('step', 'Optimizing logo...');
      metadata.set('progress', 55);
      const trimmedLogoUrl = await runStepSafe(
        logger,
        '07b_trim_logo',
        () => trimAndUploadLogo(brandData.logoUrl, slug),
        brandData.logoUrl,
        (url) => ({ trimmed: url !== brandData.logoUrl })
      );
      const logoWasTrimmed = trimmedLogoUrl && trimmedLogoUrl !== brandData.logoUrl;
      if (logoWasTrimmed) {
        brandData.logoUrl = trimmedLogoUrl;
      }

      // Step 8: Generate deck HTML
      metadata.set('step', 'Building your story deck...');
      metadata.set('progress', 60);
      logger.startStep('08_generate_deck_html');
      const deckHtml = generateDeck(slug, brandData);
      logger.endStep('success', { htmlSizeKb: Math.round(deckHtml.length / 1024) });

      // Step 9: Generate OG HTML
      metadata.set('step', 'Creating social preview...');
      metadata.set('progress', 70);
      logger.startStep('09_generate_og_html');
      const ogHtml = generateOg(slug, brandData);
      logger.endStep('success', { htmlSize: ogHtml.length });

      // Step 10: Screenshot OG image
      metadata.set('step', 'Rendering preview image...');
      metadata.set('progress', 80);
      const ogPngBuffer = await runStep(
        logger,
        '10_screenshot_og',
        () => screenshotOgImage(ogHtml),
        (buf) => ({ sizeKb: Math.round(buf.length / 1024) })
      );

      // Step 11: Deploy to Vercel Blob
      metadata.set('step', 'Publishing your deck...');
      metadata.set('progress', 90);
      const deployResult = await runStep(
        logger,
        '11_deploy',
        () => deploy(slug, deckHtml, ogPngBuffer),
        (r) => ({ deckUrl: r.deckUrl, ogImageUrl: r.ogImageUrl })
      );
      const { deckUrl, ogImageUrl } = deployResult;

      // Step 12: Update database
      logger.startStep('12_update_db');
      try {
        await completeDeck(slug, {
          deckUrl,
          ogImageUrl,
          sector: brandData.sector,
          brandData,
          orgName: brandData.orgName,
        });
        logger.endStep('success');
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : 'Unknown';
        logger.endStep('warning', { note: 'Deck exists but DB update failed' }, msg);
      }

      // Finalize logging
      const pipelineLog = logger.finalize('success', {
        orgName: brandData.orgName,
        logoSource,
        logoFound: !!logoUrl,
        metricsFound: extractedMetrics.length,
        sector: brandData.sector,
      });

      // Set metadata for Trigger.dev dashboard
      metadata.set('step', 'Complete!');
      metadata.set('progress', 100);
      metadata.set('deckUrl', deckUrl);
      metadata.set('ogImageUrl', ogImageUrl);
      metadata.set('orgName', brandData.orgName);
      metadata.set('logoSource', logoSource);
      metadata.set('logoFound', !!logoUrl);
      metadata.set('logoTrimmed', logoWasTrimmed);
      metadata.set('metricsFound', extractedMetrics.length);
      metadata.set('sector', brandData.sector);
      metadata.set('totalDuration', pipelineLog.totalDuration);

      return {
        deckUrl,
        ogImageUrl,
        orgName: brandData.orgName,
        slug,
        pipelineLog,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Finalize with failure
      logger.finalize('failed', {
        logoFound: false,
        metricsFound: 0,
      }, message);

      metadata.set('step', 'Failed');
      metadata.set('error', message);

      await failDeck(deckSlug, message);
      throw error;
    }
  },
});
