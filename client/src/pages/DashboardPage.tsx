/**
 * GluMira™ V7 — client/src/pages/DashboardPage.tsx
 * Dashboard Redesign: Demo Data + Quick Actions + IOB Hunter™ Graphs + Widgets
 */

import { useAuth } from "../hooks/useAuth";
import { useDemoData } from "../hooks/useDemoData";
import DemoBanner from "../components/dashboard/DemoBanner";
import IOBCombinedGraph from "../components/dashboard/IOBCombinedGraph";
import InterpretationPanel from "../components/dashboard/InterpretationPanel";
import QuickActions from "../components/dashboard/QuickActions";
import PressureGauge from "../components/dashboard/PressureGauge";
import RiskWindow from "../components/dashboard/RiskWindow";
import QuietTailCard from "../components/dashboard/QuietTailCard";
import DailySummary from "../components/dashboard/DailySummary";
import GlucoseTrend from "../components/dashboard/GlucoseTrend";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeCase, setActiveCase, isDemo } = useDemoData();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2a5e]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dashboard
            </h1>
            <p className="text-sm text-[#718096]">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#a0aec0] uppercase tracking-wider">GluMira&trade; | Powered by IOB Hunter&trade;</p>
          </div>
        </div>

        {/* Demo Banner */}
        {isDemo && <DemoBanner activeCaseId={activeCase.id} onCaseChange={setActiveCase} />}

        {/* Quick Actions — always visible top on mobile */}
        <div className="md:hidden">
          <QuickActions />
        </div>

        {/* Two-column grid (desktop) / single column (mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-5">

          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <IOBCombinedGraph data={activeCase} />
            <InterpretationPanel interpretations={activeCase.interpretation} quietTails={activeCase.quietTails} />
            <DailySummary data={activeCase} />
            <GlucoseTrend readings={activeCase.glucoseReadings} units={activeCase.glucoseUnits} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Quick Actions — desktop only (vertical stack) */}
            <div className="hidden md:block">
              <QuickActions />
            </div>
            <PressureGauge timeline={activeCase.iobTimeline} />
            <RiskWindow dangerWindows={activeCase.dangerWindows} />
            <QuietTailCard quietTails={activeCase.quietTails} />
          </div>
        </div>

      </div>
    </div>
  );
}
