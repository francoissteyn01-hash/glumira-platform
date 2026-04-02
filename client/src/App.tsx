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
      <p className="text-[#718096] animate-pulse text-sm">Loading…</p>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="border-b border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="font-bold text-[#2ab5c1] dark:text-[#2ab5c1] text-lg">GluMira™</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-brand-100 dark:bg-brand-600/30 text-brand-600 dark:text-brand-500"
                    : "text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#1a2a5e]"
                }`
              }
            >
              {link.label}
        {/* Modules dropdown */}
        <div className="relative group">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#1a2a5e] hover:bg-[#f0f4f8] transition-colors whitespace-nowrap">
            Modules ▾
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-2 hidden group-hover:flex flex-col gap-1 min-w-[190px] z-50">
            <NavLink to="/modules/pregnancy"   className="px-3 py-2 text-xs text-[#1a2a5e] hover:bg-[#f0f4f8] rounded-lg">🤱 Pregnancy</NavLink>
            <NavLink to="/modules/paediatric"  className="px-3 py-2 text-xs text-[#1a2a5e] hover:bg-[#f0f4f8] rounded-lg">👶 Paediatric</NavLink>
            <NavLink to="/modules/school-care" className="px-3 py-2 text-xs text-[#1a2a5e] hover:bg-[#f0f4f8] rounded-lg">🏫 School Care Plan</NavLink>
            <NavLink to="/modules/menstrual"   className="px-3 py-2 text-xs text-[#1a2a5e] hover:bg-[#f0f4f8] rounded-lg">🌿 Menstrual Cycle</NavLink>
          </div>
        </div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#f8f9fa]">
        <NavBar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/education"   element={<EducationPage />} />
            <Route path="/mira"        element={<MiraPage />} />
            <Route path="/badges"      element={<BadgesPage />} />
            <Route path="/faq"         element={<FAQPage />} />
            <Route path="/settings"    element={<div className="p-8 text-[#718096]">Settings — coming soon</div>} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
