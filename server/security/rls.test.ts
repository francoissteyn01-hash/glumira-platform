/**
 * GluMira™ RLS Policy Test Suite
 * Version: 7.0.0
 *
 * Tests Row-Level Security policy logic for all 6 GluMira tables:
 *  1. patient_profiles
 *  2. glucose_readings
 *  3. doses
 *  4. beta_feedback
 *  5. notifications
 *  6. beta_participants
 *
 * These are unit tests of the policy LOGIC (pure functions that mirror
 * the SQL WHERE clauses). They do NOT require a live Supabase connection.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";

// ─── Policy logic mirrors (pure TypeScript) ───────────────────
// Each function mirrors the SQL RLS policy for that table/operation.
// auth.uid() is represented as `actorId`.

// patient_profiles
const canReadProfile = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canUpdateProfile = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

// glucose_readings
const canReadReading = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canInsertReading = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canDeleteReading = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

// doses
const canReadDose = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canInsertDose = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canDeleteDose = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

// beta_feedback
const canReadFeedback = (
  actorId: string,
  rowUserId: string,
  actorRole: string
) => actorId === rowUserId || actorRole === "admin";

const canInsertFeedback = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

// notifications
const canReadNotification = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

const canUpdateNotification = (actorId: string, rowUserId: string) =>
  actorId === rowUserId;

// beta_participants
const canReadParticipant = (
  actorId: string,
  rowUserId: string,
  actorRole: string
) => actorId === rowUserId || actorRole === "admin";

const canWriteParticipant = (actorRole: string) =>
  actorRole === "admin";

// ─── Tests ────────────────────────────────────────────────────

const ALICE = "user-alice-001";
const BOB   = "user-bob-002";
const ADMIN = "user-admin-999";

describe("RLS — patient_profiles", () => {
  it("Alice can read her own profile", () => {
    expect(canReadProfile(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot read Alice's profile", () => {
    expect(canReadProfile(BOB, ALICE)).toBe(false);
  });
  it("Alice can update her own profile", () => {
    expect(canUpdateProfile(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot update Alice's profile", () => {
    expect(canUpdateProfile(BOB, ALICE)).toBe(false);
  });
});

describe("RLS — glucose_readings", () => {
  it("Alice can read her own readings", () => {
    expect(canReadReading(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot read Alice's readings", () => {
    expect(canReadReading(BOB, ALICE)).toBe(false);
  });
  it("Alice can insert her own readings", () => {
    expect(canInsertReading(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot insert readings for Alice", () => {
    expect(canInsertReading(BOB, ALICE)).toBe(false);
  });
  it("Alice can delete her own readings", () => {
    expect(canDeleteReading(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot delete Alice's readings", () => {
    expect(canDeleteReading(BOB, ALICE)).toBe(false);
  });
});

describe("RLS — doses", () => {
  it("Alice can read her own doses", () => {
    expect(canReadDose(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot read Alice's doses", () => {
    expect(canReadDose(BOB, ALICE)).toBe(false);
  });
  it("Alice can insert her own doses", () => {
    expect(canInsertDose(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot insert doses for Alice", () => {
    expect(canInsertDose(BOB, ALICE)).toBe(false);
  });
  it("Alice can delete her own doses", () => {
    expect(canDeleteDose(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot delete Alice's doses", () => {
    expect(canDeleteDose(BOB, ALICE)).toBe(false);
  });
});

describe("RLS — beta_feedback", () => {
  it("Alice can read her own feedback", () => {
    expect(canReadFeedback(ALICE, ALICE, "patient")).toBe(true);
  });
  it("Bob cannot read Alice's feedback", () => {
    expect(canReadFeedback(BOB, ALICE, "patient")).toBe(false);
  });
  it("Admin can read any feedback", () => {
    expect(canReadFeedback(ADMIN, ALICE, "admin")).toBe(true);
    expect(canReadFeedback(ADMIN, BOB, "admin")).toBe(true);
  });
  it("Alice can insert her own feedback", () => {
    expect(canInsertFeedback(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot insert feedback for Alice", () => {
    expect(canInsertFeedback(BOB, ALICE)).toBe(false);
  });
});

describe("RLS — notifications", () => {
  it("Alice can read her own notifications", () => {
    expect(canReadNotification(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot read Alice's notifications", () => {
    expect(canReadNotification(BOB, ALICE)).toBe(false);
  });
  it("Alice can update (mark read) her own notifications", () => {
    expect(canUpdateNotification(ALICE, ALICE)).toBe(true);
  });
  it("Bob cannot update Alice's notifications", () => {
    expect(canUpdateNotification(BOB, ALICE)).toBe(false);
  });
});

describe("RLS — beta_participants", () => {
  it("Alice can read her own participant record", () => {
    expect(canReadParticipant(ALICE, ALICE, "patient")).toBe(true);
  });
  it("Bob cannot read Alice's participant record", () => {
    expect(canReadParticipant(BOB, ALICE, "patient")).toBe(false);
  });
  it("Admin can read any participant record", () => {
    expect(canReadParticipant(ADMIN, ALICE, "admin")).toBe(true);
    expect(canReadParticipant(ADMIN, BOB, "admin")).toBe(true);
  });
  it("Admin can write participant records", () => {
    expect(canWriteParticipant("admin")).toBe(true);
  });
  it("Patient cannot write participant records", () => {
    expect(canWriteParticipant("patient")).toBe(false);
  });
  it("Clinician cannot write participant records", () => {
    expect(canWriteParticipant("clinician")).toBe(false);
  });
});

// ─── Cross-table isolation ────────────────────────────────────

describe("RLS — cross-table isolation invariants", () => {
  const tables = [
    { name: "glucose_readings", fn: canReadReading },
    { name: "doses",            fn: canReadDose },
    { name: "notifications",    fn: canReadNotification },
  ];

  tables.forEach(({ name, fn }) => {
    it(`${name}: owner can always read own rows`, () => {
      expect(fn(ALICE, ALICE)).toBe(true);
    });
    it(`${name}: non-owner is always denied`, () => {
      expect(fn(BOB, ALICE)).toBe(false);
      expect(fn(ADMIN, ALICE)).toBe(false); // admin has no special access here
    });
  });
});
