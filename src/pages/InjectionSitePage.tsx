/**
 * GluMira™ V7 — Injection Site Rotation Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column. Visual SVG body map with clickable injection zones.
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STORAGE_KEY = "glumira_injection_sites";

const INSULIN_LABELS: Record<string, string> = {
  glargine_u100: "Glargine U-100 (Lantus/Basaglar)",
  glargine_u300: "Glargine U-300 (Toujeo)",
  degludec: "Degludec (Tresiba)",
  detemir: "Detemir (Levemir)",
  nph: "NPH (Humulin N/Novolin N)",
  aspart: "Aspart (NovoRapid/Fiasp)",
  lispro: "Lispro (Humalog/Lyumjev)",
  glulisine: "Glulisine (Apidra)",
  regular: "Regular (Actrapid/Humulin R)",
};

const INSULIN_OPTIONS = Object.entries(INSULIN_LABELS).map(([value, label]) => ({ value, label }));

type ZoneId =
  | "left_abdomen" | "right_abdomen"
  | "left_thigh_front" | "right_thigh_front"
  | "left_upper_arm_front" | "right_upper_arm_front"
  | "left_buttock" | "right_buttock"
  | "left_thigh_back" | "right_thigh_back"
  | "left_upper_arm_back" | "right_upper_arm_back";

interface ZoneDef {
  id: ZoneId;
  label: string;
  side: "front" | "back";
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONES: ZoneDef[] = [
  // Front
  { id: "left_abdomen",          label: "Left Abdomen",            side: "front", x: 58,  y: 108, w: 30, h: 36 },
  { id: "right_abdomen",         label: "Right Abdomen",           side: "front", x: 92,  y: 108, w: 30, h: 36 },
  { id: "left_thigh_front",      label: "Left Thigh (front)",      side: "front", x: 56,  y: 172, w: 26, h: 44 },
  { id: "right_thigh_front",     label: "Right Thigh (front)",     side: "front", x: 98,  y: 172, w: 26, h: 44 },
  { id: "left_upper_arm_front",  label: "Left Upper Arm (front)",  side: "front", x: 34,  y: 72,  w: 18, h: 34 },
  { id: "right_upper_arm_front", label: "Right Upper Arm (front)", side: "front", x: 128, y: 72,  w: 18, h: 34 },
  // Back
  { id: "left_buttock",          label: "Left Buttock",            side: "back",  x: 58,  y: 148, w: 30, h: 24 },
  { id: "right_buttock",         label: "Right Buttock",           side: "back",  x: 92,  y: 148, w: 30, h: 24 },
  { id: "left_thigh_back",       label: "Left Thigh (back)",       side: "back",  x: 56,  y: 172, w: 26, h: 44 },
  { id: "right_thigh_back",      label: "Right Thigh (back)",      side: "back",  x: 98,  y: 172, w: 26, h: 44 },
  { id: "left_upper_arm_back",   label: "Left Upper Arm (back)",   side: "back",  x: 34,  y: 72,  w: 18, h: 34 },
  { id: "right_upper_arm_back",  label: "Right Upper Arm (back)",  side: "back",  x: 128, y: 72,  w: 18, h: 34 },
];

interface InjectionRecord {
  id: string;
  zone: ZoneId;
  datetime: string;
  insulin_type: string;
  dose: number;
  notes: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadRecords(): InjectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: InjectionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

type Freshness = "green" | "yellow" | "orange" | "red";

function getZoneFreshness(zone: ZoneId, records: InjectionRecord[]): Freshness {
  const now = Date.now();
  const zoneRecords = records.filter((r) => r.zone === zone);
  if (zoneRecords.length === 0) return "green";

  const latest = Math.max(...zoneRecords.map((r) => new Date(r.datetime).getTime()));
  const hoursAgo = (now - latest) / (1000 * 60 * 60);

  if (hoursAgo < 24) return "red";
  if (hoursAgo < 48) return "orange";
  if (hoursAgo < 168) return "yellow";
  return "green";
}

const FRESHNESS_COLORS: Record<Freshness, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

/* ─── Styles ──────────────────────────────────────────────────────────────── */

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

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--accent-teal)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--border-light)";
  e.currentTarget.style.boxShadow = "none";
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ─── SVG Body Silhouette ─────────────────────────────────────────────────── */

function BodySilhouette({ side }: { side: "front" | "back" }) {
  return (
    <g>
      {/* Head */}
      <ellipse cx="90" cy="28" rx="18" ry="22" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Neck */}
      <rect x="83" y="48" width="14" height="12" rx="4" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Torso */}
      <rect x="58" y="58" width="64" height="90" rx="10" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Left Arm */}
      <rect x="34" y="62" width="18" height="68" rx="8" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Right Arm */}
      <rect x="128" y="62" width="18" height="68" rx="8" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Left Leg */}
      <rect x="58" y="148" width="24" height="80" rx="8" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Right Leg */}
      <rect x="98" y="148" width="24" height="80" rx="8" fill="var(--border-light)" stroke="var(--text-faint)" strokeWidth="1" />
      {/* Label */}
      <text x="90" y="246" textAnchor="middle" fontSize="11" fill="var(--text-faint)" fontFamily="'DM Sans', system-ui, sans-serif">
        {side === "front" ? "Front" : "Back"}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function InjectionSitePage() {
  const { session } = useAuth();
  const [records, setRecords] = useState<InjectionRecord[]>(loadRecords);
  const [side, setSide] = useState<"front" | "back">("front");
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [formDatetime, setFormDatetime] = useState(nowLocal);
  const [formInsulin, setFormInsulin] = useState("");
  const [formDose, setFormDose] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync records to localStorage on change
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const visibleZones = ZONES.filter((z) => z.side === side);
  const selectedZoneDef = ZONES.find((z) => z.id === selectedZone) ?? null;

  /* ─── Save ──────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!selectedZone) { setError("Please select an injection zone on the body map."); return; }
    if (!formInsulin) { setError("Please select an insulin type."); return; }
    if (!formDose || parseFloat(formDose) <= 0) { setError("Please enter a valid dose."); return; }

    setSaving(true);
    setError(null);
    setToast(null);

    const record: InjectionRecord = {
      id: uid(),
      zone: selectedZone,
      datetime: new Date(formDatetime).toISOString(),
      insulin_type: formInsulin,
      dose: parseFloat(formDose),
      notes: formNotes,
    };

    try {
      // POST to API
      if (session) {
        await fetch("/trpc/injectionSite.create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            json: {
              zone: record.zone,
              datetime: record.datetime,
              insulin_type: record.insulin_type,
              dose: record.dose,
              notes: record.notes || null,
            },
          }),
        }).catch(() => {});
      }

      setRecords((prev) => [record, ...prev]);
      setToast("Injection logged");
      setTimeout(() => setToast(null), 3000);
      setSelectedZone(null);
      setFormDatetime(nowLocal());
      setFormInsulin("");
      setFormDose("");
      setFormNotes("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, selectedZone, formDatetime, formInsulin, formDose, formNotes]);

  useKeyboardSave(save);

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <h1 style={{
        fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 5vw, 28px)",
        color: "var(--text-primary)", marginBottom: 4, fontWeight: 700,
      }}>
        Injection Site Rotation
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, marginTop: 0 }}>
        Track and rotate your injection sites to keep tissue healthy.
      </p>

      {/* Toast */}
      {toast && (
        <div style={{
          background: "#16a34a", color: "#fff", padding: "10px 16px", borderRadius: 8,
          marginBottom: 16, fontSize: 14, fontWeight: 600, textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Rotation Guidance */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-light)",
        borderRadius: 12, padding: 16, marginBottom: 20,
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-primary)" }}>Rotation guidance:</strong>{" "}
          Rotate injection sites to prevent lipohypertrophy. Use each zone no more than once every 7 days.
          The body map shows site freshness — green means safe to use.
        </p>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap",
      }}>
        {([
          ["#22c55e", "Safe (7+ days)"],
          ["#eab308", "Caution (3-7 days)"],
          ["#f97316", "Avoid (1-2 days)"],
          ["#ef4444", "Used today"],
        ] as const).map(([color, text]) => (
          <div key={color} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Body Map Card */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-light)",
        borderRadius: 12, padding: 20, marginBottom: 20,
      }}>
        {/* Front/Back Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["front", "back"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                flex: 1, minHeight: 40, borderRadius: 8, border: "1px solid var(--border-light)",
                background: side === s ? "var(--accent-teal)" : "var(--bg-primary)",
                color: side === s ? "#fff" : "var(--text-secondary)",
                fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 600,
                cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s ease",
              }}
            >
              {s} View
            </button>
          ))}
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 180 260" style={{ width: "100%", maxWidth: 320, margin: "0 auto", display: "block" }}>
          <BodySilhouette side={side} />
          {visibleZones.map((zone) => {
            const freshness = getZoneFreshness(zone.id, records);
            const isSelected = selectedZone === zone.id;
            return (
              <rect
                key={zone.id}
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                rx={6}
                fill={FRESHNESS_COLORS[freshness]}
                fillOpacity={isSelected ? 0.8 : 0.45}
                stroke={isSelected ? "var(--text-primary)" : FRESHNESS_COLORS[freshness]}
                strokeWidth={isSelected ? 2.5 : 1.5}
                style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                onClick={() => setSelectedZone(zone.id)}
              >
                <title>{zone.label}</title>
              </rect>
            );
          })}
        </svg>

        {/* Selected zone label */}
        {selectedZoneDef && (
          <div style={{
            marginTop: 12, textAlign: "center", fontSize: 15, fontWeight: 600,
            color: "var(--accent-teal)", fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Selected: {selectedZoneDef.label}
          </div>
        )}
      </div>

      {/* Injection Log Form */}
      {selectedZone && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: 12, padding: 20, marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 18,
            color: "var(--text-primary)", margin: "0 0 16px 0",
          }}>
            Log Injection
          </h2>

          <Field label="Zone">
            <div style={{
              ...inputStyle, background: "var(--bg-primary)", display: "flex",
              alignItems: "center", color: "var(--accent-teal)", fontWeight: 600,
            }}>
              {selectedZoneDef?.label}
            </div>
          </Field>

          <Field label="Date & Time">
            <input
              type="datetime-local"
              value={formDatetime}
              onChange={(e) => setFormDatetime(e.target.value)}
              onFocus={focusIn}
              onBlur={focusOut}
              style={inputStyle}
            />
          </Field>

          <Field label="Insulin Type">
            <select
              value={formInsulin}
              onChange={(e) => setFormInsulin(e.target.value)}
              onFocus={focusIn as any}
              onBlur={focusOut as any}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Select insulin type...</option>
              {INSULIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Dose (units)">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              placeholder="e.g. 10.5"
              value={formDose}
              onChange={(e) => setFormDose(e.target.value)}
              onFocus={focusIn}
              onBlur={focusOut}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              onFocus={focusIn as any}
              onBlur={focusOut as any}
              rows={2}
              placeholder="Any observations..."
              style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
            />
          </Field>

          <button
            onClick={save}
            disabled={saving}
            style={{
              width: "100%", minHeight: 52, borderRadius: 10, border: "none",
              background: saving ? "#86efac" : "#16a34a", color: "#fff",
              fontSize: 16, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif", transition: "background 0.15s ease",
            }}
          >
            {saving ? "Saving..." : "Save Injection"}
          </button>
        </div>
      )}

      {/* Site History */}
      {records.length > 0 && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: 12, padding: 20,
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 18,
            color: "var(--text-primary)", margin: "0 0 16px 0",
          }}>
            Recent Injections
          </h2>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {records.slice(0, 50).map((r) => {
              const freshness = getZoneFreshness(r.zone, records);
              const zoneDef = ZONES.find((z) => z.id === r.zone);
              const dt = new Date(r.datetime);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 0", borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                    background: FRESHNESS_COLORS[freshness],
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
                      marginBottom: 2,
                    }}>
                      {zoneDef?.label ?? r.zone}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {INSULIN_LABELS[r.insulin_type] ?? r.insulin_type}
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                        {r.notes}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
                    fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
                  }}>
                    {r.dose}u
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
