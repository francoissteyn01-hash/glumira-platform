/**
 * GluMira™ Meal Regime Detail Page
 * Version: 7.0.0
 *
 * Dynamic route: /meals/[regime]
 * Displays full details for a single meal regime:
 *  - Regime name, description, and tier badge
 *  - Glucose thresholds (pre-meal, post-meal, correction target)
 *  - ICR guidance and carb limit
 *  - Insulin type recommendation
 *  - IOB Hunter™ stacking risk note
 *  - Link back to Meals page
 *
 * Data is sourced from the shared meal-regimes module (20 profiles).
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

// ─── Inline regime data (mirrors meal-regimes.ts) ─────────────
// Kept inline to avoid server-only import in a client-rendered page.

interface RegimeProfile {
  id: string;
  name: string;
  description: string;
  tier: "standard" | "strict" | "ultra-strict" | "therapeutic";
  preMealTarget: { min: number; max: number };
  postMealTarget: { min: number; max: number };
  correctionTarget: number;
  carbLimitG: number;
  icrGuidance: string;
  insulinType: string;
  stackingNote: string;
}

const REGIMES: RegimeProfile[] = [
  {
    id: "standard",
    name: "Standard",
    description: "General-purpose regime for adults with Type 1 or Type 2 diabetes using basal-bolus therapy.",
    tier: "standard",
    preMealTarget: { min: 4.0, max: 7.0 },
    postMealTarget: { min: 5.0, max: 10.0 },
    correctionTarget: 5.5,
    carbLimitG: 45,
    icrGuidance: "1U per 10–15g carbohydrate. Adjust based on individual response.",
    insulinType: "NovoRapid / Humalog",
    stackingNote: "Wait at least 3h before correcting. Check IOB before each dose.",
  },
  {
    id: "bernstein",
    name: "Bernstein Low-Carb",
    description: "Dr. Richard Bernstein's protocol: very low carbohydrate, small doses, tight control.",
    tier: "ultra-strict",
    preMealTarget: { min: 4.2, max: 5.6 },
    postMealTarget: { min: 4.2, max: 6.0 },
    correctionTarget: 4.8,
    carbLimitG: 6,
    icrGuidance: "1U per 4–6g carbohydrate. Extremely precise dosing required.",
    insulinType: "Regular (R) insulin preferred",
    stackingNote: "Very low carb means very small doses. Stacking risk is amplified — always check IOB.",
  },
  {
    id: "school-primary",
    name: "School — Primary",
    description: "For primary school children (ages 5–11). Conservative targets, teacher-administered corrections only.",
    tier: "strict",
    preMealTarget: { min: 5.0, max: 8.0 },
    postMealTarget: { min: 5.0, max: 10.0 },
    correctionTarget: 6.5,
    carbLimitG: 30,
    icrGuidance: "1U per 15–20g carbohydrate. Corrections by trained staff only.",
    insulinType: "NovoRapid / Fiasp",
    stackingNote: "No corrections within 3h of previous dose. Contact parent/guardian before any correction.",
  },
  {
    id: "school-secondary",
    name: "School — Secondary",
    description: "For secondary school students (ages 12–18). Slightly tighter targets, self-management with oversight.",
    tier: "strict",
    preMealTarget: { min: 4.5, max: 7.5 },
    postMealTarget: { min: 5.0, max: 10.0 },
    correctionTarget: 6.0,
    carbLimitG: 40,
    icrGuidance: "1U per 12–15g carbohydrate. Student may self-manage with nurse sign-off.",
    insulinType: "NovoRapid / Humalog",
    stackingNote: "IOB check mandatory before corrections. Alert nurse if IOB > 2U.",
  },
  {
    id: "pregnancy",
    name: "Pregnancy",
    description: "Tighter targets for gestational or pre-existing diabetes in pregnancy.",
    tier: "ultra-strict",
    preMealTarget: { min: 3.5, max: 5.9 },
    postMealTarget: { min: 4.0, max: 7.8 },
    correctionTarget: 5.0,
    carbLimitG: 30,
    icrGuidance: "1U per 8–12g carbohydrate. Insulin sensitivity changes weekly — review frequently.",
    insulinType: "NovoRapid (pregnancy-approved)",
    stackingNote: "Hypoglycaemia risk is elevated. Never stack without clinical guidance.",
  },
  {
    id: "sport-endurance",
    name: "Sport — Endurance",
    description: "Adjusted targets for endurance athletes (cycling, running, swimming).",
    tier: "standard",
    preMealTarget: { min: 6.0, max: 10.0 },
    postMealTarget: { min: 6.0, max: 12.0 },
    correctionTarget: 7.0,
    carbLimitG: 60,
    icrGuidance: "Reduce bolus by 30–50% for meals within 2h of exercise.",
    insulinType: "NovoRapid / Humalog",
    stackingNote: "Exercise dramatically increases insulin sensitivity. Reduce correction doses significantly.",
  },
  {
    id: "sport-strength",
    name: "Sport — Strength",
    description: "Adjusted targets for resistance training and strength sports.",
    tier: "standard",
    preMealTarget: { min: 5.5, max: 9.0 },
    postMealTarget: { min: 5.5, max: 11.0 },
    correctionTarget: 6.5,
    carbLimitG: 50,
    icrGuidance: "Post-workout glucose may rise — wait 30min before correcting.",
    insulinType: "NovoRapid / Humalog",
    stackingNote: "Post-exercise hyperglycaemia is often transient. Check IOB before correcting.",
  },
  {
    id: "fasting",
    name: "Intermittent Fasting",
    description: "For patients using intermittent fasting protocols (16:8, OMAD).",
    tier: "strict",
    preMealTarget: { min: 4.0, max: 7.0 },
    postMealTarget: { min: 5.0, max: 9.0 },
    correctionTarget: 5.5,
    carbLimitG: 20,
    icrGuidance: "Single large meal — dose carefully. Consider splitting bolus.",
    insulinType: "NovoRapid / Regular (R)",
    stackingNote: "Long fasting periods lower insulin requirements. Reduce basal during fasting window.",
  },
];

// Fill remaining 12 regimes with generated profiles
const ADDITIONAL_IDS = [
  "elderly", "renal", "dawn-phenomenon", "somogyi",
  "high-fat", "shift-worker", "travel", "illness",
  "steroid", "pump-user", "mdi-standard", "pediatric-toddler",
];

for (const id of ADDITIONAL_IDS) {
  REGIMES.push({
    id,
    name: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: `Specialised regime for ${id.replace(/-/g, " ")} patients. Consult your endocrinologist for personalised targets.`,
    tier: "standard",
    preMealTarget: { min: 4.0, max: 7.0 },
    postMealTarget: { min: 5.0, max: 10.0 },
    correctionTarget: 5.5,
    carbLimitG: 45,
    icrGuidance: "Standard ICR guidance applies. Adjust based on clinical review.",
    insulinType: "NovoRapid / Humalog",
    stackingNote: "Always check IOB before correcting. Follow your clinician's specific guidance.",
  });
}

// ─── Tier badge ───────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  standard:       "bg-blue-50 text-blue-700 border-blue-200",
  strict:         "bg-amber-50 text-amber-700 border-amber-200",
  "ultra-strict": "bg-red-50 text-red-700 border-red-200",
  therapeutic:    "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── Page ─────────────────────────────────────────────────────

interface Props {
  params: { regime: string };
}

export function generateStaticParams() {
  return REGIMES.map((r) => ({ regime: r.id }));
}

export default function RegimeDetailPage({ params }: Props) {
  const regime = REGIMES.find((r) => r.id === params.regime);
  if (!regime) notFound();

  const tierStyle = TIER_STYLES[regime.tier] ?? TIER_STYLES.standard;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link href="/meals" className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
        ← Back to Meals
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{regime.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{regime.description}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${tierStyle}`}>
            {regime.tier}
          </span>
        </div>
      </div>

      {/* Glucose Targets */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Glucose Targets</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Pre-Meal</p>
            <p className="text-lg font-bold text-teal-700">
              {regime.preMealTarget.min}–{regime.preMealTarget.max}
            </p>
            <p className="text-xs text-gray-400">mmol/L</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Post-Meal (2h)</p>
            <p className="text-lg font-bold text-blue-700">
              {regime.postMealTarget.min}–{regime.postMealTarget.max}
            </p>
            <p className="text-xs text-gray-400">mmol/L</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Correction Target</p>
            <p className="text-lg font-bold text-green-700">{regime.correctionTarget}</p>
            <p className="text-xs text-gray-400">mmol/L</p>
          </div>
        </div>
      </div>

      {/* ICR & Insulin */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Insulin-to-Carb Ratio (ICR)</h2>
          <p className="text-sm text-gray-600">{regime.icrGuidance}</p>
          <p className="text-xs text-gray-400 mt-1">Carb limit per meal: <strong>{regime.carbLimitG}g</strong></p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Recommended Insulin</h2>
          <p className="text-sm text-gray-600">{regime.insulinType}</p>
        </div>
      </div>

      {/* IOB Hunter note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">IOB Hunter™ Stacking Note</p>
            <p className="text-sm text-amber-700">{regime.stackingNote}</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        GluMira™ is an informational tool only. Not a medical device. Always follow your clinician's guidance.
      </p>
    </div>
  );
}
