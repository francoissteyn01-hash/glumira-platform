/**
 * GluMira™ — /api/meals
 *
 * GET  /api/meals?page=1&pageSize=20&mealType=breakfast&from=ISO&to=ISO
 * POST /api/meals  { mealType, carbsGrams, proteinGrams?, fatGrams?, notes?, loggedAt? }
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ─── In-memory store (replaced by DB in production) ──────────────────────────

interface MealEntry {
  id: string;
  userId: string;
  loggedAt: string;
  mealType: string;
  carbsGrams: number;
  proteinGrams?: number;
  fatGrams?: number;
  notes?: string;
  photoUrl?: string;
  glycaemicIndex?: number;
  insulinDoseId?: string;
}

const mealStore: MealEntry[] = [];
let nextId = 1;

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page     = Math.max(parseInt(searchParams.get("page")     ?? "1",  10), 1);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20", 10), 100);
  const mealType = searchParams.get("mealType") ?? null;
  const from     = searchParams.get("from")     ?? null;
  const to       = searchParams.get("to")       ?? null;

  let entries = mealStore.filter((e) => e.userId === session.user.id);

  if (mealType) entries = entries.filter((e) => e.mealType === mealType);
  if (from)     entries = entries.filter((e) => e.loggedAt >= from);
  if (to)       entries = entries.filter((e) => e.loggedAt <= to);

  // Sort descending by loggedAt
  entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  const total = entries.length;
  const slice = entries.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ entries: slice, total, page, pageSize });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mealType, carbsGrams, proteinGrams, fatGrams, notes, loggedAt, photoUrl, glycaemicIndex, insulinDoseId } = body;

  if (!mealType || typeof mealType !== "string") {
    return NextResponse.json({ error: "mealType is required" }, { status: 400 });
  }

  const validTypes = ["breakfast", "lunch", "dinner", "snack", "other"];
  if (!validTypes.includes(mealType)) {
    return NextResponse.json({ error: `mealType must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  if (typeof carbsGrams !== "number" || carbsGrams < 0) {
    return NextResponse.json({ error: "carbsGrams must be a non-negative number" }, { status: 400 });
  }

  const entry: MealEntry = {
    id:       String(nextId++),
    userId:   session.user.id,
    loggedAt: loggedAt ?? new Date().toISOString(),
    mealType,
    carbsGrams,
    ...(proteinGrams    !== undefined && { proteinGrams }),
    ...(fatGrams        !== undefined && { fatGrams }),
    ...(notes           !== undefined && { notes }),
    ...(photoUrl        !== undefined && { photoUrl }),
    ...(glycaemicIndex  !== undefined && { glycaemicIndex }),
    ...(insulinDoseId   !== undefined && { insulinDoseId }),
  };

  mealStore.push(entry);

  return NextResponse.json(entry, { status: 201 });
}
