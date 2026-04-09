import React from "react";

interface SixtySecondInsightProps {
  profileId: "subj001" | "subj002";
}

function Badge({ label, color }: { label: string; color: "green" | "amber" | "orange" | "red" }) {
  const colors = {
    green: "bg-green-600/80 text-green-100",
    amber: "bg-amber-600/80 text-amber-100",
    orange: "bg-orange-600/80 text-orange-100",
    red: "bg-red-600/80 text-red-100",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>
      {label}
    </span>
  );
}

function Section({
  borderColor,
  bgColor,
  children,
}: {
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border-l-4 ${borderColor} ${bgColor} rounded-r-md p-4`}>
      {children}
    </div>
  );
}

function Subj001Insight() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white font-['DM_Sans']">
        <span className="mr-2" aria-hidden="true">&#9201;</span>
        60-SECOND INSIGHT — SUBJ-001 | Day 2 Steady State
      </h2>

      <Section borderColor="border-amber-500" bgColor="bg-amber-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">BASAL COVERAGE:</span> Tresiba 12U provides continuous depot-release coverage.{"\n"}
          Prior-cycle residual carries ~10.3U at midnight. Never drops to zero.
        </p>
        <div className="mt-2"><Badge label="Light" color="green" /></div>
      </Section>

      <Section borderColor="border-red-500" bgColor="bg-red-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">DANGER WINDOW: 02:00–06:00</span> <Badge label="Overlap" color="red" />{"\n"}
          Humulin R dinner tail (3.5U at 18:00) extends into overnight hours.{"\n"}
          Tresiba peak glucose-lowering effect centres at ~06:30 (12h post-dose).{"\n"}
          Combined pressure peaks during fasting. This explains overnight lows.
        </p>
      </Section>

      <Section borderColor="border-amber-500" bgColor="bg-amber-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">BOLUS STACKING: Moderate at 08:00–09:00</span> <Badge label="Moderate" color="amber" />{"\n"}
          Fiasp breakfast (3U at 07:00) peaks at 08:00–09:00 on top of Tresiba base.{"\n"}
          Combined IOB reaches ~15U. Monitor post-breakfast.
        </p>
      </Section>

      <Section borderColor="border-[#2ab5c1]" bgColor="bg-[#2ab5c1]/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">KEY OBSERVATION:</span> The dinner Humulin R tail overlaps with the Tresiba{"\n"}
          ramp-up through 02:00–06:00. A timing question — not a dose question.
        </p>
      </Section>

      <p className="text-white/60 text-xs italic font-['DM_Sans']">
        <span aria-hidden="true">&#9877;</span> EDUCATIONAL ONLY — Not medical advice. Discuss timing with your care team.
      </p>
    </div>
  );
}

function Subj002Insight() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white font-['DM_Sans']">
        <span className="mr-2" aria-hidden="true">&#9201;</span>
        60-SECOND INSIGHT — SUBJ-002 | Gastro Emergency Scenario
      </h2>

      <Section borderColor="border-amber-500" bgColor="bg-amber-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">BASAL PATTERN:</span> Levemir 3× daily creates overlapping peaked curves.{"\n"}
          At any point, at least one Levemir dose is in its active window.{"\n"}
          Continuous downward pressure that CANNOT be paused.
        </p>
        <div className="mt-2"><Badge label="Strong" color="orange" /></div>
      </Section>

      <Section borderColor="border-red-500" bgColor="bg-red-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">CRITICAL EVENT:</span> Dinner bolus (Fiasp 1U + Actrapid 1.5U) at 18:00.{"\n"}
          Vomiting at ~18:30 expelled carbs. Insulin already absorbed.{"\n"}
          The insulin CANNOT be taken back.
        </p>
      </Section>

      <Section borderColor="border-red-500" bgColor="bg-red-500/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">DANGER WINDOW: 19:00–22:00</span> <Badge label="Overlap" color="red" />{"\n"}
          Actrapid peak (2-3h post-dose) hits at ~20:00-21:00.{"\n"}
          Combined IOB at 20:30 = ~7.9U against ZERO incoming glucose.{"\n"}
          Glucose crashed to ~2.0 mmol/L.
        </p>
      </Section>

      <Section borderColor="border-[#2ab5c1]" bgColor="bg-[#2ab5c1]/10">
        <p className="text-white font-['DM_Sans'] text-sm whitespace-pre-line">
          <span className="font-bold">SURVIVAL WINDOW:</span> If caregiver had seen IOB at vomiting onset:{"\n"}
          - Active IOB: ~8.1U{"\n"}
          - Actrapid clears: ~5-6h remaining{"\n"}
          - Fiasp clears: ~3h remaining{"\n"}
          This is the information that saves lives.
        </p>
      </Section>

      <p className="text-white/60 text-xs italic font-['DM_Sans']">
        <span aria-hidden="true">&#9877;</span> EDUCATIONAL ONLY — Not medical advice. Have fast-acting glucose ready.
      </p>
    </div>
  );
}

const SixtySecondInsight: React.FC<SixtySecondInsightProps> = ({ profileId }) => {
  return (
    <div className="bg-[#1a2a5e] rounded-lg p-6 font-['DM_Sans']">
      {profileId === "subj001" ? <Subj001Insight /> : <Subj002Insight />}
    </div>
  );
};

export default SixtySecondInsight;
