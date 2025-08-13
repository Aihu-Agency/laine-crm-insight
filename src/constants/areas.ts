// Centralized Areas of Interest options and normalization
// Keep this list in sync with UI and Airtable allowed values
export const AREA_OPTIONS = [
  "Marbella",
  "Puerto Banus",
  "Malaga",
  "Fuengirola",
  "Mijas",
  "Torremolinos",
  "Alhaurin",
  "Benahavís",
  "Estepona",
  "Mijas Costa",
  "Nueva Andalucía",
  "Costa del Sol other",
  "Torrevieja",
  "Costa Blanca other",
  "Other",
] as const;

const SIMPLE_SYNONYMS: Record<string, string> = {
  // casing / spacing / punctuation variants
  "puerto banús": "Puerto Banus",
  "puerto-banus": "Puerto Banus",
  "puerto-banús": "Puerto Banus",
  "benahavis": "Benahavís",
  "nueva andalucia": "Nueva Andalucía",
  "mijas-costa": "Mijas Costa",
  "costa del sol": "Costa del Sol other",
  "costa blanca": "Costa Blanca other",
  // commonly seen phrases
  "downtown mijas": "Mijas",
  "mijas pueblo": "Mijas",
  "mijas center": "Mijas",
};

function stripDiacritics(input: string) {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function normalizeArea(raw: string): (typeof AREA_OPTIONS)[number] | null {
  if (!raw) return null;
  const base = raw.trim();
  if (!base) return null;
  const lowered = stripDiacritics(base).toLowerCase();

  // direct match against options (case/diacritics-insensitive)
  for (const opt of AREA_OPTIONS) {
    const optNorm = stripDiacritics(opt).toLowerCase();
    if (optNorm === lowered) return opt;
  }

  // simple synonyms map
  if (SIMPLE_SYNONYMS[lowered]) return SIMPLE_SYNONYMS[lowered] as (typeof AREA_OPTIONS)[number];

  // substring heuristics
  if (lowered.includes('puerto') && lowered.includes('ban')) return "Puerto Banus";
  if (lowered.includes('nueva') && lowered.includes('andalu')) return "Nueva Andalucía";
  if (lowered.includes('mijas') && lowered.includes('costa')) return "Mijas Costa";
  if (lowered.includes('mijas')) return "Mijas";
  if (lowered.includes('benahav')) return "Benahavís";
  if (lowered.includes('marbella')) return "Marbella";
  if (lowered.includes('fuengirola')) return "Fuengirola";
  if (lowered.includes('estepona')) return "Estepona";
  if (lowered.includes('torremolinos')) return "Torremolinos";
  if (lowered.includes('alhaurin')) return "Alhaurin";
  if (lowered.includes('torrevieja')) return "Torrevieja";
  if (lowered.includes('costa del sol')) return "Costa del Sol other";
  if (lowered.includes('costa blanca')) return "Costa Blanca other";

  // no match
  return null;
}
