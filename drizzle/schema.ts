/**
 * GluMira™ V7 — drizzle/schema.ts
 * Drizzle ORM schema. Matches glumira-schema.sql exactly.
 * Run: npx drizzle-kit push:pg
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  integer,
  smallint,
  jsonb,
  time,
  inet,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const userRoleEnum        = pgEnum("user_role",          ["user", "clinician", "admin"]);
export const diagnosisTypeEnum   = pgEnum("diagnosis_type",     ["T1D", "T2D", "Gestational"]);
export const genderTypeEnum      = pgEnum("gender_type",        ["M", "F", "Other"]);
export const moduleTypeEnum      = pgEnum("module_type",        ["pediatric", "school", "pregnancy", "menstrual_cycle"]);
export const ageGroupTypeEnum    = pgEnum("age_group_type",     ["toddler", "child", "teen", "adult", "older_adult"]);
export const mediaTypeEnum       = pgEnum("media_type",         ["photo", "file"]);
export const permissionLevelEnum = pgEnum("permission_level",   ["view", "edit"]);
export const apptStatusEnum      = pgEnum("appt_status",        ["scheduled", "completed", "cancelled"]);
export const tierTypeEnum        = pgEnum("tier_type",          ["free", "pro", "ai"]);
export const regionTypeEnum      = pgEnum("region_type",        ["AF", "UAE", "UK", "EU", "US", "INT"]);
export const cyclePhaseTypeEnum  = pgEnum("cycle_phase_type",   ["follicular", "ovulation", "luteal", "menstruation"]);
export const riskZoneTypeEnum    = pgEnum("risk_zone_type",     ["safe", "caution", "elevated", "high"]);
export const insulinTypeEnum     = pgEnum("insulin_type_enum",  [
  "glargine_u100", "glargine_u300", "degludec", "detemir", "nph",
  "aspart", "lispro", "glulisine", "regular",
]);

// ── Tables ────────────────────────────────────────────────────────────────────

// 1. User profiles (extends Supabase auth.users)
export const userProfiles = pgTable("user_profiles", {
  id:             uuid("id").primaryKey(),  // references auth.users(id)
  role:           userRoleEnum("role").notNull().default("user"),
  firstName:      varchar("first_name", { length: 100 }),
  lastName:       varchar("last_name", { length: 100 }),
  clinicName:     varchar("clinic_name", { length: 255 }),
  licenseNumber:  varchar("license_number", { length: 255 }),
  specialization: varchar("specialization", { length: 100 }),
  region:         regionTypeEnum("region").notNull().default("INT"),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id:                     uuid("id").primaryKey().defaultRandom(),
  userId:                 uuid("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  tier:                   tierTypeEnum("tier").notNull().default("free"),
  trialStartDate:         timestamp("trial_start_date", { withTimezone: true }),
  trialEndDate:           timestamp("trial_end_date", { withTimezone: true }),
  subscriptionStartDate:  timestamp("subscription_start_date", { withTimezone: true }),
  subscriptionEndDate:    timestamp("subscription_end_date", { withTimezone: true }),
  region:                 regionTypeEnum("region"),
  discountApplied:        decimal("discount_applied", { precision: 4, scale: 3 }).notNull().default("1.000"),
  autoRenew:              boolean("auto_renew").notNull().default(true),
  cancelledAt:            timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason:     text("cancellation_reason"),
  stripeCustomerId:       varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId:   varchar("stripe_subscription_id", { length: 255 }),
  createdAt:              timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueUser: unique().on(t.userId) }));

// 3. Patient profiles
export const patientProfiles = pgTable("patient_profiles", {
  id:               uuid("id").primaryKey().defaultRandom(),
  clinicianId:      uuid("clinician_id").notNull().references(() => userProfiles.id),
  patientName:      varchar("patient_name", { length: 255 }).notNull(),
  dateOfBirth:      date("date_of_birth").notNull(),
  gender:           genderTypeEnum("gender"),
  diagnosis:        diagnosisTypeEnum("diagnosis").notNull(),
  diagnosisDate:    date("diagnosis_date"),
  photoUrl:         text("photo_url"),
  nightscoutUrl:    text("nightscout_url"),
  nightscoutToken:  text("nightscout_token"),
  tdd:              decimal("tdd", { precision: 6, scale: 2 }),
  typicalBasalDose: decimal("typical_basal_dose", { precision: 6, scale: 2 }),
  glucoseTargetLow: decimal("glucose_target_low", { precision: 4, scale: 1 }).notNull().default("4.4"),
  glucoseTargetHigh:decimal("glucose_target_high", { precision: 4, scale: 1 }).notNull().default("10.0"),
  glucoseUnit:      varchar("glucose_unit", { length: 10 }).notNull().default("mmol"),
  isActive:         boolean("is_active").notNull().default(true),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniquePatient: unique().on(t.clinicianId, t.patientName) }));

// 4. Specialist module assignments
export const patientModules = pgTable("patient_modules", {
  id:          uuid("id").primaryKey().defaultRandom(),
  patientId:   uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  moduleType:  moduleTypeEnum("module_type").notNull(),
  ageGroup:    ageGroupTypeEnum("age_group"),
  trimester:   smallint("trimester"),
  cyclePhase:  cyclePhaseTypeEnum("cycle_phase"),
  isActive:    boolean("is_active").notNull().default(true),
  activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueModule: unique().on(t.patientId, t.moduleType) }));

// 5. Insulin profiles (curves & carb ratios)
export const insulinProfiles = pgTable("insulin_profiles", {
  id:               uuid("id").primaryKey().defaultRandom(),
  patientId:        uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  profileName:      varchar("profile_name", { length: 100 }).notNull().default("Default"),
  carbRatio:        decimal("carb_ratio", { precision: 5, scale: 2 }),
  isf:              decimal("isf", { precision: 5, scale: 2 }),
  glucoseTargetLow: decimal("glucose_target_low", { precision: 4, scale: 1 }),
  glucoseTargetHigh:decimal("glucose_target_high", { precision: 4, scale: 1 }),
  basalRates:       jsonb("basal_rates"),
  isActive:         boolean("is_active").notNull().default(true),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 6. Time-of-day ISF modifiers
export const todIsfModifiers = pgTable("tod_isf_modifiers", {
  id:            uuid("id").primaryKey().defaultRandom(),
  patientId:     uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  periodStart:   time("period_start").notNull(),
  periodEnd:     time("period_end").notNull(),
  isfMultiplier: decimal("isf_multiplier", { precision: 3, scale: 2 }).notNull().default("1.00"),
  label:         varchar("label", { length: 100 }),
  isEnabled:     boolean("is_enabled").notNull().default(false),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 7. Dose log
export const doseLog = pgTable("dose_log", {
  id:             uuid("id").primaryKey().defaultRandom(),
  patientId:      uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  insulinType:    insulinTypeEnum("insulin_type").notNull(),
  doseUnits:      decimal("dose_units", { precision: 6, scale: 2 }).notNull(),
  administeredAt: timestamp("administered_at", { withTimezone: true }).notNull(),
  doseReason:     varchar("dose_reason", { length: 50 }),
  carbsG:         decimal("carbs_g", { precision: 5, scale: 1 }),
  glucoseAtTime:  decimal("glucose_at_time", { precision: 4, scale: 1 }),
  notes:          text("notes"),
  iobAtTime:      decimal("iob_at_time", { precision: 6, scale: 3 }),
  createdBy:      uuid("created_by").references(() => userProfiles.id),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 8. IOB snapshots (cached calculations)
export const iobSnapshots = pgTable("iob_snapshots", {
  id:                uuid("id").primaryKey().defaultRandom(),
  patientId:         uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  calculatedAt:      timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  totalIob:          decimal("total_iob", { precision: 6, scale: 3 }).notNull(),
  stackingScore:     decimal("stacking_score", { precision: 5, scale: 2 }).notNull(),
  riskZone:          riskZoneTypeEnum("risk_zone").notNull(),
  doseBreakdown:     jsonb("dose_breakdown"),
  isfUsed:           decimal("isf_used", { precision: 5, scale: 2 }),
  icrUsed:           decimal("icr_used", { precision: 5, scale: 2 }),
  optimalNextDoseH:  decimal("optimal_next_dose_h", { precision: 4, scale: 1 }),
  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 9. Glucose readings (from Nightscout/Dexcom/Libre)
export const glucoseReadings = pgTable("glucose_readings", {
  id:          uuid("id").primaryKey().defaultRandom(),
  patientId:   uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  valueMmol:   decimal("value_mmol", { precision: 4, scale: 1 }).notNull(),
  valueMgdl:   decimal("value_mgdl", { precision: 6, scale: 1 }),
  trendArrow:  varchar("trend_arrow", { length: 20 }),
  source:      varchar("source", { length: 50 }).notNull().default("nightscout"),
  recordedAt:  timestamp("recorded_at", { withTimezone: true }).notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueReading: unique().on(t.patientId, t.recordedAt),
  patientTimeIdx: index("idx_glucose_patient_time").on(t.patientId, t.recordedAt),
}));

// 10. Patient media (photos, lab reports)
export const patientMedia = pgTable("patient_media", {
  id:            uuid("id").primaryKey().defaultRandom(),
  patientId:     uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  mediaType:     mediaTypeEnum("media_type").notNull(),
  fileType:      varchar("file_type", { length: 20 }),
  storagePath:   text("storage_path").notNull(),
  publicUrl:     text("public_url"),
  description:   varchar("description", { length: 255 }),
  fileSizeBytes: integer("file_size_bytes"),
  uploadedBy:    uuid("uploaded_by").references(() => userProfiles.id),
  uploadedAt:    timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:     timestamp("expires_at", { withTimezone: true }),
});

// 11. Caregiver shares
export const caregiverShares = pgTable("caregiver_shares", {
  id:              uuid("id").primaryKey().defaultRandom(),
  patientId:       uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  caregiverEmail:  varchar("caregiver_email", { length: 255 }).notNull(),
  permissionLevel: permissionLevelEnum("permission_level").notNull().default("view"),
  shareToken:      varchar("share_token", { length: 64 }).unique(),
  caregiverUserId: uuid("caregiver_user_id").references(() => userProfiles.id),
  isActive:        boolean("is_active").notNull().default(true),
  createdBy:       uuid("created_by").references(() => userProfiles.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:       timestamp("expires_at", { withTimezone: true }),
}, (t) => ({ uniqueShare: unique().on(t.patientId, t.caregiverEmail) }));

// 12. Appointments
export const appointments = pgTable("appointments", {
  id:              uuid("id").primaryKey().defaultRandom(),
  patientId:       uuid("patient_id").notNull().references(() => patientProfiles.id),
  clinicianId:     uuid("clinician_id").notNull().references(() => userProfiles.id),
  appointmentDate: timestamp("appointment_date", { withTimezone: true }).notNull(),
  purpose:         varchar("purpose", { length: 255 }),
  status:          apptStatusEnum("status").notNull().default("scheduled"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 13. Menstrual cycles
export const menstrualCycles = pgTable("menstrual_cycles", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  patientId:            uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  cycleStartDate:       date("cycle_start_date").notNull(),
  cycleLengthDays:      integer("cycle_length_days").notNull().default(28),
  currentPhase:         cyclePhaseTypeEnum("current_phase"),
  isfAdjustment:        decimal("isf_adjustment", { precision: 3, scale: 2 }).notNull().default("1.00"),
  icrAdjustment:        decimal("icr_adjustment", { precision: 3, scale: 2 }).notNull().default("1.00"),
  follicularIsfMult:    decimal("follicular_isf_mult", { precision: 3, scale: 2 }).default("1.10"),
  ovulationIsfMult:     decimal("ovulation_isf_mult", { precision: 3, scale: 2 }).default("1.00"),
  lutealIsfMult:        decimal("luteal_isf_mult", { precision: 3, scale: 2 }).default("0.80"),
  menstruationIsfMult:  decimal("menstruation_isf_mult", { precision: 3, scale: 2 }).default("1.15"),
  notes:                text("notes"),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueCycle: unique().on(t.patientId, t.cycleStartDate) }));

// 14. Audit log
export const auditLog = pgTable("audit_log", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").references(() => userProfiles.id),
  action:       varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId:   uuid("resource_id"),
  ipAddress:    inet("ip_address"),
  userAgent:    text("user_agent"),
  metadata:     jsonb("metadata"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 15. Telemetry (pending migration)
export const telemetryWaveGroupB = pgTable("telemetry_wave_groupb", {
  id:        uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patientProfiles.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  sessionId: uuid("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  subscription:    one(subscriptions, { fields: [userProfiles.id], references: [subscriptions.userId] }),
  patients:        many(patientProfiles),
  createdShares:   many(caregiverShares),
}));

export const patientProfilesRelations = relations(patientProfiles, ({ one, many }) => ({
  clinician:       one(userProfiles, { fields: [patientProfiles.clinicianId], references: [userProfiles.id] }),
  modules:         many(patientModules),
  insulinProfiles: many(insulinProfiles),
  doseLog:         many(doseLog),
  glucoseReadings: many(glucoseReadings),
  media:           many(patientMedia),
  caregiverShares: many(caregiverShares),
  appointments:    many(appointments),
  menstrualCycles: many(menstrualCycles),
  iobSnapshots:    many(iobSnapshots),
}));

export const doseLogRelations = relations(doseLog, ({ one }) => ({
  patient:   one(patientProfiles, { fields: [doseLog.patientId], references: [patientProfiles.id] }),
  createdBy: one(userProfiles, { fields: [doseLog.createdBy], references: [userProfiles.id] }),
}));

// ── Badges & Mira (moved from server/db/schema.ts) ───────────────────────────

export const badgeTierEnum = pgEnum("badge_tier", ["bronze", "silver", "gold", "platinum"]);

export const badges = pgTable("badges", {
  id:          uuid("id").primaryKey().defaultRandom(),
  slug:        varchar("slug", { length: 100 }).notNull().unique(),
  name:        varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  tier:        badgeTierEnum("tier").notNull().default("bronze"),
  iconEmoji:   varchar("icon_emoji", { length: 10 }).notNull().default("🏅"),
  criteria:    jsonb("criteria"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id:        uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  badgeId:   uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt:  timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueBadge: unique().on(t.patientId, t.badgeId) }));

export const miraConversations = pgTable("mira_conversations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  patientId:  uuid("patient_id").references(() => patientProfiles.id, { onDelete: "set null" }),
  userId:     uuid("user_id").references(() => userProfiles.id, { onDelete: "set null" }),
  messages:   jsonb("messages").notNull().default([]),
  tokenCount: integer("token_count").default(0),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
