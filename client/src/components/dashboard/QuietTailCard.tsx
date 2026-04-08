import type { DemoQuietTail } from "../../hooks/useDemoData";

interface Props {
  quietTails: DemoQuietTail[];
}

export default function QuietTailCard({ quietTails }: Props) {
  if (!quietTails.length) {
    return (
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <p className="text-xs text-[#718096] uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hidden IOB Quiet Tail</p>
        <p className="text-sm text-[#22c55e] font-medium">No hidden tails detected.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-[#f59e0b] bg-white p-5">
      <p className="text-xs text-[#718096] uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hidden IOB Quiet Tail</p>
      <ul className="space-y-1.5">
        {quietTails.map((qt, i) => (
          <li key={i} className="text-sm text-[#f59e0b] font-medium">
            {qt.insulin} ({qt.meal}): {qt.residual}U still active \u2014 {qt.hoursPastDOA}h past labelled end.
          </li>
        ))}
      </ul>
    </div>
  );
}
