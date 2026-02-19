import type { ExtractedMetric } from '@/lib/types';

export function extractMetrics(aboutPageContent: string): ExtractedMetric[] {
  if (!aboutPageContent || aboutPageContent.length === 0) return [];

  const metrics: ExtractedMetric[] = [];

  const getContext = (text: string, matchStr: string, chars = 80): string => {
    const idx = text.toLowerCase().indexOf(matchStr.toLowerCase());
    if (idx === -1) return matchStr;
    const start = Math.max(0, idx - chars);
    const end = Math.min(text.length, idx + matchStr.length + chars);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  };

  const parseScaledValue = (v: string): number => {
    const stripped = v.replace(/,/g, '').toLowerCase();
    const num = parseFloat(stripped);
    if (stripped.includes('billion')) return num * 1000000000;
    if (stripped.includes('million')) return num * 1000000;
    return num;
  };

  const simplePatterns = [
    { regex: /(\d[\d,]*k?)\+?\s*years?/gi, baseLabel: 'Years of Service' },
    { regex: /since\s*(\d{4})/gi, baseLabel: 'Founded' },
    { regex: /founded\s*(?:in\s*)?(\d{4})/gi, baseLabel: 'Founded' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:youth|children|kids|students|littles)/gi, baseLabel: 'Youth Served' },
    { regex: /(\d[\d,]*k?)\+?\s*hours?/gi, baseLabel: 'Hours of Service' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:families|family)/gi, baseLabel: 'Families Served' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:volunteers?|mentors?|bigs?)/gi, baseLabel: 'Volunteers' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:matches|relationships)/gi, baseLabel: 'Mentoring Matches' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:programs?|schools?|locations?|sites?)/gi, baseLabel: 'Programs' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:communities|counties|cities)/gi, baseLabel: 'Communities Served' },
    { regex: /(\d+\.?\d*\s*(?:billion|million))\s*meals?/gi, baseLabel: 'Meals' },
    { regex: /(\d+\.?\d*\s*(?:billion|million))\s*pounds?/gi, baseLabel: 'Pounds of Food' },
    { regex: /(\d[\d,]*k?)\+?\s*food\s*banks?/gi, baseLabel: 'Food Banks' },
    { regex: /(\d[\d,]*k?)\+?\s*meals?\s*(?:served|provided|distributed)?/gi, baseLabel: 'Meals Served' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:people|individuals|clients|residents)\s*(?:served|helped|housed|assisted)?/gi, baseLabel: 'People Served' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:beds?|nights?\s*of\s*shelter)/gi, baseLabel: 'Nights of Shelter' },
    { regex: /(\d[\d,]*k?)\+?\s*acres?/gi, baseLabel: 'Acres Protected' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:animals?|pets?)\s*(?:rescued|saved|helped|adopted|served|housed|cared\s*for)?/gi, baseLabel: 'Animals Helped' },
    { regex: /(\d[\d,]*k?)\+?\s*adoptions?/gi, baseLabel: 'Adoptions' },
    { regex: /(\d+\.?\d*\s*(?:billion|million))\s*(?:spay|neuter|procedures?|surgeries|operations?)/gi, baseLabel: 'Procedures' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:spay|neuter|procedures?|surgeries|operations?)/gi, baseLabel: 'Procedures' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:rescues?|rescued)/gi, baseLabel: 'Rescues' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:species|breeds?)/gi, baseLabel: 'Species Protected' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:visits?|appointments?|checkups?|screenings?|exams?)/gi, baseLabel: 'Visits' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:offices?|clinics?|centers?|facilities|hospitals?)/gi, baseLabel: 'Locations' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:providers?|doctors?|nurses?|physicians?|practitioners?|therapists?|counselors?)\s*(?:trained|certified|served|supported)?/gi, baseLabel: 'Providers' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:books?|titles?)\s*(?:distributed|donated|given|provided)?/gi, baseLabel: 'Books Distributed' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:patients?|members?|participants?|beneficiaries?|recipients?)\s*(?:served|helped|supported|reached)?/gi, baseLabel: 'People Served' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:donors?|supporters?|partners?)/gi, baseLabel: 'Supporters' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:survivors?|lives?\s*(?:changed|impacted|transformed|touched))/gi, baseLabel: 'Survivors Served' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:organizations?|agencies|affiliates?)\s*(?:served|partnering|supported)?/gi, baseLabel: 'Partner Organizations' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:events?|workshops?|sessions?|classes?|trainings?)/gi, baseLabel: 'Events' },
    { regex: /(\d[\d,]*k?)\+?\s*\w+\s+(?:workshops?|sessions?|classes?)/gi, baseLabel: 'Workshops' },
    { regex: /(\d[\d,]*k?)\+?\s*(?:grants?|scholarships?|awards?)\s*(?:awarded|given|distributed)?/gi, baseLabel: 'Grants Awarded' },
    { regex: /\$(\d[\d,]*(?:\.\d+)?)\s*(?:billion|million|k)?\s*(?:raised|donated|distributed|invested|awarded|given|granted)/gi, baseLabel: 'Funds Raised' },
  ];

  for (const p of simplePatterns) {
    const matches = [...aboutPageContent.matchAll(p.regex)];
    for (const match of matches) {
      const value = match[1];
      const numVal = parseScaledValue(value);

      if (numVal < 5 && !p.baseLabel.includes('Founded')) continue;
      if (!p.baseLabel.includes('Founded') && numVal > 1900 && numVal < 2030) continue;

      const context = getContext(aboutPageContent, match[0]);

      const existingIdx = metrics.findIndex(m => m.label === p.baseLabel);
      if (existingIdx >= 0) {
        const existingVal = parseScaledValue(metrics[existingIdx].value);
        if (numVal > existingVal) {
          metrics.splice(existingIdx, 1);
        } else {
          continue;
        }
      }

      let label = p.baseLabel;
      const ctxLower = context.toLowerCase();
      if (p.baseLabel === 'Hours of Service') {
        if (ctxLower.includes('mentor')) label = 'Mentoring Hours';
        else if (ctxLower.includes('volunteer')) label = 'Volunteer Hours';
        else if (ctxLower.includes('shared')) label = 'Hours Shared';
      } else if (p.baseLabel === 'Youth Served') {
        if (ctxLower.includes('annual')) label = 'Youth Served Annually';
        else if (ctxLower.includes('mentor')) label = 'Youth Mentored';
      } else if (p.baseLabel === 'Years of Service') {
        if (ctxLower.includes('mentor')) label = 'Years of Mentoring';
      } else if (p.baseLabel === 'Animals Helped') {
        if (ctxLower.includes('rescue')) label = 'Animals Rescued';
        else if (ctxLower.includes('adopt')) label = 'Animals Adopted';
        else if (ctxLower.includes('sanctuary') || ctxLower.includes('shelter')) label = 'Animals Sheltered';
        else if (ctxLower.includes('spay') || ctxLower.includes('neuter')) label = 'Spay/Neuter Procedures';
      } else if (p.baseLabel === 'Procedures') {
        if (ctxLower.includes('spay') || ctxLower.includes('neuter')) label = 'Spay/Neuter Procedures';
      }

      const isDupe = metrics.some(m => m.value === value && m.label === label);
      if (!isDupe) {
        metrics.push({ value, label, context: context.substring(0, 60) });
      }
    }
  }

  // Percentage extraction
  const pctMatches = [...aboutPageContent.matchAll(/(\d+)%/gi)];
  for (const match of pctMatches) {
    const pctVal = parseInt(match[1]);
    const context = getContext(aboutPageContent, match[0]);
    const ctxLower = context.toLowerCase();

    const positiveWords = ['graduate', 'success', 'complete', 'achieve', 'improve', 'increase'];
    const hasPositive = positiveWords.some(w => ctxLower.includes(w));

    if (pctVal >= 70 || hasPositive) {
      let label = '';
      if (ctxLower.includes('graduat')) label = 'Graduation Rate';
      else if (ctxLower.includes('college')) label = 'College Enrollment';
      else if (ctxLower.includes('complet')) label = 'Completion Rate';
      else if (ctxLower.includes('retention') || ctxLower.includes('retain')) label = 'Retention Rate';
      else if (ctxLower.includes('employ')) label = 'Employment Rate';

      if (!label) continue;

      const isDupe = metrics.some(m => m.value === match[1] + '%');
      if (!isDupe) {
        metrics.push({ value: match[1] + '%', label, context: context.substring(0, 60) });
      }
    }
  }

  // Cross-label deduplication
  const mealsIdx = metrics.findIndex(m => m.label === 'Meals');
  const mealsServedIdx = metrics.findIndex(m => m.label === 'Meals Served');
  if (mealsIdx >= 0 && mealsServedIdx >= 0) {
    metrics.splice(mealsServedIdx, 1);
  }

  return metrics;
}
