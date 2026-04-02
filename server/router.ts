/**
 * GluMira™ V7 — server/router.ts
 * tRPC root router — merges all sub-routers.
 * GluMira™ is an educational platform, not a medical device.
 */
import { router, publicProcedure } from "./trpc";
import { mealLogRouter } from "./routes/meal-log.router";
import { insulinEventRouter } from "./routes/insulin-event.router";
import { iobHunterRouter } from "./routes/iob-hunter.router";
import { conditionEventRouter } from "./routes/condition-event.router";
import { emotionalDistressRouter } from "./routes/emotional-distress.router";
import { patternRouter } from "./routes/pattern.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    version: "7.0.0",
    service: "GluMira™ tRPC",
  })),
  mealLog: mealLogRouter,
  insulinEvent: insulinEventRouter,
  iobHunter: iobHunterRouter,
  conditionEvent: conditionEventRouter,
  emotionalDistress: emotionalDistressRouter,
  patterns: patternRouter,
});

export type AppRouter = typeof appRouter;
