/**
 * GluMira V7 — Autism + T1D module routes
 * Express REST endpoints for profile, injections, meltdowns, schedule, hypo preferences.
 * In-memory stub storage; replace with Supabase/Drizzle persistence in prod.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

// Dev-phase in-memory stores keyed by userId (or "anon")
const profiles = new Map<string, any>();
const injections = new Map<string, any[]>();
const meltdowns = new Map<string, any[]>();
const schedules = new Map<string, any>();
const hypoPrefs = new Map<string, string[]>();

const uid = (req: Request) =>
  (req.body?.userId as string) || (req.params?.userId as string) || (req.query?.userId as string) || "anon";

/* ── Profile ─────────────────────────────────────────────────────────────── */
router.get("/api/modules/autism/profile/:userId", (req, res) => {
  res.json(profiles.get(req.params.userId) || { sensory_mode: "standard" });
});
router.get("/api/modules/autism/profile", (req, res) => {
  res.json(profiles.get(uid(req)) || { sensory_mode: "standard" });
});
router.post("/api/modules/autism/profile", (req: Request, res: Response) => {
  const id = uid(req);
  const prev = profiles.get(id) || {};
  const next = { ...prev, ...req.body, updated_at: new Date().toISOString() };
  profiles.set(id, next);
  res.json({ ok: true, profile: next });
});

/* ── Injection site log ──────────────────────────────────────────────────── */
router.get("/api/modules/autism/injections/:userId", (req, res) => {
  res.json({ entries: injections.get(req.params.userId) || [] });
});
router.get("/api/modules/autism/injections", (req, res) => {
  res.json({ entries: injections.get(uid(req)) || [] });
});
router.post("/api/modules/autism/injections", (req: Request, res: Response) => {
  const id = uid(req);
  const list = injections.get(id) || [];
  const entry = { ...req.body, logged_at: new Date().toISOString() };
  list.unshift(entry);
  injections.set(id, list);
  res.json({ ok: true, entry });
});

/* ── Meltdown log ────────────────────────────────────────────────────────── */
router.get("/api/modules/autism/meltdowns/:userId", (req, res) => {
  res.json({ entries: meltdowns.get(req.params.userId) || [] });
});
router.get("/api/modules/autism/meltdowns", (req, res) => {
  res.json({ entries: meltdowns.get(uid(req)) || [] });
});
router.post("/api/modules/autism/meltdowns", (req: Request, res: Response) => {
  const id = uid(req);
  const list = meltdowns.get(id) || [];
  const entry = { ...req.body, logged_at: new Date().toISOString() };
  list.unshift(entry);
  meltdowns.set(id, list);
  res.json({ ok: true, entry });
});

/* ── Visual schedule ─────────────────────────────────────────────────────── */
router.get("/api/modules/autism/schedule/:userId", (req, res) => {
  res.json({ schedule: schedules.get(req.params.userId) || [] });
});
router.get("/api/modules/autism/schedule", (req, res) => {
  res.json({ schedule: schedules.get(uid(req)) || [] });
});
router.post("/api/modules/autism/schedule", (req: Request, res: Response) => {
  const id = uid(req);
  schedules.set(id, req.body?.schedule || req.body);
  res.json({ ok: true });
});

/* ── Hypo preferences ────────────────────────────────────────────────────── */
router.get("/api/modules/autism/hypo-preferences/:userId", (req, res) => {
  res.json({ preferred: hypoPrefs.get(req.params.userId) || [] });
});
router.get("/api/modules/autism/hypo-preferences", (req, res) => {
  res.json({ preferred: hypoPrefs.get(uid(req)) || [] });
});
router.post("/api/modules/autism/hypo-preferences", (req: Request, res: Response) => {
  const id = uid(req);
  hypoPrefs.set(id, req.body?.preferred_hypo_treatments || []);
  res.json({ ok: true });
});

export default router;
