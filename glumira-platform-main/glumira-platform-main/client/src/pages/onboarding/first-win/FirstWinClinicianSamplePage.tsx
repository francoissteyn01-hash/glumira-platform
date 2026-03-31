/**
 * GluMira™ — First Win: Clinician Sample Patient
 *
 * Route: /onboarding/first-win/clinician/sample
 *
 * Handles the second CTA option from story-clinician.json:
 * "View sample patient summary" → /onboarding/first-win/clinician/sample
 *
 * Redirects to the clinician patients view with a sample patient pre-loaded.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 7)
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function FirstWinClinicianSamplePage() {
  const [, navigate] = useLocation();

  // Auto-navigate to clinician patients after brief loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard/clinician/patients");
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Spinner */}
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-[#1a2a5e] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-[#52667a]">Loading sample patient…</p>
      </motion.div>
    </div>
  );
}
