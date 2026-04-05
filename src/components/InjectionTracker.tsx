/**
 * InjectionTracker — 8 body-zone buttons with tolerance states.
 * Records site tolerance, notes, numbing cream, distraction, parent-assisted.
 */
import { useState } from "react";

type Tolerance = "ok" | "difficult" | "refused" | "not_tried";

const SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh outer",
  "Right thigh outer",
  "Left arm back",
  "Right arm back",
  "Left buttock upper",
  "Right buttock upper",
];

const TOLERANCES: { value: Tolerance; label: string; color: string }[] = [
  { value: "ok", label: "OK", color: "#4CAF50" },
  { value: "difficult", label: "Difficult", color: "#FFB300" },
  { value: "refused", label: "Refused", color: "#EF5350" },
  { value: "not_tried", label: "Not tried", color: "#9E9E9E" },
];

interface LogEntry {
  site: string;
  tolerance: Tolerance;
  notes: string;
  numbing: boolean;
  distraction: boolean;
  parentAssisted: boolean;
  at: string;
}

export default function InjectionTracker() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState<Tolerance>("ok");
  const [notes, setNotes] = useState("");
  const [numbing, setNumbing] = useState(false);
  const [distraction, setDistraction] = useState(false);
  const [parentAssisted, setParentAssisted] = useState(false);
  const [history, setHistory] = useState<LogEntry[]>([]);

  const save = () => {
    if (!selected) return;
    const entry: LogEntry = {
      site: selected,
      tolerance,
      notes,
      numbing,
      distraction,
      parentAssisted,
      at: new Date().toISOString(),
    };
    setHistory((h) => [entry, ...h]);
    fetch("/api/modules/autism/injections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {});
    setSelected(null);
    setNotes("");
  };

  const exportCsv = () => {
    const rows = [
      ["site", "tolerance", "numbing", "distraction", "parentAssisted", "notes", "loggedAt"],
      ...history.map((h) => [h.site, h.tolerance, String(h.numbing), String(h.distraction), String(h.parentAssisted), h.notes.replace(/,/g, ";"), h.at]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "injection-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">Tap a site to log how it went.</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SITES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelected(s)}
            className={`rounded-xl border px-3 py-4 text-sm font-medium min-h-[56px] ${
              selected === s ? "bg-[#2AB5C1]/10 border-[#2AB5C1]" : "bg-white border-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-2xl border border-[#2AB5C1]/30 bg-white p-4 mb-4">
          <p className="text-base font-semibold text-[#1A2A5E] mb-2">{selected}</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {TOLERANCES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTolerance(t.value)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium border ${
                  tolerance === t.value ? "text-white" : "text-[#1A2A5E] bg-white"
                }`}
                style={{
                  backgroundColor: tolerance === t.value ? t.color : undefined,
                  borderColor: t.color,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3"
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm mb-1">
            <input type="checkbox" checked={numbing} onChange={(e) => setNumbing(e.target.checked)} />
            Numbing cream used
          </label>
          <label className="flex items-center gap-2 text-sm mb-1">
            <input type="checkbox" checked={distraction} onChange={(e) => setDistraction(e.target.checked)} />
            Distraction needed
          </label>
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={parentAssisted} onChange={(e) => setParentAssisted(e.target.checked)} />
            Parent-assisted
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelected(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm">
              Cancel
            </button>
            <button type="button" onClick={save} className="flex-1 rounded-lg bg-[#2AB5C1] text-white py-2.5 text-sm font-semibold">
              Save
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#1A2A5E]">History</h3>
            <button type="button" onClick={exportCsv} className="text-xs text-[#2AB5C1] underline">
              Export CSV
            </button>
          </div>
          <ul className="space-y-1">
            {history.slice(0, 10).map((h, i) => (
              <li key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-[#1A2A5E]">{h.site}</span> — {h.tolerance} — {new Date(h.at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
