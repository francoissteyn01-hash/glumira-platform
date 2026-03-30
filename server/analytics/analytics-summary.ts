/**
 * GluMira™ V7 — server/analytics/analytics-summary.ts
 * 7-day vs 14-day glucose analytics: TIR, GMI, CV, patterns.
 * Required by: AnalyticsSummaryCard.tsx
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

export interface GlucosePoint { glucose: number; timestamp: string; }

export interface PeriodSummary {
  days: number; count: number; mean: number; sd: number; cv: number;
  min: number; max: number;
  tirPercent: number; belowPercent: number; abovePercent: number;
  gmi: number; patterns: string[];
}

export interface AnalyticsSummary {
  sevenDay: PeriodSummary; fourteenDay: PeriodSummary;
  tirDelta: number; gmiDelta: number; computedAt: string;
}

function avg(v: number[]) { return v.length ? v.reduce((s,x) => s+x, 0)/v.length : 0; }
function r2(n: number)    { return Math.round(n*100)/100; }

export function calcGMI(meanMmol: number): number {
  return r2(3.31 + 0.02392 * meanMmol * 18.0182);
}

export function detectPatterns(readings: GlucosePoint[]): string[] {
  if (readings.length < 10) return [];
  const patterns: string[] = [];
  const hr = (r: GlucosePoint) => new Date(r.timestamp).getHours();

  const dawn   = readings.filter(r => hr(r) >= 3 && hr(r) < 8);
  const dawnM  = avg(dawn.map(r => r.glucose));
  if (dawn.length >= 3 && dawnM > 8.5)
    patterns.push(`Dawn phenomenon (mean ${dawnM.toFixed(1)} mmol/L, 03:00–08:00)`);

  const noct  = readings.filter(r => hr(r) >= 22 || hr(r) < 4);
  const nHypo = noct.filter(r => r.glucose < 3.9).length;
  if (noct.length >= 3 && nHypo/noct.length > 0.1)
    patterns.push(`Nocturnal hypoglycaemia (${nHypo} events)`);

  const lunch  = readings.filter(r => hr(r) >= 12 && hr(r) < 15);
  const lunchM = avg(lunch.map(r => r.glucose));
  if (lunch.length >= 3 && lunchM > 11.0)
    patterns.push(`Post-lunch hyperglycaemia (mean ${lunchM.toFixed(1)} mmol/L)`);

  return patterns;
}

export function buildPeriodSummary(readings: GlucosePoint[], days: number): PeriodSummary {
  const cut      = new Date(Date.now() - days*24*60*60*1000).toISOString();
  const filtered = readings.filter(r => r.timestamp >= cut);
  const vals     = filtered.map(r => r.glucose);

  if (!vals.length) return { days, count:0, mean:0, sd:0, cv:0, min:0, max:0, tirPercent:0, belowPercent:0, abovePercent:0, gmi:0, patterns:[] };

  const mean_  = avg(vals);
  const sd     = vals.length < 2 ? 0 : Math.sqrt(vals.reduce((s,v) => s+(v-mean_)**2, 0)/vals.length);
  const inR    = vals.filter(v => v >= 3.9 && v <= 10.0).length;
  const below  = vals.filter(v => v < 3.9).length;
  const above  = vals.filter(v => v > 10.0).length;

  return {
    days, count: vals.length,
    mean: r2(mean_), sd: r2(sd), cv: r2(mean_ > 0 ? (sd/mean_)*100 : 0),
    min: r2(Math.min(...vals)), max: r2(Math.max(...vals)),
    tirPercent:   r2((inR  / vals.length)*100),
    belowPercent: r2((below / vals.length)*100),
    abovePercent: r2((above / vals.length)*100),
    gmi:      calcGMI(mean_),
    patterns: detectPatterns(filtered),
  };
}

export function generateAnalyticsSummary(readings: GlucosePoint[]): AnalyticsSummary {
  const s7  = buildPeriodSummary(readings, 7);
  const s14 = buildPeriodSummary(readings, 14);
  return { sevenDay: s7, fourteenDay: s14, tirDelta: r2(s7.tirPercent - s14.tirPercent), gmiDelta: r2(s7.gmi - s14.gmi), computedAt: new Date().toISOString() };
}

// UI helpers used by AnalyticsSummaryCard
export function tirStatusLabel(tir: number): string {
  return tir >= 70 ? "On target" : tir >= 50 ? "Below target" : "Well below target";
}
export function gmiCategory(gmi: number): string {
  return gmi < 6.5 ? "Excellent" : gmi < 7.0 ? "Good" : gmi < 7.5 ? "Moderate" : gmi < 8.0 ? "High" : "Very high";
}
export function tirColour(tir: number): string {
  return tir >= 70 ? "text-emerald-600" : tir >= 50 ? "text-amber-600" : "text-red-600";
}

// Alias used by analytics.route.ts
export const computeAnalyticsSummary = generateAnalyticsSummary;
