/**
 * GluMira V7 — TierGate component
 * Block 25: Wraps features that require a specific subscription tier.
 *
 * If the user has the required tier, children are rendered.
 * Otherwise a styled upgrade prompt is shown.
 */

import React from "react";
import { useSubscription } from "../hooks/useSubscription";
import {
  canAccessFeature,
  isUpgradeRequired,
} from "../lib/subscription-tiers";

interface TierGateProps {
  /** The feature key to check (e.g. "iob_hunter", "predictive_glucose") */
  feature: string;
  children: React.ReactNode;
  /** Optional custom fallback when the user lacks access */
  fallback?: React.ReactNode;
}

export default function TierGate({
  feature,
  children,
  fallback,
}: TierGateProps) {
  const { tier } = useSubscription();

  if (canAccessFeature(tier, feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <DefaultUpgradePrompt feature={feature} userTier={tier} />;
}

// ---------- Default upgrade prompt ----------

function DefaultUpgradePrompt({
  feature,
  userTier,
}: {
  feature: string;
  userTier: string;
}) {
  const info = isUpgradeRequired(
    userTier as "free" | "pro" | "ai" | "clinical",
    feature
  );

  const tierName = info?.tierName ?? "a higher plan";
  const price = info?.price ?? "";

  return (
    <div style={styles.card}>
      <div style={styles.lock}>🔒</div>
      <h3 style={styles.heading}>
        This feature requires {tierName}
      </h3>
      <p style={styles.feature}>{formatFeatureName(feature)}</p>
      {price && <p style={styles.price}>{price}</p>}
      <a href="/settings" style={styles.button}>
        Upgrade
      </a>
    </div>
  );
}

/**
 * Turn a snake_case feature key into a human-readable label.
 */
function formatFeatureName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Styles (Scandinavian Minimalist) ----------

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--bg-card, #ffffff)",
    borderRadius: 12,
    border: "1px solid var(--border-light, #e5e7eb)",
    padding: 32,
    textAlign: "center",
    maxWidth: 400,
    margin: "24px auto",
  },
  lock: {
    fontSize: 32,
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 8px",
    color: "var(--text-primary, #111827)",
  },
  feature: {
    fontSize: 14,
    color: "var(--text-secondary, #6b7280)",
    margin: "0 0 4px",
  },
  price: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary, #111827)",
    margin: "0 0 20px",
  },
  button: {
    display: "inline-block",
    padding: "10px 28px",
    borderRadius: 8,
    background: "var(--brand-primary, #2563eb)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    transition: "opacity 0.15s",
  },
};
