/**
 * GluMira™ — Milestone Toast Component
 * Version: 1.0.0
 *
 * Subtle, elegant toast notification for milestone events.
 * Slides in from the right, auto-dismisses after 6 seconds.
 * Easy to dismiss manually.
 *
 * Used for: badge earned, streak milestones, tier upgrades, in-range streaks.
 * NOT used for: diaversary, birthday, caregiver (those use the full modal).
 *
 * Design: Scandinavian minimalist — white bg, subtle border, no heavy gradients.
 */

import React, { useEffect, useRef, useState } from "react";
import type { MilestoneMessage, MascotTier } from "../../lib/gamification/types";
import { BADGE_CONFIGS, TIER_CONFIGS } from "../../lib/gamification/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MilestoneToastProps {
  milestone: MilestoneMessage;
  onDismiss: (id: string) => void;
  /** Auto-dismiss delay in ms. Default: 6000 */
  autoDismissMs?: number;
}

// ─── Toast Icon ───────────────────────────────────────────────────────────────

function ToastIcon({ milestone }: { milestone: MilestoneMessage }) {
  if (milestone.badgeId) {
    const badge = BADGE_CONFIGS[milestone.badgeId];
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
          boxShadow: "0 0 10px rgba(42, 181, 193, 0.3)",
        }}
      >
        {badge.icon}
      </div>
    );
  }

  if (milestone.newTier) {
    const tierConfig = TIER_CONFIGS[milestone.newTier];
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{
          background: `radial-gradient(circle, ${tierConfig.glowColor}, rgba(13, 27, 62, 0.8))`,
          border: `1.5px solid ${tierConfig.primaryColor}`,
        }}
      >
        {milestone.newTier === "crown" ? "👑" : "⬆️"}
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    streak_7: "🔥",
    streak_30: "⚡",
    streak_90: "💎",
    a1c_improved: "📈",
    in_range_week: "🎯",
    in_range_month: "🏆",
    badge_earned: "🦉",
    tier_upgrade: "⭐",
  };

  return (
    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl flex-shrink-0">
      {typeIcons[milestone.type] ?? "✨"}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ durationMs }: { durationMs: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-b-xl overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-400 to-teal-400 rounded-full"
        style={{
          animation: `toast-progress ${durationMs}ms linear forwards`,
          width: "100%",
        }}
      />
    </div>
  );
}

// ─── Main Toast ───────────────────────────────────────────────────────────────

export function MilestoneToast({
  milestone,
  onDismiss,
  autoDismissMs = 6000,
}: MilestoneToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(milestone.id), 300);
  };

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, autoDismissMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-w-sm w-full"
      style={{
        animation: isLeaving
          ? "toast-slide-out 0.3s ease-in forwards"
          : "toast-slide-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        {/* Icon */}
        <ToastIcon milestone={milestone} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {milestone.title}
          </p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-2">
            {milestone.body}
          </p>
          {milestone.pointsAwarded && milestone.pointsAwarded > 0 && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
              +{milestone.pointsAwarded} pts
            </span>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <ProgressBar durationMs={autoDismissMs} />
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

interface MilestoneToastContainerProps {
  milestones: MilestoneMessage[];
  onDismiss: (id: string) => void;
}

export function MilestoneToastContainer({
  milestones,
  onDismiss,
}: MilestoneToastContainerProps) {
  // Only show toast-appropriate types (not the heavy modal types)
  const toastTypes = ["badge_earned", "streak_7", "streak_30", "streak_90", "tier_upgrade", "a1c_improved", "in_range_week", "in_range_month"];
  const toastMilestones = milestones.filter((m) => toastTypes.includes(m.type));

  if (toastMilestones.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 items-end"
      aria-label="Milestone notifications"
    >
      {toastMilestones.slice(0, 3).map((milestone) => (
        <MilestoneToast
          key={milestone.id}
          milestone={milestone}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

export default MilestoneToastContainer;
