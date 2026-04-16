export type PressureLevel = "light" | "moderate" | "strong" | "overlap";

export type DensityPoint = {
  timeHours: number;
  iobTotal: number;
  pressure: PressureLevel;
  perInsulin: Record<string, number>;
};

export type DensityRiskZone = {
  start: number;
  end: number;
  pressure: PressureLevel;
};

export type DensityMap = {
  points: DensityPoint[];
  peakTime: number;
  peakIOB: number;
  highestOverlapWindow: { start: number; end: number };
  riskZones: DensityRiskZone[];
};

function classifyPressure(iobTotal: number, basalDose: number): PressureLevel {
  if (basalDose <= 0) return "light";
  const ratio = iobTotal / basalDose;
  if (ratio < 0.25) return "light";
  if (ratio < 0.5) return "moderate";
  if (ratio < 0.75) return "strong";
  return "overlap";
}

function identifyRiskZones(points: DensityPoint[]): DensityRiskZone[] {
  const zones: DensityRiskZone[] = [];
  let current: DensityRiskZone | null = null;
  for (const p of points) {
    if (!current || current.pressure !== p.pressure) {
      if (current) zones.push(current);
      current = { start: p.timeHours, end: p.timeHours, pressure: p.pressure };
    } else {
      current.end = p.timeHours;
    }
  }
  if (current) zones.push(current);
  return zones;
}

export function buildDensityMap(
  curve: Array<{ hours: number; total_iob: number; breakdown: Record<string, number> }>,
  typicalBasalDose: number,
): DensityMap {
  if (curve.length === 0) {
    return {
      points: [],
      peakTime: 0,
      peakIOB: 0,
      highestOverlapWindow: { start: 0, end: 0 },
      riskZones: [],
    };
  }

  const points: DensityPoint[] = curve.map((pt) => ({
    timeHours: pt.hours,
    iobTotal: pt.total_iob,
    pressure: classifyPressure(pt.total_iob, typicalBasalDose),
    perInsulin: { ...pt.breakdown },
  }));

  const peakPoint = points.reduce((max, p) =>
    p.iobTotal > max.iobTotal ? p : max,
  );

  const overlapPoints = points.filter(
    (p) => p.pressure === "overlap" || p.pressure === "strong",
  );
  const highestOverlapWindow =
    overlapPoints.length > 0
      ? {
          start: overlapPoints[0].timeHours,
          end: overlapPoints[overlapPoints.length - 1].timeHours,
        }
      : { start: 0, end: 0 };

  return {
    points,
    peakTime: peakPoint.timeHours,
    peakIOB: peakPoint.iobTotal,
    highestOverlapWindow,
    riskZones: identifyRiskZones(points),
  };
}
