import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Patient Profiles
 * Stores patient-specific information including insulin settings and preferences
 */
export const patientProfiles = mysqlTable("patientProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  dateOfBirth: timestamp("dateOfBirth"),
  diabetesType: mysqlEnum("diabetesType", ["type1", "type2", "gestational", "other"]),
  insulinSensitivityFactor: decimal("insulinSensitivityFactor", { precision: 10, scale: 2 }),
  carbRatio: decimal("carbRatio", { precision: 10, scale: 2 }),
  targetGlucoseMin: decimal("targetGlucoseMin", { precision: 10, scale: 2 }),
  targetGlucoseMax: decimal("targetGlucoseMax", { precision: 10, scale: 2 }),
  glucoseUnit: mysqlEnum("glucoseUnit", ["mg/dL", "mmol/L"]).default("mg/dL"),
  insulinUnit: mysqlEnum("insulinUnit", ["U", "mU"]).default("U"),
  iobDecayTime: int("iobDecayTime"), // in minutes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertPatientProfile = typeof patientProfiles.$inferInsert;

/**
 * Basal Insulin Profiles
 * Stores hourly basal rate settings for each patient
 */
export const basalProfiles = mysqlTable("basalProfiles", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  profileName: varchar("profileName", { length: 255 }),
  hour: int("hour").notNull(), // 0-23
  basalRate: decimal("basalRate", { precision: 10, scale: 3 }).notNull(), // units per hour
  isActive: int("isActive").default(1).notNull(), // 1 = true, 0 = false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BasalProfile = typeof basalProfiles.$inferSelect;
export type InsertBasalProfile = typeof basalProfiles.$inferInsert;

/**
 * Glucose Readings
 * Stores CGM or manual glucose measurements
 */
export const glucoseReadings = mysqlTable("glucoseReadings", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  glucoseValue: decimal("glucoseValue", { precision: 10, scale: 2 }).notNull(),
  glucoseUnit: mysqlEnum("glucoseUnit", ["mg/dL", "mmol/L"]).default("mg/dL"),
  readingType: mysqlEnum("readingType", ["cgm", "fingerstick", "manual"]).notNull(),
  cgmSource: varchar("cgmSource", { length: 100 }), // e.g., "Dexcom", "FreeStyle", "Medtronic"
  timestamp: timestamp("timestamp").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GlucoseReading = typeof glucoseReadings.$inferSelect;
export type InsertGlucoseReading = typeof glucoseReadings.$inferInsert;

/**
 * Insulin Doses
 * Tracks bolus and basal insulin administration
 */
export const insulinDoses = mysqlTable("insulinDoses", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  doseType: mysqlEnum("doseType", ["bolus", "basal", "correction"]).notNull(),
  insulinType: mysqlEnum("insulinType", ["rapid", "short", "intermediate", "long", "ultra-long"]),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(), // units
  carbohydrates: decimal("carbohydrates", { precision: 10, scale: 1 }), // grams
  reason: varchar("reason", { length: 255 }), // e.g., "meal", "correction", "exercise"
  timestamp: timestamp("timestamp").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsulinDose = typeof insulinDoses.$inferSelect;
export type InsertInsulinDose = typeof insulinDoses.$inferInsert;

/**
 * IOB Calculations
 * Stores calculated insulin on-board values with decay curve data
 */
export const iobCalculations = mysqlTable("iobCalculations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  totalIOB: decimal("totalIOB", { precision: 10, scale: 3 }).notNull(),
  bolusIOB: decimal("bolusIOB", { precision: 10, scale: 3 }).notNull(),
  basalIOB: decimal("basalIOB", { precision: 10, scale: 3 }).notNull(),
  decayModel: varchar("decayModel", { length: 50 }).default("exponential"),
  decayData: json("decayData"), // stores decay curve points as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IOBCalculation = typeof iobCalculations.$inferSelect;
export type InsertIOBCalculation = typeof iobCalculations.$inferInsert;

/**
 * Chat Sessions
 * Stores predictive text chat history for each patient
 */
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  sessionName: varchar("sessionName", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat Messages
 * Stores individual messages within chat sessions
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  typosDetected: json("typosDetected"), // array of typos and suggestions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Audit Logs
 * Tracks all clinical actions and data modifications for compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "glucose_entry", "insulin_dose", "profile_update"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "glucose", "insulin", "profile"
  entityId: int("entityId"),
  changes: json("changes"), // stores before/after values
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Meals
 * Tracks meal entries with carb estimates and regime association
 */
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(),
  eatenAt: timestamp("eatenAt").notNull(),
  carbsGrams: decimal("carbsGrams", { precision: 10, scale: 1 }).notNull(),
  mealRegime: varchar("mealRegime", { length: 50 }), // references MEAL_REGIMES id
  mealName: varchar("mealName", { length: 255 }), // e.g., "Suhoor", "Breakfast"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

/**
 * Meal Patient Settings
 * Stores per-patient meal regime preferences and custom thresholds
 */
export const mealPatientSettings = mysqlTable("mealPatientSettings", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  activeRegimeId: varchar("activeRegimeId", { length: 50 }).notNull(), // references MEAL_REGIMES id
  customHypoThreshold: decimal("customHypoThreshold", { precision: 10, scale: 2 }), // mg/dL override
  customHyperThreshold: decimal("customHyperThreshold", { precision: 10, scale: 2 }), // mg/dL override
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MealPatientSetting = typeof mealPatientSettings.$inferSelect;
export type InsertMealPatientSetting = typeof mealPatientSettings.$inferInsert;
