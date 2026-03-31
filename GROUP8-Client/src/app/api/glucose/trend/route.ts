/**
 * GluMira™ — GET /api/glucose/trend
 *
 * Returns glucose trend analytics for the authenticated patient.
 *
 * Query params:
 *   days  — 7 | 14 | 30 | 90  (default 14)
 *
 * Response: GlucoseTrend (see server/analytics/glucose-trend.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  computeTirBreakdown,
  classifyTir,
  computeGmi,
  computeCv,
  computeTrendDirection,
  detectPatterns,
  buildReportSummary,
} from "@/server/analytics/glucose-trend";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// ─── GET /api/glucose/trend ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { user, supabase } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysParam = url.searchParams.get("days") ?? "14";
  const days = [7, 14, 30, 90].includes(Number(daysParam))
    ? Number(daysParam)
    : 14;

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  // Fetch readings
  const { data: rows, error } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", user.id)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length < 3) {
    return NextResponse.json({
      days,
      readingCount: rows?.length ?? 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      cv: 0,
      gmi: 0,
      tirBreakdown: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
      tirClassification: "poor",
      trendDirection: "insufficient_data",
      trendSlope: 0,
      patternFlags: {
        morningHyperglycaemia: false,
        nocturnalHypoglycaemia: false,
        postMealSpikes: false,
        highVariability: false,
        frequentHypos: false,
      },
      reportSummary: "Insufficient data to generate a trend report.",
      generatedAt: new Date().toISOString(),
    });
  }

  const values = rows.map((r) => r.glucose_mmol as number);
  const timestamps = rows.map((r) => new Date(r.recorded_at as string).getTime());

  // Statistical calculations
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const cv = computeCv(mean, stdDev);
  const gmi = computeGmi(mean);
  const tirBreakdown = computeTirBreakdown(values);
  const tirClassification = classifyTir(tirBreakdown.inRange);
  const { direction: trendDirection, slope: trendSlope } = computeTrendDirection(
    values,
    timestamps
  );
  const patternFlags = detectPatterns(
    rows.map((r) => ({
      glucose: r.glucose_mmol as number,
      ts: new Date(r.recorded_at as string),
    }))
  );
  const reportSummary = buildReportSummary({
    days,
    readingCount: values.length,
    mean,
    gmi,
    cv,
    tirBreakdown,
    tirClassification,
    trendDirection,
    patternFlags,
  });

  return NextResponse.json({
    days,
    readingCount: values.length,
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv * 10) / 10,
    gmi: Math.round(gmi * 10) / 10,
    tirBreakdown,
    tirClassification,
    trendDirection,
    trendSlope: Math.round(trendSlope * 1000) / 1000,
    patternFlags,
    reportSummary,
    generatedAt: new Date().toISOString(),
  });
}
