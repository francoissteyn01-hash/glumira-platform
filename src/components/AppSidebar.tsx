/**
 * GluMira™ V7 — App Sidebar + Mobile Bottom Tab Bar
 * Desktop: 240px fixed left panel, collapsible to 64px icon-only
 * Mobile (<768px): bottom tab bar with "More" bottom sheet
 * Scandinavian Minimalist: #f8f9fa bg, #1a2a5e items, #2ab5c1 active
 */

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const BG = "var(--bg-sidebar)";
const NAVY = "var(--text-primary)";
const TEAL = "var(--accent-teal)";
const MUTED = "var(--text-muted)";
const BORDER = "var(--border)";
const RED = "#ef4444";

/* ─── Icons (inline SVG) ────────────────────────────────────────────────── */
// Raw stroke icon — used for utility controls (collapse, chevron, signout)
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// Circular nav icon — modern clinical style matching brand icon language
// Active: teal pill background, white icon. Inactive: soft grey, navy icon.
const NavIcon = ({ d, active, collapsed }: { d: string; active: boolean; collapsed: boolean }) => {
  const size = collapsed ? 36 : 32;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: 10,
      flexShrink: 0,
      background: active ? "var(--accent-teal)" : "rgba(26,42,94,0.07)",
      transition: "background 0.15s",
    }}>
      <svg
        width={collapsed ? 18 : 16}
        height={collapsed ? 18 : 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#ffffff" : "var(--text-primary)"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={d} />
      </svg>
    </span>
  );
};

const ICONS = {
  profile:      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  // Insulin pen (not syringe): clean pen/stylus representing modern insulin delivery
  insulin:      "M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",
  dashboard:    "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  analytics:    "M3 3v18h18M7 14l4-4 4 4 5-5",
  alertHistory: "M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  syncStatus:   "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 22v-6h6M21 2v6h-6",
  compliance:   "M9 12l2 2 4-4M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z",
  iobHunter:    "M3 12h4l3-9 4 18 3-9h4",
  // Insulin log: clipboard with pen — clinical record, not syringe
  logInsulin:   "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM12 11h4M12 16h4M8 11h.01M8 16h.01",
  // Meal log: fork and knife — clean, not a syringe
  logMeal:      "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  // Conditions log: pulse/heart rate — medical, clean
  conditions:   "M22 12h-4l-3 9L9 3l-3 9H2",
  // Education: open book — clean, professional
  education:    "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  // Mira AI: message with sparkle — AI assistant
  mira:         "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 7v.01M16 11v.01M8 11v.01",
  // Modules: clean 4-square grid
  modules:      "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  // Meal plan: calendar with fork
  meal:         "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  badges:       "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 22l5-3 5 3-1.21-8.12",
  // Tutorial: play button — video/walkthrough
  tutorial:     "M15 10l-4.553-2.276A1 1 0 0 0 9 8.618v6.764a1 1 0 0 0 1.447.894L15 14M3 4h18v16H3z",
  // Settings: sliders (not gear — cleaner, less mechanical)
  settings:     "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  faq:          "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  signout:      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevronDown:  "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  more:         "M12 5v.01M12 12v.01M12 19v.01",
  close:        "M18 6L6 18M6 6l12 12",
  collapse:     "M19 12H5M12 5l-7 7 7 7",
  expand:       "M5 12h14M12 5l7 7-7 7",
};

const CLINICAL_MODULES = [
  { path: "/modules/adhd", label: "ADHD" },
  { path: "/modules/autism", label: "Autism + T1D" },
  { path: "/modules/menstrual", label: "Menstrual Cycle" },
  { path: "/modules/thyroid", label: "Thyroid" },
];

const SPECIAL_CARE_MODULES = [
  { path: "/modules/paediatric", label: "Paediatric" },
  { path: "/modules/pregnancy", label: "Pregnancy" },
  { path: "/modules/school-care", label: "School Care Plan" },
];

const DIETARY_MODULES = [
  { path: "/modules/bernstein", label: "Bernstein" },
  { path: "/modules/carnivore", label: "Carnivore" },
  { path: "/modules/dash", label: "DASH" },
  { path: "/modules/full-carb", label: "Full Carb" },
  { path: "/modules/gluten-free", label: "Gluten-Free" },
  { path: "/modules/halal", label: "Halal" },
  { path: "/modules/high-protein", label: "High Protein" },
  { path: "/modules/intermittent-fasting", label: "IF (Fasting)" },
  { path: "/modules/keto", label: "Keto" },
  { path: "/modules/kosher", label: "Kosher" },
  { path: "/modules/low-carb", label: "Low Carb" },
  { path: "/modules/low-gi", label: "Low GI" },
  { path: "/modules/mediterranean", label: "Mediterranean" },
  { path: "/modules/mixed-balanced", label: "Mixed / Balanced" },
  { path: "/modules/paleo", label: "Paleo" },
  { path: "/modules/plant-based", label: "Plant-Based" },
  { path: "/modules/ramadan", label: "Ramadan" },
  { path: "/modules/sick-day", label: "Sick Day" },
  { path: "/modules/vegetarian", label: "Vegetarian" },
  { path: "/modules/zone", label: "Zone" },
];

/* ─── Shared item styles ────────────────────────────────────────────────── */
const itemStyle = (active: boolean, collapsed: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: collapsed ? 0 : 10,
  padding: collapsed ? "6px" : "6px 10px",
  margin: "2px 6px",
  borderRadius: 10,
  color: active ? TEAL : NAVY,
  background: "transparent",
  fontSize: 14,
  fontWeight: active ? 600 : 450,
  textDecoration: "none",
  cursor: "pointer",
  position: "relative",
  transition: "background 0.15s, color 0.15s",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  justifyContent: collapsed ? "center" : "flex-start",
  border: "none",
  width: collapsed ? "calc(100% - 12px)" : "calc(100% - 12px)",
  textAlign: "left",
  lineHeight: 1.4,
});

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: MUTED,
  padding: "20px 18px 5px",
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
      {({ isActive }: { isActive: boolean }) => (
        <>
          <NavIcon d={iconPath} active={isActive} collapsed={collapsed} />
          {!collapsed && <span style={{ letterSpacing: "-0.01em" }}>{label}</span>}
        </>
      )}
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
          <span style={{ fontSize: 16, fontWeight: 700, color: TEAL, letterSpacing: "-0.02em", fontFamily: "'Playfair Display', Georgia, serif" }}>
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
        {/* My Profile */}
        {!collapsed && <div style={sectionLabelStyle}>My Profile</div>}
        {navItem("/profile", "User Profile", ICONS.profile)}
        {navItem("/settings", "Insulin Profile", ICONS.settings)}

        {/* Insulin & Logging */}
        {!collapsed && <div style={sectionLabelStyle}>Insulin &amp; Logging</div>}
        {navItem("/dashboard", "Dashboard", ICONS.dashboard)}
        {navItem("/iob-hunter", "IOB Hunter", ICONS.iobHunter)}
        {navItem("/dashboard/analytics", "Analytics", ICONS.analytics)}
        {navItem("/alerts/history", "Alert History", ICONS.alertHistory)}
        {navItem("/sync-status", "Sync Status", ICONS.syncStatus)}
        {navItem("/compliance", "Compliance", ICONS.compliance)}
        {navItem("/insulin", "Log Insulin", ICONS.logInsulin)}
        {navItem("/log", "Log Meal", ICONS.logMeal)}
        {navItem("/conditions", "Log Conditions", ICONS.conditions)}

        {/* Modules (expandable) */}
        {!collapsed && <div style={sectionLabelStyle}>Modules</div>}
        <button type="button"
          onClick={() => setModulesOpen(!modulesOpen)}
          title={collapsed ? "Modules" : undefined}
          style={itemStyle(false, collapsed)}
        >
          <NavIcon d={ICONS.modules} active={false} collapsed={collapsed} />
          {!collapsed && (
            <>
              <span style={{ flex: 1, letterSpacing: "-0.01em" }}>Modules</span>
              <Icon d={modulesOpen ? ICONS.chevronDown : ICONS.chevronRight} size={14} />
            </>
          )}
        </button>
        {!collapsed && modulesOpen && (
          <div>
            <div style={{ ...sectionLabelStyle, padding: "8px 22px 2px", fontSize: 9 }}>Clinical</div>
            {CLINICAL_MODULES.map((m) => subItem(m.path, m.label))}
            <div style={{ ...sectionLabelStyle, padding: "8px 22px 2px", fontSize: 9 }}>Special Care</div>
            {SPECIAL_CARE_MODULES.map((m) => subItem(m.path, m.label))}
            <div style={{ ...sectionLabelStyle, padding: "8px 22px 2px", fontSize: 9 }}>Dietary Regime</div>
            {DIETARY_MODULES.map((m) => subItem(m.path, m.label))}
          </div>
        )}

        {/* Education & Tools */}
        {!collapsed && <div style={sectionLabelStyle}>Education &amp; Tools</div>}
        {navItem("/education", "Education", ICONS.education)}
        {navItem("/mira", "Mira AI", ICONS.mira)}
        {navItem("/meals/plan", "Meal Plan", ICONS.meal)}
        {navItem("/badges", "Badges", ICONS.badges)}
        {navItem("/tutorial", "Tutorial", ICONS.tutorial)}

        {/* Help */}
        {!collapsed && <div style={sectionLabelStyle}>Help</div>}
        {navItem("/faq", "FAQ", ICONS.faq)}
      </nav>

      {/* Night mode + Sign out — bottom */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "8px 8px" }}>
        {!collapsed && (
          <div style={{ margin: "4px 0 8px" }}>
            <ThemeToggle showLabel />
          </div>
        )}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 8px" }}>
            <ThemeToggle />
          </div>
        )}
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
        <NavLink to="/insulin" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.logInsulin} size={20} /><span>Insulin</span>
        </NavLink>
        <NavLink to="/log" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.logMeal} size={20} /><span>Log</span>
        </NavLink>
        <NavLink to="/mira" style={({ isActive }) => tabStyle(isActive)}>
          <Icon d={ICONS.mira} size={20} /><span>Mira</span>
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
              <div style={sectionLabelStyle}>My Profile</div>
              {moreItem("/profile", "User Profile", ICONS.profile)}
              {moreItem("/settings", "Insulin Profile", ICONS.settings)}
              <div style={sectionLabelStyle}>Insulin &amp; Logging</div>
              {moreItem("/conditions", "Log Conditions", ICONS.conditions)}
              <div style={sectionLabelStyle}>Modules &mdash; Clinical</div>
              {CLINICAL_MODULES.map((m) => moreItem(m.path, m.label, ICONS.modules))}
              <div style={sectionLabelStyle}>Modules &mdash; Special Care</div>
              {SPECIAL_CARE_MODULES.map((m) => moreItem(m.path, m.label, ICONS.modules))}
              <div style={sectionLabelStyle}>Modules &mdash; Dietary Regime</div>
              {DIETARY_MODULES.map((m) => moreItem(m.path, m.label, ICONS.modules))}
              <div style={sectionLabelStyle}>Education &amp; Tools</div>
              {moreItem("/education", "Education", ICONS.education)}
              {moreItem("/meals/plan", "Meal Plan", ICONS.meal)}
              {moreItem("/badges", "Badges", ICONS.badges)}
              {moreItem("/tutorial", "Tutorial", ICONS.tutorial)}
              <div style={sectionLabelStyle}>Help</div>
              {moreItem("/faq", "FAQ", ICONS.faq)}
              <div style={{ padding: "10px 20px" }}>
                <ThemeToggle showLabel />
              </div>
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
    try { localStorage.setItem("glumira_sidebar_collapsed", collapsed ? "1" : "0"); } catch { /* localStorage unavailable */ }
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
