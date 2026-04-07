/**
 * GluMira™ V7 — Beta Profile Switcher
 * Dropdown in dashboard header. Shows preloaded + custom profiles.
 * Active profile drives IOB calculations and graph displays across the app.
 */

import { useState, useEffect, useRef } from "react";
import {
  BETA_PROFILES,
  getCustomProfiles,
  getActiveProfileId,
  setActiveProfileId,
  type BetaProfile,
  type CustomBetaProfile,
} from "@/data/beta-profiles";

const NAVY = "#1a2a5e";
const TEAL = "#2ab5c1";
const AMBER = "#f59e0b";
const BORDER = "#e2e8f0";
const MUTED = "#718096";

interface Props {
  onChange?: (profile: BetaProfile | CustomBetaProfile) => void;
}

export default function BetaProfileSwitcher({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => getActiveProfileId());
  const [customProfiles, setCustomProfiles] = useState<CustomBetaProfile[]>(() => getCustomProfiles());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const allProfiles = [...BETA_PROFILES, ...customProfiles];
  const active = allProfiles.find((p) => p.id === activeId) ?? BETA_PROFILES[0];

  function selectProfile(profile: BetaProfile | CustomBetaProfile) {
    setActiveId(profile.id);
    setActiveProfileId(profile.id);
    setOpen(false);
    onChange?.(profile);
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("glumira:profile-change", { detail: profile }));
  }

  const typeColor = (t: string) => {
    if (t === "paediatric") return TEAL;
    if (t === "teen") return "#8b5cf6";
    if (t === "adult") return NAVY;
    if (t === "clinician") return AMBER;
    return MUTED;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <button type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          background: "#ffffff",
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          cursor: "pointer",
          minWidth: 240,
          textAlign: "left",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = TEAL; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: typeColor(active.profile_type),
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {"case_code" in active ? active.case_code : `Custom ${("slot" in active && active.slot) ? active.slot : ""}`}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {active.profile_name}
          </p>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: 320,
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(15,27,61,0.1)",
            zIndex: 100,
            maxHeight: 440,
            overflowY: "auto",
          }}
        >
          {/* BETA disclaimer header */}
          <div style={{
            padding: "10px 16px",
            background: "rgba(245,158,11,0.08)",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: AMBER, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              BETA TEST DATA &mdash; NOT REAL PATIENT
            </p>
          </div>

          {/* Preloaded case studies */}
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, padding: "6px 16px 4px", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Case Studies
            </p>
            {BETA_PROFILES.map((p) => (
              <button type="button"
                key={p.id}
                role="option"
                aria-selected={p.id === activeId}
                onClick={() => selectProfile(p)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  background: p.id === activeId ? "rgba(42,181,193,0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (p.id !== activeId) e.currentTarget.style.background = "#f8f9fa"; }}
                onMouseLeave={(e) => { if (p.id !== activeId) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: typeColor(p.profile_type),
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, margin: 0, letterSpacing: "0.05em" }}>
                    {p.case_code}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: p.id === activeId ? 600 : 500, color: NAVY, margin: "2px 0 0" }}>
                    {p.profile_name}
                  </p>
                </div>
                {p.id === activeId && (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Custom profiles */}
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: "8px 0" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, padding: "6px 16px 4px", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Your Custom Profiles
            </p>
            {customProfiles.length === 0 && (
              <p style={{ fontSize: 12, color: MUTED, padding: "8px 16px", margin: 0, fontStyle: "italic" }}>
                No custom profiles yet. You can create up to 2.
              </p>
            )}
            {customProfiles.map((p) => (
              <button type="button"
                key={p.id}
                role="option"
                aria-selected={p.id === activeId}
                onClick={() => selectProfile(p)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  background: p.id === activeId ? "rgba(42,181,193,0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: typeColor(p.profile_type),
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, margin: 0 }}>
                    CUSTOM {p.slot}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: p.id === activeId ? 600 : 500, color: NAVY, margin: "2px 0 0" }}>
                    {p.profile_name}
                  </p>
                </div>
              </button>
            ))}
            {customProfiles.length < 2 && (
              <a
                href="/dashboard"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  fontSize: 12,
                  color: TEAL,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                + Create custom profile ({2 - customProfiles.length} slot{2 - customProfiles.length === 1 ? "" : "s"} left)
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook to subscribe to active profile changes across the app */
export function useActiveBetaProfile() {
  const [profile, setProfile] = useState<BetaProfile | CustomBetaProfile>(() => {
    const id = getActiveProfileId();
    const all = [...BETA_PROFILES, ...getCustomProfiles()];
    return all.find((p) => p.id === id) ?? BETA_PROFILES[0];
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setProfile(detail);
    };
    window.addEventListener("glumira:profile-change", handler);
    return () => window.removeEventListener("glumira:profile-change", handler);
  }, []);

  return profile;
}
