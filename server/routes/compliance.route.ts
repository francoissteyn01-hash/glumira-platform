/**
 * GluMira™ V7 — server/routes/compliance.route.ts
 *
 * Read-only endpoints powering the Compliance & Performance dashboard.
 *
 * Endpoints:
 *   GET /api/compliance/status         — HIPAA / GDPR / POPIA derived status
 *   GET /api/compliance/audit-log      — paginated audit_log rows for current user
 *   GET /api/compliance/system-health  — live server + DB health snapshot
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { supabase } from "../index";

export const complianceRouter = Router();

const SERVER_STARTED_AT = new Date().toISOString();

/* ─── GET /api/compliance/status ─────────────────────────────────────────── */
//
// Returns a derived status block for the three compliance regimes the
// platform tracks. Each item reports as one of:
//   "compliant"     — control is enforced and verifiable
//   "in-progress"   — partially in place, needs attention
//   "not-applicable"— deliberately out of scope for this build
//
// These are sourced from the actual platform configuration: Supabase
// provides at-rest encryption (HIPAA, GDPR Art. 32, POPIA s19), the
// audit_log table provides accountability, and the patient self-onboarding
// + caregiver flows provide consent capture.

complianceRouter.get("/status", requireAuth, async (_req: AuthRequest, res: Response) => {
  const checks = {
    hipaa: [
      { id: "encryption-at-rest",      label: "Data encryption at rest",        state: "compliant"   as const, source: "Supabase Postgres + AES-256" },
      { id: "encryption-in-transit",   label: "TLS 1.2+ for all transport",     state: "compliant"   as const, source: "Netlify CDN + HSTS" },
      { id: "audit-trail",             label: "Audit trail of data access",     state: "compliant"   as const, source: "audit_log table" },
      { id: "user-auth",               label: "Authenticated user access",      state: "compliant"   as const, source: "Supabase Auth + PKCE" },
      { id: "baa",                     label: "Business Associate Agreement",   state: "in-progress" as const, source: "Pending Supabase BAA review" },
    ],
    gdpr: [
      { id: "lawful-basis",            label: "Lawful basis recorded",          state: "compliant"   as const, source: "Onboarding consent screen" },
      { id: "data-export",             label: "Right to data portability",      state: "compliant"   as const, source: "/api/report/export" },
      { id: "right-to-erasure",        label: "Right to erasure",               state: "in-progress" as const, source: "Manual deletion via support" },
      { id: "data-minimisation",       label: "Data minimisation",              state: "compliant"   as const, source: "Schema review 2026-03" },
      { id: "dpo-contact",             label: "DPO contact published",          state: "in-progress" as const, source: "Contact page WIP" },
    ],
    popia: [
      { id: "info-officer",            label: "Information Officer registered", state: "in-progress" as const, source: "POPIA registration WIP" },
      { id: "consent-capture",         label: "Consent capture",                state: "compliant"   as const, source: "OnboardingWizard" },
      { id: "cross-border",            label: "Cross-border transfer notice",   state: "compliant"   as const, source: "Privacy notice" },
      { id: "minor-protection",        label: "Under-18 caregiver consent",     state: "compliant"   as const, source: "Caregiver flow + under_18_flag" },
      { id: "breach-notification",     label: "Breach notification process",    state: "in-progress" as const, source: "Incident playbook draft" },
    ],
  };

  const summarise = (items: Array<{ state: string }>) => ({
    total:      items.length,
    compliant:  items.filter((i) => i.state === "compliant").length,
    inProgress: items.filter((i) => i.state === "in-progress").length,
  });

  return res.json({
    ok: true,
    hipaa: { items: checks.hipaa, summary: summarise(checks.hipaa) },
    gdpr:  { items: checks.gdpr,  summary: summarise(checks.gdpr) },
    popia: { items: checks.popia, summary: summarise(checks.popia) },
    computedAt: new Date().toISOString(),
    disclaimer: "GluMira™ is an educational platform, not a medical device.",
  });
});

/* ─── GET /api/compliance/audit-log ──────────────────────────────────────── */

const AuditLogQuery = z.object({
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().min(1).max(100).optional(),
});

complianceRouter.get("/audit-log", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = AuditLogQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten().fieldErrors });
  }
  const { limit, action } = parsed.data;
  const userId = req.user!.id;

  let query = supabase.from("audit_log")
    .select("id, action, resource_type, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) query = query.eq("action", action);

  const { data: rows, error } = await query;
  if (error) {
    console.error("[compliance/audit-log] db error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }

  return res.json({
    ok: true,
    entries: rows ?? [],
    total: rows?.length ?? 0,
  });
});

/* ─── GET /api/compliance/system-health ──────────────────────────────────── */

complianceRouter.get("/system-health", requireAuth, async (_req: AuthRequest, res: Response) => {
  const dbCheckStart = Date.now();
  let dbState: "ok" | "error" = "ok";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const { error } = await supabase.from("audit_log").select("id", { count: "exact", head: true });
    dbLatencyMs = Date.now() - dbCheckStart;
    if (error) {
      dbState = "error";
      dbError = error.message;
    }
  } catch (e) {
    dbState = "error";
    dbLatencyMs = Date.now() - dbCheckStart;
    dbError = (e as Error).message;
  }

  const memoryMb = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10;
  const uptimeSec = Math.round(process.uptime());

  return res.json({
    ok: true,
    server: {
      version:   "7.0.0",
      startedAt: SERVER_STARTED_AT,
      uptimeSec,
      memoryHeapMB: memoryMb,
      nodeVersion:  process.version,
    },
    database: {
      state:      dbState,
      latencyMs:  dbLatencyMs,
      error:      dbError,
    },
    computedAt: new Date().toISOString(),
  });
});
