import { task, metadata } from '@trigger.dev/sdk/v3';
import { slugify } from '@/lib/slugify';
import { completeDeck, failDeck } from '@/db/queries';
import { PipelineLogger, runStep, runStepSafe } from '../lib/logger';

import { analyzeManualInput, type ManualInput } from '../pipeline/06b-analyze-manual';
import { processBrandData } from '../pipeline/07-process-brand';
import { generateDeck } from '../pipeline/08-generate-deck';
import { generateOg } from '../pipeline/09-generate-og';
import { screenshotOgImage } from '../pipeline/10-screenshot-og';
import { deploy } from '../pipeline/11-deploy';
import { trimAndUploadLogo } from '@/lib/services/logo-processor';

export interface ManualDeckPayload {
  deckSlug: string;
  orgName: string;
  description: string;
  beneficiaries: string;
  sector: string;
  location?: string;
  yearFounded?: number;
  programs?: string[];
  metrics?: { value: string; label: string }[];
  contactEmail?: string;
  donateUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const generateManualDeckTask = task({
  id: 'generate-manual-deck',
  queue: {
    concurrencyLimit: 100,
  },
  run: async (payload: ManualDeckPayload) => {
    const { deckSlug, orgName } = payload;
    const logger = new PipelineLogger(deckSlug, 'manual-entry');

    try {
      // Step 1: Claude text analysis
      metadata.set('step', 'Analyzing with AI...');
      metadata.set('progress', 10);
      const manualInput: ManualInput = {
        orgName: payload.orgName,
        description: payload.description,
        beneficiaries: payload.beneficiaries,
        sector: payload.sector,
        location: payload.location,
        yearFounded: payload.yearFounded,
        programs: payload.programs,
        metrics: payload.metrics,
        contactEmail: payload.contactEmail,
        donateUrl: payload.donateUrl,
        primaryColor: payload.primaryColor,
        accentColor: payload.accentColor,
      };

      const claudeAnalysis = await runStep(
        logger,
        '01_analyze_manual',
        () => analyzeManualInput(manualInput),
        (analysis) => ({
          orgName: analysis.orgName,
          sector: analysis.sector,
          hasTagline: !!analysis.tagline,
          programsFound: analysis.programs?.length || 0,
        })
      );

      // Step 2: Process brand data (pass empty arrays for scraped data)
      metadata.set('step', 'Processing brand identity...');
      metadata.set('progress', 40);
      logger.startStep('02_process_brand');
      const brandData = processBrandData(
        claudeAnalysis,
        [], // visionColors - none for manual
        { dominant: [], vibrant: null, muted: null, source: 'manual' }, // logoColors
        payload.metrics || [], // pass user metrics as extractedMetrics
        { heading: null, body: null }, // detectedFonts
        payload.logoUrl || null, // logoUrl
        payload.logoUrl ? 'user-upload' : 'none', // logoSource
        null, // headerBgColor
        '', // originalUrl - empty for manual
      );
      logger.endStep('success', {
        orgName: brandData.orgName,
        sector: brandData.sector,
        primaryColor: brandData.colors?.primary,
        accentColor: brandData.colors?.accent,
      });

      // Override colors if user provided them
      if (payload.primaryColor) {
        brandData.colors.primary = payload.primaryColor;
      }
      if (payload.accentColor) {
        brandData.colors.accent = payload.accentColor;
      }

      const slug = deckSlug || slugify(brandData.orgName);

      // Step 3: Trim logo (skip if no logo)
      metadata.set('step', 'Optimizing logo...');
      metadata.set('progress', 50);
      if (brandData.logoUrl) {
        const trimmedLogoUrl = await runStepSafe(
          logger,
          '03_trim_logo',
          () => trimAndUploadLogo(brandData.logoUrl, slug),
          brandData.logoUrl,
          (url) => ({ trimmed: url !== brandData.logoUrl })
        );
        if (trimmedLogoUrl && trimmedLogoUrl !== brandData.logoUrl) {
          brandData.logoUrl = trimmedLogoUrl;
        }
      }

      // Step 4: Generate deck HTML
      metadata.set('step', 'Building your story deck...');
      metadata.set('progress', 55);
      logger.startStep('04_generate_deck_html');
      const deckHtml = generateDeck(slug, brandData);
      logger.endStep('success', { htmlSizeKb: Math.round(deckHtml.length / 1024) });

      // Step 5: Generate OG HTML
      metadata.set('step', 'Creating social preview...');
      metadata.set('progress', 65);
      logger.startStep('05_generate_og_html');
      const ogHtml = generateOg(slug, brandData);
      logger.endStep('success', { htmlSize: ogHtml.length });

      // Step 6: Screenshot OG image
      metadata.set('step', 'Rendering preview image...');
      metadata.set('progress', 75);
      const ogPngBuffer = await runStep(
        logger,
        '06_screenshot_og',
        () => screenshotOgImage(ogHtml),
        (buf) => ({ sizeKb: Math.round(buf.length / 1024) })
      );

      // Step 7: Deploy to Vercel Blob
      metadata.set('step', 'Publishing your deck...');
      metadata.set('progress', 85);
      const deployResult = await runStep(
        logger,
        '07_deploy',
        () => deploy(slug, deckHtml, ogPngBuffer),
        (r) => ({ deckUrl: r.deckUrl, ogImageUrl: r.ogImageUrl })
      );
      const { deckUrl, ogImageUrl } = deployResult;

      // Step 8: Update database
      logger.startStep('08_update_db');
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

      // Finalize
      const pipelineLog = logger.finalize('success', {
        orgName: brandData.orgName,
        logoSource: payload.logoUrl ? 'user-upload' : 'none',
        logoFound: !!payload.logoUrl,
        metricsFound: payload.metrics?.length || 0,
        sector: brandData.sector,
      });

      metadata.set('step', 'Complete!');
      metadata.set('progress', 100);
      metadata.set('deckUrl', deckUrl);
      metadata.set('ogImageUrl', ogImageUrl);
      metadata.set('orgName', brandData.orgName);
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

      logger.finalize('failed', {
        logoFound: !!payload.logoUrl,
        metricsFound: payload.metrics?.length || 0,
      }, message);

      metadata.set('step', 'Failed');
      metadata.set('error', message);

      await failDeck(deckSlug, message);
      throw error;
    }
  },
});
