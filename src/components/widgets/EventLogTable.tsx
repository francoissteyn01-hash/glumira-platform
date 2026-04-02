/**
 * GluMira™ V7 — Event Log Table
 * Scrollable sortable table of today's entries.
 */

import { useState } from "react";

interface Entry {
  time: string;
  type: string;
  description: string;
  value?: string;
}

interface Props { entries: Entry[] }

export default function EventLogTable({ entries }: Props) {
  const [sortAsc, setSortAsc] = useState(true);
  const sorted = [...entries].sort((a, b) => sortAsc ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time));

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e9ecef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>Event Log</h3>
        <button onClick={() => setSortAsc(!sortAsc)} style={{ background: "none", border: "1px solid #dee2e6", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: "#52667a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {sortAsc ? "\u2191 Oldest first" : "\u2193 Newest first"}
        </button>
      </div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {sorted.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: "#94a3b8", textAlign: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>No events today</p>
        ) : sorted.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: i < sorted.length - 1 ? "1px solid #f1f3f5" : "none", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace", minWidth: 50 }}>
              {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#2ab5c1", textTransform: "uppercase", minWidth: 70, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{e.type}</span>
            <span style={{ flex: 1, fontSize: 12, color: "#52667a", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</span>
            {e.value && <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>{e.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
