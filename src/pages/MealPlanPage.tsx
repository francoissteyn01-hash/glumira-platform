/**
 * GluMira V7 — Meal Plan Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column, Tailwind CSS.
 */

import { useState, useMemo } from "react";
import DietaryBadge from "@/components/DietaryBadge";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Meal {
  time: string;
  type: string;
  foods: string[];
  carbs: number;
  protein: number;
  fat: number;
}

interface DailyTargets {
  carbs: number;
  protein: number;
  fat: number;
  fibre: number;
}

/* ─── Static plan data (mirrors server route) ────────────────────────────── */

const MEALS: Meal[] = [
  { time: "07:00", type: "breakfast", foods: ["Wholegrain toast", "Eggs", "Avocado"], carbs: 30, protein: 20, fat: 15 },
  { time: "10:00", type: "snack", foods: ["Apple", "Peanut butter"], carbs: 20, protein: 5, fat: 8 },
  { time: "12:30", type: "lunch", foods: ["Grilled chicken wrap", "Side salad"], carbs: 40, protein: 30, fat: 12 },
  { time: "15:30", type: "snack", foods: ["Greek yoghurt", "Berries"], carbs: 15, protein: 12, fat: 5 },
  { time: "18:30", type: "dinner", foods: ["Salmon", "Sweet potato", "Broccoli"], carbs: 45, protein: 35, fat: 18 },
  { time: "21:00", type: "supper", foods: ["Cheese", "Crackers"], carbs: 15, protein: 8, fat: 10 },
];

const DAILY_TARGETS: DailyTargets = { carbs: 165, protein: 110, fat: 68, fibre: 30 };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pct(value: number, target: number): number {
  return Math.min(Math.round((value / target) * 100), 100);
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: "sunrise",
  snack: "coffee",
  lunch: "sun",
  dinner: "moon",
  supper: "star",
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const percent = pct(value, target);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>
          {value}g / {target}g
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MealCard({
  meal,
  logged,
  onLog,
}: {
  meal: Meal;
  logged: boolean;
  onLog: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* time + type row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 tracking-wide">{meal.time}</span>
          <span className="text-sm font-semibold text-gray-800">{capitalize(meal.type)}</span>
        </div>
        {logged && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            Logged
          </span>
        )}
      </div>

      {/* foods */}
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {meal.foods.map((f) => (
          <li
            key={f}
            className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600"
          >
            {f}
          </li>
        ))}
      </ul>

      {/* macros */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>
          <span className="font-semibold text-cyan-700">{meal.carbs}g</span> carbs
        </span>
        <span>
          <span className="font-semibold text-amber-700">{meal.protein}g</span> protein
        </span>
        <span>
          <span className="font-semibold text-rose-700">{meal.fat}g</span> fat
        </span>
      </div>

      {/* log button */}
      {!logged && (
        <button type="button"
          onClick={onLog}
          className="mt-3 w-full rounded-xl border border-cyan-200 bg-cyan-50 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 active:scale-[0.98]"
        >
          Log this meal
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function MealPlanPage() {
  const [activeModule] = useState("balanced");
  const [view, setView] = useState<"today" | "week">("today");
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [shoppingOpen, setShoppingOpen] = useState(false);

  /* derived totals from logged meals */
  const totals = useMemo(() => {
    let carbs = 0;
    let protein = 0;
    let fat = 0;
    MEALS.forEach((m) => {
      if (loggedMeals.has(m.time)) {
        carbs += m.carbs;
        protein += m.protein;
        fat += m.fat;
      }
    });
    return { carbs, protein, fat };
  }, [loggedMeals]);

  /* unique shopping list derived from all meal foods */
  const shoppingItems = useMemo(() => {
    const set = new Set<string>();
    MEALS.forEach((m) => m.foods.forEach((f) => set.add(f)));
    return Array.from(set).sort();
  }, []);

  function handleLog(time: string) {
    setLoggedMeals((prev) => {
      const next = new Set(prev);
      next.add(time);
      return next;
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50/60 px-4 pb-24 pt-6 font-sans antialiased">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-gray-900">Meal Plan</h1>
          <DietaryBadge module={activeModule} size="md" />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Your daily plan tailored for Type 1 diabetes management.
        </p>
      </header>

      {/* ── View Toggle ───────────────────────────────────────────────────── */}
      <div className="mb-5 flex rounded-xl bg-white p-1 shadow-sm">
        {(["today", "week"] as const).map((v) => (
          <button type="button"
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              view === v
                ? "bg-cyan-600 text-white shadow"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {v === "today" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {/* ── Today view ────────────────────────────────────────────────────── */}
      {view === "today" && (
        <>
          {/* Daily Totals */}
          <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Daily Totals
            </h2>
            <div className="flex flex-col gap-3">
              <MacroBar label="Carbs" value={totals.carbs} target={DAILY_TARGETS.carbs} color="#0891B2" />
              <MacroBar label="Protein" value={totals.protein} target={DAILY_TARGETS.protein} color="#D97706" />
              <MacroBar label="Fat" value={totals.fat} target={DAILY_TARGETS.fat} color="#E11D48" />
            </div>
            {loggedMeals.size === 0 && (
              <p className="mt-3 text-center text-[11px] text-gray-300">
                Log meals below to see your progress.
              </p>
            )}
          </section>

          {/* Meal Cards */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Today's Meals
            </h2>
            {MEALS.map((meal) => (
              <MealCard
                key={meal.time}
                meal={meal}
                logged={loggedMeals.has(meal.time)}
                onLog={() => handleLog(meal.time)}
              />
            ))}
          </section>

          {/* Shopping List */}
          <section className="mt-6">
            <button type="button"
              onClick={() => setShoppingOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Shopping List
              </h2>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${shoppingOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {shoppingOpen && (
              <div className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {shoppingItems.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-center text-[10px] text-gray-300">
                  {shoppingItems.length} items derived from today's plan
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Week view placeholder ─────────────────────────────────────────── */}
      {view === "week" && (
        <section className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
          <div className="mb-3 text-3xl text-gray-200">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-700">Weekly View</h3>
          <p className="mt-1 text-xs text-gray-400 text-center max-w-[220px]">
            Full 7-day meal planning with drag-and-drop rearranging is coming soon.
          </p>
        </section>
      )}
    </div>
  );
}
