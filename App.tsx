/**
 * GluMira™ V7 — App.tsx
 * Root component. All routes + nav + auth guard.
 * Landing page at /, dark navbar for authenticated pages, light navbar for public pages.
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { NAV_LINKS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ─── Lazy pages ─────────────────────────────────────────────────────────── */
const LandingPage   = lazy(() => import("@/pages/LandingPage"));
const AuthPage      = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EducationPage = lazy(() => import("@/pages/EducationPage"));
const MiraPage      = lazy(() => import("@/pages/MiraPage"));
const BadgesPage    = lazy(() => import("@/pages/BadgesPage"));
const FAQPage       = lazy(() => import("@/pages/FAQPage"));
const SettingsPage  = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage   = lazy(() => import("@/pages/ProfilePage"));

/* ─── Loading fallback ───────────────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
    </div>
  );
}

/* ─── Light navbar (landing page — transparent over dark hero) ───────────── */
function LightNavBar() {
  const navigate = useNavigate();
  return (
    <nav
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "transparent",
        padding: "14px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <div style={{ width: 28, height: 28 }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: "#ffffff", letterSpacing: "-0.01em" }}>
            GluMira<sup style={{ fontSize: 8, verticalAlign: "super", color: "#2ab5c1" }}>™</sup>
          </span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#2ab5c1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Dark navbar (authenticated pages) ──────────────────────────────────── */
function DarkNavBar() {
  const { signOut } = useAuth();
  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="flex items-center gap-2">
          <div style={{ width: 24, height: 24 }} />
          <span className="font-bold text-violet-400 text-lg tracking-tight">GluMira™</span>
        </span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? "bg-violet-900/50 text-violet-300" : "text-gray-300 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button onClick={signOut} className="ml-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Smart navbar selector ──────────────────────────────────────────────── */
function NavBar() {
  const { user } = useAuth();
  const location = useLocation();

  // No navbar on auth page (it has its own branding)
  if (location.pathname === "/auth") return null;

  // Light navbar on landing page, dark on authenticated pages
  if (!user) return <LightNavBar />;
  return <DarkNavBar />;
}

/* ─── Smart home route ───────────────────────────────────────────────────── */
function HomeRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <NavBar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"          element={<HomeRoute />} />
            <Route path="/auth"      element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />
            <Route path="/mira"      element={<ProtectedRoute><MiraPage /></ProtectedRoute>} />
            <Route path="/badges"    element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
            <Route path="/faq"       element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
