/**
 * GluMira™ V7 — server/index.ts
 * Stack: Express + tRPC + Drizzle + Supabase
 * GluMira™ is an educational platform, not a medical device.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./trpc";
import { supabase, db } from "./db";

// ── REST route imports ────────────────────────────────────────────────────────
import { analyticsRouter }        from "./routes/analytics.route";
import { alertsRouter }           from "./routes/alerts.route";
import { complianceRouter }       from "./routes/compliance.route";
import { nightscoutRouter }       from "./routes/nightscout";
import { mealsRouter }            from "./routes/meals";
import { dosesRouter }            from "./routes/doses";
import { notificationsRouter }    from "./routes/notifications";
import { settingsRouter }         from "./routes/settings";
import { telemetryRouter }        from "./routes/telemetry";
import { betaFeedbackRouter }     from "./routes/beta-feedback.route";
import { glucoseTrendRouter }     from "./routes/glucose-trend.route";
import { subscriptionRouter }     from "./routes/subscription";
import { cronNightscoutSyncRouter as cronNightscoutRouter, scheduleSyncJob } from "./routes/cron-nightscout-sync.route";
import { badgesRouter }           from "./routes/badges.route";
import { miraRouter }             from "./routes/mira.route";
import { profileRouter }          from "./routes/profile.route";
import { inviteRouter }           from "./routes/invite.route";
import { reportRouter }           from "./routes/report.route";
import { caregiverRouter }        from "./routes/caregiver.route";
import adhdRouter                  from "./routes/adhd.route";
import autismRouter                 from "./routes/autism.route";
import thyroidRouter               from "./routes/thyroid.route";
import mealPlanRouter              from "./routes/meal-plan.route";
import educationRouter             from "./routes/education.route";
import { glucoseExportRouter, bernsteinRouter, doseHistoryRouter, carbLookupRouter } from "./routes/remaining.routes";
import { schoolCarePlanRouter }    from "./routes/school-care-plan-route";
import { glucosePredictionRouter } from "./routes/glucose-prediction.route";
import { feedbackRouter }          from "./routes/feedback.route";
import { insulinLogRouter }        from "./routes/insulin-log.route";
import { insulinProfilesRouter }  from "./routes/insulin-profiles.route";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
const ALLOWED_ORIGINS = [
  "https://glumira.ai",
  "https://www.glumira.ai",
  process.env.CLIENT_URL,
  "http://localhost:5173",
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "",
].filter(Boolean) as string[];

app.use(cors({
  origin: (incoming, cb) => {
    if (!incoming || ALLOWED_ORIGINS.includes(incoming)) cb(null, true);
    else cb(new Error(`CORS: origin ${incoming} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "10mb" }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "7.0.0", timestamp: new Date().toISOString() });
});

// ── tRPC ──────────────────────────────────────────────────────────────────────
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// ── REST routes ───────────────────────────────────────────────────────────────
app.use("/api/analytics",     analyticsRouter);
app.use("/api/alerts",        alertsRouter);
app.use("/api/compliance",    complianceRouter);
app.use("/api/nightscout",    nightscoutRouter);
app.use("/api/meals",         mealsRouter);
app.use("/api/doses",         dosesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings",      settingsRouter);
app.use("/api/telemetry",     telemetryRouter);
app.use("/api/beta-feedback", betaFeedbackRouter);
app.use("/api/glucose-trend", glucoseTrendRouter);
app.use("/api/subscription",  subscriptionRouter);
app.use("/api/cron",          cronNightscoutRouter);
app.use("/api/badges",        badgesRouter);
app.use("/api/mira",          miraRouter);
app.use("/api/profile",       profileRouter);
app.use("/api/invite",        inviteRouter);
app.use("/api/report",        reportRouter);
app.use("/api/caregiver",     caregiverRouter);
app.use(adhdRouter);
app.use(autismRouter);
app.use(thyroidRouter);
app.use(mealPlanRouter);
app.use(educationRouter);
app.use("/api/glucose",          glucoseExportRouter);
app.use("/api/bernstein",        bernsteinRouter);
app.use("/api/doses",            doseHistoryRouter);
app.use("/api/meals",            carbLookupRouter);
app.use("/api/school-care-plan", schoolCarePlanRouter);
app.use("/api/glucose-prediction", glucosePredictionRouter);
app.use("/api/feedback",           feedbackRouter);
app.use("/api/insulin-log",        insulinLogRouter);
app.use("/api/insulin-profiles",   insulinProfilesRouter);

// ── 404 / Error ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`GluMira™ V7 server :${PORT}`);
  // On Railway/Render/local: run Nightscout sync every 5 min internally.
  // On Vercel: disabled (serverless has no persistent process); Vercel Cron
  // hits GET /api/cron/nightscout-sync every 5 min instead.
  if (process.env.VERCEL !== "1") {
    scheduleSyncJob();
  }
});
export { supabase, db };
export { app };
