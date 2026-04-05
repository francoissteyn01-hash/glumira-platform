/**
 * GluMira™ V7 — useSessionTimeout hook
 * 15min inactivity -> auto-logout.
 * Warning modal at 13min -> "Session expires in 2 minutes".
 * On beforeunload -> signOut.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "./useAuth";

const IDLE_MS = 60 * 60 * 1000;   // 60 min
const WARN_MS = 58 * 60 * 1000;   // 58 min (2 min before logout)

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown", "keydown", "touchstart", "scroll", "mousemove",
];

export function useSessionTimeout(enabled: boolean = true) {
  const [showWarning, setShowWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/auth";
  }, []);

  const resetTimers = useCallback(() => {
    lastActivity.current = Date.now();
    setShowWarning(false);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    if (!enabled) return;

    warnTimer.current = setTimeout(() => setShowWarning(true), WARN_MS);
    logoutTimer.current = setTimeout(logout, IDLE_MS);
  }, [enabled, logout]);

  useEffect(() => {
    if (!enabled) return;

    resetTimers();

    const handleActivity = () => resetTimers();
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true })
    );

    // NOTE: Do NOT sign out on beforeunload — that would log users out on
    // every tab close, reload, or navigation. Supabase persists the session
    // in localStorage under "glumira-auth" and auto-refreshes tokens.

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [enabled, resetTimers]);

  const stayActive = useCallback(() => resetTimers(), [resetTimers]);

  return { showWarning, stayActive, logout };
}

/** Warning modal component */
export function SessionWarningModal({
  open, onStay, onLogout,
}: {
  open: boolean;
  onStay: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(15,27,61,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "26px 28px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>&#9201;</div>
        <h3 id="session-warning-title" style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e", margin: "0 0 8px" }}>
          Session expiring soon
        </h3>
        <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.5, margin: "0 0 20px" }}>
          Your session will expire in 2 minutes due to inactivity. Click below to stay signed in.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button type="button"
            onClick={onLogout}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "transparent",
              color: "#718096",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
          <button type="button"
            onClick={onStay}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#2ab5c1",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
