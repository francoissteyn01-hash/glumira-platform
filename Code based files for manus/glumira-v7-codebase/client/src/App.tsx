/**
 * GluMira™ V7 — client/src/App.tsx
 * React Router v6. All routes wired to E2E test spec contracts.
 * Version: v1.0 · 2026-03-29
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Suspense, lazy } from "react";

const LandingPage        = lazy(() => import("./pages/LandingPage"));
const PricingPage        = lazy(() => import("./pages/PricingPage"));
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const RegisterPage       = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage  = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage      = lazy(() => import("./pages/DashboardPage"));
const GlucosePage        = lazy(() => import("./pages/GlucosePage"));
const StackingPage       = lazy(() => import("./pages/StackingPage"));
const TrendsPage         = lazy(() => import("./pages/TrendsPage"));
const DosesPage          = lazy(() => import("./pages/DosesPage"));
const MealsPage          = lazy(() => import("./pages/MealsPage"));
const ClinicianPage      = lazy(() => import("./pages/ClinicianPage"));
const PatientsPage       = lazy(() => import("./pages/PatientsPage"));
const SchoolCarePlanPage = lazy(() => import("./pages/SchoolCarePlanPage"));
const SettingsPage       = lazy(() => import("./pages/SettingsPage"));
const AuthCallbackPage   = lazy(() => import("./pages/AuthCallbackPage"));

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Spinner() {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f8f9fa" }}>
      <div style={{ width:32,height:32,border:"3px solid #dee2e6",borderTopColor:"#2ab5c1",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"                    element={<LandingPage />} />
            <Route path="/pricing"             element={<PricingPage />} />
            <Route path="/login"               element={<LoginPage />} />
            <Route path="/register"            element={<RegisterPage />} />
            <Route path="/reset-password"      element={<ResetPasswordPage />} />
            <Route path="/auth/callback"       element={<AuthCallbackPage />} />
            <Route path="/dashboard"           element={<Protected><DashboardPage /></Protected>} />
            <Route path="/glucose"             element={<Protected><GlucosePage /></Protected>} />
            <Route path="/stacking"            element={<Protected><StackingPage /></Protected>} />
            <Route path="/trends"              element={<Protected><TrendsPage /></Protected>} />
            <Route path="/doses"               element={<Protected><DosesPage /></Protected>} />
            <Route path="/meals"               element={<Protected><MealsPage /></Protected>} />
            <Route path="/clinician"           element={<Protected><ClinicianPage /></Protected>} />
            <Route path="/clinician/patients"  element={<Protected><PatientsPage /></Protected>} />
            <Route path="/school-care-plan"    element={<Protected><SchoolCarePlanPage /></Protected>} />
            <Route path="/settings"            element={<Protected><SettingsPage /></Protected>} />
            <Route path="*"                    element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
