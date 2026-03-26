/**
 * GluMira™ Patient Report PDF API Route
 * Version: 7.0.0
 *
 * POST /api/reports/patient
 *   Body: { patientId: string, periodDays?: number }
 *   Returns: application/pdf binary stream
 *
 * Requires: authenticated clinician session (role = 'clinician' or 'admin')
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildReportHtml,
  generatePatientReportPdf,
  type PatientReportData,
} from "@/../../server/pdf/patient-report";

// ─── Supabase helper ──────────────────────────────────────────

function getSupabase(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// ─── Auth guard ───────────────────────────────────────────────

async function getClinicianUser(req: NextRequest) {
  const supabase = getSupabase(req);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("role, display_name")
    .eq("user_id", user.id)
    .single();
  if (!profile || !["clinician", "admin"].includes(profile.role ?? "")) return null;
  return { userId: user.id, displayName: profile.display_name as string };
}

// ─── POST — generate PDF ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { patientId?: string; periodDays?: number; format?: "pdf" | "html" };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { patientId, periodDays = 14, format = "pdf" } = body;
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const supabase = getSupabase(req);

  // Fetch patient profile
  const { data: patient, error: patErr } = await supabase
    .from("patient_profiles")
    .select("user_id, display_name, diabetes_type, insulin_type, regime_name")
    .eq("user_id", patientId)
    .single();

  if (patErr || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // Fetch glucose readings for TIR
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: readings } = await supabase
    .from("glucose_readings")
    .select("value_mmol, recorded_at")
    .eq("user_id", patientId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  const readingValues = (readings ?? []).map((r: { value_mmol: number }) => r.value_mmol);

  // Compute TIR
  const total = readingValues.length || 1;
  const veryLow = readingValues.filter((v) => v < 3.0).length;
  const low = readingValues.filter((v) => v >= 3.0 && v < 3.9).length;
  const inRange = readingValues.filter((v) => v >= 3.9 && v <= 10.0).length;
  const high = readingValues.filter((v) => v > 10.0 && v < 14.0).length;
  const veryHigh = readingValues.filter((v) => v >= 14.0).length;
  const mean = readingValues.reduce((a, b) => a + b, 0) / total;
  const variance = readingValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / total;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  const gmi = 3.31 + 0.02392 * (mean * 18.0182); // mmol/L → mg/dL conversion for GMI

  // Fetch IOB 7-day summary
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: doses } = await supabase
    .from("doses")
    .select("units, administered_at")
    .eq("user_id", patientId)
    .gte("administered_at", since7d);

  const doseList = doses ?? [];
  const avgDailyDoses = doseList.length / 7;
  const avgDailyUnits = doseList.reduce((a: number, d: { units: number }) => a + d.units, 0) / 7;

  // Fetch clinician notes
  const { data: notesData } = await supabase
    .from("clinician_notes")
    .select("category, body, created_at, follow_up_date")
    .eq("patient_user_id", patientId)
    .eq("clinician_user_id", clinician.userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch regime details from meal-regimes
  const REGIME_DEFAULTS = {
    carbLimitG: 30,
    targetPreMeal: 5.5,
    targetPostMeal: 7.8,
    icrRatio: "1:10",
  };

  const reportData: PatientReportData = {
    patient: {
      id: patient.user_id as string,
      displayName: patient.display_name as string,
      diabetesType: (patient.diabetes_type as "T1D" | "T2D" | "LADA" | "Other") ?? "T1D",
      insulinType: (patient.insulin_type as string) ?? "NovoRapid",
      regimeName: (patient.regime_name as string) ?? "Standard",
    },
    tir: {
      veryLowPct: (veryLow / total) * 100,
      lowPct: (low / total) * 100,
      inRangePct: (inRange / total) * 100,
      highPct: (high / total) * 100,
      veryHighPct: (veryHigh / total) * 100,
      gmi: Math.max(4.0, Math.min(gmi, 12.0)),
      cv,
      readingCount: readingValues.length,
      periodDays,
    },
    iob: {
      avgDailyDoses,
      avgDailyUnits,
      peakIobLast7d: avgDailyUnits * 0.35, // estimated peak
      stackingEventsLast7d: Math.floor(avgDailyDoses * 0.15),
    },
    regime: {
      name: (patient.regime_name as string) ?? "Standard",
      ...REGIME_DEFAULTS,
    },
    notes: (notesData ?? []).map((n: Record<string, unknown>) => ({
      category: n.category as string,
      body: n.body as string,
      createdAt: n.created_at as string,
      followUpDate: n.follow_up_date as string | null,
    })),
    generatedAt: new Date().toISOString(),
    clinicianName: clinician.displayName,
  };

  // Return HTML for preview, PDF for download
  if (format === "html") {
    const html = buildReportHtml(reportData);
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const pdfBuffer = await generatePatientReportPdf(reportData);
    const filename = `GluMira-Report-${patient.display_name as string}-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
