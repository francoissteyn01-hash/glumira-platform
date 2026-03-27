/**
 * GluMira™ Admin Feedback API Route
 * Version: 7.0.0
 *
 * GET /api/admin/feedback
 *
 * Returns all beta feedback submissions for the admin dashboard.
 * Access: admin role only.
 *
 * Query params:
 *  - limit: number (default 50)
 *  - offset: number (default 0)
 *  - category: string (optional filter)
 *  - minRating: number (optional filter)
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
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : null;

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
      .from("beta_feedback")
      .select("id, user_id, rating, category, comment, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (minRating !== null) query = query.gte("rating", minRating);

    const { data: feedback, error: dbError } = await query;
    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({
      feedback: (feedback ?? []).map((f) => ({
        id: f.id,
        userId: f.user_id,
        rating: f.rating,
        category: f.category,
        comment: f.comment,
        createdAt: f.created_at,
      })),
      total: feedback?.length ?? 0,
      offset,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
