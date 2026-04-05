/**
 * SensoryModeSelector — 3 large cards to pick the sensory mode.
 * Saves to SensoryContext and best-effort POSTs to profile endpoint.
 */
import { useSensory } from "@/contexts/SensoryContext";
import type { SensoryMode } from "@/lib/autism-sensory";

const MODES: { value: SensoryMode; label: string; preview: string }[] = [
  {
    value: "standard",
    label: "Standard",
    preview: "Full colours, icons, and animations. 2-column layout, standard touch targets.",
  },
  {
    value: "low_stimulation",
    label: "Low Stimulation",
    preview: "Muted colours, fewer items on screen, slower transitions, larger buttons.",
  },
  {
    value: "minimal",
    label: "Minimal",
    preview: "Monochrome, no animations, 3 items max, largest touch targets, largest text.",
  },
];

export default function SensoryModeSelector() {
  const { sensoryMode, setSensoryMode } = useSensory();

  const handleSelect = (mode: SensoryMode) => {
    setSensoryMode(mode);
    // Best-effort server sync
    fetch("/api/modules/autism/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sensory_mode: mode }),
    }).catch(() => { /* offline-safe */ });
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {MODES.map((m) => {
        const active = sensoryMode === m.value;
        return (
          <button
            type="button"
            key={m.value}
            onClick={() => handleSelect(m.value)}
            className={`w-full text-left rounded-2xl p-5 border transition-all min-h-[88px] ${
              active
                ? "bg-[#2AB5C1]/10 border-[#2AB5C1] ring-2 ring-[#2AB5C1]/40"
                : "bg-white border-gray-200 hover:border-[#2AB5C1]/60"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-semibold text-[#1A2A5E]">{m.label}</span>
              {active && <span className="text-xs font-semibold text-[#2AB5C1]">ACTIVE</span>}
            </div>
            <p className="text-sm text-gray-600 leading-snug">{m.preview}</p>
          </button>
        );
      })}
    </div>
  );
}
