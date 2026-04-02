/**
 * GluMira™ V7 — Onboarding Story Page
 * Renders StoryEngine with profile type from user context.
 * Route: /onboarding/story
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import StoryEngine, { type ProfileType } from "@/components/StoryEngine";

const VALID_PROFILES: ProfileType[] = [
  "caregiver", "adult_patient", "paediatric_patient", "newly_diagnosed", "clinician",
];

export default function OnboardingStoryPage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine profile type from user profile
  useEffect(() => {
    if (!session) return;
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.profile;
        if (p?.is_caregiver) {
          setProfile("caregiver");
        } else if (p?.diabetes_type === "T1D" && p?.date_of_birth) {
          const age = (Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (age < 18) setProfile("paediatric_patient");
          else setProfile("adult_patient");
        } else if (p?.special_conditions?.includes("Newly diagnosed")) {
          setProfile("newly_diagnosed");
        } else {
          setProfile("adult_patient"); // default
        }
      })
      .catch(() => setProfile("adult_patient"))
      .finally(() => setLoading(false));
  }, [session]);

  // Save progress on complete
  const handleComplete = useCallback(
    async (stats: {
      scenesViewed: string[];
      scenesSkipped: string[];
      scenesReplayed: string[];
      totalTimeMs: number;
      reducedMotion: boolean;
    }) => {
      if (!session || !profile) return;
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ story_completed: true }),
        });
      } catch {}
      // Could also POST to a story_progress tRPC endpoint here
    },
    [session, profile]
  );

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f1b3d",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "#2ab5c1", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Preparing your story...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f1b3d",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "#ef4444", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Could not determine your profile type.
        </p>
      </div>
    );
  }

  return <StoryEngine profile={profile} onComplete={handleComplete} />;
}
