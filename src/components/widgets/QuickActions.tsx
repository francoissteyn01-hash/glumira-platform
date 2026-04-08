import { useNavigate } from "react-router-dom";

const ACTIONS = [
  { icon: "\uD83D\uDC89", label: "Log Insulin", route: "/insulin", amber: false },
  { icon: "\uD83E\uDE78", label: "Log Glucose", route: "/glucose", amber: false },
  { icon: "\uD83C\uDF5E", label: "Log Meal", route: "/log", amber: false },
  { icon: "\u26A1", label: "What-If", route: "/dashboard/what-if", amber: true },
  { icon: "\uD83E\uDD89", label: "Ask Mira", route: "/mira", amber: false },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
      {ACTIONS.map((a) => (
        <button
          type="button"
          key={a.label}
          onClick={() => navigate(a.route)}
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: 120,
            minHeight: 100,
            borderRadius: 12,
            border: "1px solid var(--border-light)",
            borderLeft: `4px solid ${a.amber ? "#f59e0b" : "var(--accent-teal)"}`,
            background: a.amber ? "var(--amber-bg, #fffbeb)" : "var(--bg-card)",
            cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: 24 }}>{a.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
