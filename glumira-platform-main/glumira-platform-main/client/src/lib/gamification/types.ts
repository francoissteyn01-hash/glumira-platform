/**
 * GluMira™ Gamification & Rewards System — Core Types
 * Version: 1.0.0
 *
 * Defines all types, enums, and interfaces for the mascot tier system,
 * badge system, reward triggers, and milestone messaging.
 *
 * Design Principles:
 * - Motivates without trivialising health management
 * - Deeply empathetic tone — zero toxic positivity
 * - Mascot animations stop after exactly 3 loops
 */

// ─── Mascot Tier System ───────────────────────────────────────────────────────

export type MascotTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'crown';

export interface TierConfig {
  tier: MascotTier;
  label: string;
  /** Minimum points required to reach this tier */
  minPoints: number;
  /** Primary colour for the mascot skin */
  primaryColor: string;
  /** Secondary accent colour */
  accentColor: string;
  /** Glow/aura colour */
  glowColor: string;
  /** Whether this tier has an animated skin */
  hasAnimation: boolean;
  /** Animation type: 'gleam' | 'pulse' | 'aura' */
  animationType: 'gleam' | 'pulse' | 'aura' | 'none';
  /** Whether this tier shows a crown */
  hasCrown: boolean;
  /** Description shown to user */
  description: string;
}

export const TIER_CONFIGS: Record<MascotTier, TierConfig> = {
  bronze: {
    tier: 'bronze',
    label: 'Bronze Member',
    minPoints: 0,
    primaryColor: '#cd7f32',
    accentColor: '#e8a96e',
    glowColor: 'rgba(205, 127, 50, 0.25)',
    hasAnimation: false,
    animationType: 'none',
    hasCrown: false,
    description: 'Welcome to GluMira™. Every day you show up counts.',
  },
  silver: {
    tier: 'silver',
    label: 'Silver Member',
    minPoints: 150,
    primaryColor: '#9ca3af',
    accentColor: '#d1d5db',
    glowColor: 'rgba(156, 163, 175, 0.3)',
    hasAnimation: false,
    animationType: 'none',
    hasCrown: false,
    description: 'Consistency is its own kind of strength.',
  },
  gold: {
    tier: 'gold',
    label: 'Gold Member',
    minPoints: 500,
    primaryColor: '#f59e0b',
    accentColor: '#fcd34d',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    hasAnimation: true,
    animationType: 'gleam',
    hasCrown: false,
    description: 'Your dedication is showing in the data.',
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum Member',
    minPoints: 1200,
    primaryColor: '#e2e8f0',
    accentColor: '#cbd5e1',
    glowColor: 'rgba(226, 232, 240, 0.5)',
    hasAnimation: true,
    animationType: 'pulse',
    hasCrown: false,
    description: 'The invisible work you do every day — we see it.',
  },
  crown: {
    tier: 'crown',
    label: 'Crown Member',
    minPoints: 3000,
    primaryColor: '#2ab5c1',
    accentColor: '#f59e0b',
    glowColor: 'rgba(42, 181, 193, 0.45)',
    hasAnimation: true,
    animationType: 'aura',
    hasCrown: true,
    description: 'Elite. Resilient. Relentless. You have earned this.',
  },
};

// ─── Badge System ─────────────────────────────────────────────────────────────

export type BadgeId =
  | 'first_login'
  | 'streak_7'
  | 'streak_30'
  | 'streak_90'
  | 'a1c_improved'
  | 'in_range_week'
  | 'in_range_month'
  | 'meal_logger_10'
  | 'meal_logger_50'
  | 'reading_logger_50'
  | 'reading_logger_200'
  | 'diaversary_1'
  | 'diaversary_5'
  | 'diaversary_10'
  | 'caregiver_champion'
  | 'first_a1c'
  | 'night_owl'
  | 'early_bird';

export interface BadgeConfig {
  id: BadgeId;
  name: string;
  description: string;
  /** Emoji icon for the badge */
  icon: string;
  /** Points awarded when badge is earned */
  pointsAwarded: number;
  /** Whether this badge can replace the mascot on the profile */
  canReplaceMascot: boolean;
  /** Category for grouping */
  category: 'engagement' | 'health' | 'milestone' | 'caregiver';
}

export const BADGE_CONFIGS: Record<BadgeId, BadgeConfig> = {
  first_login: {
    id: 'first_login',
    name: 'First Step',
    description: 'Logged in for the first time. The hardest step is always the first.',
    icon: '🦉',
    pointsAwarded: 10,
    canReplaceMascot: false,
    category: 'engagement',
  },
  streak_7: {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Seven days of showing up. That\'s seven days of invisible work that matters.',
    icon: '🔥',
    pointsAwarded: 50,
    canReplaceMascot: false,
    category: 'engagement',
  },
  streak_30: {
    id: 'streak_30',
    name: '30-Day Streak',
    description: 'A full month of consistent logging. This is what dedication looks like.',
    icon: '⚡',
    pointsAwarded: 200,
    canReplaceMascot: true,
    category: 'engagement',
  },
  streak_90: {
    id: 'streak_90',
    name: '90-Day Streak',
    description: 'Three months. Every single day. The resilience this takes is extraordinary.',
    icon: '💎',
    pointsAwarded: 600,
    canReplaceMascot: true,
    category: 'engagement',
  },
  a1c_improved: {
    id: 'a1c_improved',
    name: 'A1C Progress',
    description: 'You logged an improved A1C result. Every decimal point is a victory.',
    icon: '📈',
    pointsAwarded: 300,
    canReplaceMascot: true,
    category: 'health',
  },
  in_range_week: {
    id: 'in_range_week',
    name: 'In Range — 7 Days',
    description: 'Seven days of blood sugar within your target range. That\'s exceptional management.',
    icon: '🎯',
    pointsAwarded: 100,
    canReplaceMascot: false,
    category: 'health',
  },
  in_range_month: {
    id: 'in_range_month',
    name: 'In Range — 30 Days',
    description: 'A month of consistent target range. The effort behind this number is immense.',
    icon: '🏆',
    pointsAwarded: 400,
    canReplaceMascot: true,
    category: 'health',
  },
  meal_logger_10: {
    id: 'meal_logger_10',
    name: 'Meal Tracker',
    description: 'Logged 10 meals. Every meal log helps you understand your patterns.',
    icon: '🍽️',
    pointsAwarded: 30,
    canReplaceMascot: false,
    category: 'engagement',
  },
  meal_logger_50: {
    id: 'meal_logger_50',
    name: 'Nutrition Insight',
    description: 'Logged 50 meals. Your meal data is building a powerful picture.',
    icon: '🥗',
    pointsAwarded: 150,
    canReplaceMascot: false,
    category: 'engagement',
  },
  reading_logger_50: {
    id: 'reading_logger_50',
    name: 'Data Collector',
    description: 'Logged 50 glucose readings. Every reading is a data point in your story.',
    icon: '📊',
    pointsAwarded: 50,
    canReplaceMascot: false,
    category: 'engagement',
  },
  reading_logger_200: {
    id: 'reading_logger_200',
    name: 'Glucose Guardian',
    description: 'Logged 200 glucose readings. The depth of your self-awareness is remarkable.',
    icon: '🩸',
    pointsAwarded: 200,
    canReplaceMascot: true,
    category: 'engagement',
  },
  diaversary_1: {
    id: 'diaversary_1',
    name: '1-Year Diaversary',
    description: 'One year of managing diabetes. One year of invisible strength.',
    icon: '🕯️',
    pointsAwarded: 100,
    canReplaceMascot: true,
    category: 'milestone',
  },
  diaversary_5: {
    id: 'diaversary_5',
    name: '5-Year Diaversary',
    description: 'Five years. The math, the highs, the lows — and still here.',
    icon: '⭐',
    pointsAwarded: 300,
    canReplaceMascot: true,
    category: 'milestone',
  },
  diaversary_10: {
    id: 'diaversary_10',
    name: '10-Year Diaversary',
    description: 'A decade of resilience. This is a milestone that deserves to be honoured.',
    icon: '👑',
    pointsAwarded: 750,
    canReplaceMascot: true,
    category: 'milestone',
  },
  caregiver_champion: {
    id: 'caregiver_champion',
    name: 'Caregiver Champion',
    description: 'For those who carry the weight of care for someone they love. You are seen.',
    icon: '❤️',
    pointsAwarded: 200,
    canReplaceMascot: true,
    category: 'caregiver',
  },
  first_a1c: {
    id: 'first_a1c',
    name: 'First A1C Logged',
    description: 'You logged your first A1C result. Tracking this is a powerful act of self-advocacy.',
    icon: '🔬',
    pointsAwarded: 50,
    canReplaceMascot: false,
    category: 'health',
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Logged a reading after midnight. Managing diabetes never sleeps, and neither do you.',
    icon: '🌙',
    pointsAwarded: 20,
    canReplaceMascot: false,
    category: 'engagement',
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Logged a reading before 6am. Your morning discipline sets the tone for the day.',
    icon: '🌅',
    pointsAwarded: 20,
    canReplaceMascot: false,
    category: 'engagement',
  },
};

// ─── Reward Trigger Events ────────────────────────────────────────────────────

export type RewardTriggerEvent =
  | 'daily_login'
  | 'meal_logged'
  | 'glucose_reading_logged'
  | 'in_range_reading'
  | 'streak_maintained'
  | 'a1c_logged'
  | 'a1c_improved'
  | 'diaversary'
  | 'birthday'
  | 'caregiver_erratic_streak';

export interface RewardTriggerConfig {
  event: RewardTriggerEvent;
  basePoints: number;
  description: string;
}

export const REWARD_TRIGGERS: Record<RewardTriggerEvent, RewardTriggerConfig> = {
  daily_login: { event: 'daily_login', basePoints: 5, description: 'Daily login' },
  meal_logged: { event: 'meal_logged', basePoints: 8, description: 'Meal logged' },
  glucose_reading_logged: { event: 'glucose_reading_logged', basePoints: 5, description: 'Glucose reading logged' },
  in_range_reading: { event: 'in_range_reading', basePoints: 10, description: 'In-range glucose reading' },
  streak_maintained: { event: 'streak_maintained', basePoints: 15, description: 'Daily streak maintained' },
  a1c_logged: { event: 'a1c_logged', basePoints: 30, description: 'A1C result logged' },
  a1c_improved: { event: 'a1c_improved', basePoints: 100, description: 'A1C result improved' },
  diaversary: { event: 'diaversary', basePoints: 50, description: 'Diaversary anniversary' },
  birthday: { event: 'birthday', basePoints: 25, description: 'Birthday' },
  caregiver_erratic_streak: { event: 'caregiver_erratic_streak', basePoints: 30, description: 'Caregiver encouragement' },
};

// ─── Milestone Messaging ──────────────────────────────────────────────────────

export type MilestoneType =
  | 'diaversary'
  | 'birthday'
  | 'caregiver_burnout'
  | 'streak_7'
  | 'streak_30'
  | 'streak_90'
  | 'a1c_improved'
  | 'in_range_week'
  | 'in_range_month'
  | 'tier_upgrade'
  | 'badge_earned';

export interface MilestoneMessage {
  id: string;
  type: MilestoneType;
  title: string;
  body: string;
  /** Optional sub-text for additional context */
  subtext?: string;
  triggerDate: string;
  isRead: boolean;
  isDismissed: boolean;
  /** Badge earned, if applicable */
  badgeId?: BadgeId;
  /** New tier, if a tier upgrade */
  newTier?: MascotTier;
  /** Points awarded with this milestone */
  pointsAwarded?: number;
}

// ─── Gamification Profile ─────────────────────────────────────────────────────

export interface GamificationProfile {
  userId: string;
  currentTier: MascotTier;
  points: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastLoginDate: string | null;
  unlockedBadgeIds: BadgeId[];
  /** If set, this badge replaces the mascot on the profile/dashboard */
  activeBadgeId: BadgeId | null;
  /** Date of diabetes diagnosis (for diaversary calculation) */
  diaversaryDate: string | null;
  /** Whether the user is flagged as a caregiver */
  isCaregiver: boolean;
  /** Count of consecutive erratic readings (for caregiver trigger) */
  caregiverErraticCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GamificationState {
  profile: GamificationProfile | null;
  pendingMilestones: MilestoneMessage[];
  isLoading: boolean;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determines the mascot tier from a points total.
 */
export function getTierFromPoints(points: number): MascotTier {
  const tiers: MascotTier[] = ['crown', 'platinum', 'gold', 'silver', 'bronze'];
  for (const tier of tiers) {
    if (points >= TIER_CONFIGS[tier].minPoints) return tier;
  }
  return 'bronze';
}

/**
 * Returns the number of points needed to reach the next tier.
 * Returns null if already at Crown tier.
 */
export function getPointsToNextTier(points: number): number | null {
  const tierOrder: MascotTier[] = ['bronze', 'silver', 'gold', 'platinum', 'crown'];
  const currentTier = getTierFromPoints(points);
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex === tierOrder.length - 1) return null;
  const nextTier = tierOrder[currentIndex + 1];
  return TIER_CONFIGS[nextTier].minPoints - points;
}
