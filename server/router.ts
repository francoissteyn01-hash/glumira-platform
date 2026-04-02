/**
 * GluMira™ V7 — server/router.ts
 * tRPC root router — merges all sub-routers.
 * GluMira™ is an educational platform, not a medical device.
 */
import { router, publicProcedure } from "./trpc";
import { mealLogRouter } from "./routes/meal-log.router";
import { insulinEventRouter } from "./routes/insulin-event.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    version: "7.0.0",
    service: "GluMira™ tRPC",
  })),
  mealLog: mealLogRouter,
  insulinEvent: insulinEventRouter,
});

export type AppRouter = typeof appRouter;
