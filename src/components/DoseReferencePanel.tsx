/**
 * GluMira™ V7 — Dose Reference Panel
 * Shows historical meal references when user types 3+ chars in food description.
 * Framing: "Historical reference — not a recommendation."
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface DoseRef {
  meal_description: string;
  insulin_type: string;
  dose_units: number;
  carbs_g: number;
  pre_glucose: number;
  date: string;
}

interface Props {
  foodDescription: string;
  mealType: string;
}

export default function DoseReferencePanel({ foodDescription, mealType }: Props) {
  const { session } = useAuth();
  const [refs, setRefs] = useState<DoseRef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session || foodDescription.length < 3) {
      setRefs([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/trpc/mealLog.findSimilar?input=${encodeURIComponent(JSON.stringify({ json: { description: foodDescription, mealType } }))}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        const results = data?.result?.data?.json;
        if (Array.isArray(results)) setRefs(results.slice(0, 3));
      } catch {
        setRefs([]);
      } finally {
        setLoading(false);
      }
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [foodDescription, mealType, session]);

  if (refs.length === 0 && !loading) return null;

  return (
    <div style={{
      background: "rgba(42,181,193,0.05)", borderRadius: 10, border: "1px solid rgba(42,181,193,0.2)",
      padding: "12px 16px", marginTop: 8,
    }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "var(--accent-teal)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        Historical reference — not a recommendation
      </p>
      {loading ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Searching past meals...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {refs.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>Last time:</span> {r.meal_description.slice(0, 40)} — {r.dose_units.toFixed(1)}U {r.insulin_type}, {r.carbs_g.toFixed(0)}g carbs
              {r.pre_glucose > 0 && <span style={{ color: "var(--text-secondary)" }}> (BG {r.pre_glucose.toFixed(1)})</span>}
              <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>{r.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
