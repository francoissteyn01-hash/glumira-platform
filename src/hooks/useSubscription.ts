/**
 * GluMira V7 — useSubscription hook
 * Block 25: Reads the user's subscription tier.
 *
 * Currently backed by localStorage; will be replaced with
 * Supabase + Stripe in a future block.
 */

import { useState, useEffect } from "react";
import type { SubscriptionTier } from "../lib/subscription-tiers";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isFreeTier: boolean;
  isProOrAbove: boolean;
  isAIOrAbove: boolean;
  isClinical: boolean;
}

const STORAGE_KEY = "glumira_tier";
const VALID_TIERS: SubscriptionTier[] = ["free", "pro", "ai", "clinical"];

function readTier(): SubscriptionTier {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_TIERS.includes(stored as SubscriptionTier)) {
      return stored as SubscriptionTier;
    }
  } catch {
    // localStorage unavailable (SSR, private browsing edge cases)
  }
  return "free";
}

export function useSubscription(): SubscriptionInfo {
  const [tier, setTier] = useState<SubscriptionTier>(readTier);

  // Listen for storage changes (e.g. tier changed in another tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setTier(readTier());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return {
    tier,
    isFreeTier: tier === "free",
    isProOrAbove: tier !== "free",
    isAIOrAbove: tier === "ai" || tier === "clinical",
    isClinical: tier === "clinical",
  };
}
