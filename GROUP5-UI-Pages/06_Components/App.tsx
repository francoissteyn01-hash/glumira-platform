/**
 * GluMira™ V7 — client/src/App.tsx
 * React root with routing. Vite + React + React Router.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Suspense, lazy } from "react";

// Lazy-loaded pages
const SignInPage         = lazy(() => import("./pages/auth/SignInPage"));
const RegisterPage       = lazy(() => import("./pages/auth/RegisterPage"));
const CaregiverPage      = lazy(() => import("./pages/auth/CaregiverPage"));
const DashboardPage      = lazy(() => import("./pages/dashboard/DashboardPage"));
const IOBCalculatorPage  = lazy(() => import("./pages/iob/IOBCalculatorPage"));
const WeeklySummaryPage  = lazy(() => import("./pages/analytics/WeeklySummaryPage"));
const GlucosePredPage    = lazy(() => import("./pages/analytics/GlucosePredictionPage"));
const DoseTitrationPage  = lazy(() => import("./pages/doses/DoseTitrationPage"));
const PatientsPage       = lazy(() => import("./pages/patients/PatientsPage"));
const PatientDetailPage  = lazy(() => import("./pages/patients/PatientDetailPage"));
const SettingsPage       = lazy(() => import("./pages/settings/SettingsPage"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono">GluMira™</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/signin" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Root → dashboard or sign in */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Auth */}
            <Route path="/auth/signin" element={<PublicRoute><SignInPage /></PublicRoute>} />
            <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/auth/caregiver" element={<CaregiverPage />} />

            {/* Protected app */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/iob" element={<ProtectedRoute><IOBCalculatorPage /></ProtectedRoute>} />
            <Route path="/analytics/weekly" element={<ProtectedRoute><WeeklySummaryPage /></ProtectedRoute>} />
            <Route path="/analytics/prediction" element={<ProtectedRoute><GlucosePredPage /></ProtectedRoute>} />
            <Route path="/doses/titration" element={<ProtectedRoute><DoseTitrationPage /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
