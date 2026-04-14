/**
 * GluMira™ V7 — IOB Hunter v7 · Pharmacokinetic Reference Table
 *
 * Shows ONLY the insulins in the patient's regimen (not the whole
 * formulary). Each row includes brand name (colour-coded to match the
 * graph line), type, onset, peak, duration, and brief mechanism notes.
 *
 * Canonical rule: Tresiba displays peak as "—" (peakless) and mechanism
 * explicitly flags the flat-depot behaviour.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { InsulinDose, InsulinProfile } from "@/iob-hunter/types";

export type IOBHunterPharmaTableProps = {
  doses: InsulinDose[];
  profiles: readonly InsulinProfile[];
}

function formatMinutes(m: number | null): string {
  if (m == null) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

export default function IOBHunterPharmaTable({
  doses,
  profiles,
}: IOBHunterPharmaTableProps) {
  // Get unique insulins in the regimen, in alphabetical order
  const uniqueNames = Array.from(
    new Set(doses.map((d) => d.insulin_name.toLowerCase())),
  ).sort();

  const rows = uniqueNames
    .map((name) =>
      profiles.find((p) => p.brand_name.toLowerCase() === name) ?? null,
    )
    .filter((p): p is InsulinProfile => p !== null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 16,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-divider)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Pharmacokinetic reference
        </h3>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Published PK data per insulin type. Sources cited in the colophon.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <thead>
            <tr style={{ background: "var(--card-hover, #f8fafc)" }}>
              {["Insulin", "Type", "Onset", "Peak", "Duration", "Mechanism"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 14px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-faint)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid var(--border-divider)",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((profile, i) => {
              const peakLabel = profile.is_peakless
                ? "— (peakless)"
                : `${formatMinutes(profile.peak_start_minutes)}–${formatMinutes(profile.peak_end_minutes)}`;
              return (
                <tr
                  key={profile.brand_name}
                  style={{
                    borderBottom:
                      i < rows.length - 1
                        ? "1px solid var(--card-hover, #f1f5f9)"
                        : "none",
                  }}
                >
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: profile.colour,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          color: profile.colour,
                        }}
                      >
                        {profile.brand_name}
                      </span>
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {profile.category.replace("-", " ")}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {formatMinutes(profile.onset_minutes)}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {peakLabel}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {formatMinutes(profile.duration_minutes)}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      lineHeight: 1.4,
                      maxWidth: 360,
                    }}
                  >
                    {profile.mechanism_notes ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
