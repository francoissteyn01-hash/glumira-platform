import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Test patient profile and glucose data procedures
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Patient Profile Procedures", () => {
  it("should create a patient profile", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patient.createProfile({
      firstName: "John",
      lastName: "Doe",
      diabetesType: "type1",
      insulinSensitivityFactor: 1.5,
      carbRatio: 10,
      targetGlucoseMin: 80,
      targetGlucoseMax: 180,
      glucoseUnit: "mg/dL",
      insulinUnit: "U",
      iobDecayTime: 360,
    });

    expect(result).toBeDefined();
  });

  it("should retrieve patient profile by user ID", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    // Create a profile first
    await caller.patient.createProfile({
      firstName: "Jane",
      lastName: "Smith",
      diabetesType: "type1",
      glucoseUnit: "mg/dL",
    });

    // Then retrieve it
    const profile = await caller.patient.getProfile();
    expect(profile).toBeDefined();
    if (profile) {
      expect(profile.firstName).toBe("Jane");
      expect(profile.lastName).toBe("Smith");
    }
  });

  it("should update patient profile", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    // Create a profile
    const createResult = await caller.patient.createProfile({
      firstName: "Bob",
      lastName: "Johnson",
      diabetesType: "type2",
    });

    // Get the profile to get the ID
    const profile = await caller.patient.getProfile();
    if (profile) {
      // Update it
      await caller.patient.updateProfile({
        patientId: profile.id,
        firstName: "Robert",
        carbRatio: 12,
      });

      // Verify update
      const updated = await caller.patient.getProfile();
      expect(updated?.firstName).toBe("Robert");
    }
  });
});

describe("Glucose Data Procedures", () => {
  it("should add a glucose reading", async () => {
    const { ctx } = createAuthContext(4);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile first
    const profile = await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add glucose reading
      const result = await caller.glucose.addReading({
        patientId: profileData.id,
        glucoseValue: 145,
        glucoseUnit: "mg/dL",
        readingType: "cgm",
        cgmSource: "Dexcom",
        timestamp: new Date(),
        notes: "After breakfast",
      });

      expect(result).toBeDefined();
    }
  });

  it("should retrieve glucose readings", async () => {
    const { ctx } = createAuthContext(5);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add multiple readings
      for (let i = 0; i < 3; i++) {
        await caller.glucose.addReading({
          patientId: profileData.id,
          glucoseValue: 100 + i * 10,
          glucoseUnit: "mg/dL",
          readingType: "cgm",
          timestamp: new Date(Date.now() - i * 60000), // 1 min apart
        });
      }

      // Retrieve readings
      const readings = await caller.glucose.getReadings({
        patientId: profileData.id,
        limit: 10,
      });

      expect(readings.length).toBeGreaterThan(0);
    }
  });
});

describe("Insulin Dose Procedures", () => {
  it("should add an insulin dose", async () => {
    const { ctx } = createAuthContext(6);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add insulin dose
      const result = await caller.insulin.addDose({
        patientId: profileData.id,
        doseType: "bolus",
        insulinType: "rapid",
        amount: 5.5,
        carbohydrates: 45,
        reason: "meal",
        timestamp: new Date(),
        notes: "Lunch bolus",
      });

      expect(result).toBeDefined();
    }
  });

  it("should retrieve insulin doses", async () => {
    const { ctx } = createAuthContext(7);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add multiple doses
      for (let i = 0; i < 2; i++) {
        await caller.insulin.addDose({
          patientId: profileData.id,
          doseType: i === 0 ? "bolus" : "correction",
          amount: 5 + i,
          timestamp: new Date(Date.now() - i * 3600000), // 1 hour apart
        });
      }

      // Retrieve doses
      const doses = await caller.insulin.getDoses({
        patientId: profileData.id,
        limit: 10,
      });

      expect(doses.length).toBeGreaterThan(0);
    }
  });
});

describe("Basal Profile Procedures", () => {
  it("should add basal profile entries", async () => {
    const { ctx } = createAuthContext(8);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add basal entries for different hours
      for (let hour = 0; hour < 6; hour++) {
        const result = await caller.basal.addEntry({
          patientId: profileData.id,
          profileName: "Default",
          hour,
          basalRate: 0.5 + hour * 0.1,
        });

        expect(result).toBeDefined();
      }
    }
  });

  it("should retrieve basal profile", async () => {
    const { ctx } = createAuthContext(9);
    const caller = appRouter.createCaller(ctx);

    // Create patient profile
    await caller.patient.createProfile({
      firstName: "Test",
      lastName: "Patient",
    });

    const profileData = await caller.patient.getProfile();
    if (profileData) {
      // Add basal entries
      await caller.basal.addEntry({
        patientId: profileData.id,
        hour: 0,
        basalRate: 0.5,
      });

      // Retrieve profile
      const profile = await caller.basal.getProfile({
        patientId: profileData.id,
      });

      expect(profile.length).toBeGreaterThan(0);
    }
  });
});
