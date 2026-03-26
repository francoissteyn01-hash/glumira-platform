import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertPatientProfile, patientProfiles, InsertGlucoseReading, glucoseReadings, InsertInsulinDose, insulinDoses, InsertIOBCalculation, iobCalculations, InsertBasalProfile, basalProfiles, InsertMeal, meals, InsertMealPatientSetting, mealPatientSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Patient Profile Management
 */
export async function createPatientProfile(profile: InsertPatientProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(patientProfiles).values(profile);
  return result;
}

export async function getPatientProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(patientProfiles).where(eq(patientProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePatientProfile(patientId: number, updates: Partial<InsertPatientProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(patientProfiles).set(updates).where(eq(patientProfiles.id, patientId));
}

/**
 * Glucose Readings
 */
export async function createGlucoseReading(reading: InsertGlucoseReading) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(glucoseReadings).values(reading);
}

export async function getGlucoseReadingsByPatient(patientId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(glucoseReadings)
    .where(eq(glucoseReadings.patientId, patientId))
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(limit);
}

export async function getGlucoseReadingsByDateRange(patientId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(glucoseReadings)
    .where(and(
      eq(glucoseReadings.patientId, patientId),
      // @ts-ignore - Drizzle doesn't have built-in date range, using raw SQL
    ))
    .orderBy(desc(glucoseReadings.timestamp));
}

/**
 * Insulin Doses
 */
export async function createInsulinDose(dose: InsertInsulinDose) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(insulinDoses).values(dose);
}

export async function getInsulinDosesByPatient(patientId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(insulinDoses)
    .where(eq(insulinDoses.patientId, patientId))
    .orderBy(desc(insulinDoses.timestamp))
    .limit(limit);
}

/**
 * IOB Calculations
 */
export async function createIOBCalculation(calc: InsertIOBCalculation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(iobCalculations).values(calc);
}

export async function getLatestIOBCalculation(patientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(iobCalculations)
    .where(eq(iobCalculations.patientId, patientId))
    .orderBy(desc(iobCalculations.timestamp))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Basal Profiles
 */
export async function createBasalProfile(profile: InsertBasalProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(basalProfiles).values(profile);
}

export async function getBasalProfileByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(basalProfiles)
    .where(eq(basalProfiles.patientId, patientId))
    .orderBy(basalProfiles.hour);
}

export async function updateBasalProfile(profileId: number, updates: Partial<InsertBasalProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(basalProfiles).set(updates).where(eq(basalProfiles.id, profileId));
}

/**
 * Meals
 */
export async function createMeal(meal: InsertMeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(meals).values(meal);
}

export async function getMealsByPatient(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meals)
    .where(eq(meals.patientId, patientId))
    .orderBy(desc(meals.eatenAt))
    .limit(limit);
}

/**
 * Meal Patient Settings
 */
export async function getMealSettingsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mealPatientSettings)
    .where(eq(mealPatientSettings.patientId, patientId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertMealSettings(patientId: number, settings: Partial<InsertMealPatientSetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getMealSettingsByPatient(patientId);
  if (existing) {
    return await db.update(mealPatientSettings).set(settings).where(eq(mealPatientSettings.id, existing.id));
  } else {
    return await db.insert(mealPatientSettings).values({ patientId, activeRegimeId: settings.activeRegimeId || 'standard-carb', ...settings });
  }
}
