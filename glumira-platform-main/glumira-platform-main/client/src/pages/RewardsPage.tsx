/**
 * GluMira™ — Rewards & Gamification Page
 * Route: /dashboard/rewards
 * Version: 1.0.0
 *
 * Shows the user's:
 *   - Mascot with current tier skin (Bronze → Crown)
 *   - Points and tier progress bar
 *   - Daily streak tracker
 *   - Full badge collection (with ability to set active badge)
 *   - Diaversary date setting
 *   - Caregiver flag toggle
 *
 * Design: Scandinavian minimalist — white bg, Inter/DM Sans, navy/teal/amber
 * Tone: Empathetic, validating, zero toxic positivity
 *
 * DISCLAIMER: GluMira™ is an educational platform. Not a medical device. Not a dosing tool.
 */

import React, { useState } from "react";
import { useGamification } from "../lib/gamification/GamificationContext";
import { ProfileMascot } from "../components/gamification/ProfileMascot";
import { BadgeGrid } from "../components/gamification/BadgeSystem";
import { TIER_CONFIGS, getPointsToNextTier } from "../lib/gamification/types";
import type { BadgeId } from "../lib/gamification/types";

// ─── Streak Card ──────────────────────────────────────────────────────────────

function StreakCard({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Streak
      </h3>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{current}</div>
          <div className="text-xs text-gray-500 mt-0.5">Current days</div>
        </div>
        <div className="h-10 w-px bg-gray-100" />
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-500">{longest}</div>
          <div className="text-xs text-gray-500 mt-0.5">Longest streak</div>
        </div>
        <div className="flex-1 flex justify-end">
          <span className="text-3xl" aria-hidden="true">
            {current >= 30 ? "🔥" : current >= 7 ? "⚡" : "🌱"}
          </span>
        </div>
      </div>
      {current >= 7 && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed border-t border-gray-50 pt-3">
          {current >= 90
            ? "Three months of showing up. The discipline this takes — especially on the hard days — is something to be genuinely proud of."
            : current >= 30
            ? "A full month of consistent tracking. This is what dedication looks like."
            : "Seven days of showing up. That's seven days of invisible work that matters."}
        </p>
      )}
    </div>
  );
}

// ─── Tier Progress Card ───────────────────────────────────────────────────────

function TierProgressCard({ points, tier }: { points: number; tier: string }) {
  const tierOrder = ["bronze", "silver", "gold", "platinum", "crown"] as const;
  const currentIndex = tierOrder.indexOf(tier as typeof tierOrder[number]);
  const nextTierPoints = getPointsToNextTier(points);
  const config = TIER_CONFIGS[tier as typeof tierOrder[number]];
  const nextTier = currentIndex < tierOrder.length - 1
    ? TIER_CONFIGS[tierOrder[currentIndex + 1]]
    : null;

  const progressPercent = nextTier
    ? Math.min(100, ((points - config.minPoints) / (nextTier.minPoints - config.minPoints)) * 100)
    : 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Tier Progress
      </h3>

      {/* Tier steps */}
      <div className="flex items-center gap-1 mb-4">
        {tierOrder.map((t, i) => {
          const tc = TIER_CONFIGS[t];
          const isReached = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <React.Fragment key={t}>
              <div
                className="flex flex-col items-center"
                style={{ flex: 1 }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: isReached
                      ? `radial-gradient(circle, ${tc.accentColor}, ${tc.primaryColor})`
                      : "#f3f4f6",
                    border: isCurrent ? `2px solid ${tc.primaryColor}` : "2px solid transparent",
                    boxShadow: isCurrent ? `0 0 8px ${tc.glowColor}` : "none",
                    color: isReached ? "#fff" : "#9ca3af",
                  }}
                >
                  {tc.hasCrown ? "👑" : i + 1}
                </div>
                <span
                  className="text-[9px] font-medium mt-1 text-center leading-tight"
                  style={{ color: isReached ? tc.primaryColor : "#9ca3af" }}
                >
                  {tc.tier.charAt(0).toUpperCase() + tc.tier.slice(1)}
                </span>
              </div>
              {i < tierOrder.length - 1 && (
                <div
                  className="flex-1 h-0.5 mt-[-10px]"
                  style={{
                    background: i < currentIndex
                      ? `linear-gradient(90deg, ${TIER_CONFIGS[tierOrder[i]].primaryColor}, ${TIER_CONFIGS[tierOrder[i + 1]].primaryColor})`
                      : "#e5e7eb",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: config.primaryColor }}>
          {config.label}
        </span>
        <span className="text-sm font-bold text-gray-900">
          {points.toLocaleString()} pts
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor})`,
          }}
        />
      </div>
      {nextTierPoints !== null && nextTier ? (
        <p className="text-xs text-gray-400">
          {nextTierPoints.toLocaleString()} points to{" "}
          <span style={{ color: nextTier.primaryColor, fontWeight: 600 }}>
            {nextTier.label}
          </span>
        </p>
      ) : (
        <p className="text-xs text-amber-500 font-medium">
          Crown Member — Maximum tier achieved
        </p>
      )}
    </div>
  );
}

// ─── Diaversary Card ──────────────────────────────────────────────────────────

function DiaversaryCard({
  diaversaryDate,
  onSave,
}: {
  diaversaryDate: string | null;
  onSave: (date: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(diaversaryDate ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(value || null);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🕯️</span>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Diaversary Date
          </h3>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {diaversaryDate ? "Edit" : "Set date"}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Your diagnosis anniversary. We'll acknowledge it every year with a personal message — because this date matters.
      </p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-gray-800">
          {diaversaryDate
            ? new Date(diaversaryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "Not set — tap 'Set date' to add yours"}
        </p>
      )}
    </div>
  );
}

// ─── Caregiver Card ───────────────────────────────────────────────────────────

function CaregiverCard({
  isCaregiver,
  onToggle,
}: {
  isCaregiver: boolean;
  onToggle: (value: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    await onToggle(!isCaregiver);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base" aria-hidden="true">❤️</span>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Caregiver Mode
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Managing diabetes for someone you love? Enable this to receive caregiver-specific encouragement and support. We see how much you carry.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          role="switch"
          aria-checked={isCaregiver}
          className={`
            relative ml-4 w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
            ${isCaregiver ? "bg-blue-600" : "bg-gray-200"}
            ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
              ${isCaregiver ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>
      {isCaregiver && (
        <p className="text-xs text-rose-600 font-medium mt-3 bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
          Caregiver mode active. The work you do every day — the calculations, the worry, the vigilance — it's seen. You're doing an extraordinary job.
        </p>
      )}
    </div>
  );
}

// ─── How Points Work ──────────────────────────────────────────────────────────

function HowPointsWork() {
  const items = [
    { icon: "🔑", label: "Daily login", pts: "+5 pts" },
    { icon: "🍽️", label: "Log a meal", pts: "+8 pts" },
    { icon: "📊", label: "Log a glucose reading", pts: "+5 pts" },
    { icon: "🎯", label: "In-range reading", pts: "+10 pts" },
    { icon: "🔥", label: "Maintain daily streak", pts: "+15 pts" },
    { icon: "🩺", label: "Log A1C result", pts: "+30 pts" },
    { icon: "📈", label: "Improved A1C", pts: "+100 pts" },
    { icon: "🕯️", label: "Diaversary", pts: "+50 pts" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        How Points Work
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 py-1">
            <span className="text-base w-6 text-center flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-tight truncate">{item.label}</p>
            </div>
            <span className="text-xs font-semibold text-amber-500 flex-shrink-0">
              {item.pts}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 leading-relaxed border-t border-gray-50 pt-3">
        Points reflect consistent engagement with your health data — not the health outcomes themselves. Your numbers don't define your effort.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const {
    profile,
    isLoading,
    setActiveBadge,
    setDiaversaryDate,
    setIsCaregiver,
  } = useGamification();

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your rewards…</p>
        </div>
      </div>
    );
  }

  const handleBadgeSelect = async (badgeId: BadgeId | null) => {
    await setActiveBadge(badgeId);
  };

  const tierConfig = TIER_CONFIGS[profile.currentTier];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your progress, your mascot, your milestones.
        </p>
      </div>

      {/* Mascot Hero Card */}
      <div
        className="rounded-2xl border p-6 overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, #0d1b3e 0%, #1a2a5e 60%, ${tierConfig.primaryColor}22 100%)`,
          borderColor: `${tierConfig.primaryColor}40`,
        }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 80% 50%, ${tierConfig.glowColor} 0%, transparent 60%)`,
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-6">
          <ProfileMascot
            tier={profile.currentTier}
            activeBadgeId={profile.activeBadgeId}
            size="xl"
            showTierLabel
            showPoints
            points={profile.points}
            onBadgeToggle={profile.activeBadgeId ? () => handleBadgeSelect(null) : undefined}
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {tierConfig.label}
            </h2>
            <p className="text-sm text-blue-200 mt-1 leading-relaxed">
              {tierConfig.description}
            </p>
            {profile.activeBadgeId && (
              <p className="text-xs text-amber-400 font-medium mt-2">
                Badge active on profile — tap to restore mascot
              </p>
            )}
            {profile.currentStreakDays > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-base" aria-hidden="true">
                  {profile.currentStreakDays >= 30 ? "🔥" : profile.currentStreakDays >= 7 ? "⚡" : "🌱"}
                </span>
                <span className="text-sm font-semibold text-amber-400">
                  {profile.currentStreakDays}-day streak
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <TierProgressCard points={profile.points} tier={profile.currentTier} />

      {/* Streak */}
      <StreakCard
        current={profile.currentStreakDays}
        longest={profile.longestStreakDays}
      />

      {/* Badges */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <BadgeGrid
          unlockedBadgeIds={profile.unlockedBadgeIds}
          activeBadgeId={profile.activeBadgeId}
          onBadgeSelect={handleBadgeSelect}
        />
      </div>

      {/* Diaversary */}
      <DiaversaryCard
        diaversaryDate={profile.diaversaryDate}
        onSave={setDiaversaryDate}
      />

      {/* Caregiver */}
      <CaregiverCard
        isCaregiver={profile.isCaregiver}
        onToggle={setIsCaregiver}
      />

      {/* How Points Work */}
      <HowPointsWork />

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        GluMira™ is an educational platform · Not a medical device · Not a dosing tool
      </p>
    </div>
  );
}
