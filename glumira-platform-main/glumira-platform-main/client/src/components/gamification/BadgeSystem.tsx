/**
 * GluMira™ — Badge System Components
 * Version: 1.0.0
 *
 * Components:
 *   - BadgeCard: Individual badge display with locked/unlocked state
 *   - BadgeGrid: Full grid of all badges for the profile/rewards page
 *   - BadgeEarnModal: Modal shown when a new badge is earned
 *   - ActiveBadgeSelector: UI to choose which badge replaces the mascot
 *
 * Design: Scandinavian minimalist (App UI track) — white bg, Inter/DM Sans
 */

import React, { useState } from "react";
import type { BadgeId, BadgeConfig, MascotTier } from "../../lib/gamification/types";
import { BADGE_CONFIGS, TIER_CONFIGS } from "../../lib/gamification/types";

// ─── BadgeCard ────────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badgeId: BadgeId;
  isUnlocked: boolean;
  isActive: boolean;
  unlockedAt?: string;
  onSelect?: (badgeId: BadgeId) => void;
}

export function BadgeCard({
  badgeId,
  isUnlocked,
  isActive,
  unlockedAt,
  onSelect,
}: BadgeCardProps) {
  const config = BADGE_CONFIGS[badgeId];

  const handleClick = () => {
    if (isUnlocked && onSelect && config.canReplaceMascot) {
      onSelect(badgeId);
    }
  };

  const categoryColors: Record<BadgeConfig["category"], string> = {
    engagement: "bg-blue-50 text-blue-600 border-blue-100",
    health: "bg-teal-50 text-teal-600 border-teal-100",
    milestone: "bg-amber-50 text-amber-600 border-amber-100",
    caregiver: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div
      onClick={handleClick}
      role={isUnlocked && config.canReplaceMascot ? "button" : undefined}
      tabIndex={isUnlocked && config.canReplaceMascot ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={`
        relative rounded-xl border p-3 transition-all duration-200
        ${isUnlocked
          ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
          : "bg-gray-50 border-gray-100 opacity-60"
        }
        ${isActive ? "ring-2 ring-blue-500 ring-offset-1 border-blue-200" : ""}
        ${isUnlocked && config.canReplaceMascot ? "cursor-pointer" : "cursor-default"}
      `}
      aria-label={`${config.name}${isUnlocked ? " — Unlocked" : " — Locked"}${isActive ? " — Active" : ""}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Badge icon */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl
            ${isUnlocked
              ? "bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner"
              : "bg-gray-200"
            }
          `}
          style={isUnlocked ? {
            background: "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
          } : {}}
        >
          {isUnlocked ? (
            <span style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }}>
              {config.icon}
            </span>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>

        {/* Badge name */}
        <p className={`text-xs font-semibold text-center leading-tight ${isUnlocked ? "text-gray-800" : "text-gray-400"}`}>
          {config.name}
        </p>

        {/* Category tag */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${categoryColors[config.category]}`}>
          {config.category}
        </span>

        {/* Unlocked date */}
        {isUnlocked && unlockedAt && (
          <p className="text-[10px] text-gray-400">
            {new Date(unlockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}

        {/* Can replace mascot indicator */}
        {isUnlocked && config.canReplaceMascot && (
          <p className="text-[10px] text-blue-500 font-medium">
            {isActive ? "Active on profile" : "Tap to use on profile"}
          </p>
        )}

        {/* Points */}
        {isUnlocked && (
          <p className="text-[10px] text-amber-500 font-semibold">
            +{config.pointsAwarded} pts
          </p>
        )}
      </div>
    </div>
  );
}

// ─── BadgeGrid ────────────────────────────────────────────────────────────────

interface BadgeGridProps {
  unlockedBadgeIds: BadgeId[];
  activeBadgeId: BadgeId | null;
  unlockedDates?: Partial<Record<BadgeId, string>>;
  onBadgeSelect?: (badgeId: BadgeId | null) => void;
}

type BadgeCategory = BadgeConfig["category"] | "all";

export function BadgeGrid({
  unlockedBadgeIds,
  activeBadgeId,
  unlockedDates = {},
  onBadgeSelect,
}: BadgeGridProps) {
  const [activeFilter, setActiveFilter] = useState<BadgeCategory>("all");

  const allBadgeIds = Object.keys(BADGE_CONFIGS) as BadgeId[];
  const unlockedSet = new Set(unlockedBadgeIds);

  const categories: BadgeCategory[] = ["all", "engagement", "health", "milestone", "caregiver"];

  const filteredBadges = allBadgeIds.filter((id) => {
    if (activeFilter === "all") return true;
    return BADGE_CONFIGS[id].category === activeFilter;
  });

  const handleBadgeSelect = (badgeId: BadgeId) => {
    if (!onBadgeSelect) return;
    // Toggle: if already active, deactivate (revert to mascot)
    if (activeBadgeId === badgeId) {
      onBadgeSelect(null);
    } else {
      onBadgeSelect(badgeId);
    }
  };

  const unlockedCount = unlockedBadgeIds.length;
  const totalCount = allBadgeIds.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Badges</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-24">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-0.5">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`
              text-xs px-2.5 py-1 rounded-full font-medium transition-colors capitalize
              ${activeFilter === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {filteredBadges.map((badgeId) => (
          <BadgeCard
            key={badgeId}
            badgeId={badgeId}
            isUnlocked={unlockedSet.has(badgeId)}
            isActive={activeBadgeId === badgeId}
            unlockedAt={unlockedDates[badgeId]}
            onSelect={handleBadgeSelect}
          />
        ))}
      </div>

      {/* Active badge note */}
      {activeBadgeId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <span className="text-lg">{BADGE_CONFIGS[activeBadgeId].icon}</span>
          <div>
            <p className="text-xs font-semibold text-blue-800">
              {BADGE_CONFIGS[activeBadgeId].name} is active on your profile
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Tap the badge again to restore your mascot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BadgeEarnModal ───────────────────────────────────────────────────────────

interface BadgeEarnModalProps {
  badgeId: BadgeId;
  pointsAwarded: number;
  onClose: () => void;
  onActivate?: () => void;
}

export function BadgeEarnModal({
  badgeId,
  pointsAwarded,
  onClose,
  onActivate,
}: BadgeEarnModalProps) {
  const config = BADGE_CONFIGS[badgeId];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13, 27, 62, 0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
        style={{ animation: "modal-fade-in 0.3s ease-out forwards" }}
      >
        {/* Badge icon */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{
            background: "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
            boxShadow: "0 0 24px rgba(42, 181, 193, 0.4)",
            animation: "badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          }}
        >
          {config.icon}
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
          Badge Unlocked
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{config.name}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {config.description}
        </p>

        {/* Points */}
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 mb-5">
          <span className="text-amber-500 font-bold text-sm">+{pointsAwarded}</span>
          <span className="text-amber-600 text-xs font-medium">points earned</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {config.canReplaceMascot && onActivate && (
            <button
              onClick={() => { onActivate(); onClose(); }}
              className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Use as Profile Badge
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            {config.canReplaceMascot ? "Keep Mascot" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BadgeGrid;
