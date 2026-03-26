"use client";

import { useState, useCallback } from "react";

interface BlockSensitivity {
  block: string;
  hourRange: [number, number];
  meanGlucose: number;
  cv: number;
  readingCount: number;
  sensitivityRating: "high" | "normal" | "low" | "very-low";
}

interface CircadianProfile {
  blocks: BlockSensitivity[];
  mostSensitiveBlock: string;
  leastSensitiveBlock: string;
  dawnPhenomenonLikely: boolean;
  recommendations: string[];
}

export function useCircadianSensitivity() {
  const [profile, setProfile] = useState<CircadianProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (days: number = 14) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/circadian-sensitivity?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch circadian profile");
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile };
}
