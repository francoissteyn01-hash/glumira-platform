/**
 * GluMira™ — Reward Engine & Progression Logic
 * Version: 1.0.0
 *
 * Handles:
 *   - Points calculation for all reward trigger events
 *   - Streak tracking and validation
 *   - Badge unlock evaluation
 *   - Tier upgrade detection
 *   - A1C improvement detection
 *   - Caregiver erratic reading streak detection
 *
 * This engine is pure logic — it takes a state snapshot and an event,
 * and returns the resulting state changes and any new milestones to surface.
 */

import {
  type GamificationProfile,
  type BadgeId,
  type MascotTier,
  type MilestoneMessage,
  type MilestoneType,
  type RewardTriggerEvent,
  BADGE_CONFIGS,
  REWARD_TRIGGERS,
  getTierFromPoints,
} from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RewardEventPayload {
  event: RewardTriggerEvent;
  /** ISO date string of the event */
  eventDate: string;
  /** For A1C events: the new A1C value */
  a1cValue?: number;
  /** For A1C events: the previous A1C value */
  previousA1cValue?: number;
  /** For glucose readings: whether the reading was in target range */
  inRange?: boolean;
  /** For caregiver events: current consecutive erratic count */
  erraticCount?: number;
}

export interface RewardResult {
  /** Updated profile after applying the event */
  updatedProfile: GamificationProfile;
  /** Points awarded in this event */
  pointsAwarded: number;
  /** New badges earned (empty if none) */
  newBadges: BadgeId[];
  /** Tier upgrade (null if no change) */
  tierUpgrade: { from: MascotTier; to: MascotTier } | null;
  /** Milestone messages to display */
  milestones: Omit<MilestoneMessage, "id" | "triggerDate" | "isRead" | "isDismissed">[];
}

// ─── Streak Helpers ───────────────────────────────────────────────────────────

/**
 * Checks if two ISO date strings are on consecutive calendar days.
 */
export function isConsecutiveDay(dateA: string, dateB: string): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Checks if two ISO date strings are on the same calendar day.
 */
export function isSameDay(dateA: string, dateB: string): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Checks if a date is today's date.
 */
export function isToday(dateStr: string): boolean {
  return isSameDay(dateStr, new Date().toISOString());
}

// ─── Badge Evaluation ─────────────────────────────────────────────────────────

/**
 * Evaluates which new badges should be unlocked given the updated profile state.
 * Returns only badges that were NOT previously unlocked.
 */
export function evaluateNewBadges(
  profile: GamificationProfile,
  event: RewardTriggerEvent,
  payload: RewardEventPayload,
  mealCount: number = 0,
  readingCount: number = 0,
): BadgeId[] {
  const alreadyUnlocked = new Set(profile.unlockedBadgeIds);
  const newBadges: BadgeId[] = [];

  const maybeUnlock = (id: BadgeId) => {
    if (!alreadyUnlocked.has(id)) newBadges.push(id);
  };

  // First login
  if (event === "daily_login" && !alreadyUnlocked.has("first_login")) {
    maybeUnlock("first_login");
  }

  // Streak badges
  if (profile.currentStreakDays >= 7) maybeUnlock("streak_7");
  if (profile.currentStreakDays >= 30) maybeUnlock("streak_30");
  if (profile.currentStreakDays >= 90) maybeUnlock("streak_90");

  // A1C badges
  if (event === "a1c_logged" && !alreadyUnlocked.has("first_a1c")) {
    maybeUnlock("first_a1c");
  }
  if (event === "a1c_improved") {
    maybeUnlock("a1c_improved");
  }

  // In-range badges (these require streak tracking — simplified here)
  // In a full implementation, these would check a separate in-range streak counter
  if (event === "in_range_reading") {
    // These are evaluated by the streak tracker, not here directly
    // Placeholder: would check in_range_streak_days
  }

  // Meal logging badges
  if (mealCount >= 10) maybeUnlock("meal_logger_10");
  if (mealCount >= 50) maybeUnlock("meal_logger_50");

  // Reading badges
  if (readingCount >= 50) maybeUnlock("reading_logger_50");
  if (readingCount >= 200) maybeUnlock("reading_logger_200");

  // Diaversary badges
  if (event === "diaversary" && profile.diaversaryDate) {
    const diagnosisDate = new Date(profile.diaversaryDate);
    const now = new Date(payload.eventDate);
    const yearsDiff = now.getFullYear() - diagnosisDate.getFullYear();

    if (yearsDiff >= 1) maybeUnlock("diaversary_1");
    if (yearsDiff >= 5) maybeUnlock("diaversary_5");
    if (yearsDiff >= 10) maybeUnlock("diaversary_10");
  }

  // Caregiver badge
  if (event === "caregiver_erratic_streak" && profile.isCaregiver) {
    maybeUnlock("caregiver_champion");
  }

  // Time-based badges
  const hour = new Date(payload.eventDate).getHours();
  if (event === "glucose_reading_logged") {
    if (hour >= 0 && hour < 6) maybeUnlock("night_owl");
    if (hour >= 4 && hour < 6) maybeUnlock("early_bird");
  }

  return newBadges;
}

// ─── Points Calculation ───────────────────────────────────────────────────────

/**
 * Calculates points for a given event, with streak multipliers.
 */
export function calculatePoints(
  event: RewardTriggerEvent,
  streakDays: number,
  payload: RewardEventPayload,
): number {
  const base = REWARD_TRIGGERS[event].basePoints;

  // Streak multiplier: 1x base, up to 2x at 30+ days
  const streakMultiplier = Math.min(1 + (streakDays / 60), 2);

  // A1C improvement bonus: larger improvement = more points
  if (event === "a1c_improved" && payload.a1cValue && payload.previousA1cValue) {
    const improvement = payload.previousA1cValue - payload.a1cValue;
    const bonus = Math.floor(improvement * 50); // 50 pts per 1% improvement
    return Math.round(base + bonus);
  }

  return Math.round(base * streakMultiplier);
}

// ─── Main Reward Engine ───────────────────────────────────────────────────────

/**
 * Processes a reward trigger event and returns the updated state.
 *
 * @param profile - Current gamification profile
 * @param payload - Event payload
 * @param mealCount - Total meals logged (for badge evaluation)
 * @param readingCount - Total readings logged (for badge evaluation)
 */
export function processRewardEvent(
  profile: GamificationProfile,
  payload: RewardEventPayload,
  mealCount: number = 0,
  readingCount: number = 0,
): RewardResult {
  const { event, eventDate } = payload;
  let updatedProfile = { ...profile };
  const milestones: RewardResult["milestones"] = [];

  // ── 1. Update streak ──────────────────────────────────────────────────────

  if (event === "daily_login" || event === "meal_logged" || event === "glucose_reading_logged") {
    const lastLogin = profile.lastLoginDate;

    if (!lastLogin) {
      // First ever login
      updatedProfile.currentStreakDays = 1;
      updatedProfile.lastLoginDate = eventDate;
    } else if (isSameDay(lastLogin, eventDate)) {
      // Same day — no change to streak
    } else if (isConsecutiveDay(lastLogin, eventDate)) {
      // Consecutive day — extend streak
      updatedProfile.currentStreakDays += 1;
      updatedProfile.lastLoginDate = eventDate;
    } else {
      // Streak broken
      updatedProfile.currentStreakDays = 1;
      updatedProfile.lastLoginDate = eventDate;
    }

    // Update longest streak
    if (updatedProfile.currentStreakDays > updatedProfile.longestStreakDays) {
      updatedProfile.longestStreakDays = updatedProfile.currentStreakDays;
    }
  }

  // ── 2. Calculate points ───────────────────────────────────────────────────

  const pointsAwarded = calculatePoints(event, updatedProfile.currentStreakDays, payload);
  const previousPoints = updatedProfile.points;
  updatedProfile.points += pointsAwarded;

  // ── 3. Check tier upgrade ─────────────────────────────────────────────────

  const previousTier = getTierFromPoints(previousPoints);
  const newTier = getTierFromPoints(updatedProfile.points);
  let tierUpgrade: RewardResult["tierUpgrade"] = null;

  if (newTier !== previousTier) {
    tierUpgrade = { from: previousTier, to: newTier };
    updatedProfile.currentTier = newTier;

    milestones.push({
      type: "tier_upgrade",
      title: `You've reached ${getTierLabel(newTier)}`,
      body: getTierUpgradeMessage(newTier),
      newTier,
      pointsAwarded,
    });
  } else {
    updatedProfile.currentTier = newTier;
  }

  // ── 4. Evaluate new badges ────────────────────────────────────────────────

  const newBadges = evaluateNewBadges(updatedProfile, event, payload, mealCount, readingCount);

  for (const badgeId of newBadges) {
    updatedProfile.unlockedBadgeIds = [...updatedProfile.unlockedBadgeIds, badgeId];
    const badgeConfig = BADGE_CONFIGS[badgeId];

    milestones.push({
      type: "badge_earned",
      title: `Badge Earned: ${badgeConfig.name}`,
      body: badgeConfig.description,
      badgeId,
      pointsAwarded: badgeConfig.pointsAwarded,
    });

    // Add badge points
    updatedProfile.points += badgeConfig.pointsAwarded;
  }

  // ── 5. Streak milestone messages ──────────────────────────────────────────

  const streak = updatedProfile.currentStreakDays;

  if (streak === 7 && !profile.unlockedBadgeIds.includes("streak_7")) {
    milestones.push({
      type: "streak_7",
      title: "7 Days Strong",
      body: "Seven days of showing up. That's seven days of invisible work that most people will never understand. We do.",
      pointsAwarded,
    });
  } else if (streak === 30 && !profile.unlockedBadgeIds.includes("streak_30")) {
    milestones.push({
      type: "streak_30",
      title: "30 Days. A Full Month.",
      body: "A month of consistent tracking. The discipline this takes — especially on the hard days — is something to be genuinely proud of.",
      pointsAwarded,
    });
  } else if (streak === 90 && !profile.unlockedBadgeIds.includes("streak_90")) {
    milestones.push({
      type: "streak_90",
      title: "90 Days of Resilience",
      body: "Three months. Every single day. The data you've built here is extraordinary — and so is the person behind it.",
      pointsAwarded,
    });
  }

  // ── 6. A1C improvement message ────────────────────────────────────────────

  if (event === "a1c_improved" && payload.a1cValue && payload.previousA1cValue) {
    const improvement = (payload.previousA1cValue - payload.a1cValue).toFixed(1);
    milestones.push({
      type: "a1c_improved",
      title: "A1C Progress",
      body: `Your A1C has improved by ${improvement}%. Every decimal point in that number represents real effort, real discipline, and real sacrifice. This is a meaningful result.`,
      subtext: `Previous: ${payload.previousA1cValue}% → Current: ${payload.a1cValue}%`,
      pointsAwarded,
    });
  }

  // ── 7. Caregiver erratic streak ───────────────────────────────────────────

  if (event === "caregiver_erratic_streak" && profile.isCaregiver) {
    updatedProfile.caregiverErraticCount = (payload.erraticCount ?? 0);
    milestones.push({
      type: "caregiver_burnout",
      title: "You're doing a great job",
      body: "We see how hard you're working right now. The numbers have been tough, but your dedication is exactly what they need. Take a breath — you are doing a great job.",
      pointsAwarded,
    });
  }

  updatedProfile.updatedAt = new Date().toISOString();

  return {
    updatedProfile,
    pointsAwarded,
    newBadges,
    tierUpgrade,
    milestones,
  };
}

// ─── Milestone Check: Diaversary & Birthday ───────────────────────────────────

/**
 * Checks if today is the user's diaversary or birthday.
 * Returns milestone messages if applicable.
 */
export function checkDateMilestones(
  profile: GamificationProfile,
  today: Date = new Date(),
): Omit<MilestoneMessage, "id" | "triggerDate" | "isRead" | "isDismissed">[] {
  const milestones: Omit<MilestoneMessage, "id" | "triggerDate" | "isRead" | "isDismissed">[] = [];

  // Diaversary check
  if (profile.diaversaryDate) {
    const diaversary = new Date(profile.diaversaryDate);
    if (
      diaversary.getMonth() === today.getMonth() &&
      diaversary.getDate() === today.getDate()
    ) {
      const yearsLiving = today.getFullYear() - diaversary.getFullYear();
      milestones.push({
        type: "diaversary",
        title: yearsLiving === 1 ? "Happy 1-Year Diaversary" : `Happy ${yearsLiving}-Year Diaversary`,
        body: getDiaversaryMessage(yearsLiving),
        pointsAwarded: REWARD_TRIGGERS.diaversary.basePoints,
      });
    }
  }

  return milestones;
}

// ─── Message Generators ───────────────────────────────────────────────────────

function getTierLabel(tier: MascotTier): string {
  const labels: Record<MascotTier, string> = {
    bronze: "Bronze Member",
    silver: "Silver Member",
    gold: "Gold Member",
    platinum: "Platinum Member",
    crown: "Crown Member",
  };
  return labels[tier];
}

function getTierUpgradeMessage(tier: MascotTier): string {
  switch (tier) {
    case "silver":
      return "Consistency is its own kind of strength. You've earned Silver status — keep going.";
    case "gold":
      return "Your dedication is showing in the data. Gold status reflects the real work you're putting in every day.";
    case "platinum":
      return "The invisible work you do every day — we see it. Platinum status is a reflection of extraordinary commitment.";
    case "crown":
      return "Elite. Resilient. Relentless. Crown status is reserved for those who show up, day after day, no matter what. That's you.";
    default:
      return "You've reached a new tier. Keep going.";
  }
}

function getDiaversaryMessage(years: number): string {
  if (years === 1) {
    return "One year of doing the math, managing the highs and lows, and showing up for yourself. We know how much invisible work this takes. Proud of you.";
  }
  if (years < 5) {
    return `${years} years of doing the math, managing the highs and lows, and showing up for yourself every single day. We know how much invisible work this takes. Proud of you.`;
  }
  if (years < 10) {
    return `${years} years. That's ${years} years of calculations, adjustments, late nights, and relentless self-management. The resilience behind that number is extraordinary. We see you.`;
  }
  return `${years} years. A decade or more of living with diabetes — of doing the math no one else can see, managing the highs and lows, and still showing up. That kind of strength deserves to be acknowledged. We are proud of you.`;
}
