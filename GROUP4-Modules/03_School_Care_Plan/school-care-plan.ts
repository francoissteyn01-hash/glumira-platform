/**
 * GluMira™ School Care Plan Generator
 * Version: 7.0.0
 * Module: MOD-SCHOOL
 *
 * Generates a printable HTML school care plan for children with diabetes.
 * Includes:
 *   - Patient summary (diabetes type, insulin, targets)
 *   - Active meal regime with hypo thresholds
 *   - Hypo treatment protocol (3-step rule)
 *   - Hyperglycaemia protocol
 *   - Emergency contacts
 *   - Teacher/staff education section
 *   - All 20 meal regime thresholds supported
 *
 * Output: HTML string — browser print-to-PDF via window.print()
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. It is not a
 * medical device and does not provide medical advice or dosing
 * recommendations. Always consult your registered diabetes care team.
 *
 * Powered by IOB Hunter™
 */

import { getMealRegime, type MealRegime } from "./meal-regimes";

// ─── Types ────────────────────────────────────────────────────

export interface SchoolCarePlanInput {
  // Patient
  patientFirstName: string;
  patientLastName: string;
  dateOfBirth: string;           // ISO date string
  diabetesType: "type1" | "type2" | "gestational" | "other";
  schoolName: string;
  teacherName?: string;
  grade?: string;
  academicYear?: string;

  // Insulin
  insulinType: string;           // e.g. "Rapid-acting (NovoRapid)"
  insulinConcentration: "U-100" | "U-200" | "U-500";
  diaHours: number;              // Duration of insulin action
  deliveryMethod: "pen" | "pump" | "syringe";

  // Glucose targets (mg/dL)
  targetGlucoseMin: number;
  targetGlucoseMax: number;
  hypoThresholdMgdl: number;     // e.g. 70
  hyperThresholdMgdl: number;    // e.g. 250

  // Meal regime
  mealRegimeId: string;          // references MEAL_REGIMES id
  customHypoThresholdMgdl?: number; // clinician override

  // Emergency contacts
  emergencyContacts: EmergencyContact[];

  // Clinician
  clinicianName: string;
  clinicianPhone: string;
  clinicianEmail?: string;
  clinicianSignature?: string;   // name as signature
  planDate: string;              // ISO date string
  reviewDate: string;            // ISO date string

  // Optional overrides
  customHypoProtocol?: string;   // replaces default 3-step rule
  customHyperProtocol?: string;  // replaces default protocol
  additionalNotes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  altPhone?: string;
}

export interface SchoolCarePlanResult {
  html: string;
  patientName: string;
  generatedAt: string;
  regimeName: string;
  hypoThresholdMgdl: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function mgdlToMmol(mgdl: number): string {
  return (mgdl / 18.018).toFixed(1);
}

function diabetesTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    type1: "Type 1 Diabetes",
    type2: "Type 2 Diabetes",
    gestational: "Gestational Diabetes",
    other: "Diabetes (Other)",
  };
  return labels[type] ?? type;
}

function deliveryMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    pen: "Insulin Pen",
    pump: "Insulin Pump (CSII)",
    syringe: "Insulin Syringe",
  };
  return labels[method] ?? method;
}

// ─── HTML Sections ────────────────────────────────────────────

function renderHeader(input: SchoolCarePlanInput): string {
  const patientName = `${input.patientFirstName} ${input.patientLastName}`;
  return `
  <div class="header">
    <div class="logo-row">
      <div class="brand">GluMira™</div>
      <div class="brand-sub">Powered by IOB Hunter™</div>
    </div>
    <h1>Diabetes School Care Plan</h1>
    <div class="header-meta">
      <span><strong>Patient:</strong> ${patientName}</span>
      <span><strong>School:</strong> ${input.schoolName}</span>
      <span><strong>Academic Year:</strong> ${input.academicYear ?? "—"}</span>
      <span><strong>Plan Date:</strong> ${formatDate(input.planDate)}</span>
      <span><strong>Review Date:</strong> ${formatDate(input.reviewDate)}</span>
    </div>
    <div class="disclaimer">
      ⚠️ GluMira™ is an educational platform. The science of insulin, made visible. This plan is an educational reference only.
      Always follow the guidance of the child's registered diabetes care team.
    </div>
  </div>`;
}

function renderPatientSummary(input: SchoolCarePlanInput): string {
  return `
  <section class="section">
    <h2>1. Patient Summary</h2>
    <table class="info-table">
      <tr>
        <th>Full Name</th>
        <td>${input.patientFirstName} ${input.patientLastName}</td>
        <th>Date of Birth</th>
        <td>${formatDate(input.dateOfBirth)}</td>
      </tr>
      <tr>
        <th>Diagnosis</th>
        <td>${diabetesTypeLabel(input.diabetesType)}</td>
        <th>Grade / Class</th>
        <td>${input.grade ?? "—"}</td>
      </tr>
      <tr>
        <th>Teacher</th>
        <td>${input.teacherName ?? "—"}</td>
        <th>School</th>
        <td>${input.schoolName}</td>
      </tr>
    </table>
  </section>`;
}

function renderInsulinSummary(input: SchoolCarePlanInput): string {
  return `
  <section class="section">
    <h2>2. Insulin &amp; Glucose Targets</h2>
    <table class="info-table">
      <tr>
        <th>Insulin Type</th>
        <td>${input.insulinType}</td>
        <th>Concentration</th>
        <td>${input.insulinConcentration}</td>
      </tr>
      <tr>
        <th>Delivery Method</th>
        <td>${deliveryMethodLabel(input.deliveryMethod)}</td>
        <th>Duration of Action</th>
        <td>${input.diaHours} hours</td>
      </tr>
      <tr>
        <th>Target Glucose Range</th>
        <td colspan="3">
          <strong>${input.targetGlucoseMin}–${input.targetGlucoseMax} mg/dL</strong>
          (${mgdlToMmol(input.targetGlucoseMin)}–${mgdlToMmol(input.targetGlucoseMax)} mmol/L)
        </td>
      </tr>
    </table>
  </section>`;
}

function renderMealRegime(input: SchoolCarePlanInput, regime: MealRegime | undefined): string {
  const hypoMgdl = input.customHypoThresholdMgdl ?? input.hypoThresholdMgdl;
  const hypoMmol = mgdlToMmol(hypoMgdl);
  const regimeName = regime?.name ?? input.mealRegimeId;

  const mealRows = regime?.meals.map(m => `
    <tr>
      <td>${m.name}</td>
      <td>${m.timeWindow.start}–${m.timeWindow.end}</td>
      <td>${m.carbRange.min}–${m.carbRange.max}g</td>
      <td>${m.insulinTiming}${m.preBolusMinutes ? ` (${m.preBolusMinutes} min pre-bolus)` : ""}</td>
      <td>${m.notes ?? "—"}</td>
    </tr>`).join("") ?? "";

  return `
  <section class="section">
    <h2>3. Meal Regime: ${regimeName}</h2>
    <div class="threshold-banner">
      Hypo Alert Threshold: <strong>${hypoMgdl} mg/dL (${hypoMmol} mmol/L)</strong>
      &nbsp;|&nbsp; Hyper Alert Threshold: <strong>${input.hyperThresholdMgdl} mg/dL (${mgdlToMmol(input.hyperThresholdMgdl)} mmol/L)</strong>
    </div>
    ${regime?.culturalNotes ? `<p class="cultural-note">📌 ${regime.culturalNotes}</p>` : ""}
    ${regime?.fasting ? `<p class="fasting-note">🕌 Fasting regime: ${regime.fasting.type} — ${regime.fasting.fastingHours}h fast</p>` : ""}
    <table class="meal-table">
      <thead>
        <tr>
          <th>Meal</th>
          <th>Time Window</th>
          <th>Carb Range</th>
          <th>Insulin Timing</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${mealRows}
      </tbody>
    </table>
  </section>`;
}

function renderHypoProtocol(input: SchoolCarePlanInput): string {
  const hypoMgdl = input.customHypoThresholdMgdl ?? input.hypoThresholdMgdl;
  const hypoMmol = mgdlToMmol(hypoMgdl);

  if (input.customHypoProtocol) {
    return `
    <section class="section alert-section">
      <h2>4. Hypoglycaemia Protocol (Low Blood Sugar)</h2>
      <div class="alert-box hypo">
        <p>${input.customHypoProtocol}</p>
      </div>
    </section>`;
  }

  return `
  <section class="section alert-section">
    <h2>4. Hypoglycaemia Protocol (Low Blood Sugar)</h2>
    <div class="alert-box hypo">
      <p><strong>Trigger:</strong> Blood glucose below <strong>${hypoMgdl} mg/dL (${hypoMmol} mmol/L)</strong></p>
      <h3>The 15-15 Rule — 3 Steps</h3>
      <ol>
        <li>
          <strong>Step 1 — Treat immediately:</strong>
          Give <strong>15g of fast-acting carbohydrates</strong> (e.g. 150ml fruit juice, 3–4 glucose tablets,
          or 1 tube of glucose gel). Do NOT give food with fat or protein — these slow absorption.
        </li>
        <li>
          <strong>Step 2 — Wait 15 minutes:</strong>
          Keep the child seated and calm. Recheck blood glucose after 15 minutes.
        </li>
        <li>
          <strong>Step 3 — Reassess:</strong>
          If glucose is still below ${hypoMgdl} mg/dL, repeat Step 1.
          If glucose has risen above ${hypoMgdl} mg/dL and the child feels better,
          give a small snack (e.g. crackers with peanut butter) if the next meal is more than 1 hour away.
        </li>
      </ol>
      <p class="emergency-trigger">
        🚨 <strong>Call emergency contacts immediately if:</strong>
        the child loses consciousness, has a seizure, cannot swallow, or does not recover within 20 minutes.
        Do NOT leave the child alone. Call emergency services (ambulance) if contacts are unreachable.
      </p>
    </div>
  </section>`;
}

function renderHyperProtocol(input: SchoolCarePlanInput): string {
  const hyperMgdl = input.hyperThresholdMgdl;
  const hyperMmol = mgdlToMmol(hyperMgdl);

  if (input.customHyperProtocol) {
    return `
    <section class="section alert-section">
      <h2>5. Hyperglycaemia Protocol (High Blood Sugar)</h2>
      <div class="alert-box hyper">
        <p>${input.customHyperProtocol}</p>
      </div>
    </section>`;
  }

  return `
  <section class="section alert-section">
    <h2>5. Hyperglycaemia Protocol (High Blood Sugar)</h2>
    <div class="alert-box hyper">
      <p><strong>Trigger:</strong> Blood glucose above <strong>${hyperMgdl} mg/dL (${hyperMmol} mmol/L)</strong></p>
      <ol>
        <li>
          <strong>Allow bathroom access:</strong>
          High blood sugar causes frequent urination. Allow the child to use the bathroom without restriction.
        </li>
        <li>
          <strong>Encourage water:</strong>
          Offer water to prevent dehydration. Avoid sugary drinks.
        </li>
        <li>
          <strong>Notify parents/guardian:</strong>
          Contact emergency contacts if glucose exceeds <strong>${hyperMgdl + 50} mg/dL</strong>
          or if the child feels unwell, vomits, or complains of stomach pain.
        </li>
        <li>
          <strong>Watch for DKA signs:</strong>
          Fruity breath, deep/rapid breathing, confusion, or vomiting require immediate emergency services.
          Call 112/911 and notify parents simultaneously.
        </li>
      </ol>
    </div>
  </section>`;
}

function renderEmergencyContacts(input: SchoolCarePlanInput): string {
  const rows = input.emergencyContacts.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.name}</td>
      <td>${c.relationship}</td>
      <td>${c.phone}</td>
      <td>${c.altPhone ?? "—"}</td>
    </tr>`).join("");

  return `
  <section class="section">
    <h2>6. Emergency Contacts</h2>
    <table class="info-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Relationship</th>
          <th>Primary Phone</th>
          <th>Alternate Phone</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="clinician-box">
      <p><strong>Diabetes Care Team:</strong> ${input.clinicianName}</p>
      <p><strong>Clinic Phone:</strong> ${input.clinicianPhone}</p>
      ${input.clinicianEmail ? `<p><strong>Clinic Email:</strong> ${input.clinicianEmail}</p>` : ""}
    </div>
  </section>`;
}

function renderTeacherEducation(input: SchoolCarePlanInput): string {
  const hypoMgdl = input.customHypoThresholdMgdl ?? input.hypoThresholdMgdl;
  return `
  <section class="section">
    <h2>7. Teacher &amp; Staff Education</h2>
    <div class="education-grid">
      <div class="edu-card">
        <h3>🩸 Blood Glucose Monitoring</h3>
        <p>
          ${input.patientFirstName} may need to check their blood glucose during school hours using a
          glucose meter or continuous glucose monitor (CGM). This is a medical necessity and should be
          permitted at any time, including during class. The child should never be asked to leave the
          classroom to check glucose unless they choose to.
        </p>
      </div>
      <div class="edu-card">
        <h3>💉 Insulin Administration</h3>
        <p>
          ${input.patientFirstName} uses a <strong>${deliveryMethodLabel(input.deliveryMethod)}</strong>.
          ${input.deliveryMethod === "pump"
            ? "The insulin pump must remain connected at all times, including during physical education. Do not disconnect or adjust the pump."
            : "Insulin may need to be administered before meals. This is a medical necessity and must be permitted in a private, dignified setting."}
        </p>
      </div>
      <div class="edu-card">
        <h3>🍽️ Meals &amp; Snacks</h3>
        <p>
          ${input.patientFirstName} follows the <strong>${input.mealRegimeId}</strong> meal pattern.
          Meals and snacks must not be withheld as punishment. The child may need to eat at specific
          times to manage blood glucose. Always allow access to snacks if the child reports feeling low.
        </p>
      </div>
      <div class="edu-card">
        <h3>🏃 Physical Education</h3>
        <p>
          Exercise can lower blood glucose. Before PE or sports, check that glucose is above
          <strong>${hypoMgdl + 20} mg/dL (${mgdlToMmol(hypoMgdl + 20)} mmol/L)</strong>.
          Have fast-acting carbohydrates available on the sports field. If glucose drops during
          activity, stop immediately and treat as per the hypo protocol above.
        </p>
      </div>
      <div class="edu-card">
        <h3>😰 Recognising Low Blood Sugar</h3>
        <p>
          Signs of hypoglycaemia include: shakiness, sweating, pallor, confusion, irritability,
          difficulty concentrating, headache, or unusual behaviour. If you notice these signs,
          check blood glucose immediately and follow the hypo protocol. Do not dismiss these
          symptoms as misbehaviour.
        </p>
      </div>
      <div class="edu-card">
        <h3>📋 Confidentiality</h3>
        <p>
          ${input.patientFirstName}'s medical condition is private. Share information only with
          staff who directly supervise the child. Do not disclose the diagnosis to other students
          or parents without written consent from the family.
        </p>
      </div>
    </div>
  </section>`;
}

function renderSignature(input: SchoolCarePlanInput): string {
  return `
  <section class="section signature-section">
    <h2>8. Authorisation &amp; Signatures</h2>
    <div class="sig-grid">
      <div class="sig-box">
        <p><strong>Clinician / Diabetes Educator</strong></p>
        <div class="sig-line">${input.clinicianSignature ?? ""}</div>
        <p class="sig-label">${input.clinicianName}</p>
        <p class="sig-label">Date: ${formatDate(input.planDate)}</p>
      </div>
      <div class="sig-box">
        <p><strong>Parent / Guardian</strong></p>
        <div class="sig-line"></div>
        <p class="sig-label">Name: ___________________________</p>
        <p class="sig-label">Date: ___________________________</p>
      </div>
      <div class="sig-box">
        <p><strong>School Principal / Coordinator</strong></p>
        <div class="sig-line"></div>
        <p class="sig-label">Name: ___________________________</p>
        <p class="sig-label">Date: ___________________________</p>
      </div>
    </div>
    ${input.additionalNotes ? `<div class="additional-notes"><strong>Additional Notes:</strong><p>${input.additionalNotes}</p></div>` : ""}
  </section>`;
}

function renderFooter(): string {
  return `
  <footer class="footer">
    <p>Generated by <strong>GluMira™</strong> — Powered by IOB Hunter™ — v7.0.0</p>
    <p>This document is an educational reference only. It is not a medical device or dosing tool.
       Always follow the guidance of the child's registered diabetes care team.</p>
    <p>© 2026 GluMira™. All rights reserved. info@glumira.ai</p>
  </footer>`;
}

// ─── CSS ──────────────────────────────────────────────────────

const CARE_PLAN_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #1a1a2e;
    background: #fff;
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
  }
  .header {
    border-bottom: 3px solid #1A6DB5;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .logo-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  }
  .brand {
    font-size: 22px;
    font-weight: 800;
    color: #1A6DB5;
    letter-spacing: -0.5px;
  }
  .brand-sub {
    font-size: 11px;
    color: #666;
  }
  h1 {
    font-size: 20px;
    color: #1A6DB5;
    margin-bottom: 10px;
  }
  .header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 11px;
    margin-bottom: 8px;
  }
  .disclaimer {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 11px;
    color: #856404;
  }
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  h2 {
    font-size: 14px;
    color: #1A6DB5;
    border-bottom: 1px solid #e0e7ef;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  h3 {
    font-size: 12px;
    margin-bottom: 6px;
    color: #1a1a2e;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .info-table th, .info-table td {
    border: 1px solid #d0dae8;
    padding: 6px 8px;
    text-align: left;
  }
  .info-table th {
    background: #eaf1fb;
    font-weight: 600;
    width: 18%;
  }
  .meal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-top: 8px;
  }
  .meal-table th, .meal-table td {
    border: 1px solid #d0dae8;
    padding: 5px 7px;
    text-align: left;
  }
  .meal-table thead th {
    background: #eaf1fb;
    font-weight: 600;
  }
  .threshold-banner {
    background: #e8f4fd;
    border: 1px solid #1A6DB5;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    margin-bottom: 8px;
    color: #0d3b6e;
  }
  .cultural-note, .fasting-note {
    font-size: 11px;
    color: #555;
    margin-bottom: 6px;
    font-style: italic;
  }
  .alert-section .alert-box {
    border-radius: 6px;
    padding: 12px 16px;
  }
  .alert-box.hypo {
    background: #fff0f0;
    border: 2px solid #dc3545;
  }
  .alert-box.hyper {
    background: #fff8e1;
    border: 2px solid #f5a623;
  }
  .alert-box ol {
    padding-left: 20px;
    margin-top: 8px;
  }
  .alert-box ol li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .emergency-trigger {
    margin-top: 10px;
    background: #dc3545;
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 11px;
  }
  .clinician-box {
    background: #f0f7ff;
    border: 1px solid #b8d4f0;
    border-radius: 4px;
    padding: 10px 14px;
    margin-top: 10px;
    font-size: 11px;
  }
  .clinician-box p { margin-bottom: 4px; }
  .education-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .edu-card {
    background: #f8fafd;
    border: 1px solid #d0dae8;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .edu-card h3 {
    font-size: 11px;
    color: #1A6DB5;
    margin-bottom: 5px;
  }
  .edu-card p {
    font-size: 11px;
    line-height: 1.5;
    color: #333;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-top: 10px;
  }
  .sig-box {
    border: 1px solid #d0dae8;
    border-radius: 4px;
    padding: 12px;
  }
  .sig-box p { margin-bottom: 6px; font-size: 11px; }
  .sig-line {
    border-bottom: 1px solid #1A6DB5;
    height: 32px;
    margin: 8px 0;
    font-size: 13px;
    color: #1A6DB5;
    display: flex;
    align-items: flex-end;
    padding-bottom: 2px;
  }
  .sig-label { font-size: 10px; color: #555; }
  .additional-notes {
    margin-top: 12px;
    background: #f8fafd;
    border: 1px solid #d0dae8;
    border-radius: 4px;
    padding: 10px 14px;
    font-size: 11px;
  }
  .footer {
    margin-top: 24px;
    border-top: 1px solid #d0dae8;
    padding-top: 10px;
    font-size: 10px;
    color: #888;
    text-align: center;
  }
  .footer p { margin-bottom: 3px; }
  @media print {
    body { padding: 10px; }
    .section { page-break-inside: avoid; }
    .alert-section { page-break-inside: avoid; }
    .education-grid { page-break-inside: avoid; }
  }
`;

// ─── Main Generator ───────────────────────────────────────────

/**
 * Generate a complete school care plan HTML document.
 *
 * @param input - Patient, insulin, regime, and contact data
 * @returns SchoolCarePlanResult with full HTML string ready for browser print
 */
export function generateSchoolCarePlan(input: SchoolCarePlanInput): SchoolCarePlanResult {
  // Validate required fields
  if (!input.patientFirstName || !input.patientLastName) {
    throw new Error("INVALID_INPUT: Patient name is required");
  }
  if (!input.emergencyContacts || input.emergencyContacts.length === 0) {
    throw new Error("INVALID_INPUT: At least one emergency contact is required");
  }
  if (!input.clinicianName || !input.clinicianPhone) {
    throw new Error("INVALID_INPUT: Clinician name and phone are required");
  }
  if (input.hypoThresholdMgdl >= input.hyperThresholdMgdl) {
    throw new Error("INVALID_INPUT: Hypo threshold must be less than hyper threshold");
  }

  // Resolve meal regime
  const regime = getMealRegime(input.mealRegimeId);

  // Effective hypo threshold — clinician override takes precedence
  const effectiveHypoMgdl = input.customHypoThresholdMgdl ?? input.hypoThresholdMgdl;

  const patientName = `${input.patientFirstName} ${input.patientLastName}`;
  const generatedAt = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GluMira™ School Care Plan — ${patientName}</title>
  <style>${CARE_PLAN_CSS}</style>
</head>
<body>
  ${renderHeader(input)}
  ${renderPatientSummary(input)}
  ${renderInsulinSummary(input)}
  ${renderMealRegime(input, regime)}
  ${renderHypoProtocol(input)}
  ${renderHyperProtocol(input)}
  ${renderEmergencyContacts(input)}
  ${renderTeacherEducation(input)}
  ${renderSignature(input)}
  ${renderFooter()}
</body>
</html>`;

  return {
    html,
    patientName,
    generatedAt,
    regimeName: regime?.name ?? input.mealRegimeId,
    hypoThresholdMgdl: effectiveHypoMgdl,
  };
}

/**
 * Validate school care plan input without generating HTML.
 * Returns a list of validation errors (empty = valid).
 */
export function validateSchoolCarePlanInput(input: Partial<SchoolCarePlanInput>): string[] {
  const errors: string[] = [];
  if (!input.patientFirstName) errors.push("patientFirstName is required");
  if (!input.patientLastName) errors.push("patientLastName is required");
  if (!input.dateOfBirth) errors.push("dateOfBirth is required");
  if (!input.diabetesType) errors.push("diabetesType is required");
  if (!input.schoolName) errors.push("schoolName is required");
  if (!input.insulinType) errors.push("insulinType is required");
  if (!input.insulinConcentration) errors.push("insulinConcentration is required");
  if (!input.deliveryMethod) errors.push("deliveryMethod is required");
  if (!input.mealRegimeId) errors.push("mealRegimeId is required");
  if (!input.clinicianName) errors.push("clinicianName is required");
  if (!input.clinicianPhone) errors.push("clinicianPhone is required");
  if (!input.planDate) errors.push("planDate is required");
  if (!input.reviewDate) errors.push("reviewDate is required");
  if (!input.emergencyContacts || input.emergencyContacts.length === 0) {
    errors.push("At least one emergency contact is required");
  }
  if (
    input.hypoThresholdMgdl !== undefined &&
    input.hyperThresholdMgdl !== undefined &&
    input.hypoThresholdMgdl >= input.hyperThresholdMgdl
  ) {
    errors.push("hypoThresholdMgdl must be less than hyperThresholdMgdl");
  }
  return errors;
}
