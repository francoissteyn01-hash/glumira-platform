"use client";
/**
 * GluMira™ useClinicianNotes Hook
 * Version: 7.0.0
 *
 * Fetches, adds, and deletes clinician notes for a given patient.
 * Consumes: GET/POST/DELETE /api/clinician/notes
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────

type NoteCategory = "observation" | "adjustment" | "concern" | "praise" | "school";

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

export interface NotesSummary {
  total: number;
  byCategory: Record<NoteCategory, number>;
  openConcerns: number;
  upcomingFollowUps: number;
  lastNoteDate: string | null;
}

interface AddNotePayload {
  patientUserId: string;
  category: NoteCategory;
  body: string;
  followUpDate?: string | null;
}

interface UseClinicianNotesReturn {
  notes: ClinicianNote[];
  summary: NotesSummary | null;
  loading: boolean;
  error: string | null;
  addNote: (payload: AddNotePayload) => Promise<ClinicianNote>;
  deleteNote: (id: string) => Promise<void>;
  refresh: () => void;
}

// ─── Supabase client ──────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.access_token ?? "";
}

// ─── Hook ─────────────────────────────────────────────────────

export function useClinicianNotes(patientId: string): UseClinicianNotesReturn {
  const [notes, setNotes] = useState<ClinicianNote[]>([]);
  const [summary, setSummary] = useState<NotesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch notes ────────────────────────────────────────────

  const fetchNotes = useCallback(async () => {
    if (!patientId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const res = await fetch(
        `/api/clinician/notes?patientId=${encodeURIComponent(patientId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { notes: ClinicianNote[]; summary: NotesSummary };
      setNotes(data.notes);
      setSummary(data.summary);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchNotes();
    return () => abortRef.current?.abort();
  }, [fetchNotes]);

  // ── Add note ───────────────────────────────────────────────

  const addNote = useCallback(async (payload: AddNotePayload): Promise<ClinicianNote> => {
    const token = await getAuthToken();
    const res = await fetch("/api/clinician/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const { note } = await res.json() as { note: ClinicianNote };

    // Optimistic update
    setNotes((prev) => [note, ...prev]);
    setSummary((prev) => {
      if (!prev) return prev;
      const cat = note.category;
      const newByCategory = { ...prev.byCategory, [cat]: (prev.byCategory[cat] ?? 0) + 1 };
      const openConcerns = cat === "concern" ? prev.openConcerns + 1 : prev.openConcerns;
      const upcomingFollowUps = note.followUpDate
        ? prev.upcomingFollowUps + 1
        : prev.upcomingFollowUps;
      return {
        ...prev,
        total: prev.total + 1,
        byCategory: newByCategory,
        openConcerns,
        upcomingFollowUps,
        lastNoteDate: note.createdAt,
      };
    });

    return note;
  }, []);

  // ── Delete note ────────────────────────────────────────────

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    const token = await getAuthToken();
    const res = await fetch(`/api/clinician/notes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    // Optimistic update
    setNotes((prev) => {
      const removed = prev.find((n) => n.id === id);
      const next = prev.filter((n) => n.id !== id);
      if (removed) {
        setSummary((s) => {
          if (!s) return s;
          const cat = removed.category;
          const newByCategory = { ...s.byCategory, [cat]: Math.max(0, (s.byCategory[cat] ?? 1) - 1) };
          const openConcerns = cat === "concern" ? Math.max(0, s.openConcerns - 1) : s.openConcerns;
          const upcomingFollowUps = removed.followUpDate
            ? Math.max(0, s.upcomingFollowUps - 1)
            : s.upcomingFollowUps;
          return {
            ...s,
            total: Math.max(0, s.total - 1),
            byCategory: newByCategory,
            openConcerns,
            upcomingFollowUps,
            lastNoteDate: next.length > 0 ? next[0].createdAt : null,
          };
        });
      }
      return next;
    });
  }, []);

  return {
    notes,
    summary,
    loading,
    error,
    addNote,
    deleteNote,
    refresh: fetchNotes,
  };
}

export default useClinicianNotes;
