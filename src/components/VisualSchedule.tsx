/**
 * VisualSchedule — vertical list of predictable T1D daily steps.
 * Completion ticks, current-step highlight, add/remove, drag reorder, print.
 */
import { useState } from "react";

interface Step {
  id: string;
  label: string;
  done: boolean;
}

const DEFAULT_STEPS: Step[] = [
  { id: "1", label: "Wake", done: false },
  { id: "2", label: "Check glucose", done: false },
  { id: "3", label: "Breakfast", done: false },
  { id: "4", label: "Morning dose", done: false },
  { id: "5", label: "Lunch check", done: false },
  { id: "6", label: "Lunch dose", done: false },
  { id: "7", label: "Afternoon snack", done: false },
  { id: "8", label: "Dinner", done: false },
  { id: "9", label: "Dinner dose", done: false },
  { id: "10", label: "Bedtime check", done: false },
];

export default function VisualSchedule() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [newLabel, setNewLabel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const currentIdx = steps.findIndex((s) => !s.done);

  const toggle = (id: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const remove = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

  const add = () => {
    if (!newLabel.trim()) return;
    setSteps((prev) => [...prev, { id: Date.now().toString(), label: newLabel.trim(), done: false }]);
    setNewLabel("");
  };

  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (target: number) => {
    if (dragIdx === null || dragIdx === target) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  const printPdf = () => window.print();

  return (
    <div>
      <div className="space-y-2 mb-4">
        {steps.map((s, i) => {
          const isCurrent = i === currentIdx;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                s.done
                  ? "bg-green-50 border-green-200 text-gray-500 line-through"
                  : isCurrent
                  ? "bg-[#2AB5C1]/10 border-[#2AB5C1] ring-1 ring-[#2AB5C1]/40"
                  : "bg-white border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-label={s.done ? "Mark incomplete" : "Mark complete"}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                  s.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </button>
              <span className="flex-1 text-base font-medium text-[#1A2A5E]">{s.label}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label="Remove step"
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add a step..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-[#2AB5C1] text-white px-4 py-2.5 text-sm font-semibold"
        >
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={printPdf}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-[#1A2A5E]"
      >
        Print schedule (PDF)
      </button>
    </div>
  );
}
