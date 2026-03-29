/**
 * GluMira™ V7 — client/src/App.tsx
 * Client-side routing — all pages wired
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { Suspense, lazy } from "react";
import { NAV_LINKS } from "./lib/constants";

// Lazy-load pages for code splitting
const DashboardPage  = lazy(() => import("./pages/DashboardPage"));
const EducationPage  = lazy(() => import("./pages/EducationPage"));
const MiraPage       = lazy(() => import("./pages/MiraPage"));
const BadgesPage     = lazy(() => import("./pages/BadgesPage"));
const FAQPage        = lazy(() => import("./pages/FAQPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="font-bold text-violet-600 dark:text-violet-400 text-lg">GluMira™</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <NavBar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/education"   element={<EducationPage />} />
            <Route path="/mira"        element={<MiraPage />} />
            <Route path="/badges"      element={<BadgesPage />} />
            <Route path="/faq"         element={<FAQPage />} />
            <Route path="/settings"    element={<div className="p-8 text-gray-400">Settings — coming soon</div>} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
