import { useNavigate } from "react-router-dom";

interface ActionCard {
  icon: string;
  label: string;
  route: string;
  amber?: boolean;
  onClick?: () => void;
}

const ACTIONS: ActionCard[] = [
  { icon: "\uD83D\uDC89", label: "Log Insulin", route: "/insulin" },
  { icon: "\uD83E\uDE78", label: "Log Glucose", route: "/glucose" },
  { icon: "\uD83C\uDF5E", label: "Log Meal", route: "/log" },
  { icon: "\u26A1", label: "What-If", route: "/dashboard/what-if", amber: true },
  { icon: "\uD83E\uDD89", label: "Ask Mira", route: "/mira" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible">
      {ACTIONS.map((a) => (
        <button
          type="button"
          key={a.label}
          onClick={() => navigate(a.route)}
          className="snap-start flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-4 transition-shadow hover:shadow-md cursor-pointer"
          style={{
            width: 120,
            minHeight: 100,
            borderLeft: a.amber ? "4px solid #f59e0b" : "4px solid #2ab5c1",
            background: a.amber ? "#fffbeb" : "#ffffff",
          }}
        >
          <span className="text-2xl">{a.icon}</span>
          <span className="text-xs font-medium text-[#1a2a5e]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
