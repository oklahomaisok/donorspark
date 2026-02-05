export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY || '',
  imageBaseUrl: process.env.IMAGE_BASE_URL || 'https://oklahomaisok.github.io/nonprofit-decks/images',
  videoBaseUrl: 'https://donorspark-videos.vercel.app',
  claudeModel: 'claude-sonnet-4-20250514',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.donorspark.app',
};
