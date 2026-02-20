import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/config';
import type { ClaudeAnalysis } from '@/lib/types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

export interface ManualInput {
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
  primaryColor?: string;
  accentColor?: string;
}

export async function analyzeManualInput(input: ManualInput): Promise<ClaudeAnalysis> {
  const anthropic = getClient();

  const programsList = input.programs?.length
    ? `Programs/services: ${input.programs.join(', ')}`
    : 'No specific programs listed.';

  const metricsInfo = input.metrics?.length
    ? `Impact metrics provided by the organization: ${input.metrics.map(m => `${m.value} ${m.label}`).join(', ')}. IMPORTANT: Use these EXACT numbers — do NOT fabricate or change any metrics.`
    : 'No metrics provided. Return an empty metrics array. Do NOT make up or fabricate any numbers.';

  const colorHint = input.primaryColor || input.accentColor
    ? `Color preferences: primary=${input.primaryColor || 'none specified'}, accent=${input.accentColor || 'none specified'}. Use these as starting points for your color suggestions.`
    : 'No color preferences specified. Suggest colors appropriate for the sector.';

  const prompt = `You are a professional nonprofit copywriter. Given the following information about a nonprofit organization, generate polished, professional copy for their impact deck.

ORGANIZATION INFO:
- Name: ${input.orgName}
- What they do: ${input.description}
- Who they serve: ${input.beneficiaries}
- Sector: ${input.sector}
- Location: ${input.location || 'Not specified'}
- Year founded: ${input.yearFounded || 'Not specified'}
- ${programsList}
- Contact email: ${input.contactEmail || 'Not specified'}
- Donation URL: ${input.donateUrl || 'Not specified'}

${metricsInfo}

${colorHint}

CRITICAL RULES:
1. NEVER fabricate metrics, statistics, or numbers. Only include metrics the organization explicitly provided.
2. Polish and professionalize the language, but keep the organization's authentic voice.
3. The heroHook MUST include the full organization name.
4. The donorHeadline should be 3-6 powerful words that capture the org's impact.

Return a JSON object with these fields:
- orgName: string (use the exact name provided)
- donorHeadline: string (3-6 words, compelling impact headline)
- heroHook: string (8-15 words, MUST include the full organization name)
- tagline: string (short, memorable tagline)
- location: string
- mission: string (polished mission statement based on their description)
- yearFounded: number | null
- sector: string (one of: youth-development, education, agriculture, food-bank, environment, animal-welfare, veterans, seniors, arts-culture, healthcare, housing, disaster-relief, disability-services, mental-health, refugee-immigration, lgbtq, community)
- coreValues: string[] (array of exactly 4 values appropriate for their sector)
- colors: { primary: string, secondary: string, accent: string } (hex colors)
- fonts: { headingStyle: "serif" | "sans", headingFont: string }
- need: { headline: string, description: string } (the problem they solve)
- solution: string (how they solve it)
- programs: string[] (polished program names)
- metrics: { value: string, label: string }[] (ONLY metrics the org provided, or empty array)
- contactEmail: string
- donateUrl: string

Return ONLY the JSON object, no markdown fencing.`;

  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 4096,
    messages: [
      { role: 'user', content: prompt },
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
