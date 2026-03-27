import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GlucosePage from "./pages/GlucosePage";
import InsulinPage from "./pages/InsulinPage";
import IOBPage from "./pages/IOBPage";
import MealsPage from "./pages/MealsPage";
import ProfilePage from "./pages/ProfilePage";
import PregnancyPage from "./pages/PregnancyPage";
import ADHDPage from "./pages/ADHDPage";
import ThyroidPage from "./pages/ThyroidPage";
import SchoolCarePlanPage from "./pages/SchoolCarePlanPage";
import RewardsPage from "./pages/RewardsPage";
import { GamificationProvider } from "./lib/gamification/GamificationContext";
import { GamificationOverlay } from "./components/gamification/GamificationOverlay";

// ── Onboarding — StoryEngine routes (Onboarding 3) ───────────────────────────
import OnboardingStoryPage from "./pages/onboarding/OnboardingStoryPage";
import FirstWinPage from "./pages/onboarding/first-win/FirstWinPage";
import FirstWinClinicianSamplePage from "./pages/onboarding/first-win/FirstWinClinicianSamplePage";

/**
 * GluMira™ V7 — The science of insulin, made visible
 * Soft Editorial design system with navy, teal, and amber colors
 * Powered by IOB Hunter™
 */

function DashboardRoutes() {
  return (
    <GamificationProvider>
      <DashboardLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/glucose" component={GlucosePage} />
          <Route path="/dashboard/insulin" component={InsulinPage} />
          <Route path="/dashboard/iob" component={IOBPage} />
          <Route path="/dashboard/meals" component={MealsPage} />
          <Route path="/dashboard/profile" component={ProfilePage} />
          <Route path="/dashboard/pregnancy" component={PregnancyPage} />
          <Route path="/dashboard/adhd" component={ADHDPage} />
          <Route path="/dashboard/thyroid" component={ThyroidPage} />
          <Route path="/dashboard/school-care-plan" component={SchoolCarePlanPage} />
          <Route path="/dashboard/rewards" component={RewardsPage} />
          <Route component={Dashboard} />
        </Switch>
      </DashboardLayout>
      {/* Gamification overlay: milestone toasts and modals */}
      <GamificationOverlay />
    </GamificationProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* ── Onboarding StoryEngine routes ────────────────────────────────── */}
      {/* /onboarding/story/:profile — plays the StoryEngine for that profile */}
      <Route path="/onboarding/story/:profile" component={OnboardingStoryPage} />

      {/* /onboarding/first-win/clinician/sample — clinician dual-CTA option */}
      <Route
        path="/onboarding/first-win/clinician/sample"
        component={FirstWinClinicianSamplePage}
      />

      {/* /onboarding/first-win/:profile — post-story first action for all profiles */}
      <Route path="/onboarding/first-win/:profile" component={FirstWinPage} />

      {/* ── Dashboard routes ──────────────────────────────────────────────── */}
      <Route path="/dashboard/:rest*" component={DashboardRoutes} />
      <Route path="/dashboard" component={DashboardRoutes} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
