/**
 * GluMira™ Clinician Patients API Route
 * Version: 7.0.0
 *
 * GET /api/clinician/patients
 *
 * Returns a list of patient summaries for the clinician dashboard.
 * Access: clinician or admin role only.
 *
 * Each patient summary includes:
 *  - userId, displayName, participantId
 *  - diabetesType, regimeId
 *  - tirPercent (14-day TIR, computed from glucose_readings)
 *  - lastGlucose + lastGlucoseAt
 *  - activeIob (latest dose IOB sum)
 *  - status (from beta_participants)
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Auth guard ───────────────────────────────────────────────

async function requireClinician(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const role = profile?.role ?? "patient";
  return role === "clinician" || role === "admin" ? user : null;
}

// ─── TIR computation ──────────────────────────────────────────

function computeTir(readings: { value_mmol: number }[]): number | null {
  if (!readings || readings.length === 0) return null;
  const inRange = readings.filter((r) => r.value_mmol >= 3.9 && r.value_mmol <= 10.0).length;
  return Math.round((inRange / readings.length) * 100);
}

// ─── Route ────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const clinician = await requireClinician(supabase);
    if (!clinician) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all patient profiles
    const { data: profiles, error: profileErr } = await supabase
      .from("patient_profiles")
      .select("user_id, display_name, diabetes_type, regime_id, role")
      .eq("role", "patient");

    if (profileErr) throw new Error(profileErr.message);
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const since8h  = new Date(Date.now() - 8  * 60 * 60 * 1000).toISOString();

    // Fetch participant IDs
    const { data: participants } = await supabase
      .from("beta_participants")
      .select("user_id, participant_id, status");

    const participantMap = new Map(
      (participants ?? []).map((p) => [p.user_id, p])
    );

    // Build patient summaries in parallel
    const summaries = await Promise.all(
      profiles.map(async (profile) => {
        const uid = profile.user_id;

        // 14-day readings for TIR
        const { data: readings } = await supabase
          .from("glucose_readings")
          .select("value_mmol, recorded_at")
          .eq("user_id", uid)
          .gte("recorded_at", since14d)
          .order("recorded_at", { ascending: false });

        // Last reading
        const lastReading = readings?.[0] ?? null;

        // Active doses for IOB (last 8h)
        const { data: doses } = await supabase
          .from("doses")
          .select("units, insulin_type, administered_at")
          .eq("user_id", uid)
          .gte("administered_at", since8h);

        // Simple IOB estimate: sum remaining fractions
        let activeIob: number | null = null;
        if (doses && doses.length > 0) {
          const now = Date.now();
          activeIob = doses.reduce((sum, d) => {
            const ageMin = (now - new Date(d.administered_at).getTime()) / 60000;
            const diaMin = 240; // 4h default duration
            const frac = Math.max(0, 1 - ageMin / diaMin);
            return sum + d.units * frac;
          }, 0);
          activeIob = +activeIob.toFixed(2);
        }

        const participant = participantMap.get(uid);

        return {
          userId: uid,
          displayName: profile.display_name ?? "Patient",
          participantId: participant?.participant_id ?? uid.slice(0, 8),
          diabetesType: profile.diabetes_type ?? "T1D",
          regimeId: profile.regime_id ?? "standard",
          tirPercent: computeTir(readings ?? []),
          lastGlucose: lastReading ? +lastReading.value_mmol.toFixed(1) : null,
          lastGlucoseAt: lastReading?.recorded_at ?? null,
          activeIob,
          status: (participant?.status ?? "inactive") as "active" | "inactive" | "pending",
        };
      })
    );

    return NextResponse.json({ patients: summaries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
