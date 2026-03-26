import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Test meals router procedures — regime library, meal logging, and settings
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 100): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-meals-user-${userId}`,
    email: `meals${userId}@example.com`,
    name: `Meals User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Meal Regimes — Public Procedures", () => {
  it("should return all 20 meal regimes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const regimes = await caller.meals.getRegimes();
    expect(regimes).toBeDefined();
    expect(Array.isArray(regimes)).toBe(true);
    expect(regimes.length).toBe(20);
  });

  it("each regime should have required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const regimes = await caller.meals.getRegimes();
    for (const r of regimes) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(Array.isArray(r.meals)).toBe(true);
      expect(r.meals.length).toBeGreaterThan(0);
    }
  });

  it("should look up a regime by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const regime = await caller.meals.getRegimeById({ id: "ramadan" });
    expect(regime).toBeDefined();
    expect(regime?.name).toContain("Ramadan");
  });

  it("should return null for unknown regime ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const regime = await caller.meals.getRegimeById({ id: "nonexistent-xyz" });
    expect(regime).toBeNull();
  });

  it("should filter regimes by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const religious = await caller.meals.getRegimesByCategory({ category: "religious-fasting" });
    expect(religious.length).toBeGreaterThan(0);
    for (const r of religious) {
      expect(r.category).toBe("religious-fasting");
    }
  });

  it("should search regimes by keyword", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.meals.searchRegimes({ query: "fasting" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return fasting regimes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const fasting = await caller.meals.getFastingRegimes();
    expect(fasting.length).toBeGreaterThan(0);
    for (const r of fasting) {
      expect(r.fasting).toBeDefined();
    }
  });
});

describe("Meal Logging — Protected Procedures", () => {
  it("should log a meal", async () => {
    const { ctx } = createAuthContext(101);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile first
    await caller.patient.createProfile({
      firstName: "Meal",
      lastName: "Tester",
      diabetesType: "type1",
    });

    const profile = await caller.patient.getProfile();
    expect(profile).toBeDefined();
    if (profile) {
      const result = await caller.meals.logMeal({
        patientId: profile.id,
        eatenAt: new Date(),
        carbsGrams: 45,
        mealRegime: "standard-carb",
        mealName: "Breakfast",
        notes: "Oatmeal with fruit",
      });

      expect(result).toBeDefined();
    }
  });

  it("should retrieve logged meals", async () => {
    const { ctx } = createAuthContext(102);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Meal",
      lastName: "Reader",
      diabetesType: "type1",
    });

    const profile = await caller.patient.getProfile();
    expect(profile).toBeDefined();
    if (profile) {
      // Log multiple meals
      for (let i = 0; i < 3; i++) {
        await caller.meals.logMeal({
          patientId: profile.id,
          eatenAt: new Date(Date.now() - i * 3600000),
          carbsGrams: 30 + i * 10,
          mealName: `Meal ${i + 1}`,
        });
      }

      // Retrieve meals
      const meals = await caller.meals.getMeals({
        patientId: profile.id,
        limit: 10,
      });

      expect(meals.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Meal Settings — Protected Procedures", () => {
  it("should return null when no settings exist", async () => {
    const { ctx } = createAuthContext(103);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Settings",
      lastName: "Tester",
      diabetesType: "type1",
    });

    const profile = await caller.patient.getProfile();
    expect(profile).toBeDefined();
    if (profile) {
      const settings = await caller.meals.getSettings({ patientId: profile.id });
      expect(settings).toBeNull();
    }
  });

  it("should create and update meal settings", async () => {
    const { ctx } = createAuthContext(104);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Settings",
      lastName: "Creator",
      diabetesType: "type1",
    });

    const profile = await caller.patient.getProfile();
    expect(profile).toBeDefined();
    if (profile) {
      // Create settings (upsert — first time = insert)
      await caller.meals.updateSettings({
        patientId: profile.id,
        activeRegimeId: "ramadan",
        customHypoThreshold: 70,
        customHyperThreshold: 200,
      });

      // Read back
      const settings = await caller.meals.getSettings({ patientId: profile.id });
      expect(settings).toBeDefined();
      expect(settings?.activeRegimeId).toBe("ramadan");

      // Update settings (upsert — second time = update)
      await caller.meals.updateSettings({
        patientId: profile.id,
        activeRegimeId: "low-carb",
      });

      const updated = await caller.meals.getSettings({ patientId: profile.id });
      expect(updated?.activeRegimeId).toBe("low-carb");
    }
  });
});
