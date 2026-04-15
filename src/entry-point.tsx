/**
 * Dual-Domain Entry Point
 * Routes to either glumira.ai or glumira.app based on hostname
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';

// Global pages
import LandingPageV2 from './pages/LandingPageV2';
import DashboardPageV2 from './pages/DashboardPageV2';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';

// Ramadan module (both sites)
import RamadanModule from './pages/RamadanModule';

// Determine which domain we're on
const getDomain = (): 'ai' | 'app' => {
  const hostname = window.location.hostname;
  if (hostname.includes('glumira.app') || hostname.includes('localhost:5174')) {
    return 'app'; // MENA-specific site
  }
  return 'ai'; // Global site
};

const DOMAIN = getDomain();

export default function EntryPoint() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Root landing page */}
            {DOMAIN === 'ai' ? (
              <>
                <Route path="/" element={<LandingPageV2 />} />
                <Route path="/dashboard" element={<DashboardPageV2 />} />
              </>
            ) : (
              <>
                {/* glumira.app: MENA-focused, Ramadan first */}
                <Route path="/" element={<RamadanModule />} />
              </>
            )}

            {/* Shared routes on both domains */}
            <Route path="/ramadan" element={<RamadanModule />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfUsePage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export { DOMAIN };
