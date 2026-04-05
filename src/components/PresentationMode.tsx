/**
 * GluMira™ V7 — Presentation Mode
 * Toggle: hides nav, expands charts to full width, increases fonts by 25%.
 * Banner: "Presentation Mode — Educational Use Only"
 * Exit: press Escape or tap banner.
 * Optimised for screen share at 1920×1080.
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface PresentationContextValue {
  active: boolean;
  toggle: () => void;
}

const Ctx = createContext<PresentationContextValue>({ active: false, toggle: () => {} });

export function usePresentationMode() {
  return useContext(Ctx);
}

export function PresentationModeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  const toggle = useCallback(() => setActive((a) => !a), []);

  // Escape to exit
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  // Apply body styles
  useEffect(() => {
    if (active) {
      document.body.style.fontSize = "125%";
      document.body.classList.add("presentation-mode");
    } else {
      document.body.style.fontSize = "";
      document.body.classList.remove("presentation-mode");
    }
    return () => {
      document.body.style.fontSize = "";
      document.body.classList.remove("presentation-mode");
    };
  }, [active]);

  return (
    <Ctx.Provider value={{ active, toggle }}>
      {active && (
        <div
          onClick={() => setActive(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
            background: "#1a2a5e", padding: "8px 20px", textAlign: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2ab5c1", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Presentation Mode — Educational Use Only
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 16 }}>
            Press Escape or tap to exit
          </span>
        </div>
      )}
      <style>{`
        .presentation-mode nav,
        .presentation-mode [data-nav],
        .presentation-mode [data-bottom-nav] {
          display: none !important;
        }
        .presentation-mode [data-dashboard] {
          max-width: 100% !important;
          padding-top: 48px !important;
        }
      `}</style>
      {children}
    </Ctx.Provider>
  );
}

/** Toggle button for dashboard header */
export default function PresentationToggle() {
  const { active, toggle } = usePresentationMode();

  return (
    <button type="button"
      onClick={toggle}
      title={active ? "Exit Presentation Mode" : "Enter Presentation Mode"}
      style={{
        minWidth: 40, minHeight: 40, borderRadius: 8,
        border: `1px solid ${active ? "#2ab5c1" : "#dee2e6"}`,
        background: active ? "rgba(42,181,193,0.1)" : "#ffffff",
        color: active ? "#2ab5c1" : "#52667a",
        fontSize: 18, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {active ? "\u2716" : "\u{1F5B5}"}
    </button>
  );
}
