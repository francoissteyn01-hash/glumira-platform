/**
 * GluMira™ Clinician Notes API Route
 * Version: 7.0.0
 *
 * GET    /api/clinician/notes?patientId=xxx   — list notes for a patient
 * POST   /api/clinician/notes                 — create a new note
 * PATCH  /api/clinician/notes                 — update an existing note
 * DELETE /api/clinician/notes?id=xxx          — delete a note
 *
 * Requires: authenticated clinician session (role = 'clinician' or 'admin')
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateNoteBody,
  validateCategory,
  validateFollowUpDate,
  sortNotesByDate,
  summariseNotes,
  type NoteCategory,
  type ClinicianNote,
} from "@/../../server/clinician/clinician-notes";

// ─── Supabase client ──────────────────────────────────────────

function getSupabase(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// ─── Auth guard ───────────────────────────────────────────────

async function getClinicianUser(req: NextRequest) {
  const supabase = getSupabase(req);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["clinician", "admin"].includes(profile.role ?? "")) return null;
  return { userId: user.id, role: profile.role as string };
}

// ─── GET — list notes for a patient ──────────────────────────

export async function GET(req: NextRequest) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const supabase = getSupabase(req);
  const { data, error } = await supabase
    .from("clinician_notes")
    .select("*")
    .eq("patient_user_id", patientId)
    .eq("clinician_user_id", clinician.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notes: ClinicianNote[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    patientUserId: r.patient_user_id as string,
    clinicianUserId: r.clinician_user_id as string,
    category: r.category as NoteCategory,
    body: r.body as string,
    followUpDate: r.follow_up_date as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  const sorted = sortNotesByDate(notes, "desc");
  return NextResponse.json({ notes: sorted, summary: summariseNotes(sorted) });
}

// ─── POST — create note ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { patientUserId, category, body: noteBody, followUpDate } = body as {
    patientUserId?: string;
    category?: string;
    body?: string;
    followUpDate?: string | null;
  };

  if (!patientUserId) return NextResponse.json({ error: "patientUserId required" }, { status: 400 });

  const bodyErr = validateNoteBody(noteBody ?? "");
  if (bodyErr) return NextResponse.json({ error: bodyErr }, { status: 400 });

  const catErr = validateCategory(category ?? "");
  if (catErr) return NextResponse.json({ error: catErr }, { status: 400 });

  const dateErr = validateFollowUpDate(followUpDate);
  if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });

  const supabase = getSupabase(req);
  const { data, error } = await supabase
    .from("clinician_notes")
    .insert({
      patient_user_id: patientUserId,
      clinician_user_id: clinician.userId,
      category,
      body: noteBody,
      follow_up_date: followUpDate ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data }, { status: 201 });
}

// ─── PATCH — update note ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, category, body: noteBody, followUpDate } = body as {
    id?: string;
    category?: string;
    body?: string;
    followUpDate?: string | null;
  };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (noteBody !== undefined) {
    const err = validateNoteBody(noteBody);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updates.body = noteBody;
  }
  if (category !== undefined) {
    const err = validateCategory(category);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updates.category = category;
  }
  if (followUpDate !== undefined) {
    const err = validateFollowUpDate(followUpDate);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updates.follow_up_date = followUpDate;
  }

  const supabase = getSupabase(req);
  const { data, error } = await supabase
    .from("clinician_notes")
    .update(updates)
    .eq("id", id)
    .eq("clinician_user_id", clinician.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Note not found or forbidden" }, { status: 404 });

  return NextResponse.json({ note: data });
}

// ─── DELETE — delete note ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const clinician = await getClinicianUser(req);
  if (!clinician) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabase(req);
  const { error, count } = await supabase
    .from("clinician_notes")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("clinician_user_id", clinician.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Note not found or forbidden" }, { status: 404 });

  return NextResponse.json({ success: true });
}
