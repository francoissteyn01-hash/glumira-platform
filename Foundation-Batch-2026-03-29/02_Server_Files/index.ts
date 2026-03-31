/**
 * GluMira™ V7 — server/index.ts
 * Stack: Express + tRPC + Drizzle + Supabase
 * GluMira™ is an educational platform, not a medical device.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./trpc";
import { analyticsRouter } from "./routes/analytics";
import { nightscoutRouter } from "./routes/nightscout";
import { mealsRouter } from "./routes/meals";
import { dosesRouter } from "./routes/doses";
import { notificationsRouter } from "./routes/notifications";
import { settingsRouter } from "./routes/settings";
import { telemetryRouter } from "./routes/telemetry";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "7.0.0", timestamp: new Date().toISOString() });
});

// ── tRPC ──────────────────────────────────────────────────────────────────────
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// ── REST (V6 Next.js routes → V7 Express adapters) ───────────────────────────
// These adapt the 04.1.x route handlers to Express middleware.
app.use("/api/analytics",     analyticsRouter);
app.use("/api/nightscout",    nightscoutRouter);
app.use("/api/meals",         mealsRouter);
app.use("/api/doses",         dosesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings",      settingsRouter);
app.use("/api/telemetry",     telemetryRouter);

// ── 404 / Error ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`GluMira™ V7 server :${PORT}`));
export { app };
