/**
 * HypoTreatmentFinder — filterable list of sensory-aware hypo treatments.
 * Users can mark preferred items; preferred list appears on top.
 */
import { useState, useMemo } from "react";
import { HYPO_TREATMENTS, type HypoTreatment } from "@/data/hypo-treatments";

const TEXTURES: HypoTreatment["texture"][] = ["liquid", "gel", "chalky", "crunchy", "smooth", "chewy"];

export default function HypoTreatmentFinder() {
  const [excludedTextures, setExcludedTextures] = useState<string[]>([]);
  const [noChewing, setNoChewing] = useState(false);
  const [preferred, setPreferred] = useState<string[]>([]);

  const toggleTexture = (t: string) =>
    setExcludedTextures((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const togglePreferred = (name: string) => {
    setPreferred((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      fetch("/api/modules/autism/hypo-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_hypo_treatments: next }),
      }).catch(() => {});
      return next;
    });
  };

  const filtered = useMemo(() => {
    return HYPO_TREATMENTS.filter((t) => {
      if (excludedTextures.includes(t.texture)) return false;
      if (noChewing && t.chewingRequired) return false;
      return true;
    });
  }, [excludedTextures, noChewing]);

  const preferredItems = filtered.filter((t) => preferred.includes(t.name));
  const otherItems = filtered.filter((t) => !preferred.includes(t.name));

  const Card = ({ t }: { t: HypoTreatment }) => {
    const isPref = preferred.includes(t.name);
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-[#1A2A5E]">{t.name}</h4>
          <span className="text-xs font-mono text-gray-500">{t.carbsPerServing}g</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.texture}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.taste}</span>
          {t.chewingRequired && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">chewing</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-snug">{t.sensoryNotes}</p>
        <button
          type="button"
          onClick={() => togglePreferred(t.name)}
          className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
            isPref ? "bg-[#2AB5C1] text-white" : "bg-[#2AB5C1]/10 text-[#1A2A5E] border border-[#2AB5C1]/30"
          }`}
        >
          {isPref ? "Preferred ✓" : "Add to Preferred"}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">Exclude textures</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {TEXTURES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTexture(t)}
              className={`text-xs rounded-full px-3 py-1 border ${
                excludedTextures.includes(t)
                  ? "bg-red-100 border-red-300 text-red-700 line-through"
                  : "bg-white border-gray-300 text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={noChewing} onChange={(e) => setNoChewing(e.target.checked)} />
          No chewing required
        </label>
      </div>

      {preferredItems.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#1A2A5E] mb-2">My Preferred</h3>
          <div className="space-y-2">
            {preferredItems.map((t) => <Card key={t.name} t={t} />)}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-[#1A2A5E] mb-2">All options</h3>
      <div className="space-y-2">
        {otherItems.map((t) => <Card key={t.name} t={t} />)}
      </div>
    </div>
  );
}
