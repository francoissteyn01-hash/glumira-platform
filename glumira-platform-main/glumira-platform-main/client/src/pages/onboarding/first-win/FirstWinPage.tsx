/**
 * GluMira™ — First Win Page
 *
 * Route: /onboarding/first-win/:profile
 *
 * The First Win flow is the immediate post-story action for each profile.
 * This page is the landing point after the StoryEngine CTA is tapped.
 *
 * Each profile gets a tailored first action:
 * - patient      → Set up glucose target range
 * - parent       → Add child's profile
 * - child        → Earn first badge (log a reading)
 * - teen         → Customise dashboard
 * - clinician    → View sample patient summary
 * - organisation → Add first student
 * - researcher   → Access dataset view
 *
 * Onboarding 3 — Prompt 3 (Upgrade 7)
 */

import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ALL_PROFILES } from "@/components/onboarding/story-engine/types";
import type { ProfileType } from "@/components/onboarding/story-engine/types";

// ─── First Win Config ─────────────────────────────────────────────────────────

interface FirstWinConfig {
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaRoute: string;
  skipRoute: string;
  accentColor: string;
}

const FIRST_WIN_CONFIG: Record<ProfileType, FirstWinConfig> = {
  patient: {
    heading: "Let's set your target range",
    subheading:
      "Tell GluMira™ your glucose target range and insulin type. Takes 90 seconds.",
    ctaLabel: "Set my target range",
    ctaRoute: "/dashboard/profile",
    skipRoute: "/dashboard",
    accentColor: "#2ab5c1",
  },
  parent: {
    heading: "Add your child's profile",
    subheading:
      "Enter their insulin type, target range, and dietary restrictions. We'll generate their school care plan automatically.",
    ctaLabel: "Add child's profile",
    ctaRoute: "/dashboard/profile",
    skipRoute: "/dashboard",
    accentColor: "#2ab5c1",
  },
  child: {
    heading: "Log your first reading!",
    subheading:
      "Enter your glucose reading right now and earn your very first GluMira™ badge. 🌟",
    ctaLabel: "Log a reading",
    ctaRoute: "/dashboard/glucose",
    skipRoute: "/dashboard",
    accentColor: "#f59e0b",
  },
  teen: {
    heading: "Make it yours",
    subheading:
      "Set dark mode, choose your metrics, and configure alerts. Your dashboard, your way.",
    ctaLabel: "Customise dashboard",
    ctaRoute: "/dashboard",
    skipRoute: "/dashboard",
    accentColor: "#ffffff",
  },
  clinician: {
    heading: "View a sample patient",
    subheading:
      "See a fully populated patient summary — IOB curve, pattern flags, AGP report, and clinical export.",
    ctaLabel: "View sample patient",
    ctaRoute: "/dashboard/clinician/patients",
    skipRoute: "/dashboard",
    accentColor: "#1a2a5e",
  },
  organisation: {
    heading: "Add your first student",
    subheading:
      "Enter their details and GluMira™ will generate a complete, printable school care plan instantly.",
    ctaLabel: "Add first student",
    ctaRoute: "/dashboard/school-care-plan",
    skipRoute: "/dashboard",
    accentColor: "#1a2a5e",
  },
  researcher: {
    heading: "Access the dataset view",
    subheading:
      "Browse the anonymised patient dataset. Filter by profile type, regime, comorbidity, and date range.",
    ctaLabel: "Open dataset view",
    ctaRoute: "/dashboard",
    skipRoute: "/dashboard",
    accentColor: "#2ab5c1",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FirstWinPage() {
  const params = useParams<{ profile: string }>();
  const [, navigate] = useLocation();

  const profile = params.profile as ProfileType;
  const isValid = ALL_PROFILES.includes(profile);

  if (!isValid) {
    navigate("/dashboard");
    return null;
  }

  const config = FIRST_WIN_CONFIG[profile];
  const isClinician = profile === "clinician";
  const isOrg = profile === "organisation";
  const isLight = isClinician || isOrg;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isLight ? "bg-white" : "bg-[#1a2a5e]"
      }`}
    >
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-sm px-8 gap-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* GluMira wordmark */}
        <p
          className="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{ color: config.accentColor }}
        >
          GluMira™
        </p>

        {/* Heading */}
        <h1
          className={`text-2xl font-bold leading-tight ${
            isLight ? "text-[#1a2a5e]" : "text-white"
          }`}
        >
          {config.heading}
        </h1>

        {/* Subheading */}
        <p
          className={`text-sm leading-relaxed ${
            isLight ? "text-[#52667a]" : "text-white/70"
          }`}
        >
          {config.subheading}
        </p>

        {/* Primary CTA */}
        <button
          onClick={() => navigate(config.ctaRoute)}
          className="w-full px-6 py-3.5 text-base font-semibold rounded-xl active:scale-95 transition-all shadow-lg"
          style={{
            backgroundColor: config.accentColor,
            color: isLight ? "white" : "#1a2a5e",
          }}
        >
          {config.ctaLabel}
        </button>

        {/* Skip */}
        <button
          onClick={() => navigate(config.skipRoute)}
          className={`text-sm transition-colors ${
            isLight
              ? "text-[#52667a] hover:text-[#1a2a5e]"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
