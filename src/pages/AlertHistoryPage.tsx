/**
 * GluMira™ V7 — Alert History Page
 *
 * Paginated, filterable list of past dismiss/snooze actions for the user.
 *
 * Source: GET /api/alerts/history?limit=&action=&type=
 * Logic:  server/routes/alerts.route.ts (uses shapeHistory from alerts-engine)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import { DISCLAIMER } from "@/lib/constants";

type ActionFilter = "" | "dismiss" | "snooze";
type TypeFilter = "" | "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast";

type HistoryEntry = {
  id: string;
  alertId: string;
  action: "dismiss" | "snooze";
  alertType: "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast" | "unknown";
  recordedAt: string;
  snoozedUntil: string | null;
}

type HistoryResponse = {
  ok: boolean;
  entries: HistoryEntry[];
  total: number;
  appliedFilters: { action: string | null; type: string | null; limit: number };
}

const TYPE_LABEL: Record<HistoryEntry["alertType"], string> = {
  hypo:         "Low glucose",
  hyper:        "High glucose",
  rising_fast:  "Rising fast",
  falling_fast: "Falling fast",
  stacking:     "Insulin stacking",
  unknown:      "Other",
};

const TYPE_COLOUR: Record<HistoryEntry["alertType"], string> = {
  hypo:         "#ef4444",
  hyper:        "#f59e0b",
  rising_fast:  "#f59e0b",
  falling_fast: "#f59e0b",
  stacking:     "#3b82f6",
  unknown:      "#94a3b8",
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  const days = Math.floor(mins / (60 * 24));
  return `${days}d ago`;
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AlertHistoryPage() {
  const { session } = useAuth();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [limit, setLimit] = useState<number>(50);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit));
    if (actionFilter) p.set("action", actionFilter);
    if (typeFilter)   p.set("type",   typeFilter);
    return p.toString();
  }, [actionFilter, typeFilter, limit]);

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/alerts/history?${queryString}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as HistoryResponse;
      setData(json);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [session, queryString]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* ─── Render ─────────────────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border-light)",
    overflow: "hidden",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}>
            Alert History
          </h1>
          <p style={{
            fontSize: 14, color: "var(--text-secondary)", margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            What you have dismissed or snoozed — review with your care team
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8,
          background: "var(--disclaimer-bg)",
          border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        {/* Filters */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}>
          <FilterSelect
            label="Action"
            value={actionFilter}
            onChange={(v) => setActionFilter(v as ActionFilter)}
            options={[
              { value: "",         label: "All actions" },
              { value: "dismiss",  label: "Dismissed" },
              { value: "snooze",   label: "Snoozed" },
            ]}
          />
          <FilterSelect
            label="Alert type"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
            options={[
              { value: "",             label: "All types" },
              { value: "hypo",         label: "Low glucose" },
              { value: "hyper",        label: "High glucose" },
              { value: "rising_fast",  label: "Rising fast" },
              { value: "falling_fast", label: "Falling fast" },
              { value: "stacking",     label: "Insulin stacking" },
            ]}
          />
          <FilterSelect
            label="Limit"
            value={String(limit)}
            onChange={(v) => setLimit(Number(v))}
            options={[
              { value: "25",  label: "25 entries" },
              { value: "50",  label: "50 entries" },
              { value: "100", label: "100 entries" },
              { value: "200", label: "200 entries" },
            ]}
          />
        </div>

        {/* Body */}
        {loading && !data && (
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Loading…
            </p>
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, padding: 20 }} role="alert">
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Unable to load alert history.
            </p>
          </div>
        )}

        {data && data.entries.length === 0 && (
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              No matching history entries.
            </p>
          </div>
        )}

        {data && data.entries.length > 0 && (
          <div style={cardStyle}>
            <div role="table" aria-label="Alert history" style={{ display: "flex", flexDirection: "column" }}>
              {/* Table header */}
              <div role="row" style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr",
                gap: 12,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border-divider)",
                background: "var(--card-hover, #f8fafc)",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                <span role="columnheader">Alert</span>
                <span role="columnheader">Action</span>
                <span role="columnheader">When</span>
                <span role="columnheader">Notes</span>
              </div>

              {/* Rows */}
              {data.entries.map((entry, i) => {
                const colour = TYPE_COLOUR[entry.alertType];
                const label  = TYPE_LABEL[entry.alertType];
                const isLast = i === data.entries.length - 1;
                return (
                  <div role="row" key={entry.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: isLast ? "none" : "1px solid var(--card-hover, #f1f5f9)",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    alignItems: "center",
                  }}>
                    <span role="cell" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 999,
                        background: colour, flexShrink: 0,
                      }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {label}
                      </span>
                    </span>
                    <span role="cell" style={{
                      fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: 0.4,
                      color: entry.action === "dismiss" ? "#ef4444" : "#3b82f6",
                    }}>
                      {entry.action}
                    </span>
                    <span role="cell" title={formatAbsolute(entry.recordedAt)} style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {formatRelative(entry.recordedAt)}
                    </span>
                    <span role="cell" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      {entry.snoozedUntil ? `until ${formatAbsolute(entry.snoozedUntil)}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border-divider)",
              fontSize: 11,
              color: "var(--text-faint)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              textAlign: "right",
            }}>
              {data.total} entries · limit {data.appliedFilters.limit}
            </div>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

/* ─── Internal sub-component ─────────────────────────────────────────────── */
function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          minHeight: 36,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--border-light)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: 13,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
