/**
 * GluMira™ V7 — server/trpc.ts
 * tRPC context, procedures, and middleware.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// ── Context ───────────────────────────────────────────────────────────────────

export interface Context {
  req: Request;
  res: Response;
  supabase: SupabaseClient;
  user: User | null;
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let user: User | null = null;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    user = data.user ?? null;
  }

  return { req, res, supabase, user };
}

// ── tRPC init ─────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// ── Auth middleware ───────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// ── Clinician middleware ──────────────────────────────────────────────────────

const isClinician = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

  const { data } = await ctx.supabase
    .from("user_profiles")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (!data || !["clinician", "admin"].includes(data.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinician role required" });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const clinicianProcedure = t.procedure.use(isClinician);

// ── Caregiver middleware (view-only) ──────────────────────────────────────────

const isCaregiverOrAbove = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  // Caregivers are authenticated via share tokens validated at REST level
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const caregiverProcedure = t.procedure.use(isCaregiverOrAbove);
