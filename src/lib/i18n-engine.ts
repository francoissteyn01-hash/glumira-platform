/**
 * GluMira™ V7 — Internationalisation Engine
 * Block 9: Language Selector
 */

export type SupportedLanguage = "en-GB" | "en-US" | "af";

export interface TranslationSet {
  // Navigation
  dashboard: string;
  education: string;
  mira_ai: string;
  meal_plan: string;
  badges: string;
  profile: string;
  settings: string;
  faq: string;
  // Common
  save: string;
  cancel: string;
  loading: string;
  error: string;
  // Glucose
  glucose: string;
  insulin: string;
  meal: string;
  low: string;
  in_range: string;
  high: string;
  very_high: string;
  // GluMira specific
  disclaimer: string;
  educational_only: string;
  consult_clinician: string;
  // Modules
  pregnancy: string;
  paediatric: string;
  school_care: string;
  menstrual: string;
  // Units
  units: string;
  mmol_l: string;
  mg_dl: string;
}

const TRANSLATIONS: Record<SupportedLanguage, TranslationSet> = {
  "en-GB": {
    // Navigation
    dashboard: "Dashboard",
    education: "Education",
    mira_ai: "Mira AI",
    meal_plan: "Meal Plan",
    badges: "Badges",
    profile: "Profile",
    settings: "Settings",
    faq: "FAQ",
    // Common
    save: "Save",
    cancel: "Cancel",
    loading: "Loading\u2026",
    error: "Error",
    // Glucose
    glucose: "Glucose",
    insulin: "Insulin",
    meal: "Meal",
    low: "Low",
    in_range: "In Range",
    high: "High",
    very_high: "Very High",
    // GluMira specific
    disclaimer:
      "GluMira\u2122 is an educational tool and does not provide medical advice.",
    educational_only:
      "For educational purposes only. Not a substitute for professional medical care.",
    consult_clinician:
      "Always consult your clinician before making changes to your diabetes management.",
    // Modules
    pregnancy: "Pregnancy",
    paediatric: "Paediatric",
    school_care: "School Care Plan",
    menstrual: "Menstrual Cycle",
    // Units
    units: "Units",
    mmol_l: "mmol/L",
    mg_dl: "mg/dL",
  },

  "en-US": {
    // Navigation
    dashboard: "Dashboard",
    education: "Education",
    mira_ai: "Mira AI",
    meal_plan: "Meal Plan",
    badges: "Badges",
    profile: "Profile",
    settings: "Settings",
    faq: "FAQ",
    // Common
    save: "Save",
    cancel: "Cancel",
    loading: "Loading\u2026",
    error: "Error",
    // Glucose
    glucose: "Glucose",
    insulin: "Insulin",
    meal: "Meal",
    low: "Low",
    in_range: "In Range",
    high: "High",
    very_high: "Very High",
    // GluMira specific
    disclaimer:
      "GluMira\u2122 is an educational tool and does not provide medical advice.",
    educational_only:
      "For educational purposes only. Not a substitute for professional medical care.",
    consult_clinician:
      "Always consult your clinician before making changes to your diabetes management.",
    // Modules
    pregnancy: "Pregnancy",
    paediatric: "Pediatric",
    school_care: "School Care Plan",
    menstrual: "Menstrual Cycle",
    // Units
    units: "Units",
    mmol_l: "mmol/L",
    mg_dl: "mg/dL",
  },

  af: {
    // Navigation
    dashboard: "Kontroleskerm",
    education: "Opvoeding",
    mira_ai: "Mira KI",
    meal_plan: "Eetplan",
    badges: "Kentekens",
    profile: "Profiel",
    settings: "Instellings",
    faq: "Vrae",
    // Common
    save: "Stoor",
    cancel: "Kanselleer",
    loading: "Laai tans\u2026",
    error: "Fout",
    // Glucose
    glucose: "Glukose",
    insulin: "Insulien",
    meal: "Maaltyd",
    low: "Laag",
    in_range: "Binne Reikwydte",
    high: "Hoog",
    very_high: "Baie Hoog",
    // GluMira specific
    disclaimer:
      "GluMira\u2122 is \u2019n opvoedkundige hulpmiddel en verskaf nie mediese advies nie.",
    educational_only:
      "Slegs vir opvoedkundige doeleindes. Nie \u2019n plaasvervanger vir professionele mediese sorg nie.",
    consult_clinician:
      "Raadpleeg altyd jou klinikus voordat jy veranderinge aan jou diabetesbestuur maak.",
    // Modules
    pregnancy: "Swangerskap",
    paediatric: "Pediatrie",
    school_care: "Skoolsorgplan",
    menstrual: "Menstruele Siklus",
    // Units
    units: "Eenhede",
    mmol_l: "mmol/L",
    mg_dl: "mg/dL",
  },
};

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  "en-GB": "English (UK)",
  "en-US": "English (US)",
  af: "Afrikaans",
};

const STORAGE_KEY = "glumira_language";

/**
 * Get the full translation set for a language.
 */
export function getTranslation(lang: SupportedLanguage): TranslationSet {
  return TRANSLATIONS[lang] ?? TRANSLATIONS["en-GB"];
}

/**
 * Get a single translation by key.
 * If no language is provided, uses the stored preference.
 */
export function t(
  key: keyof TranslationSet,
  lang?: SupportedLanguage
): string {
  const activeLang = lang ?? getCurrentLanguage();
  const set = getTranslation(activeLang);
  return set[key];
}

/**
 * Read the current language preference from localStorage.
 * Defaults to en-GB.
 */
export function getCurrentLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage not available (SSR, etc.)
  }
  return "en-GB";
}

/**
 * Save the language preference to localStorage.
 */
export function setLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
}

/**
 * Get the human-readable label for a language code.
 */
export function getLanguageLabel(lang: SupportedLanguage): string {
  return LANGUAGE_LABELS[lang] ?? lang;
}

/**
 * Get all supported language codes.
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(TRANSLATIONS) as SupportedLanguage[];
}

function isValidLanguage(value: string): value is SupportedLanguage {
  return value in TRANSLATIONS;
}
