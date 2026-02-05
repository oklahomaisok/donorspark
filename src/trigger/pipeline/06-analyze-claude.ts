import { analyzeScreenshot } from '@/lib/services/anthropic';
import type { ClaudeAnalysis, ExtractedMetric } from '@/lib/types';

export async function analyzeWithClaude(
  screenshotBase64: string,
  url: string,
  orgName: string,
  logoUrl: string | null,
  extractedMetrics: ExtractedMetric[],
): Promise<ClaudeAnalysis> {
  const metricsText = extractedMetrics.map(m => `${m.value} ${m.label}`).join(', ') || 'None found';
  return analyzeScreenshot(screenshotBase64, url, orgName, logoUrl, metricsText);
}
