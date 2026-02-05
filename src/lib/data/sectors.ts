export const SECTOR_ALIASES: Record<string, string> = {
  'boys and girls club': 'youth-development',
  'bgc': 'youth-development',
  'ymca': 'youth-development',
  'food pantry': 'food-bank',
  'habitat for humanity': 'housing',
  'red cross': 'disaster-relief',
  'doctors without borders': 'healthcare',
  'humane society': 'animal-welfare',
  'community-general': 'community',
};

export const VALID_SECTORS = [
  'youth-development', 'youth-sports-soccer', 'youth-sports-basketball',
  'agriculture', 'food-bank', 'education', 'environment', 'animal-welfare',
  'veterans', 'seniors', 'arts-culture', 'healthcare', 'housing', 'community',
  'disaster-relief', 'disability-services', 'mental-health',
  'refugee-immigration', 'lgbtq',
];

export function resolveSector(sector: string, orgName: string): string {
  let resolved = sector.toLowerCase().replace(/[\s_]+/g, '-');
  const orgLower = orgName.toLowerCase();

  for (const [alias, mapped] of Object.entries(SECTOR_ALIASES)) {
    if (orgLower.includes(alias)) {
      resolved = mapped;
      break;
    }
  }

  if (!VALID_SECTORS.includes(resolved)) {
    resolved = SECTOR_ALIASES[resolved] || 'community';
  }

  return resolved;
}
