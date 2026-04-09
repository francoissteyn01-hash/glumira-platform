/**
 * GluMira™ V7 — Insulin Density Heatmap
 *
 * Renders a grid: rows = individual insulin entries, columns = hours 0–23.
 * Cell colour intensity = IOB at that hour. Bottom row = combined total.
 * Highlight zone marks the danger window.
 */

import React from "react";
import type { HeatmapData } from "@/utils/insulinDensity";

interface HighlightZone {
  startHour: number;
  endHour: number;
  label: string;
}

interface InsulinDensityHeatmapProps {
  data: HeatmapData;
  highlightZone?: HighlightZone;
}

/** Map 0–1 ratio to a green→yellow→orange→red colour ramp */
function heatColor(ratio: number): string {
  if (ratio <= 0) return "transparent";
  const clamped = Math.min(Math.max(ratio, 0), 1);

  const stops = [
    { at: 0, r: 76, g: 175, b: 80 },
    { at: 0.33, r: 255, g: 193, b: 7 },
    { at: 0.66, r: 255, g: 152, b: 0 },
    { at: 1.0, r: 244, g: 67, b: 54 },
  ];

  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const range = hi.at - lo.at || 1;
  const t = (clamped - lo.at) / range;
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  const alpha = Math.min(clamped * 1.2 + 0.15, 1);

  return `rgba(${r},${g},${b},${alpha})`;
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export default function InsulinDensityHeatmap({
  data,
  highlightZone,
}: InsulinDensityHeatmapProps) {
  const { rows, combinedHourly, maxIOB } = data;

  return (
    <div className="rounded-xl bg-white p-6 shadow-md mb-6">
      <h3 className="text-lg font-semibold text-[#3D5A80] mb-1">
        Insulin Density Heatmap
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Colour intensity = insulin-on-board per hour. Red = highest stacking
        risk.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-36 px-2 py-1 text-left text-gray-500 font-medium">
                Insulin
              </th>
              {Array.from({ length: 24 }, (_, h) => (
                <th
                  key={h}
                  className={`px-1 py-1 text-center font-medium ${
                    highlightZone &&
                    h >= highlightZone.startHour &&
                    h < highlightZone.endHour
                      ? "text-red-700"
                      : "text-gray-500"
                  }`}
                >
                  {formatHour(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.entryId}>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className="font-semibold text-[#3D5A80]">
                    {row.insulinName}
                  </span>
                  <span className="ml-1 text-gray-400">
                    {row.dose}U @ {row.time}
                  </span>
                </td>
                {row.hourlyIOB.map((iob, h) => {
                  const ratio = maxIOB > 0 ? iob / maxIOB : 0;
                  const inZone =
                    highlightZone &&
                    h >= highlightZone.startHour &&
                    h < highlightZone.endHour;
                  return (
                    <td
                      key={h}
                      className={`px-1 py-1.5 text-center ${
                        inZone ? "ring-2 ring-red-400 ring-inset" : ""
                      }`}
                      style={{ backgroundColor: heatColor(ratio) }}
                      title={`${iob}U IOB`}
                    >
                      {iob > 0 ? iob.toFixed(1) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Combined row */}
            <tr className="border-t-2 border-gray-300 font-semibold">
              <td className="px-2 py-1.5 text-[#3D5A80]">Combined</td>
              {combinedHourly.map((iob, h) => {
                const ratio = maxIOB > 0 ? iob / maxIOB : 0;
                const inZone =
                  highlightZone &&
                  h >= highlightZone.startHour &&
                  h < highlightZone.endHour;
                return (
                  <td
                    key={h}
                    className={`px-1 py-1.5 text-center ${
                      inZone ? "ring-2 ring-red-500 ring-inset" : ""
                    }`}
                    style={{ backgroundColor: heatColor(ratio) }}
                    title={`${iob}U combined IOB`}
                  >
                    {iob > 0 ? iob.toFixed(1) : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {highlightZone && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-700">
          <span className="text-base">⚠️</span>
          <span>
            Danger window: <strong>{highlightZone.label}</strong> — multiple
            insulin curves overlap, increasing hypo risk.
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span>Intensity:</span>
        <div className="flex gap-1">
          {[0.1, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <div
              key={v}
              className="h-4 w-8 rounded"
              style={{ backgroundColor: heatColor(v) }}
              title={`${Math.round(v * 100)}%`}
            />
          ))}
        </div>
        <span>Low → High IOB</span>
      </div>
    </div>
  );
}
