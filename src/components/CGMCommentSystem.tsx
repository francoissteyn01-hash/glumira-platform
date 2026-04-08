/**
 * GluMira™ V7 — CGM Comment System
 * Inline annotations on glucose data points for data quality.
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type CGMCommentType =
  | "false_low" | "false_high" | "fingerstick" | "compression_low"
  | "new_sensor" | "sensor_warmup" | "sensor_drift" | "sensor_defective"
  | "calibration" | "exercise" | "illness_stress" | "custom";

export interface CGMComment {
  id: string;
  commentType: CGMCommentType;
  commentText?: string;
  glucoseValue?: number;
  fingerstickValue?: number;
  glucoseUnit: "mmol/L" | "mg/dL";
  commentedAt: string;
  excludeFromAnalysis: boolean;
}

const COMMENT_OPTIONS: Array<{ value: CGMCommentType; label: string; icon: string; color: string }> = [
  { value: "false_low",        label: "False low",                    icon: "🚩", color: "#F44336" },
  { value: "false_high",       label: "False high",                   icon: "🚩", color: "#F44336" },
  { value: "fingerstick",      label: "Fingerstick reads...",         icon: "📌", color: "#378ADD" },
  { value: "compression_low",  label: "Compression low",              icon: "🔶", color: "#FF9800" },
  { value: "new_sensor",       label: "Start new sensor",             icon: "⚪", color: "#94a3b8" },
  { value: "sensor_warmup",    label: "Sensor warmup (no data)",      icon: "⬜", color: "#94a3b8" },
  { value: "sensor_drift",     label: "Sensor drifting",              icon: "🔶", color: "#FFC107" },
  { value: "sensor_defective", label: "Sensor defective — claim",     icon: "🔴", color: "#F44336" },
  { value: "calibration",      label: "Calibration done",             icon: "📌", color: "#378ADD" },
  { value: "exercise",         label: "Exercise / Activity",          icon: "🟢", color: "#4CAF50" },
  { value: "illness_stress",   label: "Illness / Stress",             icon: "🟠", color: "#FF9800" },
  { value: "custom",           label: "Custom note",                  icon: "📝", color: "#94a3b8" },
];

/* ─── Comment Popover ───────────────────────────────────────────────────── */

interface CGMCommentPopoverProps {
  glucoseValue?: number;
  glucoseUnit: "mmol/L" | "mg/dL";
  timestamp: string;
  onSave: (comment: Omit<CGMComment, "id" | "excludeFromAnalysis">) => void;
  onClose: () => void;
}

export function CGMCommentPopover({ glucoseValue, glucoseUnit, timestamp, onSave, onClose }: CGMCommentPopoverProps) {
  const [type, setType] = useState<CGMCommentType>("custom");
  const [text, setText] = useState("");
  const [fingerstick, setFingerstick] = useState("");

  const handleSave = () => {
    onSave({
      commentType: type,
      commentText: text || undefined,
      glucoseValue,
      fingerstickValue: fingerstick ? parseFloat(fingerstick) : undefined,
      glucoseUnit,
      commentedAt: timestamp,
    });
    onClose();
  };

  return (
    <div style={{
      position: "absolute", zIndex: 100,
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 16, minWidth: 280,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Add Comment</span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18 }}>×</button>
      </div>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as CGMCommentType)}
        style={{ width: "100%", minHeight: 40, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, padding: "8px 10px", marginBottom: 10 }}
      >
        {COMMENT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
        ))}
      </select>

      {type === "fingerstick" && (
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder={`Fingerstick value (${glucoseUnit})`}
          value={fingerstick}
          onChange={(e) => setFingerstick(e.target.value)}
          style={{ width: "100%", minHeight: 40, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, padding: "8px 10px", marginBottom: 10, boxSizing: "border-box" }}
        />
      )}

      <textarea
        placeholder="Optional note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 12, padding: "8px 10px", marginBottom: 10, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handleSave} style={{ flex: 1, minHeight: 40, borderRadius: 8, border: "none", background: "var(--accent-teal)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
        <button type="button" onClick={onClose} style={{ minHeight: 40, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", padding: "0 16px" }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Comment Icon (for chart overlay) ──────────────────────────────────── */

export function CGMCommentIcon({ comment, onClick }: { comment: CGMComment; onClick?: () => void }) {
  const opt = COMMENT_OPTIONS.find((o) => o.value === comment.commentType);
  return (
    <span
      onClick={onClick}
      title={`${opt?.label}: ${comment.commentText || ""}`}
      style={{ cursor: "pointer", fontSize: 12, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: (opt?.color || "#94a3b8") + "22", border: `1px solid ${opt?.color || "#94a3b8"}44` }}
    >
      <span style={{ fontSize: 10 }}>{opt?.icon || "📝"}</span>
    </span>
  );
}

/* ─── CGM Verification Advisory (Mira) ──────────────────────────────────── */

export function CGMVerificationBanner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 8,
      background: "rgba(42,181,193,0.06)",
      border: "1px solid rgba(42,181,193,0.15)",
      fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "var(--accent-teal)", fontSize: 11, fontWeight: 700 }}>M</span>
      </span>
      <span>
        <strong style={{ color: "var(--text-primary)" }}>CGM readings are estimates.</strong>{" "}
        Always verify with a fingerstick when numbers don't match how you or your child feels.
        A fingerstick is the gold standard.
      </span>
    </div>
  );
}

/* ─── Hook: useCGMComments ──────────────────────────────────────────────── */

export function useCGMComments(profileId?: string) {
  const { session } = useAuth();
  const [comments, setComments] = useState<CGMComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (from: string, to: string) => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cgm-comments?from=${from}&to=${to}${profileId ? `&profileId=${profileId}` : ""}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.comments)) setComments(data.comments);
    } catch {}
    setLoading(false);
  }, [session, profileId]);

  const addComment = useCallback(async (comment: Omit<CGMComment, "id" | "excludeFromAnalysis">) => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/cgm-comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...comment, profileId }),
      });
      const data = await res.json();
      if (data.comment) setComments((prev) => [...prev, data.comment]);
    } catch {}
  }, [session, profileId]);

  const excludedCount = comments.filter((c) => c.excludeFromAnalysis).length;

  return { comments, loading, fetchComments, addComment, excludedCount };
}
