import { useState } from "react";
import { CASE_LIST } from "../../hooks/useDemoData";

interface Props {
  activeCaseId: string;
  onCaseChange: (id: string) => void;
}

export default function DemoBanner({ activeCaseId, onCaseChange }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("glumira_demo_banner_dismissed") === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-3" style={{ background: "#2ab5c1" }}>
      <div className="flex items-center gap-3 flex-wrap text-white text-sm">
        <span>You are viewing demo data.</span>
        <select
          value={activeCaseId}
          onChange={(e) => onCaseChange(e.target.value)}
          className="rounded px-2 py-1 text-xs text-[#1a2a5e] bg-white/90 border-none focus:outline-none"
        >
          {CASE_LIST.map((c) => (
            <option key={c.id} value={c.id}>{c.id}: {c.name}</option>
          ))}
        </select>
        <span className="text-white/80 text-xs">Switch to your profile or explore other case studies.</span>
      </div>
      <button
        type="button"
        onClick={() => { setDismissed(true); try { sessionStorage.setItem("glumira_demo_banner_dismissed", "1"); } catch {} }}
        className="text-white/80 hover:text-white text-lg leading-none"
        aria-label="Dismiss"
      >&times;</button>
    </div>
  );
}
