/**
 * GluMira™ Beta Feedback API Route
 * Version: 7.0.0
 * Route: POST /api/beta/feedback
 *
 * Accepts structured feedback from beta participants and persists to Supabase.
 * Validates input, rate-limits per participant (5 submissions/day),
 * and writes an audit log entry.
 *
 * Body: { participantId, category, rating, comment }
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type FeedbackCategory =
  | "iob_chart"
  | "glucose_timeline"
  | "school_care_plan"
  | "general"
  | "bug";

const VALID_CATEGORIES: FeedbackCategory[] = [
  "iob_chart",
  "glucose_timeline",
  "school_care_plan",
  "general",
  "bug",
];

interface FeedbackPayload {
  participantId: string;
  category: FeedbackCategory;
  rating: number;
  comment: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validatePayload(body: unknown): { data?: FeedbackPayload; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    return { errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const b = body as Record<string, unknown>;

  // participantId
  if (!b.participantId || typeof b.participantId !== "string" || b.participantId.trim().length < 2) {
    errors.push({ field: "participantId", message: "participantId must be a non-empty string" });
  }

  // category
  if (!b.category || !VALID_CATEGORIES.includes(b.category as FeedbackCategory)) {
    errors.push({
      field: "category",
      message: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  // rating
  if (typeof b.rating !== "number" || b.rating < 1 || b.rating > 5 || !Number.isInteger(b.rating)) {
    errors.push({ field: "rating", message: "rating must be an integer between 1 and 5" });
  }

  // comment
  if (typeof b.comment !== "string" || b.comment.trim().length < 5) {
    errors.push({ field: "comment", message: "comment must be at least 5 characters" });
  }
  if (typeof b.comment === "string" && b.comment.length > 2000) {
    errors.push({ field: "comment", message: "comment must be under 2000 characters" });
  }

  if (errors.length > 0) return { errors };

  return {
    data: {
      participantId: (b.participantId as string).trim(),
      category: b.category as FeedbackCategory,
      rating: b.rating as number,
      comment: (b.comment as string).trim(),
    },
    errors: [],
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate
  const { data, errors } = validatePayload(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { participantId, category, rating, comment } = data!;

  // Supabase client
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Rate limit: max 5 submissions per participant per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from("beta_feedback")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .gte("created_at", todayStart.toISOString());

  if (countError) {
    console.error("Rate limit check failed:", countError.message);
    return NextResponse.json({ error: "Service error" }, { status: 500 });
  }

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Rate limit: maximum 5 feedback submissions per day" },
      { status: 429 }
    );
  }

  // Insert feedback
  const { data: inserted, error: insertError } = await supabase
    .from("beta_feedback")
    .insert({
      participant_id: participantId,
      category,
      rating,
      comment,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to insert feedback:", insertError.message);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: participantId,
    action: "beta_feedback_submitted",
    resource: "beta_feedback",
    resource_id: inserted.id,
    metadata: JSON.stringify({ category, rating }),
    created_at: new Date().toISOString(),
  });

  return NextResponse.json(
    { success: true, feedbackId: inserted.id },
    { status: 201 }
  );
}

// Only POST is supported
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
