/**
 * GluMira™ V7 — Theme Toggle
 * Pill-shaped sun/moon toggle matching the UnitToggle style.
 */

import { useTheme } from "@/hooks/useTheme";

const SunIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const btn = (active: boolean, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      style={{
        padding: "5px 10px",
        borderRadius: 6,
        border: "none",
        background: active ? "var(--accent-teal)" : "transparent",
        color: active ? "#ffffff" : "var(--text-secondary)",
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--bg-toggle)",
        borderRadius: 8,
        padding: 2,
        border: "1px solid var(--border)",
      }}
    >
      {btn(!isDark, <SunIcon />, "Switch to light mode")}
      {btn(isDark, <MoonIcon />, "Switch to dark mode")}
    </div>
  );
}
