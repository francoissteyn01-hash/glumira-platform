/**
 * GluMira™ V7 — server/routes/settings.ts
 * Reads/writes user preferences from userProfiles table
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { db } from "../db";
import { userProfiles } from "../db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

// GET /api/settings
settingsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!profile) {
      // Return defaults if no profile exists yet
      return res.json({
        glucoseUnit: "mmol",
        theme: "system",
        notificationsEnabled: true,
        pushEnabled: false,
        lowAlertThreshold: 3.9,
        highAlertThreshold: 10.0,
        nightscoutUrl: null,
        nightscoutToken: null,
        language: "en",
        region: "INT",
      });
    }

    res.json({
      glucoseUnit: "mmol",
      theme: "system",
      notificationsEnabled: true,
      pushEnabled: false,
      lowAlertThreshold: 3.9,
      highAlertThreshold: 10.0,
      nightscoutUrl: null,
      nightscoutToken: null,
      language: "en",
      region: profile.region,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      onboardingDone: profile.onboardingDone,
    });
  } catch (err) {
    console.error("[settings/get]", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PATCH /api/settings
settingsRouter.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const patch = req.body;

    // Extract profile-level fields
    const profileUpdate: Record<string, any> = {};
    if (patch.firstName !== undefined) profileUpdate.firstName = patch.firstName;
    if (patch.lastName !== undefined) profileUpdate.lastName = patch.lastName;
    if (patch.region !== undefined) profileUpdate.region = patch.region;
    if (patch.onboardingDone !== undefined) profileUpdate.onboardingDone = patch.onboardingDone;

    if (Object.keys(profileUpdate).length > 0) {
      profileUpdate.updatedAt = new Date();
      await db.update(userProfiles)
        .set(profileUpdate)
        .where(eq(userProfiles.id, userId));
    }

    res.json({ ok: true, ...patch });
  } catch (err) {
    console.error("[settings/patch]", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});
