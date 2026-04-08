/**
 * GluMira V7 — Subscription Tiers
 * Block 25: Tier definitions and feature gating.
 */

export type SubscriptionTier = "free" | "pro" | "ai" | "clinical";

export interface TierDefinition {
  id: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
  limits: Record<string, number | boolean>;
}

// ---------- Tier definitions ----------

const TIERS: Record<SubscriptionTier, TierDefinition> = {
  free: {
    id: "free",
    name: "GluMira Free",
    price: "$0",
    features: [
      "Manual glucose logging",
      "Manual insulin logging",
      "Meal logging (up to 20 meal regime profiles)",
      "Basic 24h glucose chart",
      "School Care Plan generator",
      "Injection site rotation tracker",
      "Streak & rewards",
      "Education (first 30 articles)",
      "Beta program access",
      "Hypo alert engine",
    ],
    limits: {
      meal_regimes: 20,
      education_articles: 30,
      mira_ai_messages: 0,
      pdf_reports: false,
      caregiver_slots: 0,
      cgm_live: false,
      predictive_glucose: false,
      api_access: false,
    },
  },
  pro: {
    id: "pro",
    name: "GluMira Pro",
    price: "$9.99/mo",
    features: [
      "Everything in Free",
      "IOB Hunter\u2122 engine full access",
      "ISF/ICR calculator",
      "Pattern intelligence",
      "Basal density map",
      "Nightscout integration",
      "CGM live 5min monitor",
      "All 20 meal regimes",
      "Pregnancy module",
      "Menstrual cycle module",
      "Comorbidity modules (ADHD, Thyroid, etc.)",
      "PDF report generator",
      "Caregiver multi-access",
      "All 100 education articles",
      "Exercise, Sleep, Environmental modules",
    ],
    limits: {
      meal_regimes: 20,
      education_articles: 100,
      mira_ai_messages: 0,
      pdf_reports: true,
      caregiver_slots: 5,
      cgm_live: true,
      predictive_glucose: false,
      api_access: false,
    },
  },
  ai: {
    id: "ai",
    name: "GluMira AI",
    price: "$19.99/mo",
    features: [
      "Everything in Pro",
      "Predictive glucose (1\u20134h forecast)",
      "AI bolus advisor with confidence score",
      "Hypo prediction (30\u201360min early warning)",
      "Basal optimiser",
      "Mira AI chat (unlimited)",
      "Mira education stories",
      "Badge system (full)",
      "Clinical AI reports",
      "Community module",
    ],
    limits: {
      meal_regimes: 20,
      education_articles: 100,
      mira_ai_messages: -1, // unlimited
      pdf_reports: true,
      caregiver_slots: 10,
      cgm_live: true,
      predictive_glucose: true,
      api_access: false,
    },
  },
  clinical: {
    id: "clinical",
    name: "GluMira Clinical",
    price: "Custom",
    features: [
      "Everything in AI",
      "Clinician portal",
      "Researcher portal",
      "Organisation dashboard",
      "Multi-patient management",
      "ISPAD compliance layer",
      "Audit trail",
      "Custom integrations",
      "API access",
    ],
    limits: {
      meal_regimes: 20,
      education_articles: 100,
      mira_ai_messages: -1,
      pdf_reports: true,
      caregiver_slots: -1, // unlimited
      cgm_live: true,
      predictive_glucose: true,
      api_access: true,
    },
  },
};

// ---------- Feature-to-tier mapping ----------

const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  // Free
  glucose_log: "free",
  insulin_log: "free",
  meal_log: "free",
  basic_chart: "free",
  school_care_plan: "free",
  injection_tracker: "free",
  streak_system: "free",
  education_basic: "free",
  beta_program: "free",
  hypo_alerts: "free",

  // Pro
  iob_hunter: "pro",
  isf_icr: "pro",
  pattern_intelligence: "pro",
  basal_density: "pro",
  nightscout: "pro",
  cgm_live: "pro",
  pregnancy_module: "pro",
  menstrual_module: "pro",
  adhd_module: "pro",
  thyroid_module: "pro",
  pdf_reports: "pro",
  caregiver_access: "pro",
  education_full: "pro",
  exercise_engine: "pro",
  sleep_engine: "pro",
  environmental_module: "pro",
  meal_regimes_full: "pro",
  comorbidity_modules: "pro",

  // AI
  predictive_glucose: "ai",
  ai_bolus_advisor: "ai",
  hypo_prediction: "ai",
  basal_optimiser: "ai",
  mira_ai_unlimited: "ai",
  mira_stories: "ai",
  badge_system_full: "ai",
  clinical_reports: "ai",
  community: "ai",

  // Clinical
  clinician_portal: "clinical",
  researcher_portal: "clinical",
  org_dashboard: "clinical",
  multi_patient: "clinical",
  ispad_compliance: "clinical",
  audit_trail: "clinical",
  custom_integrations: "clinical",
  api_access: "clinical",
};

// Tier hierarchy for comparison (higher number = higher tier)
const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  ai: 2,
  clinical: 3,
};

// ---------- Public API ----------

/**
 * Get the full definition for a subscription tier.
 */
export function getTierDefinition(tier: SubscriptionTier): TierDefinition {
  return TIERS[tier];
}

/**
 * Check whether a user on the given tier can access a specific feature.
 */
export function canAccessFeature(
  userTier: SubscriptionTier,
  featureKey: string
): boolean {
  const requiredTier = FEATURE_TIER_MAP[featureKey];
  if (!requiredTier) {
    // Unknown features are blocked by default
    return false;
  }
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

/**
 * Get the minimum subscription tier required for a feature.
 * Returns undefined if the feature key is not recognised.
 */
export function getRequiredTier(
  featureKey: string
): SubscriptionTier | undefined {
  return FEATURE_TIER_MAP[featureKey];
}

/**
 * If the user's tier is too low for the feature, return upgrade info.
 * Returns null if the user already has access.
 */
export function isUpgradeRequired(
  userTier: SubscriptionTier,
  featureKey: string
): { requiredTier: SubscriptionTier; tierName: string; price: string } | null {
  if (canAccessFeature(userTier, featureKey)) {
    return null;
  }

  const requiredTier = FEATURE_TIER_MAP[featureKey];
  if (!requiredTier) {
    return null;
  }

  const def = TIERS[requiredTier];
  return {
    requiredTier,
    tierName: def.name,
    price: def.price,
  };
}

/**
 * Get all available tiers as an ordered array (free -> clinical).
 */
export function getAllTiers(): TierDefinition[] {
  return [TIERS.free, TIERS.pro, TIERS.ai, TIERS.clinical];
}

/**
 * Get the complete feature-to-tier mapping.
 */
export function getFeatureMap(): Record<string, SubscriptionTier> {
  return { ...FEATURE_TIER_MAP };
}
