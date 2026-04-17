/**
 * GluMira™ V7 — Insulin Profile Page
 *
 * Restyled 2026-04-17 to match MenopauseModule's flat-card language.
 * Card chrome is intentionally consistent across clinical modules — every
 * card is white, 1px border, 12px radius, with a navy uppercase kicker.
 * Section identity comes from a small coloured icon tile, not from an
 * accent stripe.
 *
 * Scandinavian Minimalist (app interior) design track per Rule 21.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, supabase } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import { API } from "@/lib/api";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { INSULIN_PROFILES as CLIENT_PROFILES } from "@/iob-hunter/engine/insulin-profiles";

/* ─── Theme tokens (MenopauseModule vocabulary) ────────────────────────── */
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

/* ─── Constants ───────────────────────────────────────────────────────── */
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
  long_acting: T.teal,
  ultra_long_acting: "#3498db",
  mixed: "#9b59b6",
  concentrated: "#1abc9c",
};

/* ─── Types ───────────────────────────────────────────────────────────── */
type InsulinRef = {
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

type InsulinData = {
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

/* ─── Helpers ─────────────────────────────────────────────────────────── */
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

/* ─── Shared input styles ─────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: 8,
  padding: "9px 12px", color: T.navy, fontSize: 14,
  width: "100%", boxSizing: "border-box", fontFamily: T.body,
  minHeight: 44,
  background: T.white,
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

/* ─── Insulin PK card ─────────────────────────────────────────────────── */
function InsulinPKCard({ ins, selected, onToggle }: { ins: InsulinRef; selected: boolean; onToggle: () => void }) {
  const cat = CATEGORY_LABELS[ins.category] ?? ins.category;
  const color = CATEGORY_COLORS[ins.category] ?? "#888";
  return (
    <button
      type="button" onClick={onToggle}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
        border: `1.5px solid ${selected ? T.teal : T.border}`,
        background: selected ? "rgba(42,181,193,0.06)" : T.white,
        transition: "all 0.15s", width: "100%",
        fontFamily: T.body,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>
          {selected ? "✓ " : ""}{ins.brand_name}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
          background: `${color}18`, color,
        }}>
          {cat}
        </span>
      </div>
      <span style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>
        {ins.generic_name}{ins.manufacturer ? ` — ${ins.manufacturer}` : ""}
      </span>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4,
        fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.navy,
      }}>
        <div>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: T.body, display: "block" }}>Onset</span>
          {formatDuration(ins.onset_minutes)}
        </div>
        <div>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: T.body, display: "block" }}>Peak</span>
          {ins.is_peakless ? "Peakless" : ins.peak_start_minutes != null && ins.peak_end_minutes != null
            ? `${formatDuration(ins.peak_start_minutes)}–${formatDuration(ins.peak_end_minutes)}`
            : ins.peak_start_minutes != null ? formatDuration(ins.peak_start_minutes) : "—"}
        </div>
        <div>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: T.body, display: "block" }}>Duration</span>
          {formatDuration(ins.duration_minutes)}
        </div>
      </div>
    </button>
  );
}

/* ─── 24h time input ──────────────────────────────────────────────────── */
function formatTimeDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 4);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function isValidTime(v: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
}

function Time24Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const display = value || "";
  const valid = !display || isValidTime(display);
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]{2}:[0-9]{2}"
      maxLength={5}
      value={display}
      onChange={(e) => onChange(formatTimeDigits(e.target.value))}
      placeholder="HH:MM"
      aria-label="Time (24h, type digits e.g. 2045)"
      style={{
        width: 108, minHeight: 44, padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${valid ? T.border : "#e74c3c"}`,
        background: T.white, color: T.navy,
        fontSize: 18, fontWeight: 600, letterSpacing: "0.04em",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        textAlign: "center", outline: "none", boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = T.teal;
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)";
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = valid ? T.border : "#e74c3c";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

/* ─── Collapsible card (used for the long insulin list) ───────────────── */
function CollapsibleCard({
  icon, iconBg, title, defaultOpen = false, children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={card}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={cardTitle}>{title}</div>
        </div>
        <span style={{
          fontSize: 16, color: T.teal,
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>▾</span>
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

/* ─── Static card with icon (non-collapsible) ─────────────────────────── */
function SectionCard({
  icon, iconBg, title, children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={cardTitle}>{title}</div>
      </div>
      {children}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
export default function InsulinProfilePage() {
  const { session, loading: authLoading } = useAuth();
  const [form, setForm] = useState<InsulinData>(EMPTY_INSULIN);
  const [insulinRef, setInsulinRef] = useState<InsulinRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  /* ─── Load profile + insulin reference data ─────────────────────── */
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
      .then((data) => {
        const dbInsulins = data.insulins ?? [];
        if (dbInsulins.length > 0) return dbInsulins;
        return CLIENT_PROFILES.map((p) => ({
          id: p.brand_name.toLowerCase().replace(/\s+/g, "-"),
          brand_name: p.brand_name,
          generic_name: p.generic_name,
          manufacturer: p.manufacturer ?? null,
          category: p.category.replace(/-/g, "_"),
          onset_minutes: p.onset_minutes,
          peak_start_minutes: p.peak_start_minutes ?? null,
          peak_end_minutes: p.peak_end_minutes ?? null,
          duration_minutes: p.duration_minutes,
          is_peakless: p.is_peakless,
          mechanism_notes: p.mechanism_notes ?? null,
          pk_source: p.pk_source,
        }));
      })
      .catch(() =>
        CLIENT_PROFILES.map((p) => ({
          id: p.brand_name.toLowerCase().replace(/\s+/g, "-"),
          brand_name: p.brand_name,
          generic_name: p.generic_name,
          manufacturer: p.manufacturer ?? null,
          category: p.category.replace(/-/g, "_"),
          onset_minutes: p.onset_minutes,
          peak_start_minutes: p.peak_start_minutes ?? null,
          peak_end_minutes: p.peak_end_minutes ?? null,
          duration_minutes: p.duration_minutes,
          is_peakless: p.is_peakless,
          mechanism_notes: p.mechanism_notes ?? null,
          pk_source: p.pk_source,
        }))
      );

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

  /* ─── Save ───────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data: { session: fresh } } = await supabase.auth.getSession();
      const token = fresh?.access_token ?? session.access_token;
      if (!fresh) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Server returned an unexpected response. Please try again."); }
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [session, form]);

  useKeyboardSave(save);

  /* ─── Helpers ────────────────────────────────────────────────────── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: T.muted, fontSize: 14, fontFamily: T.body }}>Loading insulin profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: 24, fontFamily: T.body }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header (MenopauseModule pattern) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#e0f2fe",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>
            💉
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: T.heading, color: T.navy, fontSize: 22 }}>Insulin Profile</h1>
            <p style={{ margin: "2px 0 0", color: T.muted, fontSize: 13 }}>
              Select your insulins and configure your regimen · {selectedInsulins.length} selected
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          fontSize: 12, color: T.muted, lineHeight: 1.6,
          padding: 12, background: T.white, borderRadius: 8,
          border: `1px solid ${T.border}`, marginBottom: 16,
        }}>
          {DISCLAIMER}
        </div>

        {/* ── My Insulins ────────────────────────────────────────────── */}
        {selectedInsulins.length > 0 && (
          <SectionCard icon="💉" iconBg="#e0f2fe" title={`My Insulins · ${selectedInsulins.length}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedInsulins.map((ins) => (
                <InsulinPKCard key={ins.id} ins={ins} selected onToggle={() => toggleInsulin(ins.brand_name)} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Select Insulins (collapsible because 20+) ─────────────── */}
        <CollapsibleCard
          icon="🔬"
          iconBg="#fef3c7"
          title="Select insulin(s)"
          defaultOpen={selectedInsulins.length === 0}
        >
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            Tap an insulin to add or remove it. {insulinRef.length} insulins available.
          </p>

          {/* Category filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <button
              type="button" onClick={() => setCategoryFilter("all")}
              style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                border: `1px solid ${categoryFilter === "all" ? T.teal : T.border}`,
                background: categoryFilter === "all" ? "rgba(42,181,193,0.12)" : T.bg,
                color: categoryFilter === "all" ? T.teal : T.muted,
                fontFamily: T.body,
              }}
            >
              All · {insulinRef.length}
            </button>
            {categories.map((cat) => (
              <button
                key={cat} type="button" onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  border: `1px solid ${categoryFilter === cat ? (CATEGORY_COLORS[cat] ?? "#888") : T.border}`,
                  background: categoryFilter === cat ? `${CATEGORY_COLORS[cat] ?? "#888"}18` : T.bg,
                  color: categoryFilter === cat ? (CATEGORY_COLORS[cat] ?? "#888") : T.muted,
                  fontFamily: T.body,
                }}
              >
                {CATEGORY_LABELS[cat] ?? cat} · {grouped[cat].length}
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
        </CollapsibleCard>

        {/* ── Delivery & Basal ──────────────────────────────────────── */}
        <SectionCard icon="⏱" iconBg="#dcfce7" title="Delivery & basal schedule">
          <Field label="Delivery method">
            <select
              value={form.delivery_method}
              onChange={(e) => set("delivery_method")(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer", color: form.delivery_method ? T.navy : T.muted }}
            >
              <option value="">Select delivery method</option>
              {DELIVERY_METHODS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Basal frequency">
            <select
              value={form.basal_frequency}
              onChange={(e) => set("basal_frequency")(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer", color: form.basal_frequency ? T.navy : T.muted }}
            >
              <option value="">Select basal frequency</option>
              {BASAL_FREQUENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          {form.basal_frequency && form.basal_frequency !== "Pump (continuous)" && (
            <Field label="Planned basal injection times (up to 4)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {form.basal_times.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Time24Input
                      value={t}
                      onChange={(v) => {
                        const updated = [...form.basal_times];
                        updated[i] = v;
                        set("basal_times")(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => set("basal_times")(form.basal_times.filter((_, j) => j !== i))}
                      style={{
                        width: 32, height: 32, borderRadius: 6, border: `1px solid ${T.border}`,
                        background: T.white, color: "#e74c3c", fontSize: 16, cursor: "pointer",
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
                      minHeight: 44, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                      border: `1px dashed ${T.teal}`, background: "rgba(42,181,193,0.06)",
                      color: T.teal, fontSize: 13, fontWeight: 600,
                      fontFamily: T.body,
                    }}
                  >
                    + Add time
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                {form.basal_times.length} of 4 slots used
              </p>
            </Field>
          )}
        </SectionCard>

        {/* ── Ratios & Target ───────────────────────────────────────── */}
        <SectionCard icon="📐" iconBg="#fce7f3" title="Ratios & correction target">
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            These values help GluMira™ provide personalised bolus suggestions. Leave blank if unknown.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            <Field label="ICR (g carbs / U)">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*.?[0-9]*"
                value={form.icr}
                onChange={(e) => set("icr")(e.target.value)}
                placeholder="e.g. 10"
                style={inputStyle}
              />
            </Field>
            <Field label="ISF (mmol/L per U)">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*.?[0-9]*"
                value={form.isf}
                onChange={(e) => set("isf")(e.target.value)}
                placeholder="e.g. 2.5"
                style={inputStyle}
              />
            </Field>
            <Field label="Correction target (mmol/L)">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*.?[0-9]*"
                value={form.correction_target}
                onChange={(e) => set("correction_target")(e.target.value)}
                placeholder="e.g. 5.5"
                style={inputStyle}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Feedback + Save */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {error && (
            <div style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
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
              width: "100%", minHeight: 52, borderRadius: 12, border: "none",
              background: saving
                ? T.border
                : `linear-gradient(135deg, ${T.teal}, #1e9eab)`,
              color: saving ? T.muted : T.white,
              fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: T.body,
              transition: "background 0.2s, box-shadow 0.2s",
              boxShadow: saving ? "none" : "0 6px 16px rgba(42,181,193,0.25)",
            }}
          >
            {saving ? "Saving…" : "Save insulin profile"}
          </button>
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
