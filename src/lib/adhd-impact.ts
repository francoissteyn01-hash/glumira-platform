export interface StimulantProfile {
  onset: number;
  peak: number;
  duration: number;
}

export interface OverlapWindow {
  start: number;
  end: number;
  risk: "low" | "medium" | "high";
  reason: string;
}

const STIMULANT_PROFILES: Record<string, StimulantProfile> = {
  methylphenidate: { onset: 0.5, peak: 2, duration: 4 },
  "methylphenidate-er": { onset: 1, peak: 4, duration: 8 },
  amphetamine: { onset: 0.5, peak: 2.5, duration: 5 },
  "amphetamine-er": { onset: 1.5, peak: 5, duration: 10 },
  lisdexamfetamine: { onset: 1.5, peak: 4, duration: 12 },
  atomoxetine: { onset: 1, peak: 3, duration: 24 },
};

export function calculateStimulantOverlap(
  stimulantType: string,
  stimulantDoseHour: number,
  insulinDoseHour: number,
  insulinDuration = 4
): OverlapWindow[] {
  const stim = STIMULANT_PROFILES[stimulantType] || STIMULANT_PROFILES.methylphenidate;
  const stimStart = stimulantDoseHour + stim.onset;
  const stimEnd = stimulantDoseHour + stim.duration;
  const insEnd = insulinDoseHour + insulinDuration;

  const windows: OverlapWindow[] = [];
  const overlapStart = Math.max(stimStart, insulinDoseHour);
  const overlapEnd = Math.min(stimEnd, insEnd);

  if (overlapStart < overlapEnd) {
    const overlapHours = overlapEnd - overlapStart;
    windows.push({
      start: overlapStart % 24,
      end: overlapEnd % 24,
      risk: overlapHours >= 3 ? "high" : overlapHours >= 1.5 ? "medium" : "low",
      reason: "Appetite suppression overlaps with active insulin — hypo risk",
    });
  }

  return windows;
}

export interface MealBlock {
  time: string;
  type: string;
  carbs: number;
  note: string;
}

export function generateAdhdMealPlan(stimulantType: string, doseHour: number): MealBlock[] {
  const stim = STIMULANT_PROFILES[stimulantType] || STIMULANT_PROFILES.methylphenidate;
  const suppressionStart = doseHour + stim.onset;
  const suppressionEnd = doseHour + stim.duration;

  const meals: MealBlock[] = [
    { time: `${(doseHour - 1 + 24) % 24}:00`, type: "breakfast", carbs: 30, note: "Eat BEFORE medication" },
  ];

  // Small snacks every 2h during suppression
  for (let h = Math.ceil(suppressionStart); h < suppressionEnd; h += 2) {
    meals.push({
      time: `${h % 24}:00`,
      type: "snack",
      carbs: 15,
      note: "Small snack — set a timer reminder",
    });
  }

  // Evening meal after medication wears off
  const dinnerHour = Math.max(18, Math.ceil(suppressionEnd));
  meals.push({ time: `${dinnerHour % 24}:00`, type: "dinner", carbs: 45, note: "Appetite returning — main meal" });
  meals.push({ time: "21:00", type: "supper", carbs: 15, note: "Prevent overnight hypo" });

  return meals;
}

export function simplifyIOBDisplay(iobUnits: number): { level: string; color: string; message: string } {
  if (iobUnits > 4) return { level: "HIGH", color: "#D32F2F", message: "Lots of insulin active — eat something" };
  if (iobUnits > 2) return { level: "MEDIUM", color: "#F59E0B", message: "Some insulin working — snack if needed" };
  if (iobUnits > 0.5) return { level: "LOW", color: "#2AB5C1", message: "A little insulin active — you're OK" };
  return { level: "CLEAR", color: "#4CAF50", message: "Almost no insulin active" };
}
