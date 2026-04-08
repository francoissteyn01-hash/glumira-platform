/**
 * GluMira™ V7 — Theme Toggle
 * "Night mode" toggle — frames dark mode as the caregiving feature it is.
 * Sun/moon icons with smooth transition.
 */

import { useTheme } from "@/hooks/useTheme";

const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

interface ThemeToggleProps {
  showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to night mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: isDark ? "rgba(42,181,193,0.08)" : "var(--bg-toggle)",
        color: isDark ? "var(--accent-teal)" : "var(--text-secondary)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "all 0.2s ease",
        width: showLabel ? "100%" : "auto",
      }}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
      {showLabel && <span>{isDark ? "Night mode on" : "Night mode"}</span>}
      {showLabel && (
        <span
          style={{
            marginLeft: "auto",
            width: 32,
            height: 18,
            borderRadius: 9,
            background: isDark ? "var(--accent-teal)" : "var(--border)",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: isDark ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
            }}
          />
        </span>
      )}
    </button>
  );
}
