/* ─── GluMira™ V7 — Streak & Engagement Engine ─────────────────────────── */

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysLogged: number;
  lastLogDate: string | null;
  milestones: StreakMilestone[];
  weeklyActivity: boolean[]; // last 7 days, [0]=today
}

const STORAGE_KEY = "glumira_streak_data";

const MILESTONE_DEFS: { days: number; title: string; description: string }[] = [
  { days: 3, title: "Getting Started", description: "Three days of consistent logging" },
  { days: 7, title: "Week Warrior", description: "A full week of tracking" },
  { days: 14, title: "Fortnight Focus", description: "Two weeks of dedication" },
  { days: 30, title: "Monthly Master", description: "One month strong" },
  { days: 60, title: "Diamond Dedication", description: "Two months of commitment" },
  { days: 90, title: "Quarterly Champion", description: "Three months — outstanding" },
  { days: 180, title: "Half-Year Hero", description: "Six months of excellence" },
  { days: 365, title: "Year of Visibility", description: "The science of insulin, made visible — for a full year" },
];

/** Normalise an ISO date string to YYYY-MM-DD */
function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Difference in calendar days between two YYYY-MM-DD strings */
function daysBetween(a: string, b: string): number {
  const msA = new Date(a + "T00:00:00Z").getTime();
  const msB = new Date(b + "T00:00:00Z").getTime();
  return Math.round(Math.abs(msA - msB) / 86_400_000);
}

/** Today as YYYY-MM-DD in local time */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Calculate full streak data from an array of ISO date strings.
 */
export function calculateStreak(logDates: string[]): StreakData {
  if (logDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysLogged: 0,
      lastLogDate: null,
      milestones: getStreakMilestones(0, 0),
      weeklyActivity: [false, false, false, false, false, false, false],
    };
  }

  // Deduplicate to unique calendar days and sort ascending
  const uniqueDays = [...new Set(logDates.map(toDateKey))].sort();
  const totalDaysLogged = uniqueDays.length;
  const lastLogDate = uniqueDays[uniqueDays.length - 1];
  const today = todayKey();

  // Calculate current streak (must include today or yesterday)
  let currentStreak = 0;
  const gapFromToday = daysBetween(lastLogDate, today);
  if (gapFromToday <= 1) {
    currentStreak = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      if (daysBetween(uniqueDays[i], uniqueDays[i + 1]) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    // If last log was yesterday (not today), the streak is tentative — still count it
  }

  // Calculate longest streak
  let longestStreak = 1;
  let runningStreak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1) {
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else {
      runningStreak = 1;
    }
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Weekly activity: [0]=today, [1]=yesterday, ... [6]=6 days ago
  const weeklyActivity: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    weeklyActivity.push(uniqueDays.includes(key));
  }

  const milestones = getStreakMilestones(currentStreak, longestStreak);

  const data: StreakData = {
    currentStreak,
    longestStreak,
    totalDaysLogged,
    lastLogDate,
    milestones,
    weeklyActivity,
  };

  // Persist to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }

  return data;
}

/**
 * Build milestones array with achieved state.
 */
export function getStreakMilestones(currentStreak: number, longestStreak: number): StreakMilestone[] {
  const best = Math.max(currentStreak, longestStreak);
  return MILESTONE_DEFS.map((m) => ({
    days: m.days,
    title: m.title,
    description: m.description,
    achieved: best >= m.days,
    ...(best >= m.days ? { achievedDate: new Date().toISOString().slice(0, 10) } : {}),
  }));
}

/**
 * Return an encouraging message based on streak length.
 */
export function getMotivationalMessage(streak: number): string {
  if (streak === 0) return "Every journey starts with day one. Log your first entry today!";
  if (streak === 1) return "Great start! One day logged — come back tomorrow to build your streak.";
  if (streak === 2) return "Two days in a row! Momentum is building.";
  if (streak < 7) return `${streak} days strong — you're building a powerful habit.`;
  if (streak < 14) return "Over a week of consistency! Your future self will thank you.";
  if (streak < 30) return "You're in the zone. Keep the rhythm going — every day matters.";
  if (streak < 60) return "A month of dedication. You're proving that small actions compound.";
  if (streak < 90) return "Two months — this isn't luck, it's discipline. Incredible work.";
  if (streak < 180) return "A full quarter of consistent tracking. You're an inspiration.";
  if (streak < 365) return "Half a year of visibility. The science of insulin, made visible — by you.";
  return "A full year. You've turned knowledge into a daily practice. Extraordinary.";
}

/**
 * Load cached streak data from localStorage (or null if none).
 */
export function loadCachedStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StreakData) : null;
  } catch {
    return null;
  }
}
