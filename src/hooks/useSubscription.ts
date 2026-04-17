/**
 * GluMira V7 — useSubscription hook
 * Block 25: Reads the user's subscription tier from the server.
 *
 * Source of truth: /api/subscription/status (server reads subscriptions table).
 * Falls back to "free" when unauthenticated or on network error.
 * Unauthenticated users get a 14-day trial computed from auth.user.created_at.
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { API } from "@/lib/api";
import type { SubscriptionTier } from "../lib/subscription-tiers";

export type SubscriptionInfo = {
  tier: SubscriptionTier;
  isFreeTier: boolean;
  isProOrAbove: boolean;
  isAIOrAbove: boolean;
  isClinical: boolean;
  /** True when the user is within their free trial window */
  isTrialActive: boolean;
  /** Trial end date (null if no trial or already expired) */
  trialEndsAt: Date | null;
}

const TRIAL_DAYS = 14;

/** Compute whether a newly registered user is still within the 14-day trial */
function computeTrialStatus(createdAt: string | undefined): { isTrialActive: boolean; trialEndsAt: Date | null } {
  if (!createdAt) return { isTrialActive: false, trialEndsAt: null };
  const created  = new Date(createdAt);
  const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return { isTrialActive: Date.now() < trialEnd.getTime(), trialEndsAt: trialEnd };
}

export function useSubscription(): SubscriptionInfo {
  const { session, user } = useAuth();

  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!session) {
      // Unauthenticated — full free tier, trial based on anonymous session age
      const { isTrialActive: ta, trialEndsAt: te } = computeTrialStatus(user?.created_at);
      setTier("free");
      setIsTrialActive(ta);
      setTrialEndsAt(te);
      return;
    }

    // Fetch tier from server (subscriptions table, checked against Stripe)
    fetch(`${API}/api/subscription/status`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const sub = data.subscription as {
          tier: string;
          trialExpired: boolean;
          trialEndsAt: string | null;
        };
        // Server returns "free" | "pro" | "ai" — map to client SubscriptionTier
        const serverTier: SubscriptionTier =
          sub.tier === "pro" ? "pro"
          : sub.tier === "ai" ? "ai"
          : "free";
        setTier(serverTier);
        const te = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
        setIsTrialActive(!sub.trialExpired && te !== null);
        setTrialEndsAt(te);
      })
      .catch(() => {
        // Network failure — fall back to trial computation from account age
        const { isTrialActive: ta, trialEndsAt: te } = computeTrialStatus(user?.created_at);
        setIsTrialActive(ta);
        setTrialEndsAt(te);
      });
  }, [session, user?.created_at]);

  return {
    tier,
    isFreeTier: tier === "free",
    isProOrAbove: tier !== "free",
    isAIOrAbove: tier === "ai" || tier === "clinical",
    isClinical: tier === "clinical",
    isTrialActive,
    trialEndsAt,
  };
}
