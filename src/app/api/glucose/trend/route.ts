/**
 * GluMira™ — /api/glucose/trend
 *
 * Returns a 14-day glucose trend report for the authenticated user.
 * Computes TIR, GMI, CV, trend direction, and pattern detection.
 *
 * GET /api/glucose/trend?days=14
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeTrendReport } from "@/server/analytics/glucose-trend";
import type { GlucosePoint } from "@/server/analytics/glucose-trend";
import { rateLimit } from "@/lib/rate-limiter";
import { auditLog } from "@/lib/audit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Query params ──────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 14, 1), 90) : 14;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // ── Fetch glucose readings ────────────────────────────────────────────────
  const { data: rows, error: dbError } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", user.id)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
    glucose: r.glucose_mmol as number,
    timestamp: r.recorded_at as string,
  }));

  // ── Compute trend report ──────────────────────────────────────────────────
  const report = computeTrendReport(readings);

  await auditLog({
    userId: user.id,
    action: "glucose_trend_viewed",
    metadata: { days, count: report.count },
  });

  return NextResponse.json({
    ok: true,
    days,
    report,
  });
}
