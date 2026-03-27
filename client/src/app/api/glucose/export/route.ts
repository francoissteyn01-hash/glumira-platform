/**
 * GluMira™ — /api/glucose/export
 *
 * GET /api/glucose/export
 * Query params:
 *   format  — "csv" | "json"  (default: "csv")
 *   unit    — "mmol" | "mgdl" (default: "mmol")
 *   days    — number of days to export (default: 14, max: 90)
 *   start   — ISO date string (YYYY-MM-DD, optional)
 *   end     — ISO date string (YYYY-MM-DD, optional)
 *
 * Returns the file as a download attachment.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  exportGlucoseData,
} from "@/server/analytics/glucose-export";
import type { ExportFormat, ExportUnit } from "@/server/analytics/glucose-export";
import type { GlucosePoint } from "@/server/analytics/glucose-trend";

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

// ─── GET ──────────────────────────────────────────────────────────────────────

const VALID_FORMATS: ExportFormat[] = ["csv", "json"];
const VALID_UNITS:   ExportUnit[]   = ["mmol", "mgdl"];
const MAX_DAYS = 90;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const format = (searchParams.get("format") ?? "csv") as ExportFormat;
  if (!VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `format must be one of: ${VALID_FORMATS.join(", ")}` },
      { status: 400 }
    );
  }

  const unit = (searchParams.get("unit") ?? "mmol") as ExportUnit;
  if (!VALID_UNITS.includes(unit)) {
    return NextResponse.json(
      { error: `unit must be one of: ${VALID_UNITS.join(", ")}` },
      { status: 400 }
    );
  }

  const daysParam = parseInt(searchParams.get("days") ?? "14", 10);
  const days = Math.min(isNaN(daysParam) ? 14 : daysParam, MAX_DAYS);

  const startDate = searchParams.get("start") ?? undefined;
  const endDate   = searchParams.get("end")   ?? undefined;

  // Build date range
  const since = startDate
    ? new Date(startDate + "T00:00:00.000Z").toISOString()
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", session.user.id)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
    glucose:   r.glucose_mmol,
    timestamp: r.recorded_at,
  }));

  const result = exportGlucoseData(readings, {
    format,
    unit,
    startDate,
    endDate,
    includeStats: true,
  });

  return new NextResponse(result.content, {
    status: 200,
    headers: {
      "Content-Type":        result.mimeType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "X-Row-Count":         String(result.rowCount),
    },
  });
}
