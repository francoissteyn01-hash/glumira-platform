import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Block 74 — Grant Evidence Package                                 */
/* ------------------------------------------------------------------ */

type GrantTarget = "gates" | "jdrf" | "novo" | "helmsley" | "other";

const GRANTS: { label: string; value: GrantTarget }[] = [
  { label: "Gates Foundation", value: "gates" },
  { label: "JDRF", value: "jdrf" },
  { label: "Novo Nordisk Foundation", value: "novo" },
  { label: "Helmsley Charitable Trust", value: "helmsley" },
  { label: "Other", value: "other" },
];

const card = "rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5";

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans']">{label}</p>
      <p className="text-lg font-bold font-['JetBrains_Mono'] text-[var(--text-primary)]">{value}</p>
      {note && <p className="text-[10px] text-[var(--text-secondary)] italic font-['DM_Sans']">{note}</p>}
    </div>
  );
}

export default function GrantEvidencePage() {
  const [target, setTarget] = useState<GrantTarget>("jdrf");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-[960px]" style={{ padding: "clamp(16px, 4vw, 32px)" }}>
        {/* ---------- Header ---------- */}
        <div className="mb-8">
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--text-primary)]">
            Grant Evidence Package
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-['DM_Sans']">
            Data outputs for research funding applications
          </p>
        </div>

        <div className="space-y-6">
          {/* ---------- Grant target selector ---------- */}
          <div className={card}>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3 font-['DM_Sans']">
              Target Funder
            </p>
            <div className="flex flex-wrap gap-2">
              {GRANTS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setTarget(g.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-['DM_Sans'] transition-colors border ${
                    target === g.value
                      ? "bg-brand-600 text-white border-brand-500"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-light)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- Platform metrics ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Platform Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Metric label="Registered Users" value="--" note="Data collection in progress" />
              <Metric label="Education Articles" value="100" />
              <Metric label="Specialist Modules" value="11" />
              <Metric label="Insulin Profiles Modelled" value="11" />
              <Metric label="Meal Regimes" value="20" />
              <Metric label="Countries Represented" value="--" note="Data collection in progress" />
            </div>
          </div>

          {/* ---------- Clinical impact ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Clinical Impact
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Metric label="Average TIR Improvement" value="--" note="Data collection in progress" />
              <Metric label="Hypo Reduction" value="--" note="Data collection in progress" />
              <Metric label="User Engagement" value="--" note="Avg sessions/week — data collection in progress" />
            </div>
          </div>

          {/* ---------- Technology stack ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Technology Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Supabase", "Claude AI", "Nightscout Integration"].map((t) => (
                <span
                  key={t}
                  className="text-xs font-['JetBrains_Mono'] px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ---------- Research capabilities ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Research Capabilities
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-[var(--text-secondary)] font-['DM_Sans']">
              {[
                "Anonymised data export",
                "Cohort analysis tools",
                "Pattern frequency analysis",
                "Demographic reach reporting",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Publication readiness ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Publication Readiness
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-['DM_Sans']">
              All platform metrics are exportable in CSV format for inclusion in peer-reviewed publications and grant
              applications. Standardised data schemas align with common diabetes research reporting requirements.
            </p>
          </div>

          {/* ---------- Download & compliance ---------- */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <button className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium font-['DM_Sans'] hover:bg-brand-700 transition-colors">
              Download Evidence Pack (PDF)
            </button>
            <div className="flex gap-2 flex-wrap">
              {["ISPAD", "ADA", "NICE"].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border border-green-700 bg-green-900/30 text-green-400 font-['DM_Sans']"
                >
                  {badge} Referenced
                </span>
              ))}
            </div>
          </div>

          {/* ---------- Contact ---------- */}
          <div className={card}>
            <p className="text-sm text-[var(--text-secondary)] font-['DM_Sans']">
              For grant enquiries:{" "}
              <a
                href="mailto:grants@glumira.ai"
                className="text-brand-500 hover:underline font-medium"
              >
                grants@glumira.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
