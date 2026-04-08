import { DISCLAIMER } from "../../lib/constants";

interface Props {
  interpretations: string[];
  quietTails: { insulin: string; meal: string; residual: number; hoursPastDOA: number }[];
}

export default function InterpretationPanel({ interpretations, quietTails }: Props) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <h3 className="text-sm font-bold text-[#1a2a5e] uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        60-Second Interpretation
      </h3>
      <ul className="space-y-2 text-sm text-[#4a5568]">
        {interpretations.map((line, i) => (
          <li key={i} className={`flex gap-2 ${line.includes("DANGER") || line.includes("CAUTION") ? "text-[#ef4444] font-medium" : ""}`}>
            <span className="text-[#2ab5c1] mt-0.5">{"\u2022"}</span>
            <span>{line}</span>
          </li>
        ))}
        {quietTails.map((qt, i) => (
          <li key={`qt-${i}`} className="flex gap-2 text-[#f59e0b] font-medium">
            <span className="mt-0.5">{"\u2022"}</span>
            <span>{qt.insulin} ({qt.meal}): {qt.residual}U still active \u2014 {qt.hoursPastDOA}h past labelled end.</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-[#a0aec0] mt-3">{DISCLAIMER}</p>
    </div>
  );
}
