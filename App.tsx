/**
 * GluMira™ V7 — App.tsx
 * Root component. All routes + nav + auth guard.
 * Landing page at /, dark navbar for authenticated pages, light navbar for public pages.
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GlucoseUnitsProvider } from "@/context/GlucoseUnitsContext";
import { PresentationModeProvider } from "@/components/PresentationMode";
import { SensoryProvider } from "@/contexts/SensoryContext";
import AppSidebar, { useSidebarOffset } from "@/components/AppSidebar";
import { useSessionTimeout, SessionWarningModal } from "@/hooks/useSessionTimeout";

/* ─── Lazy pages ─────────────────────────────────────────────────────────── */
const LandingPage   = lazy(() => import("@/pages/LandingPage"));
const AuthPage      = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EducationPage = lazy(() => import("@/pages/EducationPage"));
const MiraPage      = lazy(() => import("@/pages/MiraPage"));
const BadgesPage    = lazy(() => import("@/pages/BadgesPage"));
const FAQPage       = lazy(() => import("@/pages/FAQPage"));
const SettingsPage  = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage   = lazy(() => import("@/pages/ProfilePage"));
const MealLogPage    = lazy(() => import("@/pages/MealLogPage"));
const InsulinLogPage    = lazy(() => import("@/pages/InsulinLogPage"));
const ConditionLogPage     = lazy(() => import("@/pages/ConditionLogPage"));
const OnboardingWizard        = lazy(() => import("@/pages/OnboardingWizard"));
const OnboardingStoryPage     = lazy(() => import("@/pages/OnboardingStoryPage"));
const HandwrittenImportPage   = lazy(() => import("@/pages/HandwrittenImportPage"));
const CaregiverManagePage     = lazy(() => import("@/pages/CaregiverManagePage"));

/* ─── GROUP4 Modules ────────────────────────────────────────────────────── */
const PregnancyModule         = lazy(() => import("@/pages/PregnancyModule"));
const PaediatricModule        = lazy(() => import("@/pages/PaediatricModule"));
const SchoolCarePlanModule    = lazy(() => import("@/pages/SchoolCarePlanModule"));
const MenstrualCycleModule    = lazy(() => import("@/pages/MenstrualCycleModule"));

/* ─── Specialist & Dietary Modules ─────────────────────────────────────── */
const ADHDModule              = lazy(() => import("@/pages/ADHDModule"));
const AutismModule            = lazy(() => import("@/pages/AutismModule"));
const ThyroidModule           = lazy(() => import("@/pages/ThyroidModule"));
const RamadanModule           = lazy(() => import("@/pages/RamadanModule"));
const KosherModule            = lazy(() => import("@/pages/KosherModule"));
const HalalModule             = lazy(() => import("@/pages/HalalModule"));
const BernsteinModule         = lazy(() => import("@/pages/BernsteinModule"));
const SickDayModule           = lazy(() => import("@/pages/SickDayModule"));
const MealPlanPage            = lazy(() => import("@/pages/MealPlanPage"));
const EducationTopicPage      = lazy(() => import("@/pages/EducationTopicPage"));

const DevPanel                = lazy(() => import("@/pages/DevPanel"));
const RegisterPage            = lazy(() => import("@/pages/RegisterPage"));
const TutorialPage            = lazy(() => import("@/pages/TutorialPage"));

/* ─── Loading fallback ───────────────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
    </div>
  );
}

/* ─── Paths with no sidebar chrome ───────────────────────────────────────── */
const CHROMELESS = ["/", "/auth", "/auth/callback", "/dev", "/tutorial"];
function isChromeless(pathname: string): boolean {
  if (CHROMELESS.includes(pathname)) return true;
  if (pathname === "/register") return true;
  return false;
}

/* ─── Shell: sidebar + content wrapper with session timeout ───────────────── */
function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const chromeless = isChromeless(location.pathname);
  const sidebarOffset = useSidebarOffset();
  const { showWarning, stayActive, logout } = useSessionTimeout(!chromeless);

  if (chromeless) {
    return <>{children}</>;
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <AppSidebar />
      <div
        style={{
          marginLeft: sidebarOffset,
          paddingBottom: isMobile ? 72 : 0,
          minHeight: "100vh",
          transition: "margin-left 0.2s ease",
          background: "#f8f9fa",
        }}
      >
        {children}
      </div>
      <SessionWarningModal open={showWarning} onStay={stayActive} onLogout={logout} />
    </>
  );
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
      <GlucoseUnitsProvider>
        <SensoryProvider>
        <PresentationModeProvider>
        <div className="min-h-screen" style={{ background: "#f8f9fa", color: "#1a2a5e" }}>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <AppShell>
          <main id="main-content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/"          element={<HomeRoute />} />
              <Route path="/auth"      element={<AuthPage />} />
              <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
              {/* Dev phase: all routes bypass auth */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/education/:id" element={<EducationTopicPage />} />
              <Route path="/mira"      element={<MiraPage />} />
              <Route path="/badges"    element={<BadgesPage />} />
              <Route path="/faq"       element={<FAQPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
              <Route path="/log"       element={<MealLogPage />} />
              <Route path="/insulin"    element={<InsulinLogPage />} />
              <Route path="/conditions" element={<ConditionLogPage />} />
              <Route path="/profile"           element={<ProfilePage />} />
              <Route path="/onboarding"             element={<OnboardingWizard />} />
              <Route path="/onboarding/story"     element={<OnboardingStoryPage />} />
              <Route path="/import/handwritten"   element={<HandwrittenImportPage />} />
              <Route path="/caregivers"              element={<CaregiverManagePage />} />
              <Route path="/settings/caregivers"    element={<CaregiverManagePage />} />
              {/* GROUP4 Modules */}
              <Route path="/modules/pregnancy"       element={<PregnancyModule />} />
              <Route path="/modules/paediatric"      element={<PaediatricModule />} />
              <Route path="/modules/school-care"     element={<SchoolCarePlanModule />} />
              <Route path="/modules/menstrual"       element={<MenstrualCycleModule />} />
              {/* Legacy route redirects */}
              <Route path="/pregnancy" element={<Navigate to="/modules/pregnancy" replace />} />
              <Route path="/paediatric" element={<Navigate to="/modules/paediatric" replace />} />
              <Route path="/school-care-plan" element={<Navigate to="/modules/school-care" replace />} />
              <Route path="/menstrual-cycle" element={<Navigate to="/modules/menstrual" replace />} />
              {/* Specialist & Dietary Modules */}
              <Route path="/modules/adhd"       element={<ADHDModule />} />
              <Route path="/modules/autism"     element={<AutismModule />} />
              <Route path="/modules/thyroid"    element={<ThyroidModule />} />
              <Route path="/modules/ramadan"    element={<RamadanModule />} />
              <Route path="/modules/kosher"     element={<KosherModule />} />
              <Route path="/modules/halal"      element={<HalalModule />} />
              <Route path="/modules/bernstein"  element={<BernsteinModule />} />
              <Route path="/modules/sick-day"   element={<SickDayModule />} />
              <Route path="/meals/plan"         element={<MealPlanPage />} />
              <Route path="/dev"                   element={<DevPanel />} />
              <Route path="/register"              element={<RegisterPage />} />
              <Route path="/tutorial"              element={<TutorialPage />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </main>
          </AppShell>
        </div>
        </PresentationModeProvider>
        </SensoryProvider>
      </GlucoseUnitsProvider>
    </BrowserRouter>
  );
}
