/**
 * GluMira™ IOB Current API Route
 * Version: 7.0.0
 *
 * GET /api/iob/current
 *
 * Returns the current total IOB for the authenticated user,
 * computed from all doses logged in the last 8 hours.
 * Used by the dashboard badge and notification system.
 *
 * Response:
 *  {
 *    totalIob: number,        // mmol/L equivalent units
 *    riskTier: string,        // "low" | "moderate" | "high" | "critical"
 *    activeDoses: number,     // count of doses still contributing IOB
 *    narrative: string,       // plain-language stacking risk summary
 *    computedAt: string       // ISO timestamp
 *  }
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Biexponential IOB model (inline, no server import) ───────

interface InsulinProfile {
  alpha: number;
  beta: number;
  diaMin: number;
}

const PROFILES: Record<string, InsulinProfile> = {
  NovoRapid: { alpha: 0.0116, beta: 0.0173, diaMin: 240 },
  Humalog:   { alpha: 0.0116, beta: 0.0173, diaMin: 240 },
  Apidra:    { alpha: 0.0130, beta: 0.0190, diaMin: 210 },
  Fiasp:     { alpha: 0.0150, beta: 0.0210, diaMin: 180 },
  Tresiba:   { alpha: 0.0005, beta: 0.0008, diaMin: 2400 },
  Lantus:    { alpha: 0.0006, beta: 0.0009, diaMin: 1800 },
};

function currentIob(units: number, insulinType: string, administeredAt: string): number {
  const p = PROFILES[insulinType] ?? PROFILES.NovoRapid;
  const elapsed = (Date.now() - new Date(administeredAt).getTime()) / 60000;
  if (elapsed <= 0) return units;
  if (elapsed >= p.diaMin) return 0;
  const raw = units * (Math.exp(-p.alpha * elapsed) - Math.exp(-p.beta * elapsed));
  return Math.max(0, raw);
}

function riskTier(iob: number): "low" | "moderate" | "high" | "critical" {
  if (iob < 2)  return "low";
  if (iob < 5)  return "moderate";
  if (iob < 8)  return "high";
  return "critical";
}

function narrative(iob: number, tier: string, activeDoses: number): string {
  if (tier === "low") {
    return `Your IOB is ${iob.toFixed(2)}U — low stacking risk. Safe to correct if needed.`;
  }
  if (tier === "moderate") {
    return `Your IOB is ${iob.toFixed(2)}U from ${activeDoses} active dose(s). Moderate stacking risk — consider waiting before correcting.`;
  }
  if (tier === "high") {
    return `Your IOB is ${iob.toFixed(2)}U — high stacking risk. Do not correct without clinical guidance.`;
  }
  return `Your IOB is ${iob.toFixed(2)}U — critical stacking risk. Seek immediate clinical advice before any further dosing.`;
}

// ─── Route handler ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch doses from last 8 hours
    const since = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const { data: doses, error: dbError } = await supabase
      .from("doses")
      .select("id, insulin_type, units, administered_at")
      .eq("user_id", user.id)
      .gte("administered_at", since)
      .order("administered_at", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    // Compute IOB
    let totalIob = 0;
    let activeDoses = 0;

    for (const dose of doses ?? []) {
      const iob = currentIob(dose.units, dose.insulin_type, dose.administered_at);
      if (iob > 0.01) {
        totalIob += iob;
        activeDoses++;
      }
    }

    const tier = riskTier(totalIob);

    return NextResponse.json({
      totalIob: +totalIob.toFixed(3),
      riskTier: tier,
      activeDoses,
      narrative: narrative(totalIob, tier, activeDoses),
      computedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
