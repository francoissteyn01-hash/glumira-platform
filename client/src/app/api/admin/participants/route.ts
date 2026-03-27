/**
 * GluMira™ Admin Participants API Route
 * Version: 7.0.0
 *
 * GET /api/admin/participants
 *
 * Returns all beta participants for the admin dashboard.
 * Access: admin role only.
 *
 * Query params:
 *  - status: "active" | "inactive" | "pending" (optional filter)
 *  - limit: number (default 100)
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function requireAdmin(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

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

    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("beta_participants")
      .select("id, participant_id, email, nightscout_url, status, joined_at, last_active_at")
      .order("joined_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data: participants, error: dbError } = await query;
    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({
      participants: (participants ?? []).map((p) => ({
        id: p.id,
        participantId: p.participant_id,
        email: p.email,
        nightscoutUrl: p.nightscout_url,
        status: p.status,
        joinedAt: p.joined_at,
        lastActiveAt: p.last_active_at,
      })),
      total: participants?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
