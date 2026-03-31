/**
 * GluMira™ IOB Stacking Analysis — API Route
 * Version: 7.0.0
 * Route: POST /api/stacking/analyse
 *
 * Accepts an array of recent insulin doses and returns a full
 * stacking analysis: IOB timeline, peak IOB, risk tier, and narrative.
 *
 * Rate limited: 60 requests per user per hour.
 * Requires authenticated session.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { analyseStacking } from "../../../../../server/iob/iob-stacking";
import type { StackingDose } from "../../../../../server/iob/iob-stacking";

// ─── Request Schema ───────────────────────────────────────────

const DoseSchema = z.object({
  id: z.string(),
  units: z.number().positive().max(100),
  administeredAt: z.string().datetime(),
  insulinType: z.enum(["NovoRapid", "Humalog", "Apidra", "Fiasp", "Tresiba", "Lantus"]),
});

const AnalyseSchema = z.object({
  doses: z.array(DoseSchema).min(1).max(50),
});

// ─── In-memory rate limiter (per user, 60 req/hour) ──────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }

  if (entry.count >= 60) return false;
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
        { error: "Rate limit exceeded. Maximum 60 analyses per hour." },
        { status: 429 }
      );
    }

    // Parse and validate
    const body = await req.json();
    const parsed = AnalyseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { doses } = parsed.data;

    // Run stacking analysis
    const result = analyseStacking(doses as StackingDose[]);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Stacking analyse route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "GluMira™ IOB Stacking Analysis endpoint. Use POST with { doses: [...] }.",
      schema: {
        doses: [
          {
            id: "string",
            units: "number (0–100)",
            administeredAt: "ISO 8601 datetime string",
            insulinType: "NovoRapid | Humalog | Apidra | Fiasp | Tresiba | Lantus",
          },
        ],
      },
    },
    { status: 200 }
  );
}
