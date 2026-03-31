/**
 * GluMira™ Bernstein AI Q&A — API Route
 * Version: 7.0.0
 * Route: POST /api/bernstein/ask
 *
 * Accepts a question and optional patient context,
 * returns an educational answer grounded in Dr. Bernstein's methodology.
 *
 * Rate limited: 20 requests per user per hour.
 * Requires authenticated session.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { askBernstein } from "../../../../../server/ai/bernstein-qa";

// ─── Request Schema ───────────────────────────────────────────

const AskSchema = z.object({
  question: z.string().min(3).max(500),
  patientContext: z
    .object({
      diabetesType: z.string().optional(),
      yearsWithDiabetes: z.number().int().min(0).max(100).optional(),
      currentA1c: z.number().min(3).max(20).optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1000),
      })
    )
    .max(20)
    .optional(),
});

// ─── In-memory rate limiter (per user, 20 req/hour) ──────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }

  if (entry.count >= 20) return false;

  entry.count++;
  return true;
}

// ─── Route Handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 20 questions per hour." },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = AskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question, patientContext, conversationHistory } = parsed.data;

    // Call Bernstein Q&A engine
    const result = await askBernstein({
      question,
      patientContext,
      conversationHistory,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Bernstein Q&A route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "GluMira™ Bernstein AI Q&A endpoint. Use POST with { question }." },
    { status: 200 }
  );
}
