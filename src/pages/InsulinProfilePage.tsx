/**
 * GluMira™ V7 — Insulin Profile Page
 * Pulls PK reference data from insulin_profiles table.
 * Scandinavian Minimalist design track.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import { API } from "@/lib/api";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DELIVERY_METHODS = ["MDI (Multiple Daily Injections)", "Insulin Pump", "Insulin Pen", "Inhaled Insulin"] as const;
const BASAL_FREQUENCY_OPTIONS = ["Once daily", "Twice daily", "Pump (continuous)", "Other (split doses)"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  rapid_acting: "Rapid-Acting",
  short_acting: "Short-Acting",
  intermediate_acting: "Intermediate-Acting",
  long_acting: "Long-Acting",
  ultra_long_acting: "Ultra-Long-Acting",
  mixed: "Mixed / Biphasic",
  concentrated: "Concentrated",
};

const CATEGORY_COLORS: Record<string, string> = {
  rapid_acting: "#e74c3c",
  short_acting: "#e67e22",
  intermediate_acting: "#f1c40f",
  long_acting: "#2ab5c1",
  ultra_long_acting: "#3498db",
  mixed: "#9b59b6",
  concentrated: "#1abc9c",
};

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface InsulinRef {
  id: string;
  brand_name: string;
  generic_name: string;
  manufacturer: string | null;
  category: string;
  onset_minutes: number;
  peak_start_minutes: number | null;
  peak_end_minutes: number | null;
  duration_minutes: number;
  is_peakless: boolean;
  mechanism_notes: string | null;
  pk_source: string;
}

interface InsulinData {
  insulin_types: string[];
  delivery_method: string;
  basal_frequency: string;
  basal_times: string[];
  icr: string;
  isf: string;
  correction_target: string;
}

const EMPTY_INSULIN: InsulinData = {
  insulin_types: [], delivery_method: "", basal_frequency: "", basal_times: [],
  icr: "", isf: "", correction_target: "",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function groupByCategory(insulins: InsulinRef[]): Record<string, InsulinRef[]> {
  const groups: Record<string, InsulinRef[]> = {};
  for (const ins of insulins) {
    (groups[ins.category] ??= []).push(ins);
  }
  return groups;
}

/* ─── Collapsible Card ────────────────────────────────────────────────────── */

function Card({ id, title, defaultOpen = false, children }: { id?: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const isTarget = id && typeof window !== "undefined" && window.location.hash === `#${id}`;
  const [open, setOpen] = useState(defaultOpen || !!isTarget);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isTarget && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isTarget]);
  return (
    <div ref={ref} id={id} style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(16px, 5vw, 20px)",
          fontWeight: 700, color: "var(--text-primary)", textAlign: "left",
        }}
      >
        {title}
        <span style={{ fontSize: 18, color: "var(--text-secondary)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          &#9662;
        </span>
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

/* ─── Input Components ────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 48, padding: "12px 14px", borderRadius: 8,
  border: "1px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
  marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", inputMode, pattern }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: string; pattern?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} inputMode={inputMode as any} pattern={pattern}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2ab5c1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#dee2e6"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: value ? "var(--text-primary)" : "var(--text-secondary)" }}
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ─── Insulin Card (PK details) ───────────────────────────────────────────── */

function InsulinPKCard({ ins, selected, onToggle }: { ins: InsulinRef; selected: boolean; onToggle: () => void }) {
  const cat = CATEGORY_LABELS[ins.category] ?? ins.category;
  const color = CATEGORY_COLORS[ins.category] ?? "#888";
  return (
    <button
      type="button" onClick={onToggle}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
        border: `1.5px solid ${selected ? "var(--accent-teal)" : "var(--border-light)"}`,
        background: selected ? "rgba(42,181,193,0.06)" : "var(--bg-card)",
        transition: "all 0.15s", width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {selected ? "\u2713 " : ""}{ins.brand_name}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
          background: `${color}18`, color, fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {cat}
        </span>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", fontStyle: "italic" }}>
        {ins.generic_name}{ins.manufacturer ? ` \u2014 ${ins.manufacturer}` : ""}
      </span>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4,
        fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)",
      }}>
        <div>
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif", display: "block" }}>Onset</span>
          {formatDuration(ins.onset_minutes)}
        </div>
        <div>
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif", display: "block" }}>Peak</span>
          {ins.is_peakless ? "Peakless" : ins.peak_start_minutes != null && ins.peak_end_minutes != null
            ? `${formatDuration(ins.peak_start_minutes)}\u2013${formatDuration(ins.peak_end_minutes)}`
            : ins.peak_start_minutes != null ? formatDuration(ins.peak_start_minutes) : "\u2014"}
        </div>
        <div>
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif", display: "block" }}>Duration</span>
          {formatDuration(ins.duration_minutes)}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function InsulinProfilePage() {
  const { session, loading: authLoading } = useAuth();
  const [form, setForm] = useState<InsulinData>(EMPTY_INSULIN);
  const [insulinRef, setInsulinRef] = useState<InsulinRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  /* ─── Load profile + insulin reference data ──────────────────────────── */
  useEffect(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session) headers.Authorization = `Bearer ${session.access_token}`;

    const profileFetch = session
      ? fetch(`${API}/api/profile`, { headers })
          .then((r) => r.json())
          .then((data) => data.profile ?? null)
          .catch(() => null)
      : Promise.resolve(null);

    const refFetch = fetch(`${API}/api/insulin-profiles`)
      .then((r) => r.json())
      .then((data) => data.insulins ?? [])
      .catch(() => []);

    Promise.all([profileFetch, refFetch]).then(([profile, insulins]) => {
      if (profile) {
        setForm({
          insulin_types:     profile.insulin_types ?? [],
          delivery_method:   profile.delivery_method ?? "",
          basal_frequency:   profile.basal_frequency ?? "",
          basal_times:       profile.basal_times ?? [],
          icr:               profile.icr ?? "",
          isf:               profile.isf ?? "",
          correction_target: profile.correction_target ?? "",
        });
      }
      setInsulinRef(insulins);
      setLoading(false);
    });
  }, [session]);

  /* ─── Save ────────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Server returned an unexpected response. Please try again."); }
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form]);

  useKeyboardSave(save);

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const set = (key: keyof InsulinData) => (val: any) => setForm((f) => ({ ...f, [key]: val }));
  const toggleInsulin = (brandName: string) => {
    setForm((f) => ({
      ...f,
      insulin_types: f.insulin_types.includes(brandName)
        ? f.insulin_types.filter((v) => v !== brandName)
        : [...f.insulin_types, brandName],
    }));
  };

  const grouped = groupByCategory(insulinRef);
  const categories = Object.keys(grouped).sort();
  const filtered = categoryFilter === "all" ? insulinRef : (grouped[categoryFilter] ?? []);
  const selectedInsulins = insulinRef.filter((i) => form.insulin_types.includes(i.brand_name));

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading insulin profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px",
          }}>
            Insulin Profile
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Select your insulins and configure your regimen. Pharmacokinetic data sourced from prescribing information.
          </p>
        </div>

        {/* Medical disclaimer */}
        <div style={{
          borderRadius: 8, background: "var(--disclaimer-bg)", border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Selected Insulins Summary ──────────────────────────────── */}
          {selectedInsulins.length > 0 && (
            <Card title={`My Insulins (${selectedInsulins.length})`} defaultOpen={true}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedInsulins.map((ins) => (
                  <InsulinPKCard key={ins.id} ins={ins} selected={true} onToggle={() => toggleInsulin(ins.brand_name)} />
                ))}
              </div>
            </Card>
          )}

          {/* ── Select Insulins ────────────────────────────────────────── */}
          <Card title="Select Insulin(s)" defaultOpen={selectedInsulins.length === 0}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Tap an insulin to add or remove it. {insulinRef.length} insulins available.
            </p>

            {/* Category filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              <button
                type="button" onClick={() => setCategoryFilter("all")}
                style={{
                  padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  border: `1px solid ${categoryFilter === "all" ? "var(--accent-teal)" : "var(--border-light)"}`,
                  background: categoryFilter === "all" ? "rgba(42,181,193,0.12)" : "var(--bg-card)",
                  color: categoryFilter === "all" ? "var(--accent-teal)" : "var(--text-secondary)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat} type="button" onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${categoryFilter === cat ? (CATEGORY_COLORS[cat] ?? "#888") : "var(--border-light)"}`,
                    background: categoryFilter === cat ? `${CATEGORY_COLORS[cat] ?? "#888"}18` : "var(--bg-card)",
                    color: categoryFilter === cat ? (CATEGORY_COLORS[cat] ?? "#888") : "var(--text-secondary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {CATEGORY_LABELS[cat] ?? cat} ({grouped[cat].length})
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((ins) => (
                <InsulinPKCard
                  key={ins.id} ins={ins}
                  selected={form.insulin_types.includes(ins.brand_name)}
                  onToggle={() => toggleInsulin(ins.brand_name)}
                />
              ))}
            </div>
          </Card>

          {/* ── Delivery & Basal ───────────────────────────────────────── */}
          <Card title="Delivery & Basal Schedule" defaultOpen={true}>
            <Field label="Delivery method">
              <SelectInput value={form.delivery_method} onChange={set("delivery_method")} options={DELIVERY_METHODS} placeholder="Select delivery method" />
            </Field>
            <Field label="Basal frequency">
              <SelectInput value={form.basal_frequency} onChange={set("basal_frequency")} options={BASAL_FREQUENCY_OPTIONS} placeholder="Select basal frequency" />
            </Field>
            {form.basal_frequency && form.basal_frequency !== "Pump (continuous)" && (
              <Field label="Planned basal injection times (up to 4)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {form.basal_times.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="time" value={t}
                        onChange={(e) => {
                          const updated = [...form.basal_times];
                          updated[i] = e.target.value;
                          set("basal_times")(updated);
                        }}
                        style={{ ...inputStyle, width: 130 }}
                      />
                      <button
                        type="button"
                        onClick={() => set("basal_times")(form.basal_times.filter((_, j) => j !== i))}
                        style={{
                          width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border-light)",
                          background: "#fff", color: "var(--error-text)", fontSize: 16, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        aria-label="Remove time slot"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.basal_times.length < 4 && (
                    <button
                      type="button"
                      onClick={() => set("basal_times")([...form.basal_times, "08:00"])}
                      style={{
                        minHeight: 48, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                        border: "1px dashed #2ab5c1", background: "rgba(42,181,193,0.06)",
                        color: "#2ab5c1", fontSize: 13, fontWeight: 600,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    >
                      + Add time
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {form.basal_times.length} of 4 slots used
                </p>
              </Field>
            )}
          </Card>

          {/* ── Ratios & Targets ───────────────────────────────────────── */}
          <Card title="Ratios & Correction Target" defaultOpen={true}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              These values help GluMira™ provide personalised bolus suggestions. Leave blank if unknown.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="ICR">
                <TextInput value={form.icr} onChange={set("icr")} placeholder="e.g. 10" type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" />
              </Field>
              <Field label="ISF">
                <TextInput value={form.isf} onChange={set("isf")} placeholder="e.g. 2.5" type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" />
              </Field>
              <Field label="Correction target">
                <TextInput value={form.correction_target} onChange={set("correction_target")} placeholder="e.g. 5.5" type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Save Button & Feedback ─────────────────────────────────────── */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ borderRadius: 8, background: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "10px 14px", fontSize: 13, color: "var(--error-text)" }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", fontSize: 13, color: "#166534" }}>
              Insulin profile saved successfully.
            </div>
          )}
          <button
            type="button" onClick={save} disabled={saving}
            style={{
              width: "100%", minHeight: 52, borderRadius: 10, border: "none",
              background: saving ? "var(--text-faint)" : "var(--accent-teal)", color: "#ffffff",
              fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save Insulin Profile"}
          </button>
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
