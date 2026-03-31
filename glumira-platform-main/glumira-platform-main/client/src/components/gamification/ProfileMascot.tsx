/**
 * GluMira™ — Profile Mascot Component
 * Version: 1.0.0
 *
 * Renders the dynamic profile mascot with tier-based skins and animations.
 * The mascot is the GluMira Owl, styled per the brand guide (Clinical Depth).
 *
 * Animation Rules (STRICT):
 *   - All animations MUST stop after exactly 3 loops.
 *   - Bronze/Silver: No animation.
 *   - Gold: Subtle gleam sweep.
 *   - Platinum: Gentle pulse.
 *   - Crown: Ambient aura + crown.
 *
 * Brand Reference: GluMira Brand Skill — Owl mascot (Clinical Depth style)
 * Owl CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663458340082/gNfELHaXwyQCxhnC.png
 */

import React, { useEffect, useRef, useState } from "react";
import type { MascotTier, TierConfig, BadgeConfig, BadgeId } from "../../lib/gamification/types";
import { TIER_CONFIGS, BADGE_CONFIGS } from "../../lib/gamification/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const OWL_CDN_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663458340082/gNfELHaXwyQCxhnC.png";

const ANIMATION_LOOP_COUNT = 3; // STRICT: All animations stop after exactly 3 loops

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileMascotProps {
  tier: MascotTier;
  /** If set, renders the badge icon instead of the mascot owl */
  activeBadgeId?: BadgeId | null;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show the tier label below */
  showTierLabel?: boolean;
  /** Whether to show the points */
  showPoints?: boolean;
  points?: number;
  /** Callback when user clicks to change their active badge */
  onBadgeToggle?: () => void;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 40, ring: 44, crown: 16, label: "text-xs" },
  md: { container: 64, ring: 70, crown: 22, label: "text-sm" },
  lg: { container: 96, ring: 104, crown: 30, label: "text-sm" },
  xl: { container: 128, ring: 138, crown: 40, label: "text-base" },
};

// ─── Tier Ring Component ──────────────────────────────────────────────────────

function TierRing({
  config,
  size,
  animationDone,
}: {
  config: TierConfig;
  size: (typeof SIZE_MAP)[keyof typeof SIZE_MAP];
  animationDone: boolean;
}) {
  const ringSize = size.ring;

  const ringStyle: React.CSSProperties = {
    width: ringSize,
    height: ringSize,
    borderRadius: "50%",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    border: `2.5px solid ${config.primaryColor}`,
    boxShadow: `0 0 0 1px ${config.glowColor}, 0 0 12px ${config.glowColor}`,
    pointerEvents: "none",
  };

  return <div style={ringStyle} />;
}

// ─── Crown Component ──────────────────────────────────────────────────────────

function Crown({ size }: { size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -size * 0.6,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: size,
        lineHeight: 1,
        filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))",
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      👑
    </div>
  );
}

// ─── Gleam Overlay (Gold) ─────────────────────────────────────────────────────

function GleamOverlay({
  size,
  animationDone,
}: {
  size: number;
  animationDone: boolean;
}) {
  if (animationDone) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "60%",
          height: "100%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          animation: `gleam-sweep 1.8s ease-in-out ${ANIMATION_LOOP_COUNT} forwards`,
          transform: "skewX(-20deg)",
        }}
      />
    </div>
  );
}

// ─── Pulse Ring (Platinum) ────────────────────────────────────────────────────

function PulseRing({
  config,
  size,
  animationDone,
}: {
  config: TierConfig;
  size: number;
  animationDone: boolean;
}) {
  if (animationDone) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: -6,
        borderRadius: "50%",
        border: `1.5px solid ${config.primaryColor}`,
        opacity: 0.6,
        animation: `pulse-ring 2s ease-out ${ANIMATION_LOOP_COUNT} forwards`,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Aura Ring (Crown) ────────────────────────────────────────────────────────

function AuraRing({
  config,
  size,
  animationDone,
}: {
  config: TierConfig;
  size: number;
  animationDone: boolean;
}) {
  if (animationDone) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          animation: `aura-pulse 2.5s ease-in-out ${ANIMATION_LOOP_COUNT} forwards`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `1px solid ${config.accentColor}`,
          opacity: 0.7,
          animation: `aura-pulse 2.5s ease-in-out ${ANIMATION_LOOP_COUNT} forwards 0.5s`,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// ─── Badge Display ────────────────────────────────────────────────────────────

function BadgeDisplay({
  badgeConfig,
  containerSize,
}: {
  badgeConfig: BadgeConfig;
  containerSize: number;
}) {
  return (
    <div
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: containerSize * 0.45,
        border: "2px solid rgba(42, 181, 193, 0.4)",
      }}
      title={badgeConfig.name}
    >
      {badgeConfig.icon}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileMascot({
  tier,
  activeBadgeId,
  size = "md",
  showTierLabel = false,
  showPoints = false,
  points = 0,
  onBadgeToggle,
  className = "",
}: ProfileMascotProps) {
  const config = TIER_CONFIGS[tier];
  const sizeConfig = SIZE_MAP[size];
  const containerSize = sizeConfig.container;

  const [animationDone, setAnimationDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate animation duration: 3 loops × animation duration
  const animationDurations: Record<string, number> = {
    gleam: 1800 * ANIMATION_LOOP_COUNT,
    pulse: 2000 * ANIMATION_LOOP_COUNT,
    aura: 2500 * ANIMATION_LOOP_COUNT,
    none: 0,
  };

  useEffect(() => {
    if (!config.hasAnimation) {
      setAnimationDone(false);
      return;
    }

    setAnimationDone(false);
    const duration = animationDurations[config.animationType] ?? 0;

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setAnimationDone(true);
      }, duration + 100); // +100ms buffer for CSS to complete
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tier]);

  const activeBadge = activeBadgeId ? BADGE_CONFIGS[activeBadgeId] : null;

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      {/* Mascot Container */}
      <div
        style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        onClick={onBadgeToggle}
        role={onBadgeToggle ? "button" : undefined}
        tabIndex={onBadgeToggle ? 0 : undefined}
        aria-label={activeBadge ? `Active badge: ${activeBadge.name}` : `Mascot tier: ${config.label}`}
        className={onBadgeToggle ? "cursor-pointer" : ""}
      >
        {/* Crown (Crown tier only) */}
        {config.hasCrown && !activeBadge && (
          <Crown size={sizeConfig.crown} />
        )}

        {/* Aura animation (Crown tier) */}
        {config.animationType === "aura" && !activeBadge && (
          <AuraRing config={config} size={containerSize} animationDone={animationDone} />
        )}

        {/* Tier ring */}
        {!activeBadge && (
          <TierRing config={config} size={sizeConfig} animationDone={animationDone} />
        )}

        {/* Inner content: Badge or Mascot Owl */}
        <div
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            background: activeBadge
              ? "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)"
              : `radial-gradient(circle at 40% 40%, ${config.glowColor}, rgba(13, 27, 62, 0.85))`,
            flexShrink: 0,
          }}
        >
          {activeBadge ? (
            <BadgeDisplay badgeConfig={activeBadge} containerSize={containerSize} />
          ) : (
            <>
              <img
                src={OWL_CDN_URL}
                alt="GluMira Owl Mascot"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: getTierImageFilter(tier),
                }}
                draggable={false}
              />
              {/* Gleam overlay (Gold tier) */}
              {config.animationType === "gleam" && (
                <GleamOverlay size={containerSize} animationDone={animationDone} />
              )}
            </>
          )}
        </div>

        {/* Pulse ring (Platinum tier) */}
        {config.animationType === "pulse" && !activeBadge && (
          <PulseRing config={config} size={containerSize} animationDone={animationDone} />
        )}
      </div>

      {/* Tier Label */}
      {showTierLabel && (
        <span
          className={`font-semibold ${sizeConfig.label}`}
          style={{ color: config.primaryColor }}
        >
          {activeBadge ? activeBadge.name : config.label}
        </span>
      )}

      {/* Points */}
      {showPoints && (
        <span className="text-xs text-gray-400 font-medium">
          {points.toLocaleString()} pts
        </span>
      )}
    </div>
  );
}

// ─── Tier Image Filter Helper ─────────────────────────────────────────────────

function getTierImageFilter(tier: MascotTier): string {
  switch (tier) {
    case 'bronze':
      return 'sepia(0.4) saturate(1.2) hue-rotate(10deg) brightness(0.95)';
    case 'silver':
      return 'grayscale(0.3) brightness(1.05) contrast(1.05)';
    case 'gold':
      return 'sepia(0.2) saturate(1.4) hue-rotate(-10deg) brightness(1.1)';
    case 'platinum':
      return 'brightness(1.15) contrast(1.1) saturate(0.9)';
    case 'crown':
      return 'brightness(1.2) saturate(1.3) contrast(1.05)';
    default:
      return 'none';
  }
}

export default ProfileMascot;
