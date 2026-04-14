/**
 * GluMira™ V7 — IOB Hunter v7 · Pressure Map Chart (Chart.js)
 *
 * The 24-hour insulin pressure map. Replaces the legacy Recharts mountain
 * graph with the canonical Chart.js design from the v7 spec.
 *
 * Graph colours (LOCKED — NOT the brand palette):
 *   - Light IOB (<25% of peak):    #D4C960 / #FFFACD  (pale yellow)
 *   - Moderate IOB (25-50%):       #FFD700            (gold)
 *   - Strong IOB (50-75%):         #FF8C00            (orange)
 *   - Overlap IOB (>75%):          #E84040            (red)
 *   - Basal band fill:             #5B8FD4 @ 9% alpha
 *   - What-if overlay:             #2E9E5A dashed
 *   - Stacking risk zone:          rgba(232,64,64,0.06) fill + dashed border
 *
 * Locked rules enforced:
 *   - Segment colour based on value, not single-colour
 *   - Injection markers rendered via custom plugin (NOT annotation plugin)
 *     as full-height coloured dashed lines with rotated -90° text labels
 *     that sit in the whitespace above the curve data (y=16..20)
 *   - Never start at 0 IOB — the hook passes cycles=2 by default so
 *     prior-day residual is already in the curve points
 *   - Mobile-first layout — chart resizes via ResponsiveContainer equivalent
 *     (Chart.js responsive:true + maintainAspectRatio:false in a sized div)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useRef, type RefObject } from "react";
import {
  Chart,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type ChartDataset,
  type Plugin,
  type ScriptableContext,
  type ScriptableLineSegmentContext,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import type {
  InjectionMarker,
  IOBCurvePoint,
  StackingAlert,
} from "@/iob-hunter";

/* ─── Register Chart.js modules once per browser session ─────────────── */
Chart.register(
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  annotationPlugin,
);

/* ─── Locked graph palette ───────────────────────────────────────────── */
const COLOUR = {
  light:    "#D4C960",
  moderate: "#FFD700",
  strong:   "#FF8C00",
  overlap:  "#E84040",
  basal:    "#5B8FD4",
  whatIf:   "#2E9E5A",
  stackZoneFill:   "rgba(232,64,64,0.06)",
  stackZoneBorder: "rgba(232,64,64,0.35)",
  gridLine:  "rgba(148,163,184,0.15)",
  axis:      "#94A3B8",
  labelText: "#1E293B",
} as const;

function segmentColourForValue(value: number, max: number): string {
  if (max <= 0) return COLOUR.light;
  const ratio = value / max;
  if (ratio >= 0.75) return COLOUR.overlap;
  if (ratio >= 0.5)  return COLOUR.strong;
  if (ratio >= 0.25) return COLOUR.moderate;
  return COLOUR.light;
}

/* ─── Custom plugin: injection markers with rotated labels ───────────── */
/*
 * Draws a full-height dashed coloured line at each injection hour, plus
 * a rotated -90° text label positioned in the whitespace above the curve
 * data. This cannot be done cleanly with the annotation plugin alone —
 * label orientation hacks in that plugin break on mobile.
 */
/**
 * Plugin factory that reads markers + visibility from refs. This lets the
 * parent component mutate markers without destroying and re-creating the
 * Chart.js instance on every prop change — which is the root cause of
 * the flicker/blank-frame bug the founder reported.
 */
function makeInjectionMarkerPlugin(
  markersRef: RefObject<InjectionMarker[]>,
  showRef: RefObject<boolean>,
  labelZoneTop: number = 0.15,  // top 15% of the chart area is label territory
): Plugin<"line"> {
  return {
    id: "iob-hunter-injection-markers",
    afterDatasetsDraw(chart) {
      if (!showRef.current) return;
      const markers = markersRef.current ?? [];
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;
      const xScale = scales.x;

      ctx.save();

      for (const marker of markers) {
        const x = xScale.getPixelForValue(marker.hour);
        if (x < chartArea.left || x > chartArea.right) continue;

        // Dashed vertical line — full chart height
        ctx.strokeStyle = marker.colour;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotated label in the top label-zone band
        const labelY = chartArea.top + (chartArea.bottom - chartArea.top) * labelZoneTop;
        ctx.save();
        ctx.translate(x + 6, labelY + 80);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = marker.colour;
        ctx.font = "500 9px 'DM Sans', system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(marker.label, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    },
  };
}

/* ─── Component props ────────────────────────────────────────────────── */
export type IOBHunterChartProps = {
  /** Primary 24h curve (always shown). */
  curve: IOBCurvePoint[];
  /** Injection markers for the custom plugin. */
  markers: InjectionMarker[];
  /** Optional basal-only curve to render as a faded blue band. */
  basalCurve?: IOBCurvePoint[];
  /** Optional what-if modified curve to overlay as a green dashed line. */
  whatIfCurve?: IOBCurvePoint[];
  /** Stacking risk windows to highlight with a red box annotation. */
  stackingAlerts?: StackingAlert[];
  /** Peak value from the primary curve (for Y-axis ceiling + segment colour). */
  maxIOB: number;
  /** Show/hide toggles. */
  showBasalBand?: boolean;
  showWhatIf?: boolean;
  showInjectionMarkers?: boolean;
  /** Fixed pixel height (chart is responsive in width). */
  height?: number;
}

/**
 * Pure config builder. Given props, returns a ChartConfiguration that
 * reflects the current state of the chart. Used on mount (first render)
 * and on every prop change (update-in-place). Does NOT include the
 * injection-marker plugin — that is attached once at mount and reads
 * fresh markers from a ref.
 */
function buildConfig(args: {
  curve: IOBCurvePoint[];
  basalCurve?: IOBCurvePoint[];
  whatIfCurve?: IOBCurvePoint[];
  stackingAlerts: StackingAlert[];
  maxIOB: number;
  showBasalBand: boolean;
  showWhatIf: boolean;
}): ChartConfiguration<"line"> {
  const {
    curve, basalCurve, whatIfCurve, stackingAlerts,
    maxIOB, showBasalBand, showWhatIf,
  } = args;

  const labels = curve.map((p) => p.time_label);
    const primaryData = curve.map((p) => p.total_iob);
    const yMax = Math.max(21, Math.ceil(maxIOB * 1.25));

    /* ─── Segment-coloured primary dataset ───────────────────────── */
    const primaryDataset: ChartDataset<"line", number[]> = {
      label: "IOB (combined)",
      data: primaryData,
      borderColor: (ctx: ScriptableContext<"line">) => {
        const value = (ctx.parsed?.y ?? 0) as number;
        return segmentColourForValue(value, maxIOB);
      },
      backgroundColor: (ctx: ScriptableContext<"line">) => {
        const value = (ctx.parsed?.y ?? 0) as number;
        return segmentColourForValue(value, maxIOB) + "1A"; // ~10% alpha
      },
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
      segment: {
        borderColor: (ctx: ScriptableLineSegmentContext) => {
          const y0 = (ctx.p0.parsed.y ?? 0) as number;
          const y1 = (ctx.p1.parsed.y ?? 0) as number;
          const avg = (y0 + y1) / 2;
          return segmentColourForValue(avg, maxIOB);
        },
      },
    };

    const datasets: ChartDataset<"line", number[]>[] = [primaryDataset];

    /* ─── Optional basal coverage band ───────────────────────────── */
    if (showBasalBand && basalCurve && basalCurve.length > 0) {
      datasets.push({
        label: "Basal coverage",
        data: basalCurve.map((p) => p.total_iob),
        borderColor: COLOUR.basal,
        backgroundColor: COLOUR.basal + "17", // 9% alpha
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      });
    }

    /* ─── Optional what-if overlay ───────────────────────────────── */
    if (showWhatIf && whatIfCurve && whatIfCurve.length > 0) {
      datasets.push({
        label: "What-if",
        data: whatIfCurve.map((p) => p.total_iob),
        borderColor: COLOUR.whatIf,
        backgroundColor: "transparent",
        borderWidth: 2.5,
        borderDash: [8, 4],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      });
    }

    /* ─── Stacking-risk zone annotations ─────────────────────────── */
    // Type for the annotation plugin's annotations bag is complex; using
    // a plain record here and letting the plugin config consume it via
    // a structural-type cast below.
    const boxAnnotations: Record<string, Record<string, unknown>> = {};
    stackingAlerts.forEach((alert, i) => {
      boxAnnotations[`stack-${i}`] = {
        type: "box",
        xScaleID: "x",
        yScaleID: "y",
        xMin: alert.start_hour * (curve.length - 1) / 24,
        xMax: alert.end_hour * (curve.length - 1) / 24,
        backgroundColor: COLOUR.stackZoneFill,
        borderColor: COLOUR.stackZoneBorder,
        borderWidth: 0.5,
        borderDash: [4, 4],
        label: {
          display: true,
          content: "Stacking risk zone",
          position: "start",
          color: COLOUR.overlap,
          font: { size: 9, family: "'DM Sans', system-ui, sans-serif" },
          backgroundColor: "transparent",
        },
      };
    });

    /* ─── Build config ────────────────────────────────────────────── */
    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            type: "category",
            ticks: {
              autoSkip: true,
              maxTicksLimit: 13,
              color: COLOUR.axis,
              font: { size: 10, family: "'JetBrains Mono', monospace" },
            },
            grid: { color: COLOUR.gridLine },
          },
          y: {
            type: "linear",
            beginAtZero: true,
            min: 0,
            max: yMax,
            title: {
              display: true,
              text: "IOB (pressure units)",
              color: COLOUR.axis,
              font: { size: 11, family: "'DM Sans', system-ui, sans-serif" },
            },
            ticks: {
              color: COLOUR.axis,
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              callback: (value) => `${value}U`,
            },
            grid: { color: COLOUR.gridLine },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#FFFFFF",
            titleColor: COLOUR.labelText,
            bodyColor: COLOUR.labelText,
            borderColor: COLOUR.gridLine,
            borderWidth: 1,
            padding: 10,
            titleFont: { family: "'DM Sans', system-ui, sans-serif", weight: 600 },
            bodyFont: { family: "'DM Sans', system-ui, sans-serif" },
            callbacks: {
              label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(2)}U`,
            },
          },
          annotation: {
            // Annotation plugin types are strict; the structural cast is
            // necessary because our keys are dynamic per stacking alert.
            annotations: boxAnnotations as unknown as Record<string, never>,
          },
        },
      },
  };
  return config;
}


/* ─── Main component ─────────────────────────────────────────────────── */
export default function IOBHunterChart({
  curve,
  markers,
  basalCurve,
  whatIfCurve,
  stackingAlerts = [],
  maxIOB,
  showBasalBand = true,
  showWhatIf = true,
  showInjectionMarkers = true,
  height = 380,
}: IOBHunterChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  // Refs the marker plugin reads on every frame. Keeping markers behind
  // refs means changing them does NOT require destroying the chart.
  const markersRef = useRef<InjectionMarker[]>(markers);
  const showMarkersRef = useRef<boolean>(showInjectionMarkers);
  markersRef.current = markers;
  showMarkersRef.current = showInjectionMarkers;

  /* Effect A — mount only. Create the chart once. */
  useEffect(() => {
    if (!canvasRef.current) return;

    const config = buildConfig({
      curve, basalCurve, whatIfCurve, stackingAlerts,
      maxIOB, showBasalBand, showWhatIf,
    });
    config.plugins = [makeInjectionMarkerPlugin(markersRef, showMarkersRef)];

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Intentional: mount-once effect. Prop changes are handled by Effect B,
    // which mutates chart.data / chart.options in place instead of destroying.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip Effect B's first run — Effect A already created the chart with
  // the right config, so calling update() immediately would be wasted work.
  const isInitialMount = useRef(true);

  /* Effect B — on prop changes, update the chart in place. No destroy. */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const chart = chartRef.current;
    if (!chart) return;

    const next = buildConfig({
      curve, basalCurve, whatIfCurve, stackingAlerts,
      maxIOB, showBasalBand, showWhatIf,
    });
    chart.data = next.data;
    if (next.options) chart.options = next.options;
    chart.update("none");
  }, [curve, basalCurve, whatIfCurve, stackingAlerts, maxIOB, showBasalBand, showWhatIf]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-light)",
        padding: "clamp(12px, 3vw, 20px)",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
