import { useState } from "react";
import { Link } from "react-router-dom";
import {
  analyseMenopause,
  type MenopauseStage,
  type HrtType,
  type Symptom,
  type MenopauseAnalysisResult,
} from "@/lib/menopause-engine";

const T = {
  navy:    "#1a2a5e",
  deep:    "#0d1b3e",
  teal:    "#2ab5c1",
  amber:   "#f59e0b",
  white:   "#ffffff",
  muted:   "#64748b",
  bg:      "#f8f9fa",
  border:  "#e2e8f0",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

const card: React.CSSProperties = {
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};

const cardTitle: React.CSSProperties = {
  fontWeight: 600,
  color: T.navy,
  marginBottom: 10,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: ".5px",
};

const STAGES: { value: MenopauseStage; label: string; desc: string }[] = [
  { value: "perimenopause",  label: "Perimenopause",  desc: "Irregular cycles, fluctuating oestrogen. Typically 2–8 years before final period." },
  { value: "menopause",      label: "Menopause",      desc: "12 months since last period. Oestrogen levels fall and stabilise at a lower level." },
  { value: "postmenopause",  label: "Postmenopause",  desc: "More than 12 months since last period. Hormone levels are now stable but low." },
];

const HRT_OPTIONS: { value: HrtType; label: string }[] = [
  { value: "none",            label: "None" },
  { value: "oestrogen-only",  label: "Oestrogen-only" },
  { value: "combined",        label: "Combined (oestrogen + progesterone)" },
];

const SYMPTOM_OPTIONS: { value: Symptom; label: string }[] = [
  { value: "hot_flashes",     label: "Hot flashes" },
  { value: "insomnia",        label: "Insomnia" },
  { value: "mood_changes",    label: "Mood changes" },
  { value: "weight_gain",     label: "Weight gain" },
  { value: "brain_fog",       label: "Brain fog" },
  { value: "vaginal_dryness", label: "Vaginal dryness" },
];

const TRACKER_KEY = "glumira_menopause_tracker";

type TrackerEntry = { date: string; fastingMmol: string; postMealMmol: string; symptoms: Symptom[] }

function loadTrackerEntries(): TrackerEntry[] {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) ?? "[]"); } catch { return []; }
}

function saveTrackerEntries(entries: TrackerEntry[]) {
  localStorage.setItem(TRACKER_KEY, JSON.stringify(entries));
}

export default function MenopauseModule() {
  const [stage, setStage]           = useState<MenopauseStage>("perimenopause");
  const [hrtType, setHrtType]       = useState<HrtType>("none");
  const [symptoms, setSymptoms]     = useState<Symptom[]>([]);
  const [fasting, setFasting]       = useState("");
  const [postMeal, setPostMeal]     = useState("");
  const [basalDose, setBasalDose]   = useState("");
  const [hypos, setHypos]           = useState("0");
  const [unit, setUnit]             = useState<"mmol" | "mg">("mmol");
  const [result, setResult]         = useState<MenopauseAnalysisResult | null>(null);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerEntries, setTrackerEntries] = useState<TrackerEntry[]>(loadTrackerEntries);
  const [trackerForm, setTrackerForm] = useState<TrackerEntry>({
    date: new Date().toISOString().slice(0, 10),
    fastingMmol: "",
    postMealMmol: "",
    symptoms: [],
  });

  const stageDesc = STAGES.find(s => s.value === stage)?.desc ?? "";

  const toggleSymptom = (s: Symptom) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleTrackerSymptom = (s: Symptom) =>
    setTrackerForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));

  const canAnalyse = fasting && postMeal && basalDose;

  const handleAnalyse = () => {
    if (!canAnalyse) return;
    setResult(analyseMenopause({
      stage,
      hrtType,
      yearsSinceLastPeriod: 2,
      symptoms,
      avgFastingMmol: parseFloat(fasting),
      avgPostMealMmol: parseFloat(postMeal),
      basalDoseUnits: parseFloat(basalDose),
      hypoEventsLast7Days: parseInt(hypos, 10),
      unit,
    }));
  };

  const addTrackerEntry = () => {
    if (!trackerForm.fastingMmol || !trackerForm.postMealMmol) return;
    const updated = [...trackerEntries, trackerForm];
    setTrackerEntries(updated);
    saveTrackerEntries(updated);
    setTrackerForm({ date: new Date().toISOString().slice(0, 10), fastingMmol: "", postMealMmol: "", symptoms: [] });
  };

  const resistanceColour = (r: MenopauseAnalysisResult["resistanceLevel"]) =>
    r === "low" ? "#16a34a" : r === "moderate" ? "#d97706" : "#dc2626";

  const hypoColour = (r: MenopauseAnalysisResult["nocturnalHypoRisk"]) =>
    r === "low" ? "#16a34a" : r === "elevated" ? "#d97706" : "#dc2626";

  const weekSummary = trackerEntries.length >= 7 ? (() => {
    const vals = trackerEntries.slice(-7).map(e => parseFloat(e.fastingMmol)).filter(v => !isNaN(v));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg: avg.toFixed(1), count: vals.length };
  })() : null;

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "9px 12px", color: T.navy, fontSize: 14,
    width: "100%", boxSizing: "border-box", fontFamily: T.body,
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    background: active ? T.navy : T.bg,
    color: active ? T.white : T.muted,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    border: "none",
    fontFamily: T.body,
  });

  const symptomPill = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    background: active ? "#fce7f3" : T.bg,
    color: active ? "#9d174d" : T.muted,
    borderRadius: 16,
    fontSize: 12,
    cursor: "pointer",
    border: "none",
    fontFamily: T.body,
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: 24, fontFamily: T.body }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link to="/education" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🌸</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: T.heading, color: T.navy, fontSize: 22 }}>Menopause &amp; Glucose</h1>
            <p style={{ margin: "2px 0 0", color: T.muted, fontSize: 13 }}>T1D insulin resistance modelling across the menopause transition</p>
          </div>
        </div>

        {/* Unit toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["mmol", "mg"] as const).map(u => (
            <button key={u} onClick={() => setUnit(u)} style={pill(unit === u)}>
              {u === "mmol" ? "mmol/L" : "mg/dL"}
            </button>
          ))}
        </div>

        {/* Stage selector */}
        <div style={card}>
          <div style={cardTitle}>Where are you now?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {STAGES.map(s => (
              <button key={s.value} onClick={() => setStage(s.value)} style={pill(stage === s.value)}>{s.label}</button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{stageDesc}</p>
        </div>

        {/* HRT */}
        <div style={card}>
          <div style={cardTitle}>Hormone therapy (HRT)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {HRT_OPTIONS.map(h => (
              <button key={h.value} onClick={() => setHrtType(h.value)} style={pill(hrtType === h.value)}>{h.label}</button>
            ))}
          </div>
        </div>

        {/* Glucose & insulin */}
        <div style={card}>
          <div style={cardTitle}>Glucose &amp; insulin</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Avg fasting ({unit === "mmol" ? "mmol/L" : "mg/dL"})</div>
              <input style={inputStyle} type="number" value={fasting} onChange={e => setFasting(e.target.value)} placeholder={unit === "mmol" ? "e.g. 7.2" : "e.g. 130"} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Avg post-meal ({unit === "mmol" ? "mmol/L" : "mg/dL"})</div>
              <input style={inputStyle} type="number" value={postMeal} onChange={e => setPostMeal(e.target.value)} placeholder={unit === "mmol" ? "e.g. 10.4" : "e.g. 187"} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Basal dose (U/day)</div>
              <input style={inputStyle} type="number" value={basalDose} onChange={e => setBasalDose(e.target.value)} placeholder="e.g. 22" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Hypos last 7 days</div>
              <input style={inputStyle} type="number" value={hypos} onChange={e => setHypos(e.target.value)} min="0" />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div style={card}>
          <div style={cardTitle}>Current symptoms</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SYMPTOM_OPTIONS.map(s => (
              <button key={s.value} onClick={() => toggleSymptom(s.value)} style={symptomPill(symptoms.includes(s.value))}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAnalyse}
          disabled={!canAnalyse}
          style={{
            width: "100%", marginBottom: 20, padding: "15px 24px",
            background: canAnalyse ? `linear-gradient(135deg, ${T.teal}, #1e9eab)` : T.border,
            color: canAnalyse ? T.white : T.muted,
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600,
            fontFamily: T.body, cursor: canAnalyse ? "pointer" : "not-allowed",
          }}
        >
          Analyse my pattern
        </button>

        {/* Results */}
        {result && (
          <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 20 }}>
            <h2 style={{ fontFamily: T.heading, color: T.navy, fontSize: 20, marginBottom: 16 }}>Your insulin picture</h2>

            {/* ISF band */}
            <div style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.deep})`, borderRadius: 12, padding: 16, marginBottom: 10, color: T.white }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Estimated ISF impact</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.teal }}>
                {Math.round(result.isfImpactLow * 100)}% to {Math.round(result.isfImpactHigh * 100)}%
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {STAGES.find(s => s.value === stage)?.label} · {HRT_OPTIONS.find(h => h.value === hrtType)?.label} HRT
              </div>
            </div>

            {/* Risk flags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "#fef3c7", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>INSULIN RESISTANCE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: resistanceColour(result.resistanceLevel), marginTop: 2 }}>
                  {result.resistanceLevel.charAt(0).toUpperCase() + result.resistanceLevel.slice(1)}
                </div>
              </div>
              <div style={{ background: "#fee2e2", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 600 }}>NOCTURNAL HYPO RISK</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: hypoColour(result.nocturnalHypoRisk), marginTop: 2 }}>
                  {result.nocturnalHypoRisk.charAt(0).toUpperCase() + result.nocturnalHypoRisk.slice(1)}
                </div>
              </div>
            </div>

            {/* Conditional notes */}
            {result.hrtInteractionNote && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#166534" }}>
                <strong>HRT note:</strong> {result.hrtInteractionNote}
              </div>
            )}
            {result.hotFlashCorrelationNote && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#92400e" }}>
                <strong>Hot flash correlation:</strong> {result.hotFlashCorrelationNote}
              </div>
            )}
            {result.dawnPhenomenonFlag && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#9a3412" }}>
                <strong>Dawn phenomenon risk:</strong> Insomnia disrupts cortisol rhythm — elevated morning glucose common. Log 3am and waking readings to separate dawn effect from evening carb timing.
              </div>
            )}

            {/* Doctor talking points */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={cardTitle}>Doctor talking points</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                {result.doctorTalkingPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>

            {/* Monitoring plan */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={cardTitle}>Monitoring plan</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                {result.monitoringPlan.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>

            {/* Citations */}
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
              {result.citations.join(" · ")}
            </div>

            {/* Track this week CTA */}
            <div
              style={{ border: `1px dashed ${T.teal}`, borderRadius: 10, padding: 14, marginBottom: 12, cursor: "pointer" }}
              onClick={() => setTrackerOpen(o => !o)}
            >
              <div style={{ fontSize: 13, color: T.teal, fontWeight: 600 }}>
                {trackerOpen ? "▾" : "▸"} Track this week
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                Log daily glucose + symptoms — see your personal pattern in 7 days ({trackerEntries.length}/7 entries)
              </div>
            </div>

            {/* Tracker panel */}
            {trackerOpen && (
              <div style={card}>
                <div style={cardTitle}>Daily log</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Date</div>
                    <input style={inputStyle} type="date" value={trackerForm.date} onChange={e => setTrackerForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Fasting (mmol/L)</div>
                    <input style={inputStyle} type="number" value={trackerForm.fastingMmol} onChange={e => setTrackerForm(f => ({ ...f, fastingMmol: e.target.value }))} placeholder="e.g. 7.0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Post-meal (mmol/L)</div>
                    <input style={inputStyle} type="number" value={trackerForm.postMealMmol} onChange={e => setTrackerForm(f => ({ ...f, postMealMmol: e.target.value }))} placeholder="e.g. 10.5" />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Symptoms today</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {SYMPTOM_OPTIONS.map(s => (
                      <button key={s.value} onClick={() => toggleTrackerSymptom(s.value)} style={symptomPill(trackerForm.symptoms.includes(s.value))}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={addTrackerEntry}
                  disabled={!trackerForm.fastingMmol || !trackerForm.postMealMmol}
                  style={{ ...pill(true), width: "100%", padding: "11px 16px" }}
                >
                  Add entry
                </button>

                {/* Week summary */}
                {weekSummary && (
                  <div style={{ marginTop: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, fontSize: 13, color: "#166534" }}>
                    <strong>7-day summary:</strong> avg fasting {weekSummary.avg} mmol/L across {weekSummary.count} readings
                  </div>
                )}

                {/* Recent entries */}
                {trackerEntries.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Recent entries</div>
                    {trackerEntries.slice(-3).reverse().map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#374151", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                        {e.date} — fasting {e.fastingMmol}, post-meal {e.postMealMmol} mmol/L
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, padding: 12, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, marginTop: 8 }}>
          Educational platform — not a medical device. All ISF estimates are ranges, not dosing advice. Discuss all insulin adjustments with your endocrinologist.
        </div>
      </div>
    </div>
  );
}
