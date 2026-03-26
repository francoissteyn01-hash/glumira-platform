/**
 * GluMira™ — MealLogForm.tsx
 *
 * Form for logging a new meal entry.
 * Uses useMealLog hook to submit to POST /api/meals.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState } from "react";
import { useMealLog, type MealType, type CreateMealInput } from "@/hooks/useMealLog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealLogFormProps {
  onSuccess?: () => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch"     },
  { value: "dinner",    label: "Dinner"    },
  { value: "snack",     label: "Snack"     },
  { value: "other",     label: "Other"     },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MealLogForm({ onSuccess, className = "" }: MealLogFormProps) {
  const { creating, error, createEntry } = useMealLog();

  const [mealType,    setMealType]    = useState<MealType>("breakfast");
  const [carbsGrams,  setCarbsGrams]  = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [fatGrams,    setFatGrams]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [loggedAt,    setLoggedAt]    = useState(
    new Date().toISOString().slice(0, 16)  // datetime-local format
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const carbs = parseFloat(carbsGrams);
    if (isNaN(carbs) || carbs < 0) {
      setFormError("Carbohydrates must be a non-negative number.");
      return;
    }

    const input: CreateMealInput = {
      mealType,
      carbsGrams: carbs,
      loggedAt: new Date(loggedAt).toISOString(),
    };

    if (proteinGrams) {
      const p = parseFloat(proteinGrams);
      if (!isNaN(p) && p >= 0) input.proteinGrams = p;
    }
    if (fatGrams) {
      const f = parseFloat(fatGrams);
      if (!isNaN(f) && f >= 0) input.fatGrams = f;
    }
    if (notes.trim()) input.notes = notes.trim();

    const result = await createEntry(input);
    if (result) {
      // Reset form
      setCarbsGrams("");
      setProteinGrams("");
      setFatGrams("");
      setNotes("");
      setLoggedAt(new Date().toISOString().slice(0, 16));
      onSuccess?.();
    }
  }

  const displayError = formError ?? error;

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-700">Log a Meal</h3>

      {/* Error */}
      {displayError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {displayError}
        </div>
      )}

      {/* Meal type */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Meal Type</label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMealType(t.value)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                mealType === t.value
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date/time */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Date & Time</label>
        <input
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Macros row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Carbs (g) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={carbsGrams}
            onChange={(e) => setCarbsGrams(e.target.value)}
            placeholder="0"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Protein (g)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={proteinGrams}
            onChange={(e) => setProteinGrams(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Fat (g)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={fatGrams}
            onChange={(e) => setFatGrams(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Restaurant meal, estimated portions…"
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={creating}
        className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
      >
        {creating ? "Saving…" : "Log Meal"}
      </button>

      <p className="text-center text-xs text-slate-400">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </form>
  );
}

export default MealLogForm;
