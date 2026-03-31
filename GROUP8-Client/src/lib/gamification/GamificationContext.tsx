/**
 * GluMira™ — Gamification Context Provider
 * Version: 1.0.0
 *
 * Provides app-wide gamification state:
 *   - Current user's gamification profile (tier, points, streaks)
 *   - Pending milestone messages
 *   - Methods to fire reward events and dismiss milestones
 *
 * Usage:
 *   Wrap the dashboard layout with <GamificationProvider>.
 *   Consume with useGamification() hook.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  GamificationProfile,
  MilestoneMessage,
  MascotTier,
  BadgeId,
  RewardTriggerEvent,
} from "./types";
import { getTierFromPoints } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GamificationContextValue {
  profile: GamificationProfile | null;
  pendingMilestones: MilestoneMessage[];
  isLoading: boolean;
  error: string | null;
  /** Fire a reward event (e.g., daily_login, meal_logged) */
  fireEvent: (event: RewardTriggerEvent, payload?: Record<string, unknown>) => Promise<void>;
  /** Dismiss a milestone message */
  dismissMilestone: (id: string) => void;
  /** Set the active badge (or null to revert to mascot) */
  setActiveBadge: (badgeId: BadgeId | null) => Promise<void>;
  /** Set the diaversary date */
  setDiaversaryDate: (date: string | null) => Promise<void>;
  /** Set caregiver flag */
  setIsCaregiver: (isCaregiver: boolean) => Promise<void>;
  /** Refresh the profile from the server */
  refresh: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface GamificationProviderProps {
  children: React.ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [pendingMilestones, setPendingMilestones] = useState<MilestoneMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFiredDailyLogin = useRef(false);

  // ── Fetch profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification/profile");
      if (!res.ok) {
        if (res.status === 401) return; // Not authenticated — skip silently
        throw new Error(`Failed to load gamification profile (${res.status})`);
      }
      const data = await res.json();

      const gamProfile: GamificationProfile = {
        userId: data.user_id,
        currentTier: getTierFromPoints(data.points ?? 0),
        points: data.points ?? 0,
        currentStreakDays: data.current_streak_days ?? 0,
        longestStreakDays: data.longest_streak_days ?? 0,
        lastLoginDate: data.last_login_date ?? null,
        unlockedBadgeIds: (data.badges ?? []).map((b: { badge_id: string }) => b.badge_id as BadgeId),
        activeBadgeId: data.active_badge_id ?? null,
        diaversaryDate: data.diaversary_date ?? null,
        isCaregiver: data.is_caregiver ?? false,
        caregiverErraticCount: data.caregiver_erratic_count ?? 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProfile(gamProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gamification profile");
    }
  }, []);

  // ── Fetch pending milestones ───────────────────────────────────────────────

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification/milestones");
      if (!res.ok) return;
      const data = await res.json();

      const messages: MilestoneMessage[] = (data.milestones ?? []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        type: m.type as MilestoneMessage["type"],
        title: m.title as string,
        body: m.body as string,
        subtext: m.subtext as string | undefined,
        triggerDate: m.trigger_date as string,
        isRead: m.is_read as boolean,
        isDismissed: m.is_dismissed as boolean,
        badgeId: m.badge_id as BadgeId | undefined,
        newTier: m.new_tier as MascotTier | undefined,
        pointsAwarded: m.points_awarded as number | undefined,
      }));

      setPendingMilestones(messages);
    } catch {
      // Silent fail — milestones are non-critical
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProfile(), fetchMilestones()]);
    setIsLoading(false);
  }, [fetchProfile, fetchMilestones]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Fire daily login event (once per session) ──────────────────────────────

  useEffect(() => {
    if (!profile || hasFiredDailyLogin.current) return;
    hasFiredDailyLogin.current = true;

    // Fire daily login in background — don't await
    fetch("/api/gamification/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "daily_login", eventDate: new Date().toISOString() }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.milestones?.length > 0 || result.tierUpgrade) {
          // Refresh to pick up new state
          refresh();
        }
      })
      .catch(() => {});
  }, [profile, refresh]);

  // ── Fire event ─────────────────────────────────────────────────────────────

  const fireEvent = useCallback(
    async (event: RewardTriggerEvent, payload: Record<string, unknown> = {}) => {
      try {
        const res = await fetch("/api/gamification/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, eventDate: new Date().toISOString(), ...payload }),
        });
        if (!res.ok) return;

        const result = await res.json();

        // Update local profile state optimistically
        if (result.updatedProfile) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  currentTier: result.updatedProfile.currentTier,
                  points: result.updatedProfile.points,
                  currentStreakDays: result.updatedProfile.currentStreakDays,
                  longestStreakDays: result.updatedProfile.longestStreakDays,
                }
              : prev
          );
        }

        // Add new milestones to the pending queue
        if (result.milestones?.length > 0) {
          const newMilestones: MilestoneMessage[] = result.milestones.map(
            (m: Record<string, unknown>, i: number) => ({
              id: `pending-${Date.now()}-${i}`,
              type: m.type as MilestoneMessage["type"],
              title: m.title as string,
              body: m.body as string,
              subtext: m.subtext as string | undefined,
              triggerDate: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
              badgeId: m.badgeId as BadgeId | undefined,
              newTier: m.newTier as MascotTier | undefined,
              pointsAwarded: m.pointsAwarded as number | undefined,
            })
          );
          setPendingMilestones((prev) => [...newMilestones, ...prev]);
        }

        // Update badges if new ones were earned
        if (result.newBadges?.length > 0) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  unlockedBadgeIds: [...prev.unlockedBadgeIds, ...result.newBadges],
                }
              : prev
          );
        }
      } catch {
        // Silent fail — gamification is non-critical
      }
    },
    []
  );

  // ── Dismiss milestone ──────────────────────────────────────────────────────

  const dismissMilestone = useCallback((id: string) => {
    setPendingMilestones((prev) => prev.filter((m) => m.id !== id));

    // Persist dismissal if it's a real DB id (not a pending-* id)
    if (!id.startsWith("pending-")) {
      fetch("/api/gamification/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "dismiss" }),
      }).catch(() => {});
    }
  }, []);

  // ── Set active badge ───────────────────────────────────────────────────────

  const setActiveBadge = useCallback(async (badgeId: BadgeId | null) => {
    try {
      const res = await fetch("/api/gamification/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_badge_id: badgeId }),
      });
      if (!res.ok) return;
      setProfile((prev) => (prev ? { ...prev, activeBadgeId: badgeId } : prev));
    } catch {}
  }, []);

  // ── Set diaversary date ────────────────────────────────────────────────────

  const setDiaversaryDate = useCallback(async (date: string | null) => {
    try {
      const res = await fetch("/api/gamification/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diaversary_date: date }),
      });
      if (!res.ok) return;
      setProfile((prev) => (prev ? { ...prev, diaversaryDate: date } : prev));
    } catch {}
  }, []);

  // ── Set caregiver flag ─────────────────────────────────────────────────────

  const setIsCaregiver = useCallback(async (isCaregiver: boolean) => {
    try {
      const res = await fetch("/api/gamification/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_caregiver: isCaregiver }),
      });
      if (!res.ok) return;
      setProfile((prev) => (prev ? { ...prev, isCaregiver } : prev));
    } catch {}
  }, []);

  const value: GamificationContextValue = {
    profile,
    pendingMilestones,
    isLoading,
    error,
    fireEvent,
    dismissMilestone,
    setActiveBadge,
    setDiaversaryDate,
    setIsCaregiver,
    refresh,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGamification(): GamificationContextValue {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}

export default GamificationProvider;
