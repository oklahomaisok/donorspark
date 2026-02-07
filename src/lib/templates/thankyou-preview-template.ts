/**
 * Thank-You Deck 3-Slide Preview Template
 * Used in the dashboard to show free users what a Thank-You deck looks like
 */

export interface ThankYouPreviewData {
  orgName: string;
  sector: string;
  colors: {
    primary: string;
    accent: string;
  };
  fonts: {
    headingFont: string;
    bodyFont: string;
  };
  logoUrl?: string;
}

// Sector-specific impact messages for the preview
const SECTOR_IMPACT_MESSAGES: Record<string, { stat: string; label: string; description: string }> = {
  'youth-development': {
    stat: '2,847',
    label: 'Young Lives Transformed',
    description: 'Because of donors like you, young people in our community have access to mentorship, education, and opportunities that shape their futures.',
  },
  'youth-sports-soccer': {
    stat: '1,200',
    label: 'Athletes Supported',
    description: 'Your generosity helps young athletes develop skills, teamwork, and confidence that last a lifetime.',
  },
  'youth-sports-basketball': {
    stat: '950',
    label: 'Players on the Court',
    description: 'Thanks to supporters like you, hundreds of young athletes are learning discipline and teamwork through basketball.',
  },
  'food-bank': {
    stat: '125,000',
    label: 'Meals Served',
    description: 'Your contribution helps us fight hunger in our community, ensuring no family goes without a meal.',
  },
  'education': {
    stat: '3,500',
    label: 'Students Empowered',
    description: 'Donors like you make education accessible, giving students the tools they need to succeed.',
  },
  'environment': {
    stat: '50,000',
    label: 'Trees Planted',
    description: 'Your support helps protect our planet for future generations through conservation and restoration.',
  },
  'animal-welfare': {
    stat: '1,800',
    label: 'Animals Rescued',
    description: 'Because of your compassion, homeless animals receive care, shelter, and loving forever homes.',
  },
  'veterans': {
    stat: '750',
    label: 'Veterans Served',
    description: 'Your generosity honors those who served by providing support, resources, and community.',
  },
  'seniors': {
    stat: '2,100',
    label: 'Seniors Supported',
    description: 'Donors like you help seniors in our community live with dignity, connection, and care.',
  },
  'arts-culture': {
    stat: '15,000',
    label: 'Experiences Created',
    description: 'Your support brings art and culture to life, enriching our community through creative expression.',
  },
  'healthcare': {
    stat: '8,500',
    label: 'Patients Treated',
    description: 'Because of donors like you, people receive the medical care they need regardless of their circumstances.',
  },
  'housing': {
    stat: '420',
    label: 'Families Housed',
    description: 'Your generosity provides safe, stable housing for families working toward a brighter future.',
  },
  'disaster-relief': {
    stat: '5,200',
    label: 'Lives Restored',
    description: 'When disaster strikes, donors like you help communities rebuild and recover.',
  },
  'disability-services': {
    stat: '1,600',
    label: 'Individuals Empowered',
    description: 'Your support creates opportunities and removes barriers for people with disabilities.',
  },
  'mental-health': {
    stat: '3,800',
    label: 'People Supported',
    description: 'Donors like you help break the stigma and provide vital mental health resources.',
  },
  'refugee-immigration': {
    stat: '890',
    label: 'New Beginnings',
    description: 'Your generosity welcomes newcomers and helps them build new lives in safety.',
  },
  'lgbtq': {
    stat: '2,300',
    label: 'Community Members Served',
    description: 'Your support creates safe spaces and resources for LGBTQ+ individuals.',
  },
  'community': {
    stat: '4,500',
    label: 'Neighbors Helped',
    description: 'Because of donors like you, our community grows stronger every day.',
  },
  'agriculture': {
    stat: '680',
    label: 'Farms Supported',
    description: 'Your generosity helps local farmers thrive and strengthens our food system.',
  },
};

function getImpactMessage(sector: string) {
  return SECTOR_IMPACT_MESSAGES[sector] || SECTOR_IMPACT_MESSAGES['community'];
}

function isSerif(fontName: string): boolean {
  const serifFonts = ['playfair', 'merriweather', 'lora', 'georgia', 'times', 'garamond', 'baskerville', 'libre baskerville', 'crimson', 'spectral', 'source serif', 'instrument serif', 'cormorant'];
  return serifFonts.some(f => fontName.toLowerCase().includes(f));
}

export function generateThankYouPreviewSlides(data: ThankYouPreviewData): string[] {
  const { orgName, sector, colors, fonts, logoUrl } = data;
  const primary = colors.primary || '#1D2350';
  const accent = colors.accent || '#FFC303';
  const headingFont = fonts.headingFont || 'Montserrat';
  const bodyFont = fonts.bodyFont || 'Roboto';
  const headlineCase = isSerif(headingFont) ? '' : 'text-transform: uppercase;';

  const impact = getImpactMessage(sector);

  // Slide 1: Cover with donor name
  const slide1 = `
    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${primary} 0%, color-mix(in srgb, ${primary} 70%, black) 100%); color: white; font-family: '${bodyFont}', sans-serif; display: flex; flex-direction: column; justify-content: space-between; padding: 32px; position: relative; overflow: hidden;">
      <!-- Decorative pattern -->
      <div style="position: absolute; inset: 0; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 24px 24px;"></div>

      <!-- Top -->
      <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="height: 32px; max-width: 120px; object-fit: contain;">` : `<span style="font-family: '${headingFont}', sans-serif; font-weight: bold; font-size: 14px;">${orgName}</span>`}
        <span style="font-size: 10px; color: ${accent}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid ${accent}40; padding: 4px 8px; border-radius: 4px;">Thank You Deck</span>
      </div>

      <!-- Center content -->
      <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 10;">
        <p style="font-size: 12px; color: ${accent}; margin-bottom: 8px; font-weight: 500;">Dear [Donor Name],</p>
        <h1 style="font-family: '${headingFont}', sans-serif; font-size: 28px; font-weight: 900; line-height: 1.1; margin-bottom: 16px; ${headlineCase}">
          Thank You For<br><span style="color: ${accent};">Making A Difference</span>
        </h1>
        <p style="font-size: 13px; color: rgba(255,255,255,0.8); max-width: 85%; line-height: 1.5;">
          Your generous gift of <span style="color: ${accent}; font-weight: bold;">[Amount]</span> is helping us create lasting change in our community.
        </p>
      </div>

      <!-- Bottom -->
      <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
        <span style="font-size: 11px; color: rgba(255,255,255,0.6);">${orgName}</span>
        <span style="font-size: 10px; color: ${accent}; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          Swipe
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </span>
      </div>
    </div>
  `;

  // Slide 2: Impact stat
  const slide2 = `
    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${primary} 0%, color-mix(in srgb, ${primary} 70%, black) 100%); color: white; font-family: '${bodyFont}', sans-serif; display: flex; flex-direction: column; justify-content: space-between; padding: 32px; position: relative; overflow: hidden;">
      <div style="position: absolute; inset: 0; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 24px 24px;"></div>

      <!-- Top -->
      <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10;">
        <span style="font-size: 11px; color: ${accent}; font-weight: bold;">[02]</span>
        <span style="font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.1em;">Your Impact</span>
      </div>

      <!-- Center content -->
      <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; z-index: 10;">
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; width: 100%;">
          <div style="font-family: '${headingFont}', sans-serif; font-size: 48px; font-weight: 900; color: ${accent}; margin-bottom: 8px;">
            ${impact.stat}
          </div>
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.8); font-weight: 600;">
            ${impact.label}
          </div>
        </div>
        <p style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 20px; line-height: 1.6; max-width: 90%;">
          ${impact.description}
        </p>
      </div>

      <!-- Bottom -->
      <div style="position: relative; z-index: 10; text-align: center;">
        <p style="font-size: 11px; color: rgba(255,255,255,0.5);">This is what your support makes possible</p>
      </div>
    </div>
  `;

  // Slide 3: CTA
  const slide3 = `
    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${primary} 0%, color-mix(in srgb, ${primary} 70%, black) 100%); color: white; font-family: '${bodyFont}', sans-serif; display: flex; flex-direction: column; justify-content: space-between; padding: 32px; position: relative; overflow: hidden;">
      <div style="position: absolute; inset: 0; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 24px 24px;"></div>

      <!-- Top -->
      <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10;">
        <span style="font-size: 11px; color: ${accent}; font-weight: bold;">[03]</span>
        <span style="font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.1em;">Stay Connected</span>
      </div>

      <!-- Center content -->
      <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; z-index: 10;">
        <h2 style="font-family: '${headingFont}', sans-serif; font-size: 24px; font-weight: 900; margin-bottom: 16px; ${headlineCase}">
          Together, We're<br><span style="color: ${accent};">Changing Lives</span>
        </h2>
        <p style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 24px; line-height: 1.6; max-width: 85%;">
          Thank you for being part of our mission. Your continued support means the world to us.
        </p>

        <!-- CTA Button (static for preview) -->
        <div style="background: ${accent}; color: ${primary}; padding: 14px 32px; border-radius: 999px; font-weight: bold; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
          Continue Your Impact
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </div>

      <!-- Bottom -->
      <div style="position: relative; z-index: 10; text-align: center;">
        <p style="font-size: 10px; color: rgba(255,255,255,0.4);">
          Made with DonorSpark
        </p>
      </div>
    </div>
  `;

  return [slide1, slide2, slide3];
}
