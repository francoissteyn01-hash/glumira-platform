/**
 * GluMira — Clinician Notes Page
 *
 * Allows clinicians to view, create, and manage patient notes.
 * Supports filtering by patient and note type.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface ClinicianNote {
  id: string;
  patientId: string;
  patientName: string;
  type: "consultation" | "follow-up" | "adjustment" | "alert" | "general";
  content: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_BADGES: Record<string, string> = {
  consultation: "bg-blue-100 text-blue-700",
  "follow-up": "bg-green-100 text-green-700",
  adjustment: "bg-amber-100 text-amber-700",
  alert: "bg-red-100 text-red-700",
  general: "bg-gray-100 text-gray-700",
};

export default function ClinicianNotesPage() {
  const [notes, setNotes] = useState<ClinicianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [newNote, setNewNote] = useState({ patientId: "", type: "general", content: "" });
  const [showForm, setShowForm] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/clinician/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clinician/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (res.ok) {
        setNewNote({ patientId: "", type: "general", content: "" });
        setShowForm(false);
        fetchNotes();
      }
    } catch {
      // silent
    }
  };

  const filtered = notes;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clinician Notes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">All types</option>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="adjustment">Adjustment</option>
            <option value="alert">Alert</option>
            <option value="general">General</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "New Note"}
          </button>
        </div>
      </div>

      {/* New Note Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Patient ID</label>
              <input
                type="text"
                value={newNote.patientId}
                onChange={(e) => setNewNote({ ...newNote, patientId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={newNote.type}
                onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="adjustment">Adjustment</option>
                <option value="alert">Alert</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Save Note
          </button>
        </form>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No notes found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <div key={note.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {note.patientName || `Patient ${note.patientId}`}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TYPE_BADGES[note.type] || TYPE_BADGES.general
                    }`}
                  >
                    {note.type}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
