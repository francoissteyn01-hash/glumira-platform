/* ------------------------------------------------------------------ */
/*  Block 75 — ISPAD Compliance Layer                                 */
/* ------------------------------------------------------------------ */

const card = "rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5";

type Status = "done" | "partial";

interface CheckItem {
  label: string;
  status: Status;
  detail: string;
}

const ISPAD_ITEMS: CheckItem[] = [
  { label: "Age-appropriate glucose targets", status: "done", detail: "Paediatric targets per ISPAD 2022 Ch. 8" },
  { label: "Growth monitoring integration", status: "done", detail: "Height/weight centile tracking available" },
  { label: "Psychosocial screening support", status: "done", detail: "PHQ-A and PAID screening modules included" },
  { label: "School care plan generation", status: "done", detail: "Auto-generated PDF care plans for schools" },
  { label: "Sick day management protocols", status: "done", detail: "Step-by-step sick day rules with ketone guidance" },
  { label: "Exercise guidance", status: "done", detail: "Activity-specific glucose management advice" },
  { label: "Dietary diversity support (20 regimes)", status: "done", detail: "Halal, kosher, vegan, keto, and 16 more" },
  { label: "Caregiver education content", status: "done", detail: "Dedicated parent/carer learning pathway" },
  { label: "Technology integration (CGM, pumps)", status: "partial", detail: "CGM via Nightscout — pump integration on roadmap" },
  { label: "Transition planning (paediatric to adult)", status: "partial", detail: "Framework designed — content in development" },
];

const ADA_ITEMS: CheckItem[] = [
  { label: "Standards of Care Ch. 14 — Children & Adolescents", status: "done", detail: "Content aligned with ADA 2024 update" },
  { label: "Individualised glycaemic targets", status: "done", detail: "User-adjustable targets with clinician override" },
  { label: "Diabetes self-management education (DSME)", status: "done", detail: "Structured 100-article education library" },
  { label: "Medical nutrition therapy guidance", status: "done", detail: "20 meal regimes with macro breakdowns" },
  { label: "Physical activity recommendations", status: "done", detail: "Pre/during/post exercise BG management" },
  { label: "Psychosocial care integration", status: "done", detail: "Mental health screening and resource links" },
  { label: "Technology use in diabetes", status: "partial", detail: "CGM integration live; pump data on roadmap" },
];

const NICE_ITEMS: CheckItem[] = [
  { label: "NG17 — Type 1 diabetes in adults", status: "done", detail: "Education content covers adult T1D management" },
  { label: "NG18 — Diabetes in children & young people", status: "done", detail: "Paediatric-specific pathways and targets" },
  { label: "Structured education programme", status: "done", detail: "Modular curriculum with progress tracking" },
  { label: "HbA1c monitoring guidance", status: "done", detail: "GMI calculation and trend analysis" },
  { label: "Hypoglycaemia awareness training", status: "done", detail: "Hypo recognition, treatment, and prevention modules" },
  { label: "Continuous glucose monitoring", status: "partial", detail: "Nightscout CGM integration — direct sensor pairing planned" },
];

const EVIDENCE_MAP: { recommendation: string; feature: string }[] = [
  { recommendation: "ISPAD Ch. 3 — Stages of T1D", feature: "Honeymoon phase education module" },
  { recommendation: "ISPAD Ch. 7 — Insulin Treatment", feature: "11 insulin profile models with PK/PD curves" },
  { recommendation: "ISPAD Ch. 8 — Glycaemic Targets", feature: "Age-stratified target configuration" },
  { recommendation: "ISPAD Ch. 11 — Sick Days", feature: "Sick day management wizard" },
  { recommendation: "ISPAD Ch. 12 — Exercise", feature: "Activity-specific BG guidance engine" },
  { recommendation: "ISPAD Ch. 13 — Dietary Management", feature: "20 culturally diverse meal regimes" },
  { recommendation: "ISPAD Ch. 14 — Psychosocial Issues", feature: "PHQ-A integration and wellbeing tracking" },
  { recommendation: "ISPAD Ch. 17 — School", feature: "Auto-generated school care plans" },
  { recommendation: "ISPAD Ch. 20 — Technology", feature: "Nightscout CGM integration" },
  { recommendation: "ISPAD Ch. 22 — Adolescent Transition", feature: "Transition planning framework" },
];

const GAPS: string[] = [
  "Direct insulin pump data integration (currently via manual entry only)",
  "Flash glucose monitor direct pairing (currently via Nightscout bridge)",
  "Formal clinical trial validation of education outcomes",
  "Regulatory submission as a registered medical device",
  "Multi-language content (currently English only; translation pipeline planned)",
];

function StatusIcon({ status }: { status: Status }) {
  return status === "done" ? (
    <span className="text-green-400 text-sm">&#10003;</span>
  ) : (
    <span className="text-amber-400 text-sm">&#9203;</span>
  );
}

function ComplianceSection({ title, items }: { title: string; items: CheckItem[] }) {
  const done = items.filter((i) => i.status === "done").length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className="text-xs font-['JetBrains_Mono'] text-[var(--text-secondary)]">
          {done}/{items.length} ({pct}%)
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={item.status} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-['DM_Sans']">{item.label}</p>
              <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans']">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ISPADCompliancePage() {
  const totalItems = ISPAD_ITEMS.length + ADA_ITEMS.length + NICE_ITEMS.length;
  const totalDone =
    ISPAD_ITEMS.filter((i) => i.status === "done").length +
    ADA_ITEMS.filter((i) => i.status === "done").length +
    NICE_ITEMS.filter((i) => i.status === "done").length;
  const overallPct = Math.round((totalDone / totalItems) * 100);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-[960px]" style={{ padding: "clamp(16px, 4vw, 32px)" }}>
        {/* ---------- Header ---------- */}
        <div className="mb-8">
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--text-primary)]">
            ISPAD Compliance
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-['DM_Sans']">
            Paediatric diabetes standard alignment
          </p>
        </div>

        <div className="space-y-6">
          {/* ---------- Overall compliance gauge ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Overall Compliance Score
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--brand-500, #6366f1)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallPct * 2.64} ${264 - overallPct * 2.64}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold font-['JetBrains_Mono'] text-[var(--text-primary)]">
                  {overallPct}%
                </span>
              </div>
              <div className="text-sm text-[var(--text-secondary)] font-['DM_Sans']">
                <p>
                  <span className="font-semibold text-[var(--text-primary)]">{totalDone}</span> of{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{totalItems}</span> requirements met across
                  ISPAD, ADA, and NICE guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* ---------- ISPAD ---------- */}
          <ComplianceSection title="ISPAD 2022 Guidelines" items={ISPAD_ITEMS} />

          {/* ---------- ADA ---------- */}
          <ComplianceSection title="ADA Standards of Care" items={ADA_ITEMS} />

          {/* ---------- NICE ---------- */}
          <ComplianceSection title="NICE NG17 / NG18" items={NICE_ITEMS} />

          {/* ---------- Evidence mapping ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Evidence Mapping
            </h2>
            <table className="w-full text-sm font-['DM_Sans']">
              <thead>
                <tr className="text-left text-xs text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                  <th className="pb-2 pr-4">ISPAD Recommendation</th>
                  <th className="pb-2">GluMira Feature</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)]">
                {EVIDENCE_MAP.map((row) => (
                  <tr key={row.recommendation} className="border-b border-[var(--border-light)]/30">
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.recommendation}</td>
                    <td className="py-2 font-medium">{row.feature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- Gap analysis ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Gap Analysis
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans'] mb-3">
              Items required for full compliance that are not yet implemented:
            </p>
            <ul className="space-y-2">
              {GAPS.map((gap) => (
                <li key={gap} className="flex items-start gap-2 text-sm text-[var(--text-secondary)] font-['DM_Sans']">
                  <span className="text-amber-400 shrink-0 mt-0.5">&#9888;</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Disclaimer ---------- */}
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-5">
            <p className="text-xs text-amber-300/80 font-['DM_Sans'] leading-relaxed">
              Compliance assessment is self-reported and for informational purposes. GluMira{"\u2122"} is not a
              regulated medical device. Alignment with ISPAD, ADA, and NICE guidelines reflects educational content
              coverage and does not imply endorsement by these organisations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
