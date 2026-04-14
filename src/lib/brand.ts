/**
 * GluMira™ V7 — Brand tokens (Rule 19/20 LOCKED)
 * Shared across all marketing surfaces. Do not introduce new colors or fonts.
 */

export const BRAND = {
  navy: "#1A2A5E",
  navyDeep: "#0D1B3E",
  teal: "#2AB5C1",
  amber: "#F59E0B",
  white: "#FFFFFF",
  interior: "#F8F9FA",
  whatIfGreen: "#2E9E5A",
} as const;

export const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

export function loadBrandFonts(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[href*="Playfair"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

export const DISCLAIMER =
  "GluMira™ is an educational platform, not a medical device. No personal data required to browse.";
