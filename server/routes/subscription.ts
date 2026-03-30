/**
 * GluMira™ V7 — server/middleware/subscription.ts
 *
 * Subscription tier gate middleware and feature flag system.
 * Source: 04.2.87 Subscription Tier Logic + Phase 2 Execution Plan §1.4
 *
 * Tiers:
 *   Free  — 3-month trial, limited features, expires
 *   Pro   — $29.99/mo, full features, unlimited patients
 *   AI    — $99.99/mo, predictive AI, API access, research tools
 *
 * Regional pricing: 30% discount for African residents (AF region)
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Request, Response, NextFunction } from "express";
import { supabase } from "../index";
import { type AuthRequest } from "./auth";

// ─── Tier definitions ──────────────────────────────────────────────────────

export type Tier    = "free" | "pro" | "ai";
export type Region  = "AF" | "UAE" | "UK" | "EU" | "US" | "INT";

export interface TierConfig {
  name:           string;
  monthlyUSD:     number;
  trialDays:      number | null;   // null = no trial
  maxPatients:    number;          // -1 = unlimited
  dataRetentionDays: number;       // -1 = unlimited
  mediaExpiryDays:   number | null;// null = unlimited
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  free: {
    name:              "GluMira Free",
    monthlyUSD:        0,
    trialDays:         90,         // 3 months
    maxPatients:       -1,         // unlimited during trial
    dataRetentionDays: 90,
    mediaExpiryDays:   90,
  },
  pro: {
    name:              "GluMira Pro",
    monthlyUSD:        29.99,
    trialDays:         null,
    maxPatients:       -1,
    dataRetentionDays: -1,
    mediaExpiryDays:   null,
  },
  ai: {
    name:              "GluMira AI",
    monthlyUSD:        99.99,
    trialDays:         null,
    maxPatients:       -1,
    dataRetentionDays: -1,
    mediaExpiryDays:   null,
  },
};

// Regional discount — 30% for African residents (spec §5.5)
export const REGIONAL_DISCOUNT: Record<Region, number> = {
  AF:  0.70,  // 30% off
  UAE: 0.70,  // 30% off — Gulf pricing
  UK:  1.00,
  EU:  1.00,
  US:  1.00,
  INT: 1.00,
};

export function getEffectivePrice(tier: Tier, region: Region): number {
  const base     = TIER_CONFIG[tier].monthlyUSD;
  const discount = REGIONAL_DISCOUNT[region] ?? 1.0;
  return Math.round(base * discount * 100) / 100;
}

// ─── Features gated by tier ────────────────────────────────────────────────
// Source: Phase 2 Execution Plan §1.4

export type Feature =
  | "photo_upload"
  | "file_upload"
  | "results_dashboard"
  | "appointment_booking"
  | "menstrual_tracking"
  | "caregiver_sharing"
  | "basic_iob"
  | "multi_dose_stacking"
  | "pdf_export"
  | "iob_decay_curves"
  | "unlimited_patients"
  | "team_collaboration"
  | "specialist_modules"
  | "ai_predictions"
  | "api_access"
  | "population_analytics"
  | "deid_export"
  | "nightscout_cgm"
  | "dexcom_cgm"
  | "libre_cgm";

const FREE_FEATURES: Feature[] = [
  "nightscout_cgm",
  "basic_iob",
  "photo_upload",        // disabled after trial expires
  "file_upload",         // disabled after trial expires
  "results_dashboard",   // disabled after trial expires
  "appointment_booking", // disabled after trial expires
  "menstrual_tracking",  // disabled after trial expires
  "caregiver_sharing",
  "specialist_modules",
  "unlimited_patients",
];

const PRO_FEATURES: Feature[] = [
  ...FREE_FEATURES,
  "dexcom_cgm",
  "libre_cgm",
  "multi_dose_stacking",
  "iob_decay_curves",
  "pdf_export",
  "team_collaboration",
];

const AI_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  "ai_predictions",
  "api_access",
  "population_analytics",
  "deid_export",
];

// Features removed after free trial expires
const POST_TRIAL_DISABLED: Feature[] = [
  "photo_upload",
  "file_upload",
  "results_dashboard",
  "appointment_booking",
  "menstrual_tracking",
];

const TIER_FEATURES: Record<Tier, Feature[]> = {
  free: FREE_FEATURES,
  pro:  PRO_FEATURES,
  ai:   AI_FEATURES,
};

// ─── Subscription lookup ──────────────────────────────────────────────────

export interface UserSubscription {
  tier:         Tier;
  region:       Region;
  trialExpired: boolean;
  trialEndsAt:  Date | null;
  isActive:     boolean;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, region, trial_end_date, subscription_end_date, cancelled_at")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // No subscription row — default free with 90-day trial from account creation
    return { tier: "free", region: "INT", trialExpired: false, trialEndsAt: null, isActive: true };
  }

  const now          = new Date();
  const trialEndsAt  = data.trial_end_date ? new Date(data.trial_end_date) : null;
  const trialExpired = trialEndsAt ? now > trialEndsAt : false;
  const subEndsAt    = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
  const cancelled    = !!data.cancelled_at;

  const isActive = !cancelled && (
    data.tier === "free" || (subEndsAt ? now <= subEndsAt : true)
  );

  return {
    tier:         (data.tier as Tier) ?? "free",
    region:       (data.region as Region) ?? "INT",
    trialExpired,
    trialEndsAt,
    isActive,
  };
}

// ─── Feature check ────────────────────────────────────────────────────────

export function canAccessFeature(
  feature: Feature,
  sub: UserSubscription
): { allowed: boolean; reason?: string } {
  if (!sub.isActive) {
    return { allowed: false, reason: "Subscription inactive. Please renew." };
  }

  const features = TIER_FEATURES[sub.tier];
  if (!features.includes(feature)) {
    const requiredTier = AI_FEATURES.includes(feature) ? "ai" : "pro";
    return {
      allowed: false,
      reason: `${feature} requires GluMira ${requiredTier === "ai" ? "AI ($99.99/mo)" : "Pro ($29.99/mo)"}`,
    };
  }

  // Check if free trial has expired and feature is post-trial-disabled
  if (sub.tier === "free" && sub.trialExpired && POST_TRIAL_DISABLED.includes(feature)) {
    return {
      allowed: false,
      reason: `Your 3-month trial has ended. Upgrade to Pro to re-enable ${feature}.`,
    };
  }

  return { allowed: true };
}

// ─── Express middleware factories ─────────────────────────────────────────

/**
 * requireFeature(feature) — gates a route on tier + trial status.
 * Usage: router.get("/export", requireAuth, requireFeature("pdf_export"), handler)
 */
export function requireFeature(feature: Feature) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const sub    = await getUserSubscription(req.user.id);
      const { allowed, reason } = canAccessFeature(feature, sub);

      if (!allowed) {
        return res.status(403).json({
          error:   "Feature not available on your current plan",
          reason,
          upgrade: "https://glumira.com/pricing",
        });
      }

      // Attach subscription to request for downstream use
      (req as AuthRequest & { sub?: UserSubscription }).sub = sub;
      return next();
    } catch (err) {
      console.error("[requireFeature]", err);
      return res.status(500).json({ error: "Subscription check failed" });
    }
  };
}

/**
 * requireTier(tier) — gates a route on minimum tier level.
 */
export function requireTier(minTier: Tier) {
  const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, ai: 2 };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const sub = await getUserSubscription(req.user.id);

    if (TIER_RANK[sub.tier] < TIER_RANK[minTier]) {
      return res.status(403).json({
        error:   `This endpoint requires GluMira ${minTier === "ai" ? "AI" : "Pro"} or higher`,
        upgrade: "https://glumira.com/pricing",
      });
    }

    return next();
  };
}

/**
 * injectSubscription — adds sub to req without blocking.
 * Use for endpoints that adjust behaviour by tier (not gate entirely).
 */
export async function injectSubscription(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  if (req.user) {
    try {
      (req as AuthRequest & { sub?: UserSubscription }).sub =
        await getUserSubscription(req.user.id);
    } catch { /* non-blocking */ }
  }
  next();
}

// ─── Subscription REST router ────────────────────────────────────────────
import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const subscriptionRouter = Router();

subscriptionRouter.get("/status", requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const sub = await getUserSubscription(req.user.id);
    return res.json({ ok: true, subscription: sub });
  } catch (err) {
    console.error("[subscription/status]", err);
    return res.status(500).json({ error: "Failed to fetch subscription" });
  }
});
