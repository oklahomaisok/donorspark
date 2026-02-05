const FONT_MAP: Record<string, string> = {
  'proxima nova': 'Montserrat',
  'proxima-nova': 'Montserrat',
  'proximanova': 'Montserrat',
  'gotham': 'Poppins',
  'gotham rounded': 'Nunito',
  'avenir': 'Nunito Sans',
  'avenir next': 'Nunito Sans',
  'futura': 'Jost',
  'futura pt': 'Jost',
  'helvetica neue': 'Inter',
  'helvetica': 'Inter',
  'arial': 'Inter',
  'din': 'Barlow',
  'din next': 'Barlow',
  'trade gothic': 'Barlow Condensed',
  'brandon grotesque': 'Raleway',
  'brandon': 'Raleway',
  'circular': 'DM Sans',
  'sofia pro': 'Quicksand',
  'museo sans': 'Nunito Sans',
  'lato': 'Lato',
  'open sans': 'Open Sans',
  'roboto': 'Roboto',
  'montserrat': 'Montserrat',
  'poppins': 'Poppins',
  'raleway': 'Raleway',
  'oswald': 'Oswald',
  'source sans pro': 'Source Sans 3',
  'source sans 3': 'Source Sans 3',
  'work sans': 'Work Sans',
  'nunito': 'Nunito',
  'inter': 'Inter',
  'manrope': 'Manrope',
  'outfit': 'Outfit',
  'plus jakarta sans': 'Plus Jakarta Sans',
  'space grotesk': 'Space Grotesk',
  'dm sans': 'DM Sans',
  'be vietnam pro': 'Be Vietnam Pro',
  'figtree': 'Figtree',
  'georgia': 'Merriweather',
  'times new roman': 'Playfair Display',
  'times': 'Playfair Display',
  'garamond': 'EB Garamond',
  'adobe garamond': 'EB Garamond',
  'minion': 'Crimson Pro',
  'minion pro': 'Crimson Pro',
  'baskerville': 'Libre Baskerville',
  'caslon': 'Libre Caslon Text',
  'palatino': 'Cormorant Garamond',
  'bodoni': 'Playfair Display',
  'didot': 'Playfair Display',
  'freight text': 'Lora',
  'miller': 'Lora',
  'sentinel': 'Zilla Slab',
  'rockwell': 'Zilla Slab',
  'clarendon': 'Zilla Slab',
  'playfair display': 'Playfair Display',
  'merriweather': 'Merriweather',
  'lora': 'Lora',
  'crimson text': 'Crimson Text',
  'eb garamond': 'EB Garamond',
  'cormorant': 'Cormorant Garamond',
  'libre baskerville': 'Libre Baskerville',
  'source serif pro': 'Source Serif 4',
  'pt serif': 'PT Serif',
  'noto serif': 'Noto Serif',
  'impact': 'Anton',
  'bebas neue': 'Bebas Neue',
  'league gothic': 'Oswald',
  'anton': 'Anton',
  'archivo black': 'Archivo Black',
};

const GOOGLE_FONTS = [
  'Montserrat', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Oswald',
  'Raleway', 'Playfair Display', 'Merriweather', 'Inter', 'Nunito',
  'Work Sans', 'DM Sans', 'Outfit', 'Space Grotesk', 'Jost',
  'Barlow', 'Quicksand', 'Nunito Sans', 'Source Sans 3',
];

export function mapToGoogleFont(fontName: string | null | undefined): string | null {
  if (!fontName) return null;
  const normalized = fontName.toLowerCase().trim();

  if (FONT_MAP[normalized]) return FONT_MAP[normalized];

  for (const [key, value] of Object.entries(FONT_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  for (const gf of GOOGLE_FONTS) {
    if (normalized.includes(gf.toLowerCase())) return gf;
  }

  return null;
}

export function isSerifFont(fontName: string | null | undefined): boolean {
  if (!fontName) return false;
  const normalized = fontName.toLowerCase();
  const serifKeywords = [
    'serif', 'georgia', 'times', 'garamond', 'baskerville', 'palatino',
    'bodoni', 'didot', 'minion', 'caslon', 'freight', 'miller', 'sentinel',
    'rockwell', 'clarendon', 'playfair', 'merriweather', 'lora', 'crimson', 'cormorant',
  ];
  return serifKeywords.some(kw => normalized.includes(kw));
}

export function getGoogleFontsUrl(headlineFont: string, bodyFont: string): string {
  const fonts = new Set([headlineFont, bodyFont]);
  const fontParams = Array.from(fonts)
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;700;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}
