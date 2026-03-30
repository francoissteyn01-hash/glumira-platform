/**
 * GluMira™ V7 — server/index.ts  (FINAL — use this version)
 * Express entry point — Vite + React + Express + Drizzle + Supabase
 * Version: v1.1 · 2026-03-29 — all routes wired
 * . Designed for the world.
 *
 * ROUTES WIRED:
 *   POST   /api/auth/...             auth (Supabase JWT)
 *   *      /api/patients/...         patient profiles (CRUD)
 *   *      /api/iob/...              IOB calculator
 *   POST   /api/glucose/prediction   glucose prediction
 *   GET    /api/glucose/trend        14-day trend report
 *   GET    /api/glucose/export       CSV/JSON download
 *   GET    /api/doses/history        dose log grouped by day
 *   GET    /api/meals/carb-lookup    food carb lookup
 *   POST   /api/telemetry            beta telemetry events
 *   POST   /api/beta/feedback        beta feedback widget
 *   POST   /api/bernstein/ask        Bernstein AI Q&A
 *   GET    /api/analytics/summary    7d vs 14d analytics
 */

import express                  from "express";
import cors                     from "cors";
import helmet                   from "helmet";
import { createClient }         from "@supabase/supabase-js";
import { drizzle }              from "drizzle-orm/node-postgres";
import { Pool }                 from "pg";
import { Router }               from "express";

// ── Route imports ─────────────────────────────────────────────────────────────
import { glucosePredictionRouter } from "./routes/glucose-prediction.route";
import { glucoseTrendRouter }      from "./routes/glucose-trend.route";
import {
  glucoseExportRouter,
  telemetryRouter,
  betaFeedbackRouter,
  bernsteinRouter,
  analyticsRouter,
  doseHistoryRouter,
  carbLookupRouter,
} from "./routes/remaining.routes";

// ── Config ────────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.VITE_CLIENT_URL ?? "http://localhost:5173";

// ── Supabase (service role — server only) ─────────────────────────────────────
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Drizzle ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// ── App ────────────────────────────────────────────────────────────────────────
const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use((_req, res, next) => {
  res.setHeader("X-GluMira-Disclaimer", "Educational platform only. Not a medical device.");
  next();
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({
  ok: true, service: "GluMira™ API", version: "v7.1",
  powered_by: "IOB Hunter™", timestamp: new Date().toISOString(),
}));

// ── Routes ─────────────────────────────────────────────────────────────────────
// Stubs for routes not yet converted — add real routers as they are built
const iobRouter     = Router(); // → server/routes/iob.route.ts (next batch)
const patientRouter = Router(); // → server/routes/patient.route.ts (next batch)
const authRouter    = Router(); // → server/routes/auth.route.ts (next batch)

app.use("/api/auth",      authRouter);
app.use("/api/patients",  patientRouter);
app.use("/api/iob",       iobRouter);
app.use("/api/glucose",   glucosePredictionRouter);
app.use("/api/glucose",   glucoseTrendRouter);
app.use("/api/glucose",   glucoseExportRouter);
app.use("/api/doses",     doseHistoryRouter);
app.use("/api/meals",     carbLookupRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/beta",      betaFeedbackRouter);
app.use("/api/bernstein", bernsteinRouter);
app.use("/api/analytics", analyticsRouter);

// ── 404 / Error ────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[GluMira]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🦉 GluMira™ API v7 :${PORT} — IOB Hunter™ — `);
});

export default app;
