/**
 * GluMira™ V7 — Core Web Vitals Card
 *
 * Real Core Web Vitals captured in-browser using PerformanceObserver, no
 * external library. Shows LCP, CLS, INP (or FID), and TTFB with the official
 * Google thresholds (good / needs improvement / poor).
 *
 * Notes:
 *   - LCP: largest-contentful-paint observer
 *   - CLS: layout-shift observer (running sum, ignoring shifts during user input)
 *   - INP: event observer (long-task style approximation; falls back to FID
 *          first-input on browsers without event timing API)
 *   - TTFB: navigation timing's responseStart - requestStart
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";

type VitalRating = {
  good: number;
  needsImprovement: number;
}

const RATINGS: Record<string, VitalRating> = {
  LCP:  { good: 2500, needsImprovement: 4000 },
  CLS:  { good: 0.1,  needsImprovement: 0.25 },
  INP:  { good: 200,  needsImprovement: 500 },
  TTFB: { good: 800,  needsImprovement: 1800 },
};

type VitalsState = {
  lcp: number | null;
  cls: number;
  inp: number | null;
  ttfb: number | null;
}

function rateValue(metric: keyof typeof RATINGS, value: number | null) {
  if (value == null) return { label: "Pending", colour: "#94a3b8" };
  const r = RATINGS[metric];
  if (value <= r.good) return { label: "Good",              colour: "#22c55e" };
  if (value <= r.needsImprovement) return { label: "Needs work", colour: "#f59e0b" };
  return { label: "Poor", colour: "#ef4444" };
}

function formatValue(metric: keyof typeof RATINGS, value: number | null): string {
  if (value == null) return "—";
  if (metric === "CLS") return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

export default function CoreWebVitalsCard() {
  const [vitals, setVitals] = useState<VitalsState>({ lcp: null, cls: 0, inp: null, ttfb: null });

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const cleanups: Array<() => void> = [];

    // TTFB from navigation timing
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        const ttfb = nav.responseStart - nav.requestStart;
        if (Number.isFinite(ttfb) && ttfb >= 0) {
          setVitals((v) => ({ ...v, ttfb }));
        }
      }
    } catch { /* not supported */ }

    // LCP — observe largest-contentful-paint
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) setVitals((v) => ({ ...v, lcp: last.startTime }));
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      cleanups.push(() => lcpObs.disconnect());
    } catch { /* not supported */ }

    // CLS — observe layout-shift
    try {
      const clsObs = new PerformanceObserver((list) => {
        let delta = 0;
        for (const entry of list.getEntries()) {
          // hadRecentInput is on the layout-shift entry but not in TS lib types
          const ls = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!ls.hadRecentInput && typeof ls.value === "number") {
            delta += ls.value;
          }
        }
        if (delta > 0) setVitals((v) => ({ ...v, cls: v.cls + delta }));
      });
      clsObs.observe({ type: "layout-shift", buffered: true });
      cleanups.push(() => clsObs.disconnect());
    } catch { /* not supported */ }

    // INP / FID — observe event (or first-input fallback)
    try {
      const eventObs = new PerformanceObserver((list) => {
        let maxDuration = 0;
        for (const entry of list.getEntries()) {
          if (entry.duration > maxDuration) maxDuration = entry.duration;
        }
        if (maxDuration > 0) {
          setVitals((v) => ({ ...v, inp: Math.max(v.inp ?? 0, maxDuration) }));
        }
      });
      try {
        // durationThreshold is part of the event-timing API spec but not in
        // the lib.dom types yet, so we widen the cast.
        eventObs.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit & { durationThreshold?: number });
      } catch {
        eventObs.observe({ type: "first-input", buffered: true });
      }
      cleanups.push(() => eventObs.disconnect());
    } catch { /* not supported */ }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const rows: Array<{ key: keyof typeof RATINGS; label: string; value: number | null }> = [
    { key: "LCP",  label: "LCP",  value: vitals.lcp },
    { key: "CLS",  label: "CLS",  value: vitals.cls },
    { key: "INP",  label: "INP",  value: vitals.inp },
    { key: "TTFB", label: "TTFB", value: vitals.ttfb },
  ];

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 12,
      border: "1px solid var(--border-light)",
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
        }}>
          Core Web Vitals
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          THIS SESSION
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row) => {
          const rating = rateValue(row.key, row.value);
          return (
            <div key={row.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 8,
              background: rating.colour + "0F",
              borderLeft: `3px solid ${rating.colour}`,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--text-primary)",
              }}>
                {row.label}
              </span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--text-primary)",
                }}>
                  {formatValue(row.key, row.value)}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 0.4,
                  color: rating.colour,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>
                  {rating.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Measured live with PerformanceObserver · educational only
      </p>
    </div>
  );
}
