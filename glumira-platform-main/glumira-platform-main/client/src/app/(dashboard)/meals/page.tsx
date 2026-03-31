"use client";

/**
 * GluMira™ Meals Page
 * Version: 7.0.0
 * Route: /meals
 *
 * Features:
 *  - Meal regime selector (20 profiles from meal-regimes.ts)
 *  - Log a meal (carbs, time, notes, regime)
 *  - Meal history table (last 20 meals)
 *  - School Care Plan quick-link
 *  - Per-meal IOB impact estimate
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import React, { useState, useEffect, useCallback } from "react";
import { SchoolCarePlanForm } from "../../../components/SchoolCarePlanForm";

// ─── Types ────────────────────────────────────────────────────

type MealRegime =
  | "standard"
  | "low-carb"
  | "very-low-carb"
  | "bernstein"
  | "moderate-carb"
  | "high-carb"
  | "ketogenic"
  | "mediterranean"
  | "plant-based"
  | "paleo"
  | "intermittent-fasting"
  | "school-standard"
  | "school-low-carb"
  | "school-snack-only"
  | "pregnancy-t1"
  | "pregnancy-t2"
  | "pregnancy-t3"
  | "ramadan-fasting"
  | "ramadan-iftar"
  | "athlete-training";

interface MealLog {
  id: string;
  eatenAt: string;
  carbsGrams: number;
  mealRegime: MealRegime;
  notes: string;
  estimatedIcr: number;
}

interface MealForm {
  carbsGrams: number;
  mealRegime: MealRegime;
  notes: string;
  eatenAt: string;
}

// ─── Regime display names ─────────────────────────────────────

const REGIME_LABELS: Record<MealRegime, string> = {
  "standard": "Standard",
  "low-carb": "Low Carb",
  "very-low-carb": "Very Low Carb",
  "bernstein": "Bernstein Protocol",
  "moderate-carb": "Moderate Carb",
  "high-carb": "High Carb",
  "ketogenic": "Ketogenic",
  "mediterranean": "Mediterranean",
  "plant-based": "Plant-Based",
  "paleo": "Paleo",
  "intermittent-fasting": "Intermittent Fasting",
  "school-standard": "School — Standard",
  "school-low-carb": "School — Low Carb",
  "school-snack-only": "School — Snack Only",
  "pregnancy-t1": "Pregnancy T1",
  "pregnancy-t2": "Pregnancy T2",
  "pregnancy-t3": "Pregnancy T3",
  "ramadan-fasting": "Ramadan — Fasting",
  "ramadan-iftar": "Ramadan — Iftar",
  "athlete-training": "Athlete — Training",
};

// ─── ICR lookup (grams per unit) ─────────────────────────────

const REGIME_ICR: Record<MealRegime, number> = {
  "standard": 10,
  "low-carb": 15,
  "very-low-carb": 20,
  "bernstein": 25,
  "moderate-carb": 10,
  "high-carb": 8,
  "ketogenic": 30,
  "mediterranean": 12,
  "plant-based": 10,
  "paleo": 14,
  "intermittent-fasting": 12,
  "school-standard": 10,
  "school-low-carb": 15,
  "school-snack-only": 20,
  "pregnancy-t1": 10,
  "pregnancy-t2": 8,
  "pregnancy-t3": 7,
  "ramadan-fasting": 0,
  "ramadan-iftar": 8,
  "athlete-training": 6,
};

// ─── Demo meal history ────────────────────────────────────────

function generateDemoMeals(): MealLog[] {
  const meals: MealLog[] = [];
  const now = Date.now();
  const regimes: MealRegime[] = ["low-carb", "bernstein", "standard", "low-carb", "very-low-carb"];
  const carbOptions = [8, 12, 15, 20, 6, 10];
  const noteOptions = ["Breakfast", "Lunch", "Dinner", "Snack", "Post-exercise"];

  for (let i = 0; i < 10; i++) {
    const carbs = carbOptions[i % carbOptions.length];
    const regime = regimes[i % regimes.length];
    meals.push({
      id: `demo-${i}`,
      eatenAt: new Date(now - i * 6 * 60 * 60 * 1000).toISOString(),
      carbsGrams: carbs,
      mealRegime: regime,
      notes: noteOptions[i % noteOptions.length],
      estimatedIcr: REGIME_ICR[regime],
    });
  }
  return meals;
}

// ─── Page Component ───────────────────────────────────────────

export default function MealsPage() {
  const [meals, setMeals] = useState<MealLog[]>(generateDemoMeals());
  const [form, setForm] = useState<MealForm>({
    carbsGrams: 10,
    mealRegime: "low-carb",
    notes: "",
    eatenAt: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSCP, setShowSCP] = useState(false);

  const estimatedUnits =
    form.carbsGrams > 0 && REGIME_ICR[form.mealRegime] > 0
      ? (form.carbsGrams / REGIME_ICR[form.mealRegime]).toFixed(1)
      : "—";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setSuccessMsg(null);

      try {
        // In production: POST to /api/meals/log
        // For now: add to local state
        const newMeal: MealLog = {
          id: crypto.randomUUID(),
          eatenAt: new Date(form.eatenAt).toISOString(),
          carbsGrams: form.carbsGrams,
          mealRegime: form.mealRegime,
          notes: form.notes,
          estimatedIcr: REGIME_ICR[form.mealRegime],
        };
        setMeals((prev) => [newMeal, ...prev].slice(0, 20));
        setSuccessMsg(`Meal logged — ${form.carbsGrams}g carbs · ${form.mealRegime}`);
        setForm((prev) => ({ ...prev, notes: "", carbsGrams: 10 }));
      } finally {
        setSubmitting(false);
      }
    },
    [form]
  );

  return (
    <div className="min-h-screen bg-glumira-bg p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            GluMira™ · 20 meal regime profiles · IOB Hunter™
          </p>
        </div>
        <button
          onClick={() => setShowSCP((v) => !v)}
          className="glum-btn-secondary text-sm"
        >
          {showSCP ? "Hide" : "Generate"} School Care Plan
        </button>
      </div>

      {/* School Care Plan (collapsible) */}
      {showSCP && (
        <div className="glum-card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">School Care Plan</h2>
          <SchoolCarePlanForm
            onGenerate={async (data) => {
              const res = await fetch("/api/school-care-plan/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                const { html } = await res.json();
                const w = window.open("", "_blank");
                if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
              }
            }}
            generating={false}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Log meal form */}
        <div className="glum-card space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Log a Meal</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Regime selector */}
            <div>
              <label className="glum-label">Meal Regime</label>
              <select
                value={form.mealRegime}
                onChange={(e) => setForm((f) => ({ ...f, mealRegime: e.target.value as MealRegime }))}
                className="glum-input"
              >
                {(Object.keys(REGIME_LABELS) as MealRegime[]).map((r) => (
                  <option key={r} value={r}>
                    {REGIME_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ICR for this regime: <strong>1:{REGIME_ICR[form.mealRegime]}g</strong>
              </p>
            </div>

            {/* Carbs */}
            <div>
              <label className="glum-label">Carbohydrates (grams)</label>
              <input
                type="number"
                min={0}
                max={500}
                step={1}
                value={form.carbsGrams}
                onChange={(e) => setForm((f) => ({ ...f, carbsGrams: parseInt(e.target.value) || 0 }))}
                className="glum-input"
              />
              {form.carbsGrams > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Estimated bolus: <strong>{estimatedUnits}U</strong>
                  <span className="text-gray-400 ml-1">(educational estimate only — not a dose recommendation)</span>
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="glum-label">Eaten At</label>
              <input
                type="datetime-local"
                value={form.eatenAt}
                onChange={(e) => setForm((f) => ({ ...f, eatenAt: e.target.value }))}
                className="glum-input"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="glum-label">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Breakfast, post-exercise snack…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="glum-input"
                maxLength={200}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="glum-btn-primary w-full disabled:opacity-50"
            >
              {submitting ? "Logging…" : "Log Meal"}
            </button>
          </form>

          {successMsg && (
            <div className="glum-alert-success text-sm">{successMsg}</div>
          )}

          <p className="text-xs text-gray-400">
            GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
            Estimated bolus values are educational and not dosing recommendations.
          </p>
        </div>

        {/* Right: Meal history */}
        <div className="glum-card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Recent Meals
            <span className="text-xs font-normal text-gray-400 ml-2">last 20</span>
          </h2>

          {meals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No meals logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">Time</th>
                    <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">Carbs</th>
                    <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">Regime</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Est. Bolus</th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map((meal) => {
                    const estBolus =
                      meal.estimatedIcr > 0
                        ? (meal.carbsGrams / meal.estimatedIcr).toFixed(1) + "U"
                        : "—";
                    return (
                      <tr key={meal.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {new Date(meal.eatenAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="text-gray-400 text-xs ml-1">
                            {new Date(meal.eatenAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-900">
                          {meal.carbsGrams}g
                        </td>
                        <td className="py-2 pr-3 text-gray-600 text-xs">
                          {REGIME_LABELS[meal.mealRegime]}
                        </td>
                        <td className="py-2 text-glumira-blue font-medium text-xs">
                          {estBolus}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
