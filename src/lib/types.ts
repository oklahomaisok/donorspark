export interface JobRequest {
  url: string;
  orgName?: string;
}

export interface CaptureResult {
  url: string;
  orgName: string;
  domain: string;
  screenshotBase64: string;
  logoUrl: string | null;
  logoSource: string;
  detectedFonts: DetectedFonts;
  headerBgColor: string | null;
  extractedColors: VisionColor[];
  logoColors: LogoColors;
  aboutPageContent: string;
  extractedMetrics: ExtractedMetric[];
  scrapedDonateUrl: string | null;
}

export interface DetectedFonts {
  heading: string | null;
  body: string | null;
  raw: string[];
}

export interface VisionColor {
  source: string;
  hex: string;
  percent: number;
  score: number;
  rgb: { r: number; g: number; b: number };
  saturation: number;
  luminance: number;
}

export interface LogoColors {
  dominant: LogoColorEntry[];
  vibrant: string | null;
  muted: string | null;
  source: string;
}

export interface LogoColorEntry {
  hex: string;
  count: number;
  saturation: number;
  luminance: number;
  isVibrant: boolean;
}

export interface ExtractedMetric {
  value: string;
  label: string;
  context?: string;
}

export interface ClaudeAnalysis {
  orgName: string;
  donorHeadline: string;
  heroHook: string;
  tagline: string;
  location: string;
  mission: string;
  yearFounded: number | null;
  sector: string;
  coreValues: string[];
  colors: { primary: string; secondary: string; accent: string; headerBackground?: string };
  fonts: { headingStyle: string; headingFont: string };
  need: { headline: string; description: string };
  solution: string;
  programs: string[];
  metrics: { value: string; label: string }[];
  contactEmail: string;
  donateUrl: string;
}

export interface BrandData {
  orgName: string;
  logoUrl: string | null;
  logoSource: string;
  colors: { primary: string; secondary: string; accent: string };
  fonts: { headingFont: string; bodyFont: string };
  images: SectorImages;
  testimonials: Testimonial[];
  coreValues: string[];
  metrics: { value: string; label: string }[];
  hasValidMetrics: boolean;
  useBarChart: boolean;
  numericValues: (number | null)[];
  donorHeadline: string;
  heroHook: string;
  tagline?: string;
  mission: string;
  yearFounded: number | null;
  need: { headline: string; description: string };
  solution: string;
  programs: string[];
  contactEmail: string;
  originalUrl: string;
  finalDonateUrl: string;
  headerBgColor: string | null;
  headerTextDark: boolean;
  sector: string;
  badgeText?: string; // "Impact Deck" badge - empty string hides it
  missionHeadline?: string; // "Building A Better Future" - customizable
  ctaButtonText?: string; // "Donate Today" - customizable
}

export interface SectorImages {
  hero: string;
  action: string;
  group: string;
  og: string;
  sector: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  gender: 'woman' | 'man';
  portrait?: string;
}

export interface PipelineContext {
  jobId: string;
  url: string;
  orgName: string;
  updateProgress: (step: string, progress: number) => Promise<void>;
}
