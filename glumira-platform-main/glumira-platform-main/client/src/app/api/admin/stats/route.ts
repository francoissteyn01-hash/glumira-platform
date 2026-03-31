/**
 * GluMira™ Admin Stats API Route
 * Version: 7.0.0
 *
 * GET /api/admin/stats
 *
 * Returns platform-wide statistics for the admin dashboard.
 * Access: admin role only (enforced via Supabase RLS + role check).
 *
 * Response:
 *  {
 *    totalUsers: number,
 *    activeUsers7d: number,
 *    totalReadings: number,
 *    totalDoses: number,
 *    betaParticipants: number,
 *    feedbackCount: number,
 *    avgFeedbackRating: number
 *  }
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
  if (profile?.role !== "admin") return null;
  return user;
}

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

    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: activeUsers7d },
      { count: totalReadings },
      { count: totalDoses },
      { count: betaParticipants },
      { data: feedbackData },
    ] = await Promise.all([
      supabase.from("patient_profiles").select("*", { count: "exact", head: true }),
      supabase.from("patient_profiles").select("*", { count: "exact", head: true })
        .gte("updated_at", since7d),
      supabase.from("glucose_readings").select("*", { count: "exact", head: true }),
      supabase.from("doses").select("*", { count: "exact", head: true }),
      supabase.from("beta_participants").select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("beta_feedback").select("rating"),
    ]);

    const feedbackCount = feedbackData?.length ?? 0;
    const avgFeedbackRating = feedbackCount > 0
      ? feedbackData!.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbackCount
      : 0;

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activeUsers7d: activeUsers7d ?? 0,
      totalReadings: totalReadings ?? 0,
      totalDoses: totalDoses ?? 0,
      betaParticipants: betaParticipants ?? 0,
      feedbackCount,
      avgFeedbackRating: +avgFeedbackRating.toFixed(2),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
