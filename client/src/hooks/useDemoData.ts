import { useState, useEffect } from "react";
import case001 from "../data/demo-cases/case-beta-001.json";
import case002 from "../data/demo-cases/case-beta-002.json";
import case003 from "../data/demo-cases/case-beta-003.json";
import case004 from "../data/demo-cases/case-beta-004.json";
import case005 from "../data/demo-cases/case-beta-005.json";

export interface DemoTimelinePoint {
  time: string;
  hour: number;
  basal: number;
  bolus: number;
  combined: number;
  pressure: "light" | "moderate" | "strong" | "overlap";
}

export interface DemoGlucoseReading {
  time: string;
  hour: number;
  value: number;
}

export interface DemoDangerWindow {
  start: string;
  end: string;
  severity: string;
}

export interface DemoQuietTail {
  insulin: string;
  meal: string;
  residual: number;
  hoursPastDOA: number;
}

export interface DemoCase {
  id: string;
  name: string;
  profileType: string;
  glucoseUnits: string;
  regimen: {
    basal: { insulin: string; dose: number; time: string; type: string }[];
    bolus: { insulin: string; dose: number; time: string; type: string }[];
  };
  iobTimeline: DemoTimelinePoint[];
  interpretation: string[];
  dangerWindows: DemoDangerWindow[];
  quietTails: DemoQuietTail[];
  glucoseReadings: DemoGlucoseReading[];
}

const CASES: Record<string, DemoCase> = {
  "CASE-BETA-001": case001 as DemoCase,
  "CASE-BETA-002": case002 as DemoCase,
  "CASE-BETA-003": case003 as DemoCase,
  "CASE-BETA-004": case004 as DemoCase,
  "CASE-BETA-005": case005 as DemoCase,
};

export const CASE_LIST = Object.values(CASES).map((c) => ({ id: c.id, name: c.name }));

export function useDemoData() {
  const [activeCaseId, setActiveCaseId] = useState(() => {
    try {
      return localStorage.getItem("glumira_demo_case") || "CASE-BETA-001";
    } catch {
      return "CASE-BETA-001";
    }
  });
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem("glumira_demo_case", activeCaseId);
    } catch {}
  }, [activeCaseId]);

  useEffect(() => {
    try {
      setIsDemo(!localStorage.getItem("glumira_has_custom_profile"));
    } catch {}
  }, []);

  const activeCase = CASES[activeCaseId] || CASES["CASE-BETA-001"];

  return { activeCase, setActiveCase: setActiveCaseId, caseList: CASE_LIST, isDemo };
}
