"use client";
/**
 * GluMira™ ClinicianNotesPanel
 * Version: 7.0.0
 *
 * Displays, adds, edits, and deletes clinician notes for a given patient.
 * Consumes: useClinicianNotes hook → /api/clinician/notes
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useState } from "react";
import { useClinicianNotes } from "@/hooks/useClinicianNotes";

// ─── Types ────────────────────────────────────────────────────

type NoteCategory = "observation" | "adjustment" | "concern" | "praise" | "school";

interface ClinicianNote {
  id: string;
  category: NoteCategory;
  body: string;
  followUpDate: string | null;
  createdAt: string;
}

interface Props {
  patientId: string;
  patientName?: string;
}

// ─── Category config ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<NoteCategory, { label: string; colour: string; icon: string }> = {
  observation: { label: "Observation",  colour: "bg-blue-100 text-blue-800",   icon: "👁" },
  adjustment:  { label: "Adjustment",   colour: "bg-yellow-100 text-yellow-800", icon: "⚙️" },
  concern:     { label: "Concern",      colour: "bg-red-100 text-red-800",     icon: "⚠️" },
  praise:      { label: "Praise",       colour: "bg-green-100 text-green-800", icon: "⭐" },
  school:      { label: "School",       colour: "bg-purple-100 text-purple-800", icon: "🏫" },
};

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatFollowUp(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = formatDate(iso);
  if (diff < 0) return `${label} (overdue)`;
  if (diff === 0) return `${label} (today)`;
  if (diff === 1) return `${label} (tomorrow)`;
  return `${label} (in ${diff}d)`;
}

// ─── Component ────────────────────────────────────────────────

export function ClinicianNotesPanel({ patientId, patientName }: Props) {
  const { notes, summary, loading, error, addNote, deleteNote, refresh } =
    useClinicianNotes(patientId);

  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<NoteCategory>("observation");
  const [formBody, setFormBody] = useState("");
  const [formFollowUp, setFormFollowUp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<NoteCategory | "all">("all");

  // ── Submit new note ────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (formBody.trim().length < 5) {
      setFormError("Note must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await addNote({
        patientUserId: patientId,
        category: formCategory,
        body: formBody.trim(),
        followUpDate: formFollowUp || null,
      });
      setFormBody("");
      setFormFollowUp("");
      setFormCategory("observation");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete note ────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
    } finally {
      setDeletingId(null);
    }
  }

  // ── Filtered notes ─────────────────────────────────────────

  const filtered = filterCat === "all" ? notes : notes.filter((n) => n.category === filterCat);

  // ─── Render ────────────────────────────────────────────────

  return (
    <section
      data-testid="clinician-notes-panel"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Clinician Notes
            {patientName && (
              <span className="ml-2 text-slate-500 font-normal text-sm">— {patientName}</span>
            )}
          </h2>
          {summary && (
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.total} note{summary.total !== 1 ? "s" : ""}
              {summary.openConcerns > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  {summary.openConcerns} open concern{summary.openConcerns !== 1 ? "s" : ""}
                </span>
              )}
              {summary.upcomingFollowUps > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  {summary.upcomingFollowUps} follow-up{summary.upcomingFollowUps !== 1 ? "s" : ""} due
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="text-slate-400 hover:text-slate-600 text-sm px-2 py-1 rounded"
            title="Refresh notes"
          >
            ↻
          </button>
          <button
            data-testid="add-note-btn"
            onClick={() => setShowForm((v) => !v)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ Add Note"}
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <form
          data-testid="note-form"
          onSubmit={handleSubmit}
          className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                data-testid="note-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as NoteCategory)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Follow-up Date <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="date"
                data-testid="note-followup"
                value={formFollowUp}
                onChange={(e) => setFormFollowUp(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Note <span className="text-slate-400">({formBody.length}/2000)</span>
            </label>
            <textarea
              data-testid="note-body"
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Enter clinical observation, adjustment, or concern…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {formError && (
            <p className="text-red-600 text-xs">{formError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-600 text-sm px-4 py-1.5 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="note-submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition"
            >
              {submitting ? "Saving…" : "Save Note"}
            </button>
          </div>
        </form>
      )}

      {/* Category Filter */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCat("all")}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              filterCat === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
          >
            All ({notes.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => {
            const count = notes.filter((n) => n.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  filterCat === cat
                    ? "bg-slate-800 text-white border-slate-800"
                    : "text-slate-600 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Notes List */}
      {loading && (
        <div className="text-center py-8 text-slate-400 text-sm">Loading notes…</div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          {notes.length === 0
            ? "No notes yet. Add the first note for this patient."
            : "No notes in this category."}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="space-y-3" data-testid="notes-list">
          {filtered.map((note: ClinicianNote) => {
            const cfg = CATEGORY_CONFIG[note.category];
            const followUpStr = formatFollowUp(note.followUpDate);
            const isOverdue = note.followUpDate && new Date(note.followUpDate) < new Date();
            return (
              <li
                key={note.id}
                data-testid="note-item"
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.colour}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                    {followUpStr && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        📅 {followUpStr}
                      </span>
                    )}
                  </div>
                  <button
                    data-testid="delete-note-btn"
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="text-slate-300 hover:text-red-500 transition text-lg leading-none disabled:opacity-40 flex-shrink-0"
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {note.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ClinicianNotesPanel;
