/**
 * GluMira™ V7 — client/src/lib/constants.ts
 * App-wide constants
 */

export const APP_NAME = "GluMira™";
export const APP_VERSION = "7.0.0";

export const GLUCOSE_RANGES = {
  LOW:      { min: 0,    max: 3.8  },
  NORMAL:   { min: 3.9,  max: 10.0 },
  HIGH:     { min: 10.1, max: 13.9 },
  CRITICAL: { min: 14.0, max: 999  },
} as const;

export const DISCLAIMER =
  "GluMira™ is an educational platform and does not constitute medical advice. " +
  "Always consult your healthcare team before making changes to your diabetes management.";

export const NAV_LINKS = [
  { label: "Dashboard",  href: "/dashboard" },
  { label: "Log Insulin", href: "/log" },
  { label: "Education",  href: "/education" },
  { label: "Mira AI",    href: "/mira" },
  { label: "Badges",     href: "/badges" },
  { label: "Settings",   href: "/settings" },
  { label: "FAQ",        href: "/faq" },
] as const;

export const BADGE_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type BadgeTier = typeof BADGE_TIERS[number];

export const EDUCATION_MODULES = [
  { id: "basics",       title: "Diabetes Basics",          slug: "basics" },
  { id: "iob",          title: "Insulin on Board (IOB)",   slug: "iob" },
  { id: "carbs",        title: "Carbohydrate Counting",    slug: "carbs" },
  { id: "nightscout",   title: "Nightscout & CGM",         slug: "nightscout" },
  { id: "hormones",     title: "Hormones & Glucose",       slug: "hormones" },
  { id: "sick-days",    title: "Sick Day Management",      slug: "sick-days" },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Is GluMira a medical device?",
    a: "No. GluMira™ is an educational platform. It does not provide medical advice or replace your healthcare team.",
  },
  {
    q: "Does GluMira connect to my CGM?",
    a: "GluMira can read data from Nightscout. Direct CGM integration is on the roadmap.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. We use Supabase with row-level security.",
  },
  {
    q: "What is Mira?",
    a: "Mira is GluMira's AI education assistant. She answers questions about diabetes management based on your profile.",
  },
  {
    q: "How do I earn badges?",
    a: "Badges are awarded for completing education modules, logging consistently, and hitting personal milestones.",
  },
  {
    q: "Can I share access with my caregiver?",
    a: "Yes. Caregiver sharing is available on the Pro and Clinic plans.",
  },
] as const;
