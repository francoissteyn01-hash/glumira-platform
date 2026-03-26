/**
 * GluMira™ IOB Badge Component
 * Version: 7.0.0
 *
 * Displays a live Insulin-On-Board badge using the useIobCurrent hook.
 * Designed to be embedded in the Sidebar and dashboard header.
 *
 * Variants:
 *  - "pill"    — compact coloured pill (for sidebar)
 *  - "card"    — expanded card with dose count and computed time
 *  - "inline"  — plain text with colour (for header)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useIobCurrent, iobRiskColour, type IobRiskTier } from "@/hooks/useIobCurrent";

// ─── Types ────────────────────────────────────────────────────

interface IobBadgeProps {
  variant?: "pill" | "card" | "inline";
  className?: string;
}

// ─── Risk label ───────────────────────────────────────────────

function riskLabel(tier: IobRiskTier | null): string {
  switch (tier) {
    case "danger":  return "High IOB";
    case "caution": return "Moderate IOB";
    case "safe":    return "IOB OK";
    default:        return "IOB";
  }
}

// ─── Pill variant ─────────────────────────────────────────────

function PillBadge() {
  const { iob, riskTier, loading } = useIobCurrent();

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 animate-pulse">
        IOB …
      </span>
    );
  }

  if (iob === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${iobRiskColour(riskTier)}`}
      title={`Active insulin on board: ${iob.toFixed(2)} U`}
    >
      {iob.toFixed(1)}U
    </span>
  );
}

// ─── Card variant ─────────────────────────────────────────────

function CardBadge() {
  const { iob, riskTier, doseCount, computedAt, loading, error, refresh } = useIobCurrent();

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-7 bg-gray-200 rounded w-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">
        IOB unavailable
      </div>
    );
  }

  if (iob === null) return null;

  const colourClass =
    riskTier === "danger"  ? "border-red-200 bg-red-50" :
    riskTier === "caution" ? "border-amber-200 bg-amber-50" :
    "border-green-200 bg-green-50";

  const textClass =
    riskTier === "danger"  ? "text-red-700" :
    riskTier === "caution" ? "text-amber-700" :
    "text-green-700";

  return (
    <div className={`rounded-xl border p-4 ${colourClass}`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-semibold ${textClass}`}>
          {riskLabel(riskTier)}
        </p>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-gray-600"
          title="Refresh IOB"
        >
          ↺
        </button>
      </div>
      <p className={`text-2xl font-bold ${textClass}`}>
        {iob.toFixed(2)}<span className="text-sm font-normal ml-1">U</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {doseCount} active dose{doseCount !== 1 ? "s" : ""}
        {computedAt && (
          <> · {new Date(computedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
        )}
      </p>
      <p className="text-xs text-gray-400 mt-2 italic">
        Informational only. Not a medical device.
      </p>
    </div>
  );
}

// ─── Inline variant ───────────────────────────────────────────

function InlineBadge() {
  const { iob, riskTier, loading } = useIobCurrent();

  if (loading || iob === null) return null;

  const textClass =
    riskTier === "danger"  ? "text-red-600 font-bold" :
    riskTier === "caution" ? "text-amber-600 font-semibold" :
    "text-green-700 font-semibold";

  return (
    <span className={`text-sm ${textClass}`}>
      IOB: {iob.toFixed(2)}U
    </span>
  );
}

// ─── Main export ──────────────────────────────────────────────

export function IobBadge({ variant = "pill", className = "" }: IobBadgeProps) {
  return (
    <span className={className}>
      {variant === "pill"   && <PillBadge />}
      {variant === "card"   && <CardBadge />}
      {variant === "inline" && <InlineBadge />}
    </span>
  );
}

export default IobBadge;
