/**
 * GluMira™ Clinician Patient Detail API Route
 * Version: 7.0.0
 *
 * GET /api/clinician/patients/[id]
 *
 * Returns a full patient summary for a clinician:
 *  - Patient profile (name, type, regime, status)
 *  - 14-day TIR breakdown + GMI + CV
 *  - Current IOB + risk tier + avg doses + stacking events (7d)
 *  - Last reading + last 24h readings for sparkline
 *
 * Auth: Supabase JWT — clinician role required
 * Rate limit: 120 req/hr per clinician
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase admin client ────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─── Auth helper ──────────────────────────────────────────────

async function getClinicianUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Check clinician role
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("patient_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role !== "clinician" && profile.role !== "admin")) return null;
  return user;
}

// ─── TIR computation ──────────────────────────────────────────

function computeTir(readings: { value_mmol: number }[]) {
  if (readings.length === 0) {
    return { veryLowPct: 0, lowPct: 0, inRangePct: 0, highPct: 0, veryHighPct: 0, gmi: 0, cv: 0, readingCount: 0 };
  }
  const vals = readings.map((r) => r.value_mmol);
  const n = vals.length;
  const veryLow  = vals.filter((v) => v < 3.0).length;
  const low      = vals.filter((v) => v >= 3.0 && v < 3.9).length;
  const inRange  = vals.filter((v) => v >= 3.9 && v <= 10.0).length;
  const high     = vals.filter((v) => v > 10.0 && v <= 13.9).length;
  const veryHigh = vals.filter((v) => v > 13.9).length;

  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / n);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  // GMI = 3.31 + 0.02392 × mean_mg_dL  (mean_mg_dL = mean_mmol × 18.018)
  const meanMg = mean * 18.018;
  const gmi = 3.31 + 0.02392 * meanMg;

  return {
    veryLowPct:  (veryLow  / n) * 100,
    lowPct:      (low      / n) * 100,
    inRangePct:  (inRange  / n) * 100,
    highPct:     (high     / n) * 100,
    veryHighPct: (veryHigh / n) * 100,
    gmi,
    cv,
    readingCount: n,
  };
}

// ─── IOB risk tier ────────────────────────────────────────────

function iobRiskTier(iob: number): string {
  if (iob < 2)  return "safe";
  if (iob < 4)  return "caution";
  if (iob < 6)  return "warning";
  return "critical";
}

// ─── Rate limiter (in-memory, per-clinician) ──────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxPerHour = 120): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

// ─── GET handler ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(clinician.id)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const patientId = params.id;
  if (!patientId) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // ── Patient profile ────────────────────────────────────────

  const { data: profile, error: profileErr } = await admin
    .from("patient_profiles")
    .select("user_id, display_name, diabetes_type, insulin_type, regime_name, participant_id, status")
    .eq("user_id", patientId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // ── 14-day TIR ────────────────────────────────────────────

  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data: readings14d } = await admin
    .from("glucose_readings")
    .select("value_mmol")
    .eq("user_id", patientId)
    .gte("recorded_at", since14d);

  const tir = computeTir((readings14d ?? []) as { value_mmol: number }[]);

  // ── Last 24h readings for sparkline ───────────────────────

  const since24h = new Date(Date.now() - 86_400_000).toISOString();
  const { data: readings24h } = await admin
    .from("glucose_readings")
    .select("value_mmol, recorded_at")
    .eq("user_id", patientId)
    .gte("recorded_at", since24h)
    .order("recorded_at", { ascending: true })
    .limit(288);

  const recentReadings = (readings24h ?? []) as { value_mmol: number; recorded_at: string }[];
  const lastReading = recentReadings.length > 0
    ? { valueMmol: recentReadings[recentReadings.length - 1].value_mmol, recordedAt: recentReadings[recentReadings.length - 1].recorded_at }
    : null;

  // ── IOB summary ───────────────────────────────────────────

  const since8h = new Date(Date.now() - 8 * 3_600_000).toISOString();
  const { data: doses8h } = await admin
    .from("doses")
    .select("units, administered_at, insulin_type")
    .eq("user_id", patientId)
    .gte("administered_at", since8h)
    .order("administered_at", { ascending: true });

  // Simple biexponential IOB sum (NovoRapid default: alpha=0.0116, beta=0.0173)
  const now = Date.now();
  let currentIob = 0;
  for (const dose of (doses8h ?? []) as { units: number; administered_at: string }[]) {
    const ageMin = (now - new Date(dose.administered_at).getTime()) / 60_000;
    if (ageMin < 0 || ageMin > 480) continue;
    const raw = Math.exp(-0.0116 * ageMin) - Math.exp(-0.0173 * ageMin);
    const peak = Math.exp(-0.0116 * 60) - Math.exp(-0.0173 * 60);
    const iobFraction = peak > 0 ? Math.max(0, raw / peak) : 0;
    currentIob += dose.units * iobFraction;
  }

  // Avg daily doses (7d)
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: doses7d } = await admin
    .from("doses")
    .select("administered_at")
    .eq("user_id", patientId)
    .gte("administered_at", since7d);

  const avgDailyDoses = ((doses7d ?? []).length) / 7;

  // Stacking events: any 2 doses within 2h of each other in last 7d
  const doseTimes = ((doses7d ?? []) as { administered_at: string }[])
    .map((d) => new Date(d.administered_at).getTime())
    .sort((a, b) => a - b);

  let stackingEvents = 0;
  for (let i = 1; i < doseTimes.length; i++) {
    if (doseTimes[i] - doseTimes[i - 1] < 2 * 3_600_000) stackingEvents++;
  }

  const iob = {
    currentIob: Math.max(0, currentIob),
    riskTier: iobRiskTier(currentIob),
    avgDailyDoses,
    stackingEventsLast7d: stackingEvents,
  };

  // ── Response ──────────────────────────────────────────────

  return NextResponse.json({
    patient: {
      userId:        profile.user_id,
      displayName:   profile.display_name,
      diabetesType:  profile.diabetes_type,
      insulinType:   profile.insulin_type,
      regimeName:    profile.regime_name,
      participantId: profile.participant_id,
      status:        profile.status,
      tir,
      iob,
      lastReading,
      recentReadings: recentReadings.map((r) => ({
        valueMmol:  r.value_mmol,
        recordedAt: r.recorded_at,
      })),
    },
  });
}
