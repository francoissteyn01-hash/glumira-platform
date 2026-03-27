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

/**
 * GluMira™ V7 — Visualizing the science of insulin
 * Soft Editorial design system with navy, teal, and amber colors
 * Powered by IOB Hunter™
 */

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/glucose" component={GlucosePage} />
        <Route path="/dashboard/insulin" component={InsulinPage} />
        <Route path="/dashboard/iob" component={IOBPage} />
        <Route path="/dashboard/meals" component={MealsPage} />
        <Route path="/dashboard/profile" component={ProfilePage} />
        <Route component={Dashboard} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
