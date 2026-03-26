/**
 * GluMira™ — /api/analytics/progress-report
 *
 * POST /api/analytics/progress-report
 * Body: { patientId: string; period: ReportPeriod }
 *
 * Returns a PatientProgressReport for clinician review.
 * Requires authenticated session. Clinicians can request any patient;
 * patients can only request their own report.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  generateProgressReport,
} from "@/server/analytics/patient-progress-report";
import type { ReportPeriod } from "@/server/analytics/patient-progress-report";
import type { GlucosePoint } from "@/server/analytics/glucose-trend";
import type { DoseRecord } from "@/server/doses/dose-log";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getSession() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

const VALID_PERIODS: ReportPeriod[] = ["7d", "14d", "30d", "90d"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { patientId?: string; period?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const period = (body.period ?? "14d") as ReportPeriod;
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `period must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  // Patients can only access their own reports
  const userRole = session.user.user_metadata?.role ?? "patient";
  if (userRole === "patient" && body.patientId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Determine date range
  const periodDays = { "7d": 7, "14d": 14, "30d": 30, "90d": 90 }[period];
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch glucose readings
  const { data: glucoseRows } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", body.patientId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  const readings: GlucosePoint[] = (glucoseRows ?? []).map((r) => ({
    glucose: r.glucose_mmol,
    timestamp: r.recorded_at,
  }));

  // Fetch dose records
  const { data: doseRows } = await supabase
    .from("insulin_doses")
    .select("id, user_id, insulin_type, dose_type, units, administered_at, notes, created_at")
    .eq("user_id", body.patientId)
    .gte("administered_at", since)
    .order("administered_at", { ascending: true });

  const doses: DoseRecord[] = (doseRows ?? []).map((d) => ({
    id: d.id,
    userId: d.user_id,
    insulinType: d.insulin_type,
    doseType: d.dose_type,
    units: d.units,
    administeredAt: d.administered_at,
    notes: d.notes,
    createdAt: d.created_at,
  }));

  // Fetch patient profile for name
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("first_name, last_name")
    .eq("user_id", body.patientId)
    .single();

  const patientName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : body.patientId;

  const clinicianName =
    session.user.user_metadata?.full_name ??
    session.user.email ??
    "Clinician";

  const report = generateProgressReport({
    patientId:     body.patientId,
    patientName,
    clinicianName,
    period,
    readings,
    doses,
  });

  return NextResponse.json(report);
}
