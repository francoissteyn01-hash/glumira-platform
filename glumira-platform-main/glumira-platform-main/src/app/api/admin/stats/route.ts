/**
 * GluMira™ — /api/admin/stats
 *
 * Admin-only endpoint returning aggregate platform statistics.
 * Used by the admin dashboard via useAdminStats hook.
 *
 * GET /api/admin/stats
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limiter";
import { auditLog } from "@/lib/audit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAdminUser(token: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  // ── Auth & role check ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUser = await getAdminUser(token);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // ── Parallel queries ──────────────────────────────────────────────────────
  const [
    profilesRes,
    readingsRes,
    readingsRecentRes,
    dosesRes,
    dosesRecentRes,
    notesRes,
    betaRes,
    feedbackRes,
  ] = await Promise.all([
    adminClient.from("profiles").select("role, is_active", { count: "exact" }),
    adminClient.from("glucose_readings").select("id", { count: "exact", head: true }),
    adminClient
      .from("glucose_readings")
      .select("id", { count: "exact", head: true })
      .gte("recorded_at", sevenDaysAgo),
    adminClient.from("doses").select("id", { count: "exact", head: true }),
    adminClient
      .from("doses")
      .select("id", { count: "exact", head: true })
      .gte("administered_at", sevenDaysAgo),
    adminClient.from("clinician_notes").select("id", { count: "exact", head: true }),
    adminClient.from("beta_participants").select("status", { count: "exact" }),
    adminClient.from("feedback").select("rating", { count: "exact" }),
  ]);

  // ── Aggregate profiles ────────────────────────────────────────────────────
  const profiles = profilesRes.data ?? [];
  const totalUsers = profilesRes.count ?? 0;
  const activeUsers = profiles.filter((p) => p.is_active !== false).length;
  const suspendedUsers = profiles.filter((p) => p.is_active === false).length;
  const patientCount = profiles.filter((p) => p.role === "patient").length;
  const clinicianCount = profiles.filter((p) => p.role === "clinician").length;
  const adminCount = profiles.filter((p) => p.role === "admin").length;

  // ── Beta participants ─────────────────────────────────────────────────────
  const betaAll = betaRes.data ?? [];
  const betaParticipants = betaRes.count ?? 0;
  const activeBetaParticipants = betaAll.filter((b) => b.status === "active").length;

  // ── Feedback ──────────────────────────────────────────────────────────────
  const feedbackAll = feedbackRes.data ?? [];
  const totalFeedback = feedbackRes.count ?? 0;
  const avgFeedbackRating =
    feedbackAll.length > 0
      ? Math.round(
          (feedbackAll.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbackAll.length) * 10
        ) / 10
      : 0;

  const stats = {
    totalUsers,
    activeUsers,
    suspendedUsers,
    patientCount,
    clinicianCount,
    adminCount,
    totalReadings: readingsRes.count ?? 0,
    readingsLast7d: readingsRecentRes.count ?? 0,
    totalDoses: dosesRes.count ?? 0,
    dosesLast7d: dosesRecentRes.count ?? 0,
    totalClinicianNotes: notesRes.count ?? 0,
    betaParticipants,
    activeBetaParticipants,
    totalFeedback,
    avgFeedbackRating,
    healthStatus: {
      database: "ok" as const,
      nightscout: "unconfigured" as const,
      lastChecked: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
  };

  await auditLog({
    userId: adminUser.id,
    action: "admin_stats_viewed",
    metadata: { totalUsers },
  });

  return NextResponse.json(stats);
}
