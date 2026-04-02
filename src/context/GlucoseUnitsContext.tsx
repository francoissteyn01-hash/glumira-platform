/**
 * GluMira™ V7 — Global glucose unit context
 * Initialises from user profile, persists changes back via REST API.
 * All glucose-displaying components consume this context.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import type { GlucoseUnit } from "@/utils/glucose-units";

interface GlucoseUnitsContextValue {
  units: GlucoseUnit;
  setUnits: (u: GlucoseUnit) => void;
  toggle: () => void;
}

const Ctx = createContext<GlucoseUnitsContextValue>({
  units: "mmol",
  setUnits: () => {},
  toggle: () => {},
});

export function GlucoseUnitsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [units, setUnitsLocal] = useState<GlucoseUnit>("mmol");

  // Load from profile on mount
  useEffect(() => {
    if (!session) return;
    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        const saved = data?.profile?.glucose_units;
        if (saved === "mmol" || saved === "mg") {
          setUnitsLocal(saved);
        }
      })
      .catch(() => {});
  }, [session]);

  // Persist to profile on change
  const setUnits = useCallback(
    (u: GlucoseUnit) => {
      setUnitsLocal(u);
      if (!session) return;
      fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ glucose_units: u }),
      }).catch(() => {});
    },
    [session]
  );

  const toggle = useCallback(() => {
    setUnits(units === "mmol" ? "mg" : "mmol");
  }, [units, setUnits]);

  return (
    <Ctx.Provider value={{ units, setUnits, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGlucoseUnits(): GlucoseUnitsContextValue {
  return useContext(Ctx);
}
