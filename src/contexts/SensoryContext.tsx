/**
 * GluMira V7 — Sensory Context
 * Provides sensory mode, config, and setter for the Autism + T1D module.
 * Defaults to 'standard'. Persists to localStorage; profile sync handled server-side.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSensoryConfig, type SensoryConfig, type SensoryMode } from "@/lib/autism-sensory";

interface SensoryContextValue {
  sensoryMode: SensoryMode;
  sensoryConfig: SensoryConfig;
  setSensoryMode: (mode: SensoryMode) => void;
  isAutismModuleActive: boolean;
  setAutismModuleActive: (active: boolean) => void;
}

const SensoryContext = createContext<SensoryContextValue | undefined>(undefined);

const STORAGE_KEY = "glumira_sensory_mode";
const ACTIVE_KEY = "glumira_autism_active";

export function SensoryProvider({ children }: { children: ReactNode }) {
  const [sensoryMode, setSensoryModeState] = useState<SensoryMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "standard" || saved === "low_stimulation" || saved === "minimal") return saved;
    } catch {}
    return "standard";
  });

  const [isAutismModuleActive, setAutismModuleActive] = useState<boolean>(() => {
    try { return localStorage.getItem(ACTIVE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, sensoryMode); } catch {}
  }, [sensoryMode]);

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_KEY, isAutismModuleActive ? "1" : "0"); } catch {}
  }, [isAutismModuleActive]);

  const setSensoryMode = (mode: SensoryMode) => setSensoryModeState(mode);

  const sensoryConfig = useMemo(() => getSensoryConfig(sensoryMode), [sensoryMode]);

  const value: SensoryContextValue = {
    sensoryMode,
    sensoryConfig,
    setSensoryMode,
    isAutismModuleActive,
    setAutismModuleActive,
  };

  return <SensoryContext.Provider value={value}>{children}</SensoryContext.Provider>;
}

export function useSensory(): SensoryContextValue {
  const ctx = useContext(SensoryContext);
  if (!ctx) {
    // Safe fallback so components work outside provider in tests/storybook
    return {
      sensoryMode: "standard",
      sensoryConfig: getSensoryConfig("standard"),
      setSensoryMode: () => {},
      isAutismModuleActive: false,
      setAutismModuleActive: () => {},
    };
  }
  return ctx;
}

export default SensoryContext;
