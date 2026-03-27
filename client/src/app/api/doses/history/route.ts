/**
 * GluMira™ — /api/doses/history
 *
 * Extended dose history endpoint with configurable time range.
 * Returns doses grouped by day for charting and review.
 *
 * GET /api/doses/history?days=7   — last 7 days (default)
 * GET /api/doses/history?days=14  — last 14 days
 * GET /api/doses/history?days=30  — last 30 days
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getDoses, getAllDoses } from "@/server/doses/dose-log";
import type { DoseRecord } from "@/server/doses/dose-log";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayGroup {
  date: string; // YYYY-MM-DD
  doses: DoseRecord[];
  totalUnits: number;
  bolusUnits: number;
  basalUnits: number;
  correctionUnits: number;
}

interface DoseHistoryResponse {
  ok: boolean;
  days: number;
  totalDoses: number;
  totalUnits: number;
  groups: DayGroup[];
}

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

// ─── Grouping helper ──────────────────────────────────────────────────────────

function groupByDay(doses: DoseRecord[]): DayGroup[] {
  const map = new Map<string, DoseRecord[]>();

  for (const dose of doses) {
    const date = new Date(dose.administeredAt).toISOString().slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(dose);
  }

  const groups: DayGroup[] = [];

  for (const [date, dayDoses] of map.entries()) {
    const totalUnits = dayDoses.reduce((s, d) => s + d.units, 0);
    const bolusUnits = dayDoses
      .filter((d) => d.doseType === "bolus")
      .reduce((s, d) => s + d.units, 0);
    const basalUnits = dayDoses
      .filter((d) => d.doseType === "basal")
      .reduce((s, d) => s + d.units, 0);
    const correctionUnits = dayDoses
      .filter((d) => d.doseType === "correction")
      .reduce((s, d) => s + d.units, 0);

    groups.push({ date, doses: dayDoses, totalUnits, bolusUnits, basalUnits, correctionUnits });
  }

  // Sort descending (most recent day first)
  return groups.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam ?? "7", 10) || 7, 1), 90);
  const hours = days * 24;

  const doses = getDoses(session.user.id, hours);
  const groups = groupByDay(doses);
  const totalUnits = doses.reduce((s, d) => s + d.units, 0);

  const response: DoseHistoryResponse = {
    ok: true,
    days,
    totalDoses: doses.length,
    totalUnits: parseFloat(totalUnits.toFixed(1)),
    groups,
  };

  return NextResponse.json(response);
}
