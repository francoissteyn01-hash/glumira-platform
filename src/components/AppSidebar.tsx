/**
 * GluMira™ V7 — App Sidebar + Mobile Bottom Tab Bar
 * Desktop: 240px fixed left panel, collapsible to 64px icon-only
 * Mobile (<768px): bottom tab bar with "More" bottom sheet
 * Scandinavian Minimalist: #f8f9fa bg, #1a2a5e items, #2ab5c1 active
 */

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const BG = "var(--bg-sidebar)";
const NAVY = "var(--text-primary)";
const TEAL = "var(--accent-teal)";
const MUTED = "var(--text-muted)";
const BORDER = "var(--border)";
const RED = "#ef4444";

/* ─── Icons (inline SVG) ────────────────────────────────────────────────── */
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  education: "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5",
  mira: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  modules: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  meal: "M18 8h1a4 4 0 0 1 0 8h-1M3 8h14v10H3zM6 1v3M10 1v3M14 1v3",
  badges: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 22l5-3 5 3-1.21-8.12",
  tutorial: "M15 10l-4.553-2.276A1 1 0 0 0 9 8.618v6.764a1 1 0 0 0 1.447.894L15 14M3 4h18v16H3z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  faq: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  signout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  more: "M12 5v.01M12 12v.01M12 19v.01",
  close: "M18 6L6 18M6 6l12 12",
  collapse: "M19 12H5M12 5l-7 7 7 7",
  expand: "M5 12h14M12 5l7 7-7 7",
};

const CLINICAL_MODULES = [
  { path: "/modules/pregnancy", label: "Pregnancy" },
  { path: "/modules/paediatric", label: "Paediatric" },
  { path: "/modules/school-care", label: "School Care" },
  { path: "/modules/menstrual", label: "Menstrual" },
  { path: "/modules/adhd", label: "ADHD" },
  { path: "/modules/autism", label: "Autism + T1D" },
  { path: "/modules/thyroid", label: "Thyroid" },
];

const DIETARY_MODULES = [
  { path: "/modules/ramadan", label: "Ramadan" },
  { path: "/modules/kosher", label: "Kosher" },
  { path: "/modules/halal", label: "Halal" },
  { path: "/modules/bernstein", label: "Bernstein" },
  { path: "/modules/sick-day", label: "Sick Day" },
];

/* ─── Shared item styles ────────────────────────────────────────────────── */
const itemStyle = (active: boolean, collapsed: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: collapsed ? 0 : 12,
  padding: collapsed ? "10px" : "10px 14px",
  margin: "2px 8px",
  borderRadius: 8,
  color: active ? TEAL : NAVY,
  background: active ? "rgba(42,181,193,0.08)" : "transparent",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  textDecoration: "none",
  cursor: "pointer",
  position: "relative",
  transition: "background 0.15s, color 0.15s",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  justifyContent: collapsed ? "center" : "flex-start",
  border: "none",
  width: collapsed ? "calc(100% - 16px)" : "calc(100% - 16px)",
  textAlign: "left",
});

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: MUTED,
  padding: "16px 22px 6px",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

/* ─── Desktop Sidebar ───────────────────────────────────────────────────── */
function DesktopSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const [modulesOpen, setModulesOpen] = useState(false);
  const { signOut } = useAuth();

  const width = collapsed ? 64 : 240;

  const navItem = (path: string, label: string, iconPath: string) => (
    <NavLink
      key={path}
      to={path}
      title={collapsed ? label : undefined}
      style={({ isActive }) => itemStyle(isActive, collapsed)}
    >
      <Icon d={iconPath} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  const subItem = (path: string, label: string) => (
    <NavLink
      key={path}
      to={path}
      style={({ isActive }) => ({
        display: "block",
        padding: "7px 14px 7px 48px",
        margin: "1px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? TEAL : MUTED,
        background: isActive ? "rgba(42,181,193,0.06)" : "transparent",
        textDecoration: "none",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "background 0.15s",
      })}
    >
      {label}
    </NavLink>
  );

  return (
    <aside
      aria-label="Main navigation"
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width,
        background: BG,
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: collapsed ? "18px 12px" : "18px 22px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {!collapsed && (
          <span style={{ fontSize: 16, fontWeight: 700, color: TEAL, letterSpacing: "-0.01em", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            GluMira&trade;
          </span>
        )}
        <button type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: MUTED, padding: 4, display: "flex", alignItems: "center",
          }}
        >
          <Icon d={collapsed ? ICONS.expand : ICONS.collapse} size={16} />
        </button>
      </div>

      {/* Scroll area */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Primary */}
        {!collapsed && <div style={sectionLabelStyle}>Primary</div>}
        {navItem("/dashboard", "Dashboard", ICONS.dashboard)}
        {navItem("/education", "Education", ICONS.education)}
        {navItem("/mira", "Mira AI", ICONS.mira)}

        {/* Modules (expandable) */}
        {!collapsed && <div style={sectionLabelStyle}>Modules</div>}
        <button type="button"
          onClick={() => setModulesOpen(!modulesOpen)}
          title={collapsed ? "Modules" : undefined}
          style={itemStyle(false, collapsed)}
        >
          <Icon d={ICONS.modules} />
          {!collapsed && (
            <>
              <span style={{ flex: 1 }}>Modules</span>
              <Icon d={modulesOpen ? ICONS.chevronDown : ICONS.chevronRight} size={14} />
            </>
          )}
        </button>
        {!collapsed && modulesOpen && (
          <div>
            <div style={{ ...sectionLabelStyle, padding: "8px 22px 2px", fontSize: 9 }}>Clinical</div>
            {CLINICAL_MODULES.map((m) => subItem(m.path, m.label))}
            <div style={{ ...sectionLabelStyle, padding: "8px 22px 2px", fontSize: 9 }}>Dietary</div>
            {DIETARY_MODULES.map((m) => subItem(m.path, m.label))}
          </div>
        )}

        {/* Tools */}
        {!collapsed && <div style={sectionLabelStyle}>Tools</div>}
        {navItem("/meals/plan", "Meal Plan", ICONS.meal)}
        {navItem("/badges", "Badges", ICONS.badges)}
        {navItem("/tutorial", "Tutorial", ICONS.tutorial)}

        {/* Account */}
        {!collapsed && <div style={sectionLabelStyle}>Account</div>}
        {navItem("/settings", "Settings", ICONS.settings)}
        {navItem("/faq", "FAQ", ICONS.faq)}
      </nav>

      {/* Sign out — red, bottom */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "8px 0" }}>
        <button type="button"
          onClick={signOut}
          title={collapsed ? "Sign out" : undefined}
          style={{
            ...itemStyle(false, collapsed),
            color: RED,
            width: "calc(100% - 16px)",
          }}
        >
          <Icon d={ICONS.signout} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─── Mobile Bottom Tab Bar ─────────────────────────────────────────────── */
function MobileBottomBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { signOut } = useAuth();

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "8px 0",
    color: active ? TEAL : MUTED,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: active ? 600 : 500,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    textDecoration: "none",
  });

  const moreItem = (path: string, label: string, iconPath: string, onClick?: () => void) => (
    <NavLink
      key={path}
      to={path}
      onClick={() => { setSheetOpen(false); onClick?.(); }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 20px",
        color: NAVY,
        textDecoration: "none",
        fontSize: 14, fontWeight: 500,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <Icon d={iconPath} size={18} />
      {label}
    </NavLink>
  );

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--mobile-bg)",
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          zIndex: 40,
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <NavLink to="/dashboard" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.dashboard} size={20} /><span>Dashboard</span>
        </NavLink>
        <NavLink to="/education" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.education} size={20} /><span>Learn</span>
        </NavLink>
        <NavLink to="/mira" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.mira} size={20} /><span>Mira</span>
        </NavLink>
        <NavLink to="/meals/plan" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.meal} size={20} /><span>Meals</span>
        </NavLink>
        <button type="button" onClick={() => setSheetOpen(true)} style={tabStyle(sheetOpen)}>
          <Icon d={ICONS.more} size={20} /><span>More</span>
        </button>
      </nav>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div
          role="dialog" aria-modal="true"
          onClick={() => setSheetOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "var(--sheet-overlay)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "80vh",
              background: "var(--mobile-bg)",
              borderRadius: "16px 16px 0 0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Handle */}
            <div style={{ padding: "10px 0 4px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER }} />
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 20px 10px", borderBottom: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>More</span>
              <button type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}
              >
                <Icon d={ICONS.close} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={sectionLabelStyle}>Modules &mdash; Clinical</div>
              {CLINICAL_MODULES.map((m) => moreItem(m.path, m.label, ICONS.modules))}
              <div style={sectionLabelStyle}>Modules &mdash; Dietary</div>
              {DIETARY_MODULES.map((m) => moreItem(m.path, m.label, ICONS.modules))}
              <div style={sectionLabelStyle}>Tools</div>
              {moreItem("/badges", "Badges", ICONS.badges)}
              {moreItem("/tutorial", "Tutorial", ICONS.tutorial)}
              <div style={sectionLabelStyle}>Account</div>
              {moreItem("/settings", "Settings", ICONS.settings)}
              {moreItem("/faq", "FAQ", ICONS.faq)}
              <button type="button"
                onClick={() => { setSheetOpen(false); signOut(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px",
                  color: RED,
                  background: "transparent",
                  border: "none",
                  borderBottom: `1px solid ${BORDER}`,
                  width: "100%",
                  cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  textAlign: "left",
                }}
              >
                <Icon d={ICONS.signout} size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main export — responsive switcher ─────────────────────────────────── */
export default function AppSidebar() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("glumira_sidebar_collapsed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("glumira_sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  if (isMobile) return <MobileBottomBar />;
  return <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />;
}

/** Hook to get current sidebar offset (for main content margin) */
export function useSidebarOffset() {
  const [offset, setOffset] = useState(() => {
    if (typeof window === "undefined") return 240;
    if (window.innerWidth < 768) return 0;
    try {
      return localStorage.getItem("glumira_sidebar_collapsed") === "1" ? 64 : 240;
    } catch { return 240; }
  });

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) { setOffset(0); return; }
      try {
        setOffset(localStorage.getItem("glumira_sidebar_collapsed") === "1" ? 64 : 240);
      } catch { setOffset(240); }
    };
    const interval = setInterval(update, 300);
    window.addEventListener("resize", update);
    return () => { clearInterval(interval); window.removeEventListener("resize", update); };
  }, []);

  return offset;
}
