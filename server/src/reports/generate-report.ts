/**
 * GluMira™ V7 — Two-Page PDF Report Generator
 * Uses PDFKit for server-side generation.
 *
 * Page 1: Dose & Stacking Highlights
 * Page 2: Insulin Stacking Report + Basal Evaluation Gauge
 *
 * All glucose values rendered in user's unit system. Never mixed.
 * GluMira™ is an educational platform, not a medical device.
 */

import PDFDocument from "pdfkit";
import {
  generateStackingCurve,
  calculateStackingScore,
  getActiveIOB,
  FORMULARY_MAP,
  type InsulinEvent,
  type StackingPoint,
} from "../engine/iob-hunter";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type ReportInput = {
  insulinEvents: InsulinEvent[];
  mealLogs: {
    meal_time: string;
    event_type: string;
    insulin_type: string | null;
    units: number | null;
    glucose_value: number | null;
    food_description: string | null;
    comment: string | null;
  }[];
  glucoseReadings: { time: string; value: number }[];
  glucoseUnits: "mmol" | "mg";
  reportDate: string; // YYYY-MM-DD
  patientName?: string;
}

type DoseObservation = {
  icon: "check" | "warn";
  text: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLOURS & CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const NAVY = "#1a2a5e";
const TEAL = "#2ab5c1";
const GREY = "#52667a";
const LIGHT_BG = "#f8f9fa";
const GREEN = "#22c55e";
const YELLOW = "#eab308";
const ORANGE = "#f97316";
const RED = "#ef4444";

const MMOL_TO_MG = 18.0182;

const FOOTER = "GluMira\u2122 \u2014 Educational use only \u2014 Not a medical device";
const POWERED = "Powered by IOB Hunter\u2122";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function fmtGlucose(mmol: number, units: "mmol" | "mg"): string {
  if (units === "mg") return `${Math.round(mmol * MMOL_TO_MG)}`;
  return (Math.round(mmol * 10) / 10).toFixed(1);
}

function unitLabel(units: "mmol" | "mg"): string {
  return units === "mmol" ? "mmol/L" : "mg/dL";
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function pressureColour(pressure: string): string {
  switch (pressure) {
    case "light": return GREEN;
    case "moderate": return YELLOW;
    case "strong": return ORANGE;
    case "overlap": return RED;
    default: return GREEN;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYSIS FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function generateObservations(input: ReportInput, curve: StackingPoint[]): DoseObservation[] {
  const obs: DoseObservation[] = [];
  const events = input.insulinEvents;

  // Check for dose compression (multiple rapid doses within 2h)
  const rapidEvents = events.filter((e) => {
    const p = FORMULARY_MAP[e.insulin_type];
    return p && (p.type === "ultra_rapid" || p.type === "rapid");
  });
  for (let i = 1; i < rapidEvents.length; i++) {
    const gap = (new Date(rapidEvents[i].event_time).getTime() - new Date(rapidEvents[i - 1].event_time).getTime()) / 60_000;
    if (gap < 120 && gap > 0) {
      obs.push({
        icon: "warn",
        text: `Rapid doses at ${fmtTime(rapidEvents[i - 1].event_time)} and ${fmtTime(rapidEvents[i].event_time)} are ${Math.round(gap)} min apart \u2014 stacking risk.`,
      });
    }
  }

  // Check for overlap periods
  const overlapPoints = curve.filter((p) => p.pressure === "overlap");
  if (overlapPoints.length > 0) {
    const startTime = fmtTime(overlapPoints[0].time);
    const endTime = fmtTime(overlapPoints[overlapPoints.length - 1].time);
    obs.push({
      icon: "warn",
      text: `Overlap risk detected between ${startTime}\u2013${endTime}.`,
    });
  }

  // Check basal timing
  const basalEvents = events.filter((e) => {
    const p = FORMULARY_MAP[e.insulin_type];
    return p && (p.type === "long" || p.type === "ultra_long" || p.type === "intermediate");
  });
  if (basalEvents.length > 0) {
    obs.push({
      icon: "check",
      text: `${basalEvents.length} basal dose(s) recorded today.`,
    });
  }

  // Check for bolus within 4h of basal
  for (const basal of basalEvents) {
    const basalTime = new Date(basal.event_time).getTime();
    for (const rapid of rapidEvents) {
      const rapidTime = new Date(rapid.event_time).getTime();
      const gapH = Math.abs(rapidTime - basalTime) / 3_600_000;
      if (gapH < 4 && gapH > 0) {
        obs.push({
          icon: "warn",
          text: `Bolus at ${fmtTime(rapid.event_time)} is within 4h of basal at ${fmtTime(basal.event_time)} \u2014 watch for tail overlap.`,
        });
        break;
      }
    }
  }

  // Glucose observations
  const lows = input.glucoseReadings.filter((r) => r.value < 3.9);
  if (lows.length > 0) {
    obs.push({
      icon: "warn",
      text: `${lows.length} low glucose reading(s) detected (below 3.9 ${unitLabel(input.glucoseUnits)}).`,
    });
  }

  if (obs.length === 0) {
    obs.push({ icon: "check", text: "No significant timing concerns detected today." });
  }

  return obs;
}

function generateTimingConsiderations(input: ReportInput): string[] {
  const tips: string[] = [];
  const events = input.insulinEvents;

  const basals = events.filter((e) => {
    const p = FORMULARY_MAP[e.insulin_type];
    return p && (p.type === "long" || p.type === "ultra_long");
  });

  if (basals.length >= 2) {
    const times = basals.map((b) => new Date(b.event_time).getHours());
    const gap = Math.abs(times[1] - times[0]);
    if (gap < 10) {
      tips.push("Consider spacing basal doses more evenly across 24h to reduce overlap windows.");
    }
  }

  const rapidEvents = events.filter((e) => {
    const p = FORMULARY_MAP[e.insulin_type];
    return p && (p.type === "ultra_rapid" || p.type === "rapid");
  });
  if (rapidEvents.length >= 3) {
    tips.push("Multiple rapid doses today \u2014 review pre-bolus timing to reduce post-meal spikes.");
  }

  if (tips.length === 0) {
    tips.push("Timing pattern looks consistent for today.");
  }

  return tips;
}

/** Basal Evaluation Gauge — score out of 10 */
function calculateBasalScore(events: InsulinEvent[], curve: StackingPoint[]): {
  total: number;
  coverage: number;
  overlap: number;
  timing: number;
  tail: number;
} {
  const basalEvents = events.filter((e) => {
    const p = FORMULARY_MAP[e.insulin_type];
    return p && (p.type === "long" || p.type === "ultra_long" || p.type === "intermediate");
  });

  if (basalEvents.length === 0) {
    return { total: 0, coverage: 0, overlap: 0, timing: 0, tail: 0 };
  }

  // Coverage uniformity (2.5): how evenly IOB covers 24h
  const basalCurvePoints = curve.map((p) => {
    let basalIOB = 0;
    const t = new Date(p.time).getTime();
    for (const ev of basalEvents) {
      const profile = FORMULARY_MAP[ev.insulin_type];
      if (!profile) continue;
      const elapsed = (t - new Date(ev.event_time).getTime()) / 60_000;
      basalIOB += getActiveIOB(ev.dose_units, elapsed, profile);
    }
    return basalIOB;
  });
  const maxBasal = Math.max(...basalCurvePoints, 0.01);
  const minBasal = Math.min(...basalCurvePoints);
  const uniformity = minBasal / maxBasal; // 0-1
  const coverage = Math.min(2.5, uniformity * 2.5);

  // Overlap minimisation (2.5): fewer overlap points = better
  const overlapCount = curve.filter((p) => p.pressure === "overlap" || p.pressure === "strong").length;
  const overlapRatio = overlapCount / Math.max(curve.length, 1);
  const overlap = Math.max(0, 2.5 * (1 - overlapRatio * 4));

  // Timing consistency (2.5): check if basal times are evenly spaced
  let timing: number;
  if (basalEvents.length >= 2) {
    const hours = basalEvents.map((b) => new Date(b.event_time).getHours() + new Date(b.event_time).getMinutes() / 60);
    hours.sort((a, b) => a - b);
    const idealGap = 24 / basalEvents.length;
    let gapDeviation = 0;
    for (let i = 1; i < hours.length; i++) {
      gapDeviation += Math.abs((hours[i] - hours[i - 1]) - idealGap);
    }
    const avgDev = gapDeviation / (hours.length - 1);
    timing = Math.max(0, 2.5 * (1 - avgDev / idealGap));
  } else {
    timing = 2.0; // single daily dose — decent by default
  }

  // Tail management (2.5): how low is IOB at the end of the period
  const lastPoints = basalCurvePoints.slice(-12); // last hour
  const tailAvg = lastPoints.reduce((s, v) => s + v, 0) / Math.max(lastPoints.length, 1);
  const tailRatio = maxBasal > 0 ? tailAvg / maxBasal : 0;
  const tail = tailRatio > 0.1 ? 2.5 : Math.min(2.5, tailRatio * 25);

  const total = Math.round((coverage + overlap + timing + tail) * 10) / 10;

  return {
    total: Math.min(10, total),
    coverage: Math.round(coverage * 10) / 10,
    overlap: Math.round(overlap * 10) / 10,
    timing: Math.round(timing * 10) / 10,
    tail: Math.round(tail * 10) / 10,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PDF GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */

export async function generateReport(input: ReportInput): Promise<Buffer> {
  const { from, to } = (() => {
    const d = new Date(input.reportDate);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60_000);
    return { from: start, to: end };
  })();

  const curve = generateStackingCurve(input.insulinEvents, from, to);
  const observations = generateObservations(input, curve);
  const timingTips = generateTimingConsiderations(input);
  const basalScore = calculateBasalScore(input.insulinEvents, curve);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* ── PAGE 1 — Dose & Stacking Highlights ───────────────────────── */
    drawHeader(doc, input.reportDate, "Dose & Stacking Highlights");
    drawColourLegend(doc);

    // Left column: Dose/Event Data table
    const tableTop = 130;
    doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold").text("Dose / Event Data", 40, tableTop);

    let ty = tableTop + 18;
    doc.fontSize(7).font("Helvetica-Bold").fillColor(GREY);
    doc.text("Time", 40, ty, { width: 50 });
    doc.text("Insulin", 90, ty, { width: 80 });
    doc.text("Dose", 170, ty, { width: 40 });
    doc.text("Glucose", 210, ty, { width: 50 });
    doc.text("Notes", 260, ty, { width: 100 });
    ty += 12;
    doc.moveTo(40, ty).lineTo(360, ty).strokeColor("#dee2e6").lineWidth(0.5).stroke();
    ty += 4;

    doc.font("Helvetica").fontSize(7).fillColor(NAVY);
    const rows = input.mealLogs.slice(0, 18); // max 18 rows on page 1
    for (const row of rows) {
      if (ty > 380) break;
      doc.text(fmtTime(row.meal_time), 40, ty, { width: 50 });
      doc.text(row.insulin_type ?? "\u2014", 90, ty, { width: 80 });
      doc.text(row.units != null ? row.units.toFixed(2) : "\u2014", 170, ty, { width: 40 });
      doc.text(
        row.glucose_value != null ? `${fmtGlucose(row.glucose_value, input.glucoseUnits)} ${unitLabel(input.glucoseUnits)}` : "\u2014",
        210, ty, { width: 50 }
      );
      doc.text((row.comment ?? row.food_description ?? "").slice(0, 30), 260, ty, { width: 100 });
      ty += 12;
    }

    // Left bottom: Stacking Curve (simplified as coloured bars)
    const curveTop = Math.max(ty + 16, 400);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY).text("IOB Stacking Curve", 40, curveTop);
    drawStackingCurveBar(doc, curve, 40, curveTop + 14, 320, 60);

    // Right column: Observations
    const rightX = 380;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Dose Observations", rightX, tableTop);
    let oy = tableTop + 18;
    for (const obs of observations.slice(0, 6)) {
      const icon = obs.icon === "check" ? "\u2713" : "\u26A0";
      const col = obs.icon === "check" ? GREEN : ORANGE;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(col).text(icon, rightX, oy);
      doc.font("Helvetica").fillColor(NAVY).text(obs.text, rightX + 14, oy, { width: 170 });
      oy += Math.ceil(obs.text.length / 35) * 10 + 6;
    }

    // Timing Considerations
    oy += 10;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Timing Considerations", rightX, oy);
    oy += 16;
    for (const tip of timingTips.slice(0, 4)) {
      doc.fontSize(8).font("Helvetica").fillColor(NAVY).text(`\u2022 ${tip}`, rightX, oy, { width: 170 });
      oy += Math.ceil(tip.length / 35) * 10 + 4;
    }

    // Comments
    oy += 10;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Comments", rightX, oy);
    oy += 16;
    doc.fontSize(8).font("Helvetica").fillColor(GREY);
    doc.text("Timing-based observations only. GluMira\u2122 never suggests dose volume changes.", rightX, oy, { width: 170 });

    drawFooter(doc);

    /* ── PAGE 2 — Insulin Stacking Report ──────────────────────────── */
    doc.addPage();
    drawHeader(doc, input.reportDate, "Insulin Stacking Report");
    drawColourLegend(doc);

    // Dose heatmap rows
    const hmTop = 130;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Dose Heatmap", 40, hmTop);

    const basalEvents = input.insulinEvents.filter((e) => {
      const p = FORMULARY_MAP[e.insulin_type];
      return p && (p.type === "long" || p.type === "ultra_long" || p.type === "intermediate");
    });

    let hmy = hmTop + 18;
    for (const ev of basalEvents.slice(0, 5)) {
      const label = `${fmtTime(ev.event_time)} ${ev.insulin_type} ${ev.dose_units.toFixed(1)}U`;
      doc.fontSize(7).font("Helvetica").fillColor(NAVY).text(label, 40, hmy, { width: 120 });
      drawHeatmapBar(doc, ev, from, to, 165, hmy, 390, 14);
      hmy += 22;
    }

    // Combined Stacking Curve
    const cscTop = hmy + 16;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Combined Insulin Stacking Curve", 40, cscTop);
    drawStackingCurveBar(doc, curve, 40, cscTop + 14, 515, 80);

    // Basal Evaluation Gauge
    const gaugeTop = cscTop + 110;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Basal Evaluation Gauge", 40, gaugeTop);

    const gy = gaugeTop + 18;
    // Score bar
    const barWidth = 300;
    const fillWidth = (basalScore.total / 10) * barWidth;
    doc.roundedRect(40, gy, barWidth, 20, 4).fillColor("#e9ecef").fill();
    if (fillWidth > 0) {
      const scoreColour = basalScore.total >= 7.5 ? GREEN : basalScore.total >= 5 ? YELLOW : basalScore.total >= 2.5 ? ORANGE : RED;
      doc.roundedRect(40, gy, fillWidth, 20, 4).fillColor(scoreColour).fill();
    }
    doc.fontSize(11).font("Helvetica-Bold").fillColor(NAVY)
      .text(`${basalScore.total}/10`, 350, gy + 4);

    // Score components
    const compY = gy + 30;
    const components = [
      { label: "Coverage Uniformity", val: basalScore.coverage, max: 2.5 },
      { label: "Overlap Minimisation", val: basalScore.overlap, max: 2.5 },
      { label: "Timing Consistency", val: basalScore.timing, max: 2.5 },
      { label: "Tail Management", val: basalScore.tail, max: 2.5 },
    ];
    components.forEach((c, i) => {
      const cy = compY + i * 18;
      doc.fontSize(7).font("Helvetica").fillColor(GREY).text(c.label, 40, cy, { width: 120 });
      const cBarW = 160;
      const cFillW = (c.val / c.max) * cBarW;
      doc.roundedRect(165, cy, cBarW, 10, 2).fillColor("#e9ecef").fill();
      if (cFillW > 0) {
        const cCol = c.val >= c.max * 0.75 ? GREEN : c.val >= c.max * 0.5 ? YELLOW : ORANGE;
        doc.roundedRect(165, cy, cFillW, 10, 2).fillColor(cCol).fill();
      }
      doc.fontSize(7).font("Helvetica-Bold").fillColor(NAVY).text(`${c.val}/${c.max}`, 332, cy);
    });

    // Legend
    const legY = compY + 80;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(NAVY).text("Score Components", 40, legY);
    doc.fontSize(7).font("Helvetica").fillColor(GREY);
    doc.text("Coverage Uniformity \u2014 How evenly basal IOB covers the 24h period", 40, legY + 14, { width: 400 });
    doc.text("Overlap Minimisation \u2014 Fewer strong/overlap zones = higher score", 40, legY + 26, { width: 400 });
    doc.text("Timing Consistency \u2014 How evenly spaced basal doses are across the day", 40, legY + 38, { width: 400 });
    doc.text("Tail Management \u2014 Presence of continuous background insulin at period end", 40, legY + 50, { width: 400 });

    drawFooter(doc);
    doc.end();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DRAWING HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function drawHeader(doc: PDFKit.PDFDocument, date: string, title: string) {
  // Navy header bar
  doc.rect(0, 0, 595, 50).fillColor(NAVY).fill();
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#ffffff").text("GluMira\u2122", 40, 14);
  doc.fontSize(7).font("Helvetica").fillColor(TEAL).text(POWERED, 130, 18);
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff").text(title, 280, 16, { align: "right", width: 275 });

  // Report date
  doc.fontSize(8).font("Helvetica").fillColor(GREY).text(`Report date: ${date}`, 40, 58);
}

function drawColourLegend(doc: PDFKit.PDFDocument) {
  const y = 56;
  const items = [
    { label: "Light", colour: GREEN },
    { label: "Moderate", colour: YELLOW },
    { label: "Strong", colour: ORANGE },
    { label: "Overlap", colour: RED },
  ];
  let x = 350;
  for (const item of items) {
    doc.rect(x, y, 8, 8).fillColor(item.colour).fill();
    doc.fontSize(7).font("Helvetica").fillColor(GREY).text(item.label, x + 11, y, { width: 50 });
    x += 50;
  }
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = 800;
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#dee2e6").lineWidth(0.5).stroke();
  doc.fontSize(7).font("Helvetica").fillColor(GREY).text(FOOTER, 40, y + 6, { align: "center", width: 515 });
}

function drawStackingCurveBar(
  doc: PDFKit.PDFDocument,
  curve: StackingPoint[],
  x: number, y: number, width: number, height: number
) {
  if (curve.length === 0) return;
  const maxIOB = Math.max(...curve.map((p) => p.totalIOB), 0.01);
  const barW = width / curve.length;

  for (let i = 0; i < curve.length; i++) {
    const p = curve[i];
    const barH = (p.totalIOB / maxIOB) * height;
    doc.rect(x + i * barW, y + height - barH, barW, barH)
      .fillColor(pressureColour(p.pressure))
      .fill();
  }

  // Border
  doc.rect(x, y, width, height).strokeColor("#dee2e6").lineWidth(0.5).stroke();

  // Time labels
  const labelCount = 9; // 00:00, 03:00, ..., 24:00
  doc.fontSize(6).font("Helvetica").fillColor(GREY);
  for (let h = 0; h <= 24; h += 3) {
    const lx = x + (h / 24) * width;
    doc.text(`${String(h).padStart(2, "0")}:00`, lx - 10, y + height + 2, { width: 30, align: "center" });
  }
}

function drawHeatmapBar(
  doc: PDFKit.PDFDocument,
  event: InsulinEvent,
  dayStart: Date, dayEnd: Date,
  x: number, y: number, width: number, height: number
) {
  const profile = FORMULARY_MAP[event.insulin_type];
  if (!profile) return;

  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60_000;
  const slots = 96; // 15-min intervals
  const slotW = width / slots;

  for (let i = 0; i < slots; i++) {
    const slotTime = new Date(dayStart.getTime() + (i * totalMinutes / slots) * 60_000);
    const elapsed = (slotTime.getTime() - new Date(event.event_time).getTime()) / 60_000;
    const iob = getActiveIOB(event.dose_units, elapsed, profile);
    if (iob <= 0) continue;

    const intensity = Math.min(1, iob / (event.dose_units * 0.5));
    const colour = intensity > 0.75 ? RED : intensity > 0.5 ? ORANGE : intensity > 0.25 ? YELLOW : GREEN;
    doc.rect(x + i * slotW, y, slotW, height).fillColor(colour).fill();
  }

  doc.rect(x, y, width, height).strokeColor("#dee2e6").lineWidth(0.5).stroke();
}
