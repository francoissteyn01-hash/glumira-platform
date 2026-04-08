/**
 * GluMira™ V7 — Region Detection & Configuration Engine
 * Block 8: Region Lock
 */

export interface RegionConfig {
  code: string;
  name: string;
  glucoseUnits: "mmol" | "mg";
  currency: string;
  currencySymbol: string;
  language: string;
  availableLanguages: string[];
  insulinAvailability: string[];
  pppDiscount: number;
  timezone: string;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  ZA: {
    code: "ZA",
    name: "South Africa",
    glucoseUnits: "mmol",
    currency: "ZAR",
    currencySymbol: "R",
    language: "en-GB",
    availableLanguages: ["en-GB", "af"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "actrapid",
      "humulin-n", "protaphane", "lantus", "levemir",
      "tresiba", "toujeo", "novomix-30", "humulin-30-70",
    ],
    pppDiscount: 0.55,
    timezone: "Africa/Johannesburg",
  },
  NA: {
    code: "NA",
    name: "Namibia",
    glucoseUnits: "mmol",
    currency: "NAD",
    currencySymbol: "N$",
    language: "en-GB",
    availableLanguages: ["en-GB", "af"],
    insulinAvailability: [
      "humalog", "novorapid", "actrapid",
      "humulin-n", "protaphane", "lantus", "levemir",
      "novomix-30",
    ],
    pppDiscount: 0.58,
    timezone: "Africa/Windhoek",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    glucoseUnits: "mmol",
    currency: "GBP",
    currencySymbol: "\u00a3",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp", "lyumjev",
      "actrapid", "humulin-s",
      "humulin-i", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo", "semglee",
      "novomix-30", "humalog-mix-25", "humalog-mix-50",
    ],
    pppDiscount: 0,
    timezone: "Europe/London",
  },
  IE: {
    code: "IE",
    name: "Ireland",
    glucoseUnits: "mmol",
    currency: "EUR",
    currencySymbol: "\u20ac",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid", "humulin-i", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "Europe/Dublin",
  },
  US: {
    code: "US",
    name: "United States",
    glucoseUnits: "mg",
    currency: "USD",
    currencySymbol: "$",
    language: "en-US",
    availableLanguages: ["en-US"],
    insulinAvailability: [
      "humalog", "novolog", "apidra", "fiasp", "lyumjev",
      "afrezza",
      "humulin-r", "novolin-r",
      "humulin-n", "novolin-n",
      "lantus", "basaglar", "semglee", "rezvoglar",
      "levemir", "tresiba", "toujeo",
      "novolog-mix-70-30", "humalog-mix-75-25", "humulin-70-30",
    ],
    pppDiscount: 0,
    timezone: "America/New_York",
  },
  CA: {
    code: "CA",
    name: "Canada",
    glucoseUnits: "mmol",
    currency: "CAD",
    currencySymbol: "C$",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "humulin-r", "novolin-ge-toronto",
      "humulin-n", "novolin-ge-nph",
      "lantus", "basaglar", "levemir", "tresiba", "toujeo",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "America/Toronto",
  },
  AU: {
    code: "AU",
    name: "Australia",
    glucoseUnits: "mmol",
    currency: "AUD",
    currencySymbol: "A$",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid", "humulin-r",
      "humulin-nph", "protaphane",
      "lantus", "levemir", "tresiba", "toujeo", "optisulin",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "Australia/Sydney",
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    glucoseUnits: "mmol",
    currency: "NZD",
    currencySymbol: "NZ$",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "actrapid",
      "humulin-nph", "protaphane",
      "lantus", "levemir", "tresiba",
      "novomix-30",
    ],
    pppDiscount: 0.05,
    timezone: "Pacific/Auckland",
  },
  DE: {
    code: "DE",
    name: "Germany",
    glucoseUnits: "mg",
    currency: "EUR",
    currencySymbol: "\u20ac",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp", "lyumjev",
      "actrapid", "humulin-normal",
      "humulin-basal", "protaphane",
      "lantus", "levemir", "tresiba", "toujeo", "semglee",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "Europe/Berlin",
  },
  FR: {
    code: "FR",
    name: "France",
    glucoseUnits: "mmol",
    currency: "EUR",
    currencySymbol: "\u20ac",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid", "umuline-rapide",
      "umuline-nph", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "Europe/Paris",
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    glucoseUnits: "mmol",
    currency: "EUR",
    currencySymbol: "\u20ac",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid", "humulin-regular",
      "humulin-nph", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0,
    timezone: "Europe/Amsterdam",
  },
  SE: {
    code: "SE",
    name: "Sweden",
    glucoseUnits: "mmol",
    currency: "SEK",
    currencySymbol: "kr",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "fiasp",
      "actrapid", "humulin-regular",
      "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0,
    timezone: "Europe/Stockholm",
  },
  NO: {
    code: "NO",
    name: "Norway",
    glucoseUnits: "mmol",
    currency: "NOK",
    currencySymbol: "kr",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "fiasp",
      "actrapid",
      "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0,
    timezone: "Europe/Oslo",
  },
  DK: {
    code: "DK",
    name: "Denmark",
    glucoseUnits: "mmol",
    currency: "DKK",
    currencySymbol: "kr",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "fiasp",
      "actrapid",
      "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0,
    timezone: "Europe/Copenhagen",
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    glucoseUnits: "mmol",
    currency: "AED",
    currencySymbol: "\u062f.\u0625",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid",
      "humulin-n", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0,
    timezone: "Asia/Dubai",
  },
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    glucoseUnits: "mmol",
    currency: "SAR",
    currencySymbol: "\ufdfc",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra",
      "actrapid",
      "humulin-n", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0.10,
    timezone: "Asia/Riyadh",
  },
  IN: {
    code: "IN",
    name: "India",
    glucoseUnits: "mg",
    currency: "INR",
    currencySymbol: "\u20b9",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra",
      "actrapid", "humulin-r",
      "humulin-n", "insulatard",
      "lantus", "basalog", "levemir", "tresiba",
      "novomix-30", "humalog-mix-25",
      "human-mixtard-30",
    ],
    pppDiscount: 0.75,
    timezone: "Asia/Kolkata",
  },
  JP: {
    code: "JP",
    name: "Japan",
    glucoseUnits: "mg",
    currency: "JPY",
    currencySymbol: "\u00a5",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "humulin-r", "novolin-r",
      "humulin-n", "novolin-n",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0,
    timezone: "Asia/Tokyo",
  },
  BR: {
    code: "BR",
    name: "Brazil",
    glucoseUnits: "mg",
    currency: "BRL",
    currencySymbol: "R$",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra",
      "humulin-r", "novolin-r",
      "humulin-n", "novolin-n",
      "lantus", "basaglar", "levemir", "tresiba",
      "novomix-30", "humalog-mix-25",
    ],
    pppDiscount: 0.60,
    timezone: "America/Sao_Paulo",
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    glucoseUnits: "mmol",
    currency: "NGN",
    currencySymbol: "\u20a6",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid",
      "actrapid", "humulin-r",
      "humulin-n", "insulatard",
      "lantus", "levemir",
      "novomix-30",
    ],
    pppDiscount: 0.78,
    timezone: "Africa/Lagos",
  },
  KE: {
    code: "KE",
    name: "Kenya",
    glucoseUnits: "mmol",
    currency: "KES",
    currencySymbol: "KSh",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid",
      "actrapid", "humulin-r",
      "humulin-n", "insulatard",
      "lantus", "levemir",
      "novomix-30",
    ],
    pppDiscount: 0.72,
    timezone: "Africa/Nairobi",
  },
  EG: {
    code: "EG",
    name: "Egypt",
    glucoseUnits: "mg",
    currency: "EGP",
    currencySymbol: "E\u00a3",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid",
      "actrapid", "humulin-r",
      "humulin-n", "insulatard",
      "lantus", "levemir",
      "novomix-30",
    ],
    pppDiscount: 0.70,
    timezone: "Africa/Cairo",
  },
  IL: {
    code: "IL",
    name: "Israel",
    glucoseUnits: "mg",
    currency: "ILS",
    currencySymbol: "\u20aa",
    language: "en-GB",
    availableLanguages: ["en-GB"],
    insulinAvailability: [
      "humalog", "novorapid", "apidra", "fiasp",
      "actrapid",
      "humulin-n", "insulatard",
      "lantus", "levemir", "tresiba", "toujeo",
      "novomix-30",
    ],
    pppDiscount: 0.10,
    timezone: "Asia/Jerusalem",
  },
};

/** Map IANA timezone to country code for auto-detection */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Africa/Johannesburg": "ZA",
  "Africa/Windhoek": "NA",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Darwin": "AU",
  "Australia/Hobart": "AU",
  "Pacific/Auckland": "NZ",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Amsterdam": "NL",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Tokyo": "JP",
  "America/Sao_Paulo": "BR",
  "America/Fortaleza": "BR",
  "America/Manaus": "BR",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Cairo": "EG",
  "Asia/Jerusalem": "IL",
};

/**
 * Detect the user's region based on browser timezone.
 * Falls back to GB (United Kingdom) if detection fails.
 */
export function detectRegion(): RegionConfig {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = TIMEZONE_TO_COUNTRY[tz];
    if (countryCode && REGION_CONFIGS[countryCode]) {
      return REGION_CONFIGS[countryCode];
    }
  } catch {
    // Intl not available
  }
  return REGION_CONFIGS["GB"];
}

/**
 * Look up a region config by ISO 3166-1 alpha-2 code.
 * Returns undefined if the code is not supported.
 */
export function getRegionConfig(code: string): RegionConfig | undefined {
  return REGION_CONFIGS[code.toUpperCase()];
}

/**
 * Get the list of insulin profile keys available in a given region.
 */
export function getAvailableInsulins(regionCode: string): string[] {
  const config = getRegionConfig(regionCode);
  return config ? config.insulinAvailability : [];
}

/**
 * Calculate a PPP-adjusted price for a given region.
 * Returns the discounted price rounded to 2 decimal places.
 */
export function getPPPPrice(basePrice: number, regionCode: string): number {
  const config = getRegionConfig(regionCode);
  if (!config) return basePrice;
  const adjusted = basePrice * (1 - config.pppDiscount);
  return Math.round(adjusted * 100) / 100;
}

/**
 * Get the default settings for a region.
 */
export function getRegionDefaults(code: string): {
  glucoseUnits: "mmol" | "mg";
  currency: string;
  language: string;
  timezone: string;
} | undefined {
  const config = getRegionConfig(code);
  if (!config) return undefined;
  return {
    glucoseUnits: config.glucoseUnits,
    currency: config.currency,
    language: config.language,
    timezone: config.timezone,
  };
}

/**
 * Get all supported region configs as an array, sorted by name.
 */
export function getAllRegions(): RegionConfig[] {
  return Object.values(REGION_CONFIGS).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
