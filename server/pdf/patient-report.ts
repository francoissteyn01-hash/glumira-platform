/**
 * GluMira™ Patient Report PDF Generator
 * Version: 7.0.0
 *
 * Generates a structured clinical summary PDF for a patient, including:
 *  - Patient profile header
 *  - Time-in-Range (TIR) summary with ADA targets
 *  - Insulin-on-Board (IOB) 7-day overview
 *  - Active meal regime with thresholds
 *  - Clinician notes (last 5)
 *  - Disclaimer footer
 *
 * Uses Puppeteer for server-side PDF rendering.
 * HTML generation functions are pure and fully testable without Puppeteer.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────

export interface PatientReportData {
  patient: {
    id: string;
    displayName: string;
    diabetesType: "T1D" | "T2D" | "LADA" | "Other";
    insulinType: string;
    regimeName: string;
    dob?: string;
  };
  tir: {
    veryLowPct: number;    // < 3.0 mmol/L
    lowPct: number;        // 3.0–3.9
    inRangePct: number;    // 3.9–10.0
    highPct: number;       // 10.0–13.9
    veryHighPct: number;   // ≥ 14.0
    gmi: number;           // Glucose Management Indicator
    cv: number;            // Coefficient of Variation %
    readingCount: number;
    periodDays: number;
  };
  iob: {
    avgDailyDoses: number;
    avgDailyUnits: number;
    peakIobLast7d: number;
    stackingEventsLast7d: number;
  };
  regime: {
    name: string;
    carbLimitG: number;
    targetPreMeal: number;
    targetPostMeal: number;
    icrRatio: string;
  };
  notes: Array<{
    category: string;
    body: string;
    createdAt: string;
    followUpDate: string | null;
  }>;
  generatedAt: string;
  clinicianName: string;
}

// ─── TIR colour helpers ───────────────────────────────────────

export function tirColour(pct: number, zone: "inRange" | "low" | "veryLow" | "high" | "veryHigh"): string {
  if (zone === "inRange") return pct >= 70 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
  if (zone === "low" || zone === "veryLow") return pct <= 4 ? "#16a34a" : "#dc2626";
  if (zone === "high") return pct <= 25 ? "#16a34a" : "#ca8a04";
  return pct <= 5 ? "#16a34a" : "#dc2626";
}

export function gmiLabel(gmi: number): string {
  if (gmi < 6.5) return "Excellent";
  if (gmi < 7.0) return "Good";
  if (gmi < 8.0) return "Moderate";
  return "Elevated";
}

export function cvLabel(cv: number): string {
  if (cv < 27) return "Stable";
  if (cv < 36) return "Variable";
  return "Highly Variable";
}

// ─── HTML generation (pure, testable) ────────────────────────

export function buildReportHtml(data: PatientReportData): string {
  const { patient, tir, iob, regime, notes, generatedAt, clinicianName } = data;

  const tirBar = (pct: number, colour: string) =>
    `<div style="display:inline-block;width:${Math.max(pct, 1)}%;height:20px;background:${colour};"></div>`;

  const noteRows = notes
    .slice(0, 5)
    .map(
      (n) => `
      <tr>
        <td style="padding:6px 8px;text-transform:capitalize;font-weight:600;">${n.category}</td>
        <td style="padding:6px 8px;">${n.body}</td>
        <td style="padding:6px 8px;white-space:nowrap;">${new Date(n.createdAt).toLocaleDateString()}</td>
        <td style="padding:6px 8px;">${n.followUpDate ? new Date(n.followUpDate).toLocaleDateString() : "—"}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GluMira™ Patient Report — ${patient.displayName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; padding: 32px; }
    h1 { font-size: 20px; color: #0f172a; }
    h2 { font-size: 14px; color: #0f172a; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 800; color: #0ea5e9; letter-spacing: -0.5px; }
    .logo span { color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; text-align: right; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .card-value { font-size: 22px; font-weight: 700; }
    .tir-bar { width: 100%; height: 20px; display: flex; border-radius: 4px; overflow: hidden; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-weight: 600; }
    td { border-top: 1px solid #e2e8f0; }
    .disclaimer { margin-top: 32px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Glu<span>Mira</span>™</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px;">The science of insulin, made visible</div>
      <h1 style="margin-top:12px;">Patient Clinical Summary</h1>
    </div>
    <div class="meta">
      <div>Generated: ${new Date(generatedAt).toLocaleString()}</div>
      <div>Clinician: ${clinicianName}</div>
      <div>Patient ID: ${patient.id}</div>
    </div>
  </div>

  <!-- Patient Profile -->
  <h2>Patient Profile</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Name</div>
      <div style="font-size:16px;font-weight:700;">${patient.displayName}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">${patient.diabetesType} · ${patient.insulinType}</div>
    </div>
    <div class="card">
      <div class="card-label">Active Regime</div>
      <div style="font-size:16px;font-weight:700;">${patient.regimeName}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">Carb limit: ${regime.carbLimitG}g · ICR: ${regime.icrRatio}</div>
    </div>
  </div>

  <!-- TIR Summary -->
  <h2>Time in Range — ${tir.periodDays}-Day Summary (${tir.readingCount} readings)</h2>
  <div class="tir-bar">
    ${tirBar(tir.veryLowPct, "#7f1d1d")}
    ${tirBar(tir.lowPct, "#ef4444")}
    ${tirBar(tir.inRangePct, "#16a34a")}
    ${tirBar(tir.highPct, "#f59e0b")}
    ${tirBar(tir.veryHighPct, "#b45309")}
  </div>
  <div class="grid-2" style="margin-top:8px;">
    <div class="card">
      <div class="card-label">Time in Range (3.9–10.0)</div>
      <div class="card-value" style="color:${tirColour(tir.inRangePct, "inRange")};">${tir.inRangePct.toFixed(1)}%</div>
      <div style="font-size:10px;color:#64748b;">ADA target ≥ 70%</div>
    </div>
    <div class="card">
      <div class="card-label">GMI</div>
      <div class="card-value">${tir.gmi.toFixed(1)}%</div>
      <div style="font-size:10px;color:#64748b;">${gmiLabel(tir.gmi)} · CV ${tir.cv.toFixed(1)}% (${cvLabel(tir.cv)})</div>
    </div>
    <div class="card">
      <div class="card-label">Low + Very Low</div>
      <div class="card-value" style="color:${tirColour(tir.lowPct + tir.veryLowPct, "low")};">${(tir.lowPct + tir.veryLowPct).toFixed(1)}%</div>
      <div style="font-size:10px;color:#64748b;">ADA target &lt; 4%</div>
    </div>
    <div class="card">
      <div class="card-label">High + Very High</div>
      <div class="card-value" style="color:${tirColour(tir.highPct + tir.veryHighPct, "high")};">${(tir.highPct + tir.veryHighPct).toFixed(1)}%</div>
      <div style="font-size:10px;color:#64748b;">ADA target &lt; 25%</div>
    </div>
  </div>

  <!-- IOB Overview -->
  <h2>Insulin-on-Board — 7-Day Overview</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Avg Daily Doses</div>
      <div class="card-value">${iob.avgDailyDoses.toFixed(1)}</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Daily Units</div>
      <div class="card-value">${iob.avgDailyUnits.toFixed(1)}u</div>
    </div>
    <div class="card">
      <div class="card-label">Peak IOB (7d)</div>
      <div class="card-value">${iob.peakIobLast7d.toFixed(2)}u</div>
    </div>
    <div class="card">
      <div class="card-label">Stacking Events</div>
      <div class="card-value" style="color:${iob.stackingEventsLast7d > 3 ? "#dc2626" : "#16a34a"};">${iob.stackingEventsLast7d}</div>
    </div>
  </div>

  <!-- Clinician Notes -->
  ${notes.length > 0 ? `
  <h2>Clinician Notes (Last ${Math.min(notes.length, 5)})</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Note</th>
        <th>Date</th>
        <th>Follow-up</th>
      </tr>
    </thead>
    <tbody>${noteRows}</tbody>
  </table>` : ""}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by GluMira™, an educational educational platform. It is not a medical device and does not constitute medical advice. All clinical decisions must be made by a qualified healthcare professional. GluMira™ is powered by IOB Hunter™. &copy; 2026 GluMira™. All rights reserved.
  </div>
</body>
</html>`;
}

// ─── Puppeteer PDF generation ─────────────────────────────────

export async function generatePatientReportPdf(data: PatientReportData): Promise<Buffer> {
  // Dynamic import to avoid breaking tests in environments without Puppeteer
  const puppeteer = await import("puppeteer").catch(() => null);
  if (!puppeteer) {
    throw new Error("Puppeteer not available — install with: pnpm add puppeteer");
  }

  const html = buildReportHtml(data);
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
