/**
 * GluMira™ V7 — server/routes/auth.route.ts
 * POST /api/auth/signup  — create account + start beta trial
 * POST /api/auth/signin  — email + password
 * POST /api/auth/signout — invalidate session
 * POST /api/auth/reset   — password reset email
 * GET  /api/auth/me      — current user + subscription
 * POST /api/auth/google  — Google OAuth URL
 *
 * BETA LAUNCH RULES:
 *   Day 1-7:  Free tier
 *   Day 8+:   Pro unlocks automatically (no payment)
 *   Week 6:   Beta ends, monetisation starts
 *   No Stripe during beta.
 *
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../index";
import { requireAuth, getUserId } from "../middleware/auth";

export const authRouter = Router();

const BETA_FREE_DAYS  = 7;
const BETA_TOTAL_DAYS = 42; // 6 weeks

// ── Schemas ───────────────────────────────────────────────────────────────────
const SignUpSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8),
  firstName: z.string().min(1).max(100).optional(),
  lastName:  z.string().min(1).max(100).optional(),
  role:      z.enum(["user","clinician"]).default("user"),
  region:    z.enum(["AF","UAE","UK","EU","US","INT"]).default("INT"),
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
authRouter.post("/signup", async (req: Request, res: Response) => {
  const p = SignUpSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid input", details: p.error.flatten().fieldErrors });

  const { email, password, firstName, lastName, role, region } = p.data;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: false,
    user_metadata: { firstName, lastName, role, region },
  });

  if (authError || !authData.user) {
    if (authError?.message?.includes("already registered"))
      return res.status(409).json({ error: "An account with this email already exists." });
    return res.status(400).json({ error: authError?.message ?? "Sign up failed" });
  }

  const userId = authData.user.id;
  const now    = new Date();
  const proUnlocksAt = new Date(now.getTime() + BETA_FREE_DAYS  * 86400000);
  const betaEndsAt   = new Date(now.getTime() + BETA_TOTAL_DAYS * 86400000);
  const discount     = ["AF","UAE"].includes(region) ? "0.700" : "1.000";

  // Profile + subscription + onboarding + beta_participant (parallel)
  await Promise.all([
    supabase.from("user_profiles").insert({
      id: userId, role,
      first_name: firstName, last_name: lastName,
      region, onboarding_done: false,
    }),
    supabase.from("subscriptions").insert({
      user_id: userId, tier: "free",
      trial_start_date: now.toISOString(),
      trial_end_date:   betaEndsAt.toISOString(),
      region, discount_applied: discount,
    }),
    supabase.from("onboarding_checkpoints").insert({ user_id: userId }),
    supabase.from("beta_participants").insert({
      user_id: userId,
      participant_id: `${region}-${userId.slice(0,6).toUpperCase()}`,
      region, status: "pending", consent_version: "v1.0",
      enrolled_at: now.toISOString(),
    }),
    supabase.from("telemetry_events").insert({
      user_id: userId, event_name: "user_signed_up",
      event_category: "onboarding", event_data: { role, region, beta: true },
    }),
  ]);

  return res.status(201).json({
    ok: true, userId,
    betaTier: "free",
    proUnlocksAt: proUnlocksAt.toISOString(),
    betaEndsAt:   betaEndsAt.toISOString(),
    message: "Account created. Check your email to verify, then sign in.",
  });
});

// ── POST /api/auth/signin ─────────────────────────────────────────────────────
authRouter.post("/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session)
    return res.status(401).json({ error: "Incorrect email or password." });

  const userId = data.user.id;

  // Auto-promote Free → Pro after 7 days
  const { data: sub } = await supabase
    .from("subscriptions").select("tier, trial_start_date")
    .eq("user_id", userId).single();

  let tier = sub?.tier ?? "free";
  if (tier === "free" && sub?.trial_start_date) {
    const days = (Date.now() - new Date(sub.trial_start_date).getTime()) / 86400000;
    if (days >= BETA_FREE_DAYS) {
      await supabase.from("subscriptions").update({ tier: "pro" }).eq("user_id", userId);
      tier = "pro";
    }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, first_name, last_name, region, onboarding_done")
    .eq("id", userId).single();

  // Mark participant active
  await supabase.from("beta_participants")
    .update({ last_active_at: new Date().toISOString(), status: "active" })
    .eq("user_id", userId);

  return res.json({
    ok: true,
    token:        data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt:    data.session.expires_at,
    user: {
      id:             userId,
      email:          data.user.email,
      role:           profile?.role ?? "user",
      firstName:      profile?.first_name,
      lastName:       profile?.last_name,
      region:         profile?.region ?? "INT",
      onboardingDone: profile?.onboarding_done ?? false,
      tier,
    },
  });
});

// ── POST /api/auth/signout ────────────────────────────────────────────────────
authRouter.post("/signout", requireAuth, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) ?? "";
  await supabase.auth.admin.signOut(token);
  return res.json({ ok: true });
});

// ── POST /api/auth/reset ──────────────────────────────────────────────────────
authRouter.post("/reset", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  // Always 200 — prevents email enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.VITE_CLIENT_URL ?? "http://localhost:5173"}/reset-password`,
  });
  return res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", userId).single(),
    supabase.from("subscriptions").select("*").eq("user_id", userId).single(),
  ]);

  if (!profile) return res.status(404).json({ error: "User profile not found" });

  const betaEndsAt   = sub?.trial_end_date ? new Date(sub.trial_end_date) : null;
  const betaDaysLeft = betaEndsAt
    ? Math.max(0, Math.ceil((betaEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  return res.json({
    ok: true,
    user: {
      ...profile,
      tier:         sub?.tier ?? "free",
      betaDaysLeft,
      betaEndsAt:   betaEndsAt?.toISOString() ?? null,
    },
  });
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
authRouter.post("/google", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.VITE_CLIENT_URL ?? "http://localhost:5173"}/auth/callback` },
  });
  if (error) return res.status(500).json({ error: "Google OAuth failed" });
  return res.json({ ok: true, url: data.url });
});
