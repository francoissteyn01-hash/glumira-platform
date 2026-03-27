/**
 * GluMira™ — /api/analytics/summary
 *
 * Returns a 7-day and 14-day analytics summary for the authenticated user.
 * Used by the patient dashboard analytics widget.
 *
 * GET /api/analytics/summary
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { computeAnalyticsSummary } from "@/server/analytics/analytics-summary";
import type { GlucosePoint } from "@/server/analytics/glucose-trend";

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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    }
  );

  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: rows, error } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", session.user.id)
    .gte("recorded_at", fourteenDaysAgo)
    .order("recorded_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
    glucose: r.glucose_mmol as number,
    timestamp: r.recorded_at as string,
  }));

  const summary = computeAnalyticsSummary(readings);

  return NextResponse.json({ ok: true, summary });
}
