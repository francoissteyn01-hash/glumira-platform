/**
 * GluMira™ Vitest Setup — Database Mock
 * Provides an in-memory mock for the Drizzle DB layer so integration tests
 * can run without a live DATABASE_URL in CI/sandbox environments.
 */
import { vi } from "vitest";

// ── In-memory stores ──────────────────────────────────────────────────────────
const store = {
  users: [] as any[],
  patientProfiles: [] as any[],
  glucoseReadings: [] as any[],
  insulinDoses: [] as any[],
  iobCalculations: [] as any[],
  basalProfiles: [] as any[],
  meals: [] as any[],
  mealPatientSettings: [] as any[],
};

let autoId = 1;
const nextId = () => autoId++;

// ── Mock — exact function names from server/db.ts ─────────────────────────────
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),

  // ── User ──────────────────────────────────────────────────────────────────
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),

  // ── Patient Profile ───────────────────────────────────────────────────────
  createPatientProfile: vi.fn().mockImplementation(async (profile: any) => {
    const row = { id: nextId(), ...profile };
    store.patientProfiles.push(row);
    return row;
  }),
  getPatientProfileByUserId: vi.fn().mockImplementation(async (userId: number) => {
    return store.patientProfiles.find((r) => r.userId === userId) ?? null;
  }),
  updatePatientProfile: vi.fn().mockImplementation(async (patientId: number, updates: any) => {
    store.patientProfiles = store.patientProfiles.map((r) =>
      r.id === patientId ? { ...r, ...updates } : r
    );
    return [{ affectedRows: 1 }];
  }),

  // ── Glucose Readings ──────────────────────────────────────────────────────
  createGlucoseReading: vi.fn().mockImplementation(async (reading: any) => {
    const row = { id: nextId(), ...reading };
    store.glucoseReadings.push(row);
    return row;
  }),
  getGlucoseReadingsByPatient: vi.fn().mockImplementation(async (patientId: number) => {
    return store.glucoseReadings.filter((r) => r.patientId === patientId);
  }),
  getGlucoseReadingsByDateRange: vi.fn().mockImplementation(async (patientId: number) => {
    return store.glucoseReadings.filter((r) => r.patientId === patientId);
  }),

  // ── Insulin Doses ─────────────────────────────────────────────────────────
  createInsulinDose: vi.fn().mockImplementation(async (dose: any) => {
    const row = { id: nextId(), ...dose };
    store.insulinDoses.push(row);
    return row;
  }),
  getInsulinDosesByPatient: vi.fn().mockImplementation(async (patientId: number) => {
    return store.insulinDoses.filter((r) => r.patientId === patientId);
  }),

  // ── IOB ───────────────────────────────────────────────────────────────────
  createIOBCalculation: vi.fn().mockImplementation(async (calc: any) => {
    const row = { id: nextId(), ...calc };
    store.iobCalculations.push(row);
    return row;
  }),
  getLatestIOBCalculation: vi.fn().mockResolvedValue(null),

  // ── Basal Profiles ────────────────────────────────────────────────────────
  createBasalProfile: vi.fn().mockImplementation(async (profile: any) => {
    const row = { id: nextId(), ...profile };
    store.basalProfiles.push(row);
    return row;
  }),
  getBasalProfileByPatient: vi.fn().mockImplementation(async (patientId: number) => {
    return store.basalProfiles.filter((r) => r.patientId === patientId);
  }),
  updateBasalProfile: vi.fn().mockImplementation(async (profileId: number, updates: any) => {
    store.basalProfiles = store.basalProfiles.map((r) =>
      r.id === profileId ? { ...r, ...updates } : r
    );
    return [{ affectedRows: 1 }];
  }),

  // ── Meals ─────────────────────────────────────────────────────────────────
  createMeal: vi.fn().mockImplementation(async (meal: any) => {
    const row = { id: nextId(), ...meal };
    store.meals.push(row);
    return row;
  }),
  getMealsByPatient: vi.fn().mockImplementation(async (patientId: number) => {
    return store.meals.filter((r) => r.patientId === patientId);
  }),
  getMealSettingsByPatient: vi.fn().mockImplementation(async (patientId: number) => {
    return store.mealPatientSettings.find((r) => r.patientId === patientId) ?? null;
  }),
  upsertMealSettings: vi.fn().mockImplementation(async (patientId: number, settings: any) => {
    const existing = store.mealPatientSettings.findIndex((r) => r.patientId === patientId);
    if (existing >= 0) {
      store.mealPatientSettings[existing] = { ...store.mealPatientSettings[existing], ...settings };
    } else {
      store.mealPatientSettings.push({ id: nextId(), patientId, ...settings });
    }
    return [{ affectedRows: 1 }];
  }),
}));
