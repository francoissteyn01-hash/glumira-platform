/**
 * GluMira™ V7 — ThemeContext.tsx
 * Manual toggle (sun/moon) + auto-by-time-of-day for overnight parental monitoring.
 * Dark after 19:00, light after 07:00. User can pin manual override.
 * Persists preference to localStorage. Sets both .dark class (Tailwind) and
 * data-theme attribute (CSS custom properties) on <html>.
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeMode = "manual" | "auto";
type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  mode: "auto",
  toggle: () => {},
  setMode: () => {},
  isDark: false,
});

function getTimeBasedTheme(): Theme {
  const h = new Date().getHours();
  return h >= 19 || h < 7 ? "dark" : "light";
}

function getStoredPrefs(): { theme: Theme; mode: ThemeMode } {
  if (typeof window === "undefined") return { theme: "light", mode: "auto" };
  const stored = localStorage.getItem("glumira-theme") as Theme | null;
  const storedMode = localStorage.getItem("glumira-theme-mode") as ThemeMode | null;
  const mode = storedMode === "manual" || storedMode === "auto" ? storedMode : "auto";
  if (mode === "manual" && (stored === "light" || stored === "dark")) {
    return { theme: stored, mode };
  }
  return { theme: getTimeBasedTheme(), mode };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState(getStoredPrefs);

  const { theme, mode } = prefs;

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("glumira-theme", theme);
    localStorage.setItem("glumira-theme-mode", mode);
  }, [theme, mode]);

  // Auto mode: re-check every minute and on visibility change
  useEffect(() => {
    if (mode !== "auto") return;
    const tick = () => {
      const next = getTimeBasedTheme();
      setPrefs((p) => p.theme === next ? p : { ...p, theme: next });
    };
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [mode]);

  const toggle = useCallback(() => {
    setPrefs((p) => {
      const next: Theme = p.theme === "light" ? "dark" : "light";
      return { theme: next, mode: "manual" };
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setPrefs((p) => ({
      mode: m,
      theme: m === "auto" ? getTimeBasedTheme() : p.theme,
    }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle, setMode, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
