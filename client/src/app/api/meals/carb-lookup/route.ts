/**
 * GluMira™ — GET /api/meals/carb-lookup
 *
 * Looks up carbohydrate content for a food item from the built-in FOOD_DB.
 * Returns carb estimate, glycaemic load classification, and ICR dose suggestion.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  lookupFood,
  estimateCarbs,
  classifyGlycaemicLoad,
  recommendIcrDose,
} from "@/../../server/meals/carb-counter";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const gramsParam = searchParams.get("grams");
    const icrParam = searchParams.get("icr"); // insulin-to-carb ratio

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const food = lookupFood(query);
    if (!food) {
      return NextResponse.json({ error: `Food not found: ${query}` }, { status: 404 });
    }

    const grams = gramsParam ? parseFloat(gramsParam) : 100;
    const icr = icrParam ? parseFloat(icrParam) : null;

    const carbsGrams = estimateCarbs(food, grams);
    const glLoad = classifyGlycaemicLoad(food, grams);
    const dose = icr ? recommendIcrDose(carbsGrams, icr) : null;

    return NextResponse.json({
      food: food.name,
      grams,
      carbsGrams,
      glycaemicLoad: glLoad,
      suggestedDoseUnits: dose,
    });
  } catch (err) {
    console.error("[carb-lookup] error:", err);
    return NextResponse.json({ error: "Failed to look up food" }, { status: 500 });
  }
}
