/**
 * GluMira™ — Onboarding Story Page
 *
 * Route: /onboarding/story/:profile
 *
 * Renders the StoryEngine for the given profile from the URL parameter.
 * Validates the profile param and redirects to /onboarding if invalid.
 * On story completion, navigates to the First Win flow.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 7)
 */

import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { StoryEngine } from "@/components/onboarding/story-engine/StoryEngine";
import { ALL_PROFILES } from "@/components/onboarding/story-engine/types";
import type { ProfileType } from "@/components/onboarding/story-engine/types";

export default function OnboardingStoryPage() {
  const params = useParams<{ profile: string }>();
  const [, navigate] = useLocation();

  const profile = params.profile as ProfileType;
  const isValidProfile = ALL_PROFILES.includes(profile);

  // Redirect if profile param is invalid
  useEffect(() => {
    if (!isValidProfile) {
      navigate("/onboarding");
    }
  }, [isValidProfile, navigate]);

  if (!isValidProfile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a2a5e] flex items-center justify-center">
      <div className="relative w-full max-w-md h-full max-h-[780px] mx-auto">
        <StoryEngine
          profile={profile}
          onComplete={(route) => navigate(route)}
          onSkip={() => navigate("/dashboard")}
        />
      </div>
    </div>
  );
}
