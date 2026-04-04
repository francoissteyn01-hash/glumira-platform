/**
 * GluMira™ V7 — Onboarding Story Page
 * Renders StoryEngine with profile type from auth context.
 * Route: /onboarding/story
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import StoryEngine, { type ProfileType } from "../components/StoryEngine";

export default function OnboardingStoryPage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setProfile("adult_patient");
      setLoading(false);
      return;
    }
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.profile;
        if (p?.is_caregiver) {
          setProfile("caregiver");
        } else if (p?.role === "clinician") {
          setProfile("clinician");
        } else if (p?.diabetes_type === "T1D" && p?.date_of_birth) {
          const age = (Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          setProfile(age < 18 ? "paediatric_patient" : "adult_patient");
        } else if (p?.special_conditions?.includes("Newly diagnosed")) {
          setProfile("newly_diagnosed");
        } else {
          setProfile("adult_patient");
        }
      })
      .catch(() => setProfile("adult_patient"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleComplete = useCallback(
    async (stats: {
      scenesViewed: string[];
      scenesSkipped: string[];
      scenesReplayed: string[];
      totalTimeMs: number;
      reducedMotion: boolean;
    }) => {
      if (!token || !profile) return;
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ story_completed: true }),
        });
      } catch {}
    },
    [token, profile]
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
