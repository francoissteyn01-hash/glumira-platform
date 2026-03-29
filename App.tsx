/**
 * GluMira™ V7 — App.tsx
 * Root component. All routes + nav + auth guard.
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { Suspense, lazy } from "react";
import { NAV_LINKS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

const AuthPage      = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EducationPage = lazy(() => import("@/pages/EducationPage"));
const MiraPage      = lazy(() => import("@/pages/MiraPage"));
const BadgesPage    = lazy(() => import("@/pages/BadgesPage"));
const FAQPage       = lazy(() => import("@/pages/FAQPage"));
const SettingsPage  = lazy(() => import("@/pages/SettingsPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-600 animate-pulse text-sm">Loading…</p>
    </div>
  );
}

function NavBar() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="font-bold text-violet-400 text-lg tracking-tight">GluMira™</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? "bg-violet-900/50 text-violet-300" : "text-gray-400 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button onClick={signOut} className="ml-2 px-3 py-1.5 text-xs text-gray-600 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <NavBar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/auth"      element={<AuthPage />} />
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />
            <Route path="/mira"      element={<ProtectedRoute><MiraPage /></ProtectedRoute>} />
            <Route path="/badges"    element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
            <Route path="/faq"       element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
