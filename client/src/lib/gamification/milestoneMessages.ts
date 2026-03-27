/**
 * GluMira™ — Milestone Messaging Library
 * Version: 1.0.0
 *
 * All milestone messages are written with:
 *   - Deep empathy for the lived experience of diabetes
 *   - Acknowledgment of the invisible, relentless work involved
 *   - ZERO toxic positivity or cheesiness
 *   - Tone: Inspiring, validating, honest
 *
 * Message Types:
 *   - Diaversary (anniversary of diagnosis)
 *   - Birthday (user's birthday)
 *   - Caregiver Encouragement (for caregivers logging erratic numbers)
 *   - Streak Milestones (7, 30, 90 days)
 *   - A1C Improvement
 *   - Tier Upgrades
 *   - In-Range Streaks
 */

import type { MascotTier } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MilestoneMessageTemplate {
  title: string;
  body: string;
  subtext?: string;
}

// ─── Diaversary Messages ──────────────────────────────────────────────────────

/**
 * Returns the appropriate diaversary message based on years living with diabetes.
 * Tone: Acknowledges resilience, the invisible work, the relentless reality.
 */
export function getDiaversaryMessage(years: number, displayName?: string): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  if (years === 1) {
    return {
      title: "Happy 1-Year Diaversary",
      body: `Another year of doing the math, managing the highs and the lows, and showing up for yourself${name}. We know how much invisible work this takes — the calculations, the adjustments, the moments no one else sees. Proud of you.`,
      subtext: "One year of living with diabetes. That's a year of strength.",
    };
  }

  if (years === 2) {
    return {
      title: "Happy 2-Year Diaversary",
      body: `Two years. Two years of waking up and immediately thinking about numbers. Two years of adjustments, setbacks, and keeping going anyway. That kind of persistence doesn't get enough credit. We see it.`,
      subtext: "Two years of showing up, every single day.",
    };
  }

  if (years === 3) {
    return {
      title: "Happy 3-Year Diaversary",
      body: `Three years of living with diabetes${name}. Three years of decisions most people never have to think about. The mental load of this condition is real, and you carry it every day. That deserves to be acknowledged.`,
    };
  }

  if (years >= 4 && years < 10) {
    return {
      title: `Happy ${years}-Year Diaversary`,
      body: `${years} years of doing the math, managing the highs and lows, and showing up for yourself every single day${name}. We know how much invisible work this takes. The resilience behind that number is extraordinary. Proud of you.`,
      subtext: `${years} years of strength.`,
    };
  }

  if (years === 10) {
    return {
      title: "Happy 10-Year Diaversary",
      body: `A decade${name}. Ten years of calculations, adjustments, late nights, and relentless self-management. Ten years of carrying something most people will never understand. The strength behind that number is extraordinary — and it deserves to be honoured.`,
      subtext: "A decade of resilience. This is a milestone.",
    };
  }

  if (years >= 10 && years < 20) {
    return {
      title: `Happy ${years}-Year Diaversary`,
      body: `${years} years${name}. That's ${years} years of living with something that never takes a day off — and neither have you. The invisible work behind that number is immense. We see it, and we're proud of you.`,
      subtext: `${years} years of showing up.`,
    };
  }

  if (years >= 20 && years < 30) {
    return {
      title: `Happy ${years}-Year Diaversary`,
      body: `${years} years of living with diabetes${name}. Two decades of doing the math, managing the highs and lows, and still being here. That kind of resilience is rare. It deserves to be acknowledged — not just today, but every day.`,
      subtext: `${years} years. Extraordinary.`,
    };
  }

  // 30+ years
  return {
    title: `Happy ${years}-Year Diaversary`,
    body: `${years} years${name}. A lifetime of living with diabetes — of doing the math no one else can see, managing the highs and lows, and still showing up. That kind of strength is extraordinary. We are deeply proud of you.`,
    subtext: `${years} years of resilience. This is remarkable.`,
  };
}

// ─── Birthday Messages ────────────────────────────────────────────────────────

/**
 * Birthday message — focuses on the person, not the patient.
 * Acknowledges their ongoing strength without making it the centrepiece.
 */
export function getBirthdayMessage(displayName?: string): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  const messages: MilestoneMessageTemplate[] = [
    {
      title: `Happy Birthday${name}`,
      body: `Today is about you — not your numbers, not your management, just you. You are so much more than your condition. We hope today brings you moments that have nothing to do with diabetes at all. Happy birthday.`,
      subtext: "Today is yours.",
    },
    {
      title: `Happy Birthday${name}`,
      body: `On your birthday, we want to acknowledge something: the strength you carry every day is remarkable. But today, set that down for a moment. Today is about celebrating you — the whole person, not just the one who manages diabetes. Happy birthday.`,
    },
    {
      title: `Happy Birthday${name}`,
      body: `Another year of being you — and everything that comes with that. The resilience, the humour, the strength, the moments of frustration, and the moments of grace. You are more than your condition. Happy birthday.`,
      subtext: "Wishing you a day that's entirely yours.",
    },
  ];

  // Rotate through messages based on the current year
  const index = new Date().getFullYear() % messages.length;
  return messages[index];
}

// ─── Caregiver Encouragement Messages ────────────────────────────────────────

/**
 * Caregiver encouragement — triggered after logging frequent erratic numbers.
 * Tone: Validates burnout, acknowledges the weight of caregiving.
 */
export function getCaregiverEncouragementMessage(
  erraticCount: number,
  displayName?: string,
): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  if (erraticCount >= 10) {
    return {
      title: `You are doing a great job${name}`,
      body: `We see how hard you're working right now. The numbers have been tough, and we know that takes a toll. Caregiver burnout is real — and it's okay to acknowledge it. Your dedication is exactly what they need. Take a breath. You are doing a great job.`,
      subtext: "The work you do is seen, even when it feels invisible.",
    };
  }

  if (erraticCount >= 5) {
    return {
      title: `We see you${name}`,
      body: `The numbers have been unpredictable lately, and we know how exhausting that is. Managing someone else's diabetes is one of the most demanding things a person can do. You are showing up every day for someone you love. That matters more than any number.`,
      subtext: "Your dedication is extraordinary.",
    };
  }

  return {
    title: `You're doing more than you know${name}`,
    body: `Caregiving is invisible work. The calculations, the worry, the adjustments — most people will never understand what you carry. We do. You are doing a great job, even on the hard days.`,
    subtext: "The care you give is seen.",
  };
}

// ─── Streak Milestone Messages ────────────────────────────────────────────────

export function getStreakMessage(days: number, displayName?: string): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  switch (days) {
    case 7:
      return {
        title: `7 Days Strong${name}`,
        body: `Seven days of showing up. That's seven days of invisible work that most people will never understand. We do. Keep going.`,
        subtext: "7-day streak achieved.",
      };
    case 14:
      return {
        title: `Two Weeks${name}`,
        body: `Two weeks of consistent tracking. That kind of discipline — especially on the hard days — is something to be genuinely proud of.`,
        subtext: "14-day streak achieved.",
      };
    case 30:
      return {
        title: `30 Days. A Full Month${name}`,
        body: `A month of consistent logging. The data you've built here is powerful — and so is the person behind it. This is what dedication looks like.`,
        subtext: "30-day streak achieved.",
      };
    case 60:
      return {
        title: `60 Days${name}`,
        body: `Two months of showing up every day. The consistency you've built here is remarkable. The data tells a story — and it's a story of real commitment.`,
        subtext: "60-day streak achieved.",
      };
    case 90:
      return {
        title: `90 Days of Resilience${name}`,
        body: `Three months. Every single day. The data you've built here is extraordinary — and so is the person behind it. The resilience this takes is something to be genuinely proud of.`,
        subtext: "90-day streak achieved.",
      };
    case 180:
      return {
        title: `Six Months${name}`,
        body: `Half a year of consistent tracking. That's 180 days of showing up, even when it was hard. The insight you've built into your own patterns is invaluable. We are proud of you.`,
        subtext: "180-day streak achieved.",
      };
    case 365:
      return {
        title: `One Full Year${name}`,
        body: `365 days. A full year of consistent logging. The discipline, the data, the dedication — this is extraordinary. You have built something genuinely valuable here.`,
        subtext: "365-day streak achieved. Remarkable.",
      };
    default:
      return {
        title: `${days}-Day Streak${name}`,
        body: `${days} days of consistent tracking. Every day you show up adds to the picture. Keep going.`,
        subtext: `${days}-day streak achieved.`,
      };
  }
}

// ─── A1C Improvement Messages ─────────────────────────────────────────────────

export function getA1CImprovementMessage(
  newValue: number,
  previousValue: number,
  displayName?: string,
): MilestoneMessageTemplate {
  const improvement = (previousValue - newValue).toFixed(1);
  const name = displayName ? `, ${displayName}` : "";

  if (parseFloat(improvement) >= 2) {
    return {
      title: `Significant A1C Progress${name}`,
      body: `Your A1C has improved by ${improvement}%. That is a meaningful result — and it represents real effort, real discipline, and real sacrifice. Every decimal point in that number is a decision you made. This is something to be genuinely proud of.`,
      subtext: `${previousValue}% → ${newValue}%`,
    };
  }

  if (parseFloat(improvement) >= 1) {
    return {
      title: `A1C Progress${name}`,
      body: `Your A1C has improved by ${improvement}%. We know how much work goes into moving that number — the meal decisions, the timing, the adjustments. Every decimal point matters. This is real progress.`,
      subtext: `${previousValue}% → ${newValue}%`,
    };
  }

  return {
    title: `A1C Progress${name}`,
    body: `Your A1C has improved by ${improvement}%. Moving that number — even slightly — takes sustained effort and discipline. This is a meaningful result. Keep going.`,
    subtext: `${previousValue}% → ${newValue}%`,
  };
}

// ─── In-Range Streak Messages ─────────────────────────────────────────────────

export function getInRangeMessage(days: number, displayName?: string): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  if (days === 7) {
    return {
      title: `7 Days In Range${name}`,
      body: `Seven days of blood sugar within your target range. That's exceptional management — and we know how much effort goes into each of those readings. This is a meaningful achievement.`,
      subtext: "7-day in-range streak.",
    };
  }

  return {
    title: `${days} Days In Range${name}`,
    body: `${days} days of blood sugar within your target range. The effort behind this kind of consistency is immense. This is what excellent management looks like.`,
    subtext: `${days}-day in-range streak.`,
  };
}

// ─── Tier Upgrade Messages ────────────────────────────────────────────────────

export function getTierUpgradeMessage(
  newTier: MascotTier,
  displayName?: string,
): MilestoneMessageTemplate {
  const name = displayName ? `, ${displayName}` : "";

  const messages: Record<MascotTier, MilestoneMessageTemplate> = {
    bronze: {
      title: `Welcome to GluMira™${name}`,
      body: `Every journey starts somewhere. Welcome — we're glad you're here.`,
    },
    silver: {
      title: `Silver Member${name}`,
      body: `Consistency is its own kind of strength. You've earned Silver status — keep going.`,
      subtext: "Silver tier unlocked.",
    },
    gold: {
      title: `Gold Member${name}`,
      body: `Your dedication is showing in the data. Gold status reflects the real work you're putting in every day. This is earned.`,
      subtext: "Gold tier unlocked.",
    },
    platinum: {
      title: `Platinum Member${name}`,
      body: `The invisible work you do every day — we see it. Platinum status is a reflection of extraordinary commitment. You've earned this.`,
      subtext: "Platinum tier unlocked.",
    },
    crown: {
      title: `Crown Member${name}`,
      body: `Elite. Resilient. Relentless. Crown status is reserved for those who show up, day after day, no matter what. That's you. This is the highest recognition GluMira™ offers — and you've earned every bit of it.`,
      subtext: "Crown tier unlocked. The highest tier.",
    },
  };

  return messages[newTier];
}
