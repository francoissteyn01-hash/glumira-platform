/**
 * GluMira™ Clinician Notes Module
 * Version: 7.0.0
 *
 * Manages clinician-authored notes attached to patient profiles.
 * Notes are structured with a category, body, and optional follow-up date.
 *
 * Categories:
 *  - observation   : General clinical observation
 *  - adjustment    : Insulin/regime adjustment recommendation
 *  - concern       : Flagged concern requiring follow-up
 *  - praise        : Positive reinforcement for patient
 *  - school        : School care plan related note
 *
 * All pure functions are exported for unit testing.
 * DB operations are abstracted via a StorageAdapter interface.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────

export type NoteCategory =
  | "observation"
  | "adjustment"
  | "concern"
  | "praise"
  | "school";

export interface ClinicianNote {
  id: string;
  patientUserId: string;
  clinicianUserId: string;
  category: NoteCategory;
  body: string;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  patientUserId: string;
  clinicianUserId: string;
  category: NoteCategory;
  body: string;
  followUpDate?: string | null;
}

export interface UpdateNoteInput {
  id: string;
  clinicianUserId: string;
  category?: NoteCategory;
  body?: string;
  followUpDate?: string | null;
}

export interface StorageAdapter {
  createNote(input: CreateNoteInput): Promise<ClinicianNote>;
  getNotesByPatient(patientUserId: string, clinicianUserId: string): Promise<ClinicianNote[]>;
  getNoteById(id: string): Promise<ClinicianNote | null>;
  updateNote(input: UpdateNoteInput): Promise<ClinicianNote | null>;
  deleteNote(id: string, clinicianUserId: string): Promise<boolean>;
}

// ─── Validation ───────────────────────────────────────────────

export const VALID_CATEGORIES: NoteCategory[] = [
  "observation",
  "adjustment",
  "concern",
  "praise",
  "school",
];

export function validateNoteBody(body: string): string | null {
  if (!body || typeof body !== "string") return "body is required";
  const trimmed = body.trim();
  if (trimmed.length < 5) return "body must be at least 5 characters";
  if (trimmed.length > 2000) return "body must not exceed 2000 characters";
  return null;
}

export function validateCategory(category: string): string | null {
  if (!VALID_CATEGORIES.includes(category as NoteCategory)) {
    return `category must be one of: ${VALID_CATEGORIES.join(", ")}`;
  }
  return null;
}

export function validateFollowUpDate(date: string | null | undefined): string | null {
  if (!date) return null; // optional
  const d = new Date(date);
  if (isNaN(d.getTime())) return "followUpDate must be a valid ISO date";
  if (d < new Date()) return "followUpDate must be in the future";
  return null;
}

// ─── Note summary helpers ─────────────────────────────────────

export function summariseNotes(notes: ClinicianNote[]): {
  total: number;
  byCategory: Record<NoteCategory, number>;
  hasOpenConcerns: boolean;
  nextFollowUp: string | null;
} {
  const byCategory = VALID_CATEGORIES.reduce(
    (acc, c) => ({ ...acc, [c]: 0 }),
    {} as Record<NoteCategory, number>
  );

  let nextFollowUp: string | null = null;
  const now = new Date();

  for (const note of notes) {
    byCategory[note.category] = (byCategory[note.category] ?? 0) + 1;
    if (note.followUpDate) {
      const d = new Date(note.followUpDate);
      if (d >= now) {
        if (!nextFollowUp || d < new Date(nextFollowUp)) {
          nextFollowUp = note.followUpDate;
        }
      }
    }
  }

  return {
    total: notes.length,
    byCategory,
    hasOpenConcerns: byCategory.concern > 0,
    nextFollowUp,
  };
}

export function formatNoteForExport(note: ClinicianNote): string {
  const lines = [
    `[${note.category.toUpperCase()}] ${new Date(note.createdAt).toLocaleDateString()}`,
    note.body,
  ];
  if (note.followUpDate) {
    lines.push(`Follow-up: ${new Date(note.followUpDate).toLocaleDateString()}`);
  }
  return lines.join("\n");
}

export function filterNotesByCategory(
  notes: ClinicianNote[],
  category: NoteCategory
): ClinicianNote[] {
  return notes.filter((n) => n.category === category);
}

export function sortNotesByDate(
  notes: ClinicianNote[],
  order: "asc" | "desc" = "desc"
): ClinicianNote[] {
  return [...notes].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return order === "desc" ? -diff : diff;
  });
}

// ─── Service ──────────────────────────────────────────────────

export class ClinicianNotesService {
  constructor(private readonly storage: StorageAdapter) {}

  async createNote(input: CreateNoteInput): Promise<{ note?: ClinicianNote; error?: string }> {
    const bodyErr = validateNoteBody(input.body);
    if (bodyErr) return { error: bodyErr };

    const catErr = validateCategory(input.category);
    if (catErr) return { error: catErr };

    const dateErr = validateFollowUpDate(input.followUpDate);
    if (dateErr) return { error: dateErr };

    const note = await this.storage.createNote(input);
    return { note };
  }

  async getPatientNotes(
    patientUserId: string,
    clinicianUserId: string
  ): Promise<{ notes: ClinicianNote[]; summary: ReturnType<typeof summariseNotes> }> {
    const notes = await this.storage.getNotesByPatient(patientUserId, clinicianUserId);
    const sorted = sortNotesByDate(notes, "desc");
    return { notes: sorted, summary: summariseNotes(sorted) };
  }

  async updateNote(
    input: UpdateNoteInput
  ): Promise<{ note?: ClinicianNote | null; error?: string }> {
    if (input.body) {
      const bodyErr = validateNoteBody(input.body);
      if (bodyErr) return { error: bodyErr };
    }
    if (input.category) {
      const catErr = validateCategory(input.category);
      if (catErr) return { error: catErr };
    }
    if (input.followUpDate !== undefined) {
      const dateErr = validateFollowUpDate(input.followUpDate);
      if (dateErr) return { error: dateErr };
    }

    const note = await this.storage.updateNote(input);
    return { note };
  }

  async deleteNote(
    id: string,
    clinicianUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await this.storage.getNoteById(id);
    if (!existing) return { success: false, error: "Note not found" };
    if (existing.clinicianUserId !== clinicianUserId) {
      return { success: false, error: "Forbidden: note belongs to another clinician" };
    }
    const success = await this.storage.deleteNote(id, clinicianUserId);
    return { success };
  }
}
