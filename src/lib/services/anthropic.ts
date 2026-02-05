import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import type { ClaudeAnalysis } from '../types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

export async function analyzeScreenshot(
  screenshotBase64: string,
  url: string,
  orgNameHint: string,
  logoUrl: string | null,
  metricsText: string
): Promise<ClaudeAnalysis> {
  const anthropic = getClient();

  const prompt = `Analyze this nonprofit website screenshot and extract brand information. LOGO URL: ${logoUrl || 'none'}. Website URL: ${url}. Organization name hint: ${orgNameHint}. PRE-EXTRACTED METRICS FROM ABOUT PAGE: ${metricsText}. IMPORTANT: Use these EXACT numbers in your metrics array - do not make up different numbers! Return a JSON object with: orgName, donorHeadline (3-6 words), heroHook (8-15 words - MUST include the full organization name for clarity), tagline, location, mission, yearFounded, sector (one of: youth-development, education, agriculture, food-bank, environment, animal-welfare, veterans, seniors, arts-culture, healthcare, housing, disaster-relief, disability-services, mental-health, refugee-immigration, lgbtq, community). SECTOR RULES: Use mental-health for crisis centers dealing with abuse, trauma, counseling, suicide prevention, child advocacy, or victim services. Use disaster-relief ONLY for natural disasters like hurricanes, floods, fires, earthquakes. Use youth-development for mentoring and child development programs, coreValues (array of 4), colors (object with primary, secondary, accent as hex), fonts (headingStyle, headingFont), need (headline and description), solution, programs (array), metrics (use the PRE-EXTRACTED METRICS above - format as array of {value, label} objects), contactEmail, donateUrl.`;

  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonText = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Could not parse JSON from Claude response');
  }

  return JSON.parse(match[0]) as ClaudeAnalysis;
}
