/**
 * GluMira™ Clinician Notes Test Suite
 * Version: 7.0.0
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateNoteBody,
  validateCategory,
  validateFollowUpDate,
  summariseNotes,
  formatNoteForExport,
  filterNotesByCategory,
  sortNotesByDate,
  ClinicianNotesService,
  type ClinicianNote,
  type StorageAdapter,
  type NoteCategory,
} from "./clinician-notes";

// ─── Fixtures ─────────────────────────────────────────────────

const makeNote = (overrides: Partial<ClinicianNote> = {}): ClinicianNote => ({
  id: "note-001",
  patientUserId: "patient-001",
  clinicianUserId: "clinician-001",
  category: "observation",
  body: "Patient is managing well with current regime.",
  followUpDate: null,
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
  ...overrides,
});

// ─── validateNoteBody ─────────────────────────────────────────

describe("validateNoteBody", () => {
  it("returns null for valid body", () => {
    expect(validateNoteBody("Patient is doing well today.")).toBeNull();
  });
  it("returns error for empty string", () => {
    expect(validateNoteBody("")).not.toBeNull();
  });
  it("returns error for body shorter than 5 chars", () => {
    expect(validateNoteBody("abc")).not.toBeNull();
  });
  it("returns error for body longer than 2000 chars", () => {
    expect(validateNoteBody("x".repeat(2001))).not.toBeNull();
  });
  it("accepts exactly 5 characters", () => {
    expect(validateNoteBody("abcde")).toBeNull();
  });
  it("accepts exactly 2000 characters", () => {
    expect(validateNoteBody("x".repeat(2000))).toBeNull();
  });
});

// ─── validateCategory ─────────────────────────────────────────

describe("validateCategory", () => {
  const valid = ["observation", "adjustment", "concern", "praise", "school"];
  valid.forEach((c) => {
    it(`accepts category: ${c}`, () => {
      expect(validateCategory(c)).toBeNull();
    });
  });
  it("rejects unknown category", () => {
    expect(validateCategory("unknown")).not.toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateCategory("")).not.toBeNull();
  });
});

// ─── validateFollowUpDate ─────────────────────────────────────

describe("validateFollowUpDate", () => {
  it("returns null for null (optional)", () => {
    expect(validateFollowUpDate(null)).toBeNull();
  });
  it("returns null for undefined (optional)", () => {
    expect(validateFollowUpDate(undefined)).toBeNull();
  });
  it("returns error for past date", () => {
    expect(validateFollowUpDate("2020-01-01")).not.toBeNull();
  });
  it("returns error for invalid date string", () => {
    expect(validateFollowUpDate("not-a-date")).not.toBeNull();
  });
  it("accepts future date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(validateFollowUpDate(future)).toBeNull();
  });
});

// ─── summariseNotes ───────────────────────────────────────────

describe("summariseNotes", () => {
  it("returns zero counts for empty array", () => {
    const s = summariseNotes([]);
    expect(s.total).toBe(0);
    expect(s.hasOpenConcerns).toBe(false);
    expect(s.nextFollowUp).toBeNull();
  });

  it("counts notes by category", () => {
    const notes = [
      makeNote({ category: "observation" }),
      makeNote({ category: "concern" }),
      makeNote({ category: "concern" }),
    ];
    const s = summariseNotes(notes);
    expect(s.total).toBe(3);
    expect(s.byCategory.observation).toBe(1);
    expect(s.byCategory.concern).toBe(2);
    expect(s.hasOpenConcerns).toBe(true);
  });

  it("identifies next follow-up date", () => {
    const soon  = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const later = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const notes = [
      makeNote({ followUpDate: later }),
      makeNote({ followUpDate: soon }),
    ];
    const s = summariseNotes(notes);
    expect(s.nextFollowUp).toBe(soon);
  });

  it("ignores past follow-up dates", () => {
    const notes = [makeNote({ followUpDate: "2020-01-01T00:00:00.000Z" })];
    const s = summariseNotes(notes);
    expect(s.nextFollowUp).toBeNull();
  });
});

// ─── formatNoteForExport ──────────────────────────────────────

describe("formatNoteForExport", () => {
  it("includes category and body", () => {
    const note = makeNote();
    const output = formatNoteForExport(note);
    expect(output).toContain("[OBSERVATION]");
    expect(output).toContain(note.body);
  });

  it("includes follow-up date when present", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const note = makeNote({ followUpDate: future });
    const output = formatNoteForExport(note);
    expect(output).toContain("Follow-up:");
  });

  it("omits follow-up line when null", () => {
    const note = makeNote({ followUpDate: null });
    const output = formatNoteForExport(note);
    expect(output).not.toContain("Follow-up:");
  });
});

// ─── filterNotesByCategory ────────────────────────────────────

describe("filterNotesByCategory", () => {
  const notes = [
    makeNote({ id: "1", category: "observation" }),
    makeNote({ id: "2", category: "concern" }),
    makeNote({ id: "3", category: "observation" }),
  ];

  it("filters to matching category", () => {
    const result = filterNotesByCategory(notes, "observation");
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.category === "observation")).toBe(true);
  });

  it("returns empty array when no match", () => {
    const result = filterNotesByCategory(notes, "praise");
    expect(result).toHaveLength(0);
  });
});

// ─── sortNotesByDate ──────────────────────────────────────────

describe("sortNotesByDate", () => {
  const notes = [
    makeNote({ id: "a", createdAt: "2026-03-01T00:00:00.000Z" }),
    makeNote({ id: "c", createdAt: "2026-03-03T00:00:00.000Z" }),
    makeNote({ id: "b", createdAt: "2026-03-02T00:00:00.000Z" }),
  ];

  it("sorts descending by default", () => {
    const sorted = sortNotesByDate(notes);
    expect(sorted[0].id).toBe("c");
    expect(sorted[2].id).toBe("a");
  });

  it("sorts ascending when specified", () => {
    const sorted = sortNotesByDate(notes, "asc");
    expect(sorted[0].id).toBe("a");
    expect(sorted[2].id).toBe("c");
  });

  it("does not mutate the original array", () => {
    const original = [...notes];
    sortNotesByDate(notes, "asc");
    expect(notes[0].id).toBe(original[0].id);
  });
});

// ─── ClinicianNotesService ────────────────────────────────────

function makeStorage(overrides: Partial<StorageAdapter> = {}): StorageAdapter {
  return {
    createNote: vi.fn(async (input) => makeNote({
      id: "new-001",
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    getNotesByPatient: vi.fn(async () => [makeNote()]),
    getNoteById: vi.fn(async (id) => id === "note-001" ? makeNote() : null),
    updateNote: vi.fn(async (input) => makeNote({ ...input })),
    deleteNote: vi.fn(async () => true),
    ...overrides,
  };
}

describe("ClinicianNotesService.createNote", () => {
  it("creates note with valid input", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.createNote({
      patientUserId: "p1",
      clinicianUserId: "c1",
      category: "observation",
      body: "Patient is doing well.",
    });
    expect(result.note).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("returns error for invalid body", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.createNote({
      patientUserId: "p1",
      clinicianUserId: "c1",
      category: "observation",
      body: "hi",
    });
    expect(result.error).toBeDefined();
    expect(result.note).toBeUndefined();
  });

  it("returns error for invalid category", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.createNote({
      patientUserId: "p1",
      clinicianUserId: "c1",
      category: "invalid" as NoteCategory,
      body: "Valid body text here.",
    });
    expect(result.error).toBeDefined();
  });
});

describe("ClinicianNotesService.getPatientNotes", () => {
  it("returns notes and summary", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.getPatientNotes("p1", "c1");
    expect(Array.isArray(result.notes)).toBe(true);
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
  });
});

describe("ClinicianNotesService.deleteNote", () => {
  it("deletes note owned by clinician", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.deleteNote("note-001", "clinician-001");
    expect(result.success).toBe(true);
  });

  it("rejects deletion by different clinician", async () => {
    const svc = new ClinicianNotesService(makeStorage());
    const result = await svc.deleteNote("note-001", "other-clinician");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("returns error when note not found", async () => {
    const storage = makeStorage({ getNoteById: vi.fn(async () => null) });
    const svc = new ClinicianNotesService(storage);
    const result = await svc.deleteNote("nonexistent", "clinician-001");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});
