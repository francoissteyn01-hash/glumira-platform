/**
 * GluMira™ Doses API Route
 * Version: 7.0.0
 * Routes:
 *   GET    /api/doses          — list doses + active IOB summary
 *   POST   /api/doses          — log a new dose
 *   DELETE /api/doses?id=xxx   — delete a dose
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  logDose,
  getDoses,
  deleteDose,
  computeActiveIob,
  InsulinType,
  DoseType,
} from "../../../../../server/doses/dose-log";

// ─── Validation ───────────────────────────────────────────────

const DoseSchema = z.object({
  insulinType: z.enum(["NovoRapid", "Humalog", "Apidra", "Fiasp", "Tresiba", "Lantus"]),
  doseType: z.enum(["bolus", "basal", "correction"]),
  units: z.number().min(0.1).max(100),
  administeredAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// ─── Auth helper ──────────────────────────────────────────────

async function getSession() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── GET /api/doses ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hours = parseInt(req.nextUrl.searchParams.get("hours") ?? "24");
  const doses = getDoses(session.user.id, hours);
  const iobSummary = computeActiveIob(session.user.id);

  return NextResponse.json({ doses, iobSummary }, { status: 200 });
}

// ─── POST /api/doses ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DoseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { insulinType, doseType, units, administeredAt, notes } = parsed.data;

  try {
    const dose = logDose(
      session.user.id,
      insulinType as InsulinType,
      doseType as DoseType,
      units,
      administeredAt,
      notes
    );
    const iobSummary = computeActiveIob(session.user.id);
    return NextResponse.json({ dose, iobSummary }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log dose" },
      { status: 400 }
    );
  }
}

// ─── DELETE /api/doses ────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doseId = req.nextUrl.searchParams.get("id");
  if (!doseId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ok = deleteDose(session.user.id, doseId);
  if (!ok) return NextResponse.json({ error: "Dose not found" }, { status: 404 });

  const iobSummary = computeActiveIob(session.user.id);
  return NextResponse.json({ success: true, iobSummary }, { status: 200 });
}
