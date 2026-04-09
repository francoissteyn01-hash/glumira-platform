/**
 * GluMira™ V7 — IOB Hunter™ Insulin Activity Calculation Engine
 * Simplified bi-exponential model for insulin-on-board visualization.
 */

export interface InsulinProfileDef {
  name: string;
  type: "basal" | "bolus";
  onset: number;    // hours
  peak: number;     // hours
  duration: number; // hours
  color: string;
}

export interface Injection {
  time: number;        // timestamp (ms)
  dose: number;        // units
  insulinType: string; // key into INSULIN_PROFILES
}

export interface IOBDataPoint {
  time: Date;
  hours: number;
  timeLabel: string;
  totalIOB: number;
  hour: number;
}

export interface HeatmapPoint {
  hour: number;
  timeLabel: string;
  iob: number;
  intensity: "low" | "moderate" | "high" | "extreme";
}

export const INSULIN_PROFILES: Record<string, InsulinProfileDef> = {
  levemir: {
    name: "Levemir",
    type: "basal",
    onset: 1.5,
    peak: 7,
    duration: 18,
    color: "#6FA8DC",
  },
  actrapid: {
    name: "Actrapid",
    type: "bolus",
    onset: 0.5,
    peak: 3,
    duration: 7,
    color: "#F6B26B",
  },
  fiasp: {
    name: "Fiasp",
    type: "bolus",
    onset: 0.15,
    peak: 1,
    duration: 4,
    color: "#FFD966",
  },
};

/**
 * Calculate insulin activity at a given time point.
 * Uses bi-exponential curve for realistic pharmacodynamics.
 */
export function calculateInsulinActivity(
  timeElapsed: number,
  dose: number,
  profile: InsulinProfileDef,
): number {
  const { onset, peak, duration } = profile;

  if (timeElapsed < onset || timeElapsed > duration) return 0;

  const t = (timeElapsed - onset) / (duration - onset);
  const peakTime = (peak - onset) / (duration - onset);

  // Rising phase (onset -> peak)
  if (t <= peakTime) {
    return dose * Math.pow(t / peakTime, 2);
  }

  // Falling phase (peak -> duration)
  const decay = Math.exp(-3 * (t - peakTime) / (1 - peakTime));
  return dose * decay;
}

/**
 * Calculate total IOB at specific time across all doses.
 */
export function calculateIOB(currentTime: number, injections: Injection[]): number {
  return injections.reduce((total, injection) => {
    const timeElapsed = (currentTime - injection.time) / (1000 * 60 * 60);
    const profile = INSULIN_PROFILES[injection.insulinType];
    if (!profile) return total;
    return total + calculateInsulinActivity(timeElapsed, injection.dose, profile);
  }, 0);
}

/**
 * Generate 24-hour IOB curve data at 15-minute resolution.
 */
export function generate24HourIOBCurve(injections: Injection[], startTime: Date): IOBDataPoint[] {
  const dataPoints: IOBDataPoint[] = [];
  const intervalMinutes = 15;

  for (let i = 0; i < 24 * 60; i += intervalMinutes) {
    const currentTime = new Date(startTime.getTime() + i * 60 * 1000);
    const hours = i / 60;
    const iob = calculateIOB(currentTime.getTime(), injections);

    dataPoints.push({
      time: currentTime,
      hours,
      timeLabel: formatHour(hours),
      totalIOB: parseFloat(iob.toFixed(2)),
      hour: Math.floor(hours),
    });
  }

  return dataPoints;
}

/**
 * Generate heatmap density data (hourly bins).
 */
export function generateHeatmapData(injections: Injection[], startTime: Date): HeatmapPoint[] {
  const hourlyData = Array(24).fill(0) as number[];

  for (let hour = 0; hour < 24; hour++) {
    const currentTime = new Date(startTime.getTime() + hour * 60 * 60 * 1000);
    hourlyData[hour] = calculateIOB(currentTime.getTime(), injections);
  }

  return hourlyData.map((iob, hour) => ({
    hour,
    timeLabel: formatHour(hour),
    iob: parseFloat(iob.toFixed(2)),
    intensity: getIntensity(iob),
  }));
}

export function getIntensity(iob: number): "low" | "moderate" | "high" | "extreme" {
  if (iob < 3) return "low";
  if (iob < 5) return "moderate";
  if (iob < 7) return "high";
  return "extreme";
}

export function getIOBColor(iob: number): string {
  if (iob < 3) return "#6FA8DC";
  if (iob < 5) return "#93C47D";
  if (iob < 7) return "#F6B26B";
  return "#E06666";
}

function formatHour(hours: number): string {
  const h = Math.floor(hours);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}${period}`;
}
