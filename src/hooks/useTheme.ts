/**
 * GluMira™ V7 — Theme Hook
 * Manages light/dark theme with localStorage persistence.
 * Priority: localStorage → system preference → light default.
 * Also syncs to Supabase user preferences when available.
 */

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

function getSystemPreference(): Theme {
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {}
  return "light";
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("glumira-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return getSystemPreference();
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

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const stored = localStorage.getItem("glumira-theme");
      if (!stored) {
        const next = e.matches ? "dark" : "light";
        setThemeState(next);
        applyTheme(next);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("glumira-theme", t); } catch {}
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
