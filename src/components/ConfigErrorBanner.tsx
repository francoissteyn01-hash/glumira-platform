/**
 * GluMira™ V7 — Config Error Banner
 *
 * Renders a fixed-position banner at the top of every page when the
 * Supabase client is not configured (missing VITE_SUPABASE_URL or
 * VITE_SUPABASE_ANON_KEY). Replaces the silent placeholder-redirect
 * failure mode that surfaced on the 2026-04-11 production deploy.
 *
 * Mounted unconditionally in App.tsx; the banner returns null when the
 * client is properly configured.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { isSupabaseConfigured, SUPABASE_CONFIG_ERROR } from "@/hooks/useAuth";

export default function ConfigErrorBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#ef4444",
        color: "#fff",
        padding: "12px 20px",
        fontSize: 13,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        textAlign: "center",
      }}
    >
      <strong style={{ fontWeight: 700, marginRight: 8 }}>
        Site configuration error:
      </strong>
      <span>{SUPABASE_CONFIG_ERROR}</span>
    </div>
  );
}
