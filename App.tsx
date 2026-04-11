/**
 * GluMira™ V7 — App.tsx
 * Root component. All routes + nav + auth guard.
 * Landing page at /, dark navbar for authenticated pages, light navbar for public pages.
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GlucoseUnitsProvider } from "@/context/GlucoseUnitsContext";
import { PresentationModeProvider } from "@/components/PresentationMode";
import { SensoryProvider } from "@/contexts/SensoryContext";
import AppSidebar, { useSidebarOffset } from "@/components/AppSidebar";
import ConfigErrorBanner from "@/components/ConfigErrorBanner";
import { useSessionTimeout, SessionWarningModal } from "@/hooks/useSessionTimeout";

/* ─── Lazy pages ─────────────────────────────────────────────────────────── */
const LandingPage   = lazy(() => import("@/pages/LandingPage"));
const AuthPage      = lazy(() => import("@/pages/RegisterPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AnalyticsDashboardPage = lazy(() => import("@/pages/AnalyticsDashboardPage"));
const AlertHistoryPage = lazy(() => import("@/pages/AlertHistoryPage"));
const SyncStatusPage = lazy(() => import("@/pages/SyncStatusPage"));
const CompliancePage = lazy(() => import("@/pages/CompliancePage"));
const WhatIfPage    = lazy(() => import("@/pages/WhatIfPage"));
const EducationPage = lazy(() => import("@/pages/EducationPage"));
const MiraPage      = lazy(() => import("@/pages/MiraPage"));
const BadgesPage    = lazy(() => import("@/pages/BadgesPage"));
const FAQPage       = lazy(() => import("@/pages/FAQPage"));
const SettingsPage  = lazy(() => import("@/pages/SettingsPage"));
const InsulinProfilePage = lazy(() => import("@/pages/InsulinProfilePage"));
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
const CarnivoreModule         = lazy(() => import("@/pages/CarnivoreModule"));
const DASHModule              = lazy(() => import("@/pages/DASHModule"));
const FullCarbModule          = lazy(() => import("@/pages/FullCarbModule"));
const GlutenFreeModule        = lazy(() => import("@/pages/GlutenFreeModule"));
const HighProteinModule       = lazy(() => import("@/pages/HighProteinModule"));
const IntermittentFastingModule = lazy(() => import("@/pages/IntermittentFastingModule"));
const KetoModule              = lazy(() => import("@/pages/KetoModule"));
const LowCarbModule           = lazy(() => import("@/pages/LowCarbModule"));
const LowGIModule             = lazy(() => import("@/pages/LowGIModule"));
const MediterraneanModule     = lazy(() => import("@/pages/MediterraneanModule"));
const MixedBalancedModule     = lazy(() => import("@/pages/MixedBalancedModule"));
const PaleoModule             = lazy(() => import("@/pages/PaleoModule"));
const PlantBasedModule        = lazy(() => import("@/pages/PlantBasedModule"));
const VegetarianModule        = lazy(() => import("@/pages/VegetarianModule"));
const ZoneModule              = lazy(() => import("@/pages/ZoneModule"));
const MealPlanPage            = lazy(() => import("@/pages/MealPlanPage"));
const EducationTopicPage      = lazy(() => import("@/pages/EducationTopicPage"));

/* ─── V7 New Modules — Free Tier ──────────────────────────────────────── */
const GlucoseLogPage          = lazy(() => import("@/pages/GlucoseLogPage"));
const GlucoseChartPage        = lazy(() => import("@/pages/GlucoseChartPage"));
const InjectionSitePage       = lazy(() => import("@/pages/InjectionSitePage"));
const StreakPage              = lazy(() => import("@/pages/StreakPage"));
const BetaProgramPage         = lazy(() => import("@/pages/BetaProgramPage"));

/* ─── V7 New Modules — Pro Tier ──────────────────────────────────────── */
const ExerciseModule          = lazy(() => import("@/pages/ExerciseModule"));
const SleepModule             = lazy(() => import("@/pages/SleepModule"));
const EnvironmentalModule     = lazy(() => import("@/pages/EnvironmentalModule"));
const MentalHealthModule      = lazy(() => import("@/pages/MentalHealthModule"));

/* ─── V7 New Modules — AI Tier ───────────────────────────────────────── */
const PredictionPage          = lazy(() => import("@/pages/PredictionPage"));
const BolusAdvisorPage        = lazy(() => import("@/pages/BolusAdvisorPage"));
const CommunityPage           = lazy(() => import("@/pages/CommunityPage"));
const MiraWaitingRoomGame     = lazy(() => import("@/pages/MiraWaitingRoomGame"));
const PediatricGrowthModule   = lazy(() => import("@/pages/PediatricGrowthModule"));
const PostSurgicalModule      = lazy(() => import("@/pages/PostSurgicalModule"));
const ClipsPage               = lazy(() => import("@/pages/ClipsPage"));

/* ─── V7 Portals ─────────────────────────────────────────────────────── */
const ClinicianPortal         = lazy(() => import("@/pages/ClinicianPortal"));
const ResearcherPortal        = lazy(() => import("@/pages/ResearcherPortal"));
const OrganisationPortal      = lazy(() => import("@/pages/OrganisationPortal"));

/* ─── V7 Reports & Compliance ────────────────────────────────────────── */
const ClinicalReportPage      = lazy(() => import("@/pages/ClinicalReportPage"));
const GrantEvidencePage       = lazy(() => import("@/pages/GrantEvidencePage"));
const ISPADCompliancePage     = lazy(() => import("@/pages/ISPADCompliancePage"));

/* ─── V7 Legal & Privacy ─────────────────────────────────────────────── */
const ConsentPage             = lazy(() => import("@/pages/ConsentPage"));
const PrivacyPolicyPage       = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsOfUsePage          = lazy(() => import("@/pages/TermsOfUsePage"));

/* ─── V7 Business & Developer ────────────────────────────────────────── */
const InvestorDashboard       = lazy(() => import("@/pages/InvestorDashboard"));
const APIDocumentationPage    = lazy(() => import("@/pages/APIDocumentationPage"));

/* ─── V7 Onboarding & Setup ─────────────────────────────────────────── */
const RegionSetupPage         = lazy(() => import("@/pages/RegionSetupPage"));

/* ─── V7 Audit ───────────────────────────────────────────────────────── */
const PerformanceAuditPage    = lazy(() => import("@/pages/PerformanceAuditPage"));
const AccessibilityAuditPage  = lazy(() => import("@/pages/AccessibilityAuditPage"));

/* ─── V7 Wave 3 — Final blocks ──────────────────────────────────────── */
const CGMLiveMonitorPage      = lazy(() => import("@/pages/CGMLiveMonitorPage"));
const SocialSharePage         = lazy(() => import("@/pages/SocialSharePage"));
const LaunchAnnouncementPage  = lazy(() => import("@/pages/LaunchAnnouncementPage"));

const IOBHunterPage           = lazy(() => import("@/pages/IOBHunterPage"));
const DemoDashboardPage       = lazy(() => import("@/pages/DemoDashboardPage"));
const DevPanel                = lazy(() => import("@/pages/DevPanel"));
const RegisterPage            = lazy(() => import("@/pages/RegisterPage"));
const TutorialPage            = lazy(() => import("@/pages/TutorialPage"));
const ReportPage              = lazy(() => import("@/pages/ReportPage"));

/* ─── Loading fallback ───────────────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div style={{ textAlign: "center" }}>
        <div className="skeleton" style={{ width: 120, height: 16, margin: "0 auto 12px", borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 80, height: 12, margin: "0 auto", borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ─── Paths with no sidebar chrome ───────────────────────────────────────── */
const CHROMELESS = ["/", "/auth", "/auth/callback", "/dev", "/tutorial", "/onboarding/region", "/onboarding/consent", "/privacy", "/terms", "/launch", "/demo"];
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
          background: "var(--bg-primary)",
        }}
      >
        <div className="page-transition" key={location.pathname}>
        {children}
        </div>
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
        <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
          <ConfigErrorBanner />
          <a href="#main-content" className="skip-link">Skip to content</a>
          <AppShell>
          <main id="main-content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/"          element={<HomeRoute />} />
              <Route path="/auth"      element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              {/* Public routes — no auth required */}
              <Route path="/demo"      element={<DemoDashboardPage />} />
              {/* Dev phase: all routes bypass auth */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/alerts/history" element={<AlertHistoryPage />} />
              <Route path="/sync-status" element={<SyncStatusPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/dashboard/what-if" element={<WhatIfPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/education/:id" element={<EducationTopicPage />} />
              <Route path="/clips"       element={<ClipsPage />} />
              <Route path="/mira"      element={<MiraPage />} />
              <Route path="/badges"    element={<BadgesPage />} />
              <Route path="/faq"       element={<FAQPage />} />
              <Route path="/settings"  element={<InsulinProfilePage />} />
              <Route path="/app-settings"  element={<SettingsPage />} />
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
              <Route path="/modules/carnivore"           element={<CarnivoreModule />} />
              <Route path="/modules/dash"                element={<DASHModule />} />
              <Route path="/modules/full-carb"           element={<FullCarbModule />} />
              <Route path="/modules/gluten-free"         element={<GlutenFreeModule />} />
              <Route path="/modules/high-protein"        element={<HighProteinModule />} />
              <Route path="/modules/intermittent-fasting" element={<IntermittentFastingModule />} />
              <Route path="/modules/keto"                element={<KetoModule />} />
              <Route path="/modules/low-carb"            element={<LowCarbModule />} />
              <Route path="/modules/low-gi"              element={<LowGIModule />} />
              <Route path="/modules/mediterranean"       element={<MediterraneanModule />} />
              <Route path="/modules/mixed-balanced"      element={<MixedBalancedModule />} />
              <Route path="/modules/paleo"               element={<PaleoModule />} />
              <Route path="/modules/plant-based"         element={<PlantBasedModule />} />
              <Route path="/modules/vegetarian"          element={<VegetarianModule />} />
              <Route path="/modules/zone"                element={<ZoneModule />} />
              <Route path="/meals/plan"         element={<MealPlanPage />} />
              <Route path="/report"                 element={<ReportPage />} />
              {/* ─── V7 Free Tier Routes ──────────────────────────────── */}
              <Route path="/glucose"               element={<GlucoseLogPage />} />
              <Route path="/glucose/chart"         element={<GlucoseChartPage />} />
              <Route path="/injection-sites"       element={<InjectionSitePage />} />
              <Route path="/streak"                element={<StreakPage />} />
              <Route path="/beta"                  element={<BetaProgramPage />} />
              {/* ─── V7 Pro Tier Routes ───────────────────────────────── */}
              <Route path="/modules/exercise"      element={<ExerciseModule />} />
              <Route path="/modules/sleep"         element={<SleepModule />} />
              <Route path="/modules/environmental" element={<EnvironmentalModule />} />
              <Route path="/modules/mental-health" element={<MentalHealthModule />} />
              {/* ─── V7 AI Tier Routes ────────────────────────────────── */}
              <Route path="/prediction"            element={<PredictionPage />} />
              <Route path="/bolus-advisor"         element={<BolusAdvisorPage />} />
              <Route path="/community"             element={<CommunityPage />} />
              <Route path="/mira/game"             element={<MiraWaitingRoomGame />} />
              <Route path="/modules/growth"        element={<PediatricGrowthModule />} />
              <Route path="/modules/post-surgical" element={<PostSurgicalModule />} />
              {/* ─── V7 Portal Routes ─────────────────────────────────── */}
              <Route path="/clinician"             element={<ClinicianPortal />} />
              <Route path="/researcher"            element={<ResearcherPortal />} />
              <Route path="/organisation"          element={<OrganisationPortal />} />
              {/* ─── V7 Reports & Compliance ──────────────────────────── */}
              <Route path="/clinical-report"       element={<ClinicalReportPage />} />
              <Route path="/grant-evidence"        element={<GrantEvidencePage />} />
              <Route path="/ispad"                 element={<ISPADCompliancePage />} />
              {/* ─── V7 Legal & Privacy ───────────────────────────────── */}
              <Route path="/onboarding/consent"    element={<ConsentPage />} />
              <Route path="/onboarding/region"     element={<RegionSetupPage />} />
              <Route path="/privacy"               element={<PrivacyPolicyPage />} />
              <Route path="/terms"                 element={<TermsOfUsePage />} />
              {/* ─── V7 Business & Developer ──────────────────────────── */}
              <Route path="/investors"             element={<InvestorDashboard />} />
              <Route path="/api-docs"              element={<APIDocumentationPage />} />
              {/* ─── V7 Audit ─────────────────────────────────────────── */}
              <Route path="/audit/performance"     element={<PerformanceAuditPage />} />
              <Route path="/audit/accessibility"   element={<AccessibilityAuditPage />} />
              {/* ─── V7 Wave 3 — Final blocks ─────────────────────────── */}
              <Route path="/cgm-live"              element={<CGMLiveMonitorPage />} />
              <Route path="/share"                 element={<SocialSharePage />} />
              <Route path="/launch"                element={<LaunchAnnouncementPage />} />
              {/* ─── IOB Hunter ─────────────────────────────────────────── */}
              <Route path="/iob-hunter"            element={<IOBHunterPage />} />
              {/* ─── Existing ─────────────────────────────────────────── */}
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
