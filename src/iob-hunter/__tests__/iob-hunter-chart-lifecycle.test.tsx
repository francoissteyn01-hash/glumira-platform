// @vitest-environment jsdom

/**
 * GluMira™ V7 — IOBHunterChart lifecycle regression test
 *
 * Locks in the fix for the "inconsistent IOB graph render" bug:
 * the chart must NOT be destroyed and re-created when its data prop
 * changes. Doing so caused the flicker / blank-frame symptom the
 * founder reported as a go/no-go blocker before launch.
 *
 * Strategy: mock chart.js so we can observe Chart constructor calls,
 * chart.update calls, and chart.destroy calls without needing a real
 * canvas. Render <IOBHunterChart> twice with different data, then on
 * unmount, and assert the lifecycle is mount→update→destroy — never
 * mount→destroy→mount→destroy.
 *
 * If this test ever fails, the regression has returned. Do not delete
 * the split-effect pattern in IOBHunterChart.tsx without a replacement.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { IOBCurvePoint, InjectionMarker } from "@/iob-hunter";

/* ─── Mock chart.js BEFORE importing the component ─────────────────── */

const constructorSpy = vi.fn();
const updateSpy = vi.fn();
const destroySpy = vi.fn();

vi.mock("chart.js", async () => {
  const actual = await vi.importActual<typeof import("chart.js")>("chart.js");
  // Fake Chart class — records every call but does no real rendering.
  class FakeChart {
    public data: unknown;
    public options: unknown;
    constructor(_canvas: HTMLCanvasElement, config: { data: unknown; options: unknown }) {
      constructorSpy(config);
      this.data = config.data;
      this.options = config.options;
    }
    update(_mode?: string) {
      updateSpy(_mode);
    }
    destroy() {
      destroySpy();
    }
  }
  // Static `register` is a no-op for the mock.
  (FakeChart as unknown as { register: () => void }).register = () => {};
  return { ...actual, Chart: FakeChart };
});

vi.mock("chartjs-plugin-annotation", () => ({ default: {} }));

// Component must be imported AFTER vi.mock above is registered.
const IOBHunterChartImport = await import("@/iob-hunter/components/IOBHunterChart");
const IOBHunterChart = IOBHunterChartImport.default;

/* ─── Fixtures ─────────────────────────────────────────────────────── */

function makeCurve(seed: number): IOBCurvePoint[] {
  const pts: IOBCurvePoint[] = [];
  for (let h = 0; h <= 24; h += 0.25) {
    pts.push({
      hours: h,
      time_label: `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h - Math.floor(h)) * 60)).padStart(2, "0")}`,
      total_iob: Math.max(0, Math.sin((h + seed) / 4) * 5 + 4),
      breakdown: {},
    });
  }
  return pts;
}

const MARKERS: InjectionMarker[] = [
  { hour: 8,  label: "Fiasp 2U",    colour: "#FF8C00", dose_id: "d1", dose_type: "bolus" },
  { hour: 13, label: "Actrapid 3U", colour: "#5B8FD4", dose_id: "d2", dose_type: "bolus" },
];

/* ─── Tests ────────────────────────────────────────────────────────── */

describe("IOBHunterChart — lifecycle regression", () => {
  beforeEach(() => {
    // Cleanup BEFORE clearing spies — otherwise unmounts from prior tests
    // increment destroy counts that the new test then asserts against.
    cleanup();
    constructorSpy.mockClear();
    updateSpy.mockClear();
    destroySpy.mockClear();
  });

  test("creates the Chart exactly once on mount (no double-mount in StrictMode-style remount)", () => {
    const curve = makeCurve(0);
    render(
      <IOBHunterChart curve={curve} markers={MARKERS} maxIOB={9} />,
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(destroySpy).not.toHaveBeenCalled();
  });

  test("re-rendering with different curve data updates in place — does NOT destroy + re-create the chart", () => {
    const { rerender } = render(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} />,
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);

    rerender(<IOBHunterChart curve={makeCurve(1)} markers={MARKERS} maxIOB={9} />);
    rerender(<IOBHunterChart curve={makeCurve(2)} markers={MARKERS} maxIOB={9} />);
    rerender(<IOBHunterChart curve={makeCurve(3)} markers={MARKERS} maxIOB={9} />);

    // Critical assertion: still ONE Chart instance across 4 renders.
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    // chart.update should have been called for each prop change.
    expect(updateSpy).toHaveBeenCalledTimes(3);
    // No destroy until unmount.
    expect(destroySpy).not.toHaveBeenCalled();
  });

  test("changing markers does NOT trigger a chart rebuild — markers flow through refs", () => {
    const { rerender } = render(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} />,
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);

    rerender(
      <IOBHunterChart
        curve={makeCurve(0)}
        markers={[{ hour: 9, label: "New", colour: "#000", dose_id: "d3", dose_type: "basal_injection" }]}
        maxIOB={9}
      />,
    );

    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(destroySpy).not.toHaveBeenCalled();
  });

  test("toggling showInjectionMarkers does NOT trigger a chart rebuild", () => {
    const { rerender } = render(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} showInjectionMarkers={true} />,
    );
    rerender(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} showInjectionMarkers={false} />,
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(destroySpy).not.toHaveBeenCalled();
  });

  test("destroys the chart exactly once on unmount", () => {
    const { unmount } = render(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} />,
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    unmount();
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  test("buildConfig is called for every prop change (update path stays warm)", () => {
    const { rerender } = render(
      <IOBHunterChart curve={makeCurve(0)} markers={MARKERS} maxIOB={9} />,
    );

    // 5 prop changes → 5 chart.update calls
    for (let i = 1; i <= 5; i++) {
      rerender(<IOBHunterChart curve={makeCurve(i)} markers={MARKERS} maxIOB={9} />);
    }

    expect(updateSpy).toHaveBeenCalledTimes(5);
    // All updates use 'none' (no animation) so they don't visually flicker.
    for (const call of updateSpy.mock.calls) {
      expect(call[0]).toBe("none");
    }
  });
});
