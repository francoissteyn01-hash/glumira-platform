import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";

export interface GlucoseDataPoint {
  timestamp: Date;
  glucoseValue: number;
  glucoseUnit: "mg/dL" | "mmol/L";
  readingType: "cgm" | "fingerstick" | "manual";
}

export interface GlucoseTrendChartProps {
  data: GlucoseDataPoint[];
  targetMin?: number;
  targetMax?: number;
  title?: string;
  height?: number;
}

/**
 * Glucose Trend Chart Component
 * Visualizes glucose readings over time with target range
 * 
 * Stage 2 — Visualisation: Interactive glucose trend visualization
 */
export function GlucoseTrendChart({
  data,
  targetMin = 80,
  targetMax = 180,
  title = "Glucose Trend",
  height = 300,
}: GlucoseTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No glucose data available
        </div>
      </Card>
    );
  }

  // Format data for display
  const chartData = data
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((point) => ({
      timestamp: point.timestamp.getTime(),
      glucose: point.glucoseValue,
      timeLabel: point.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      readingType: point.readingType,
    }));

  // Calculate statistics
  const glucoseValues = chartData.map((d) => d.glucose);
  const avgGlucose = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;
  const minGlucose = Math.min(...glucoseValues);
  const maxGlucose = Math.max(...glucoseValues);
  const timeInRange = glucoseValues.filter((g) => g >= targetMin && g <= targetMax).length / glucoseValues.length * 100;

  // Determine reading type colors
  const getReadingColor = (readingType: string) => {
    switch (readingType) {
      case "cgm":
        return "#2ab5c1"; // teal
      case "fingerstick":
        return "#f59e0b"; // amber
      case "manual":
        return "#64748b"; // slate
      default:
        return "#1a2a5e"; // navy
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a2a5e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1a2a5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis
            dataKey="timeLabel"
            stroke="#64748b"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            label={{ value: "Glucose (mg/dL)", angle: -90, position: "insideLeft" }}
            stroke="#64748b"
            style={{ fontSize: "12px" }}
          />

          {/* Target range reference lines */}
          <ReferenceLine
            y={targetMax}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: `Target Max: ${targetMax}`, position: "right", fill: "#f59e0b", fontSize: 12 }}
          />
          <ReferenceLine
            y={targetMin}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: `Target Min: ${targetMin}`, position: "right", fill: "#f59e0b", fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e0e7ff",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "glucose") {
                return [value.toFixed(0), "Glucose (mg/dL)"];
              }
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="glucose"
            stroke="#1a2a5e"
            fill="url(#glucoseGradient)"
            strokeWidth={2}
            dot={false}
            name="Glucose"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="text-lg font-bold text-primary">{avgGlucose.toFixed(0)} mg/dL</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Min</p>
          <p className="text-lg font-bold text-primary">{minGlucose.toFixed(0)} mg/dL</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Max</p>
          <p className="text-lg font-bold text-primary">{maxGlucose.toFixed(0)} mg/dL</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">In Range</p>
          <p className="text-lg font-bold text-secondary">{timeInRange.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Glucose Statistics Summary
 * Displays key metrics from glucose data
 */
export interface GlucoseStatisticsProps {
  data: GlucoseDataPoint[];
  targetMin?: number;
  targetMax?: number;
}

export function GlucoseStatistics({
  data,
  targetMin = 80,
  targetMax = 180,
}: GlucoseStatisticsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-primary mb-4">Glucose Statistics</h3>
        <p className="text-muted-foreground">No data available</p>
      </Card>
    );
  }

  const glucoseValues = data.map((d) => d.glucoseValue);
  const avgGlucose = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;
  const minGlucose = Math.min(...glucoseValues);
  const maxGlucose = Math.max(...glucoseValues);
  const timeInRange = glucoseValues.filter((g) => g >= targetMin && g <= targetMax).length / glucoseValues.length * 100;
  const timeHigh = glucoseValues.filter((g) => g > targetMax).length / glucoseValues.length * 100;
  const timeLow = glucoseValues.filter((g) => g < targetMin).length / glucoseValues.length * 100;

  // Calculate standard deviation
  const variance = glucoseValues.reduce((sum, val) => sum + Math.pow(val - avgGlucose, 2), 0) / glucoseValues.length;
  const stdDev = Math.sqrt(variance);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-primary mb-4">Glucose Statistics</h3>
      <div className="space-y-4">
        {/* Time in Range */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-muted-foreground">Time in Range ({targetMin}-{targetMax} mg/dL)</p>
          <p className="text-2xl font-bold text-green-600">{timeInRange.toFixed(1)}%</p>
        </div>

        {/* Time High */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-muted-foreground">Time Above Range (&gt;{targetMax} mg/dL)</p>
          <p className="text-2xl font-bold text-red-600">{timeHigh.toFixed(1)}%</p>
        </div>

        {/* Time Low */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-muted-foreground">Time Below Range (&lt;{targetMin} mg/dL)</p>
          <p className="text-2xl font-bold text-yellow-600">{timeLow.toFixed(1)}%</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-bold text-primary">{avgGlucose.toFixed(0)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Std Dev</p>
            <p className="text-lg font-bold text-primary">{stdDev.toFixed(0)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="text-lg font-bold text-primary">{minGlucose.toFixed(0)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-lg font-bold text-primary">{maxGlucose.toFixed(0)}</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-sky-pale rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>HbA1c Estimate:</strong> Based on average glucose of {avgGlucose.toFixed(0)} mg/dL, estimated HbA1c is approximately {(avgGlucose * 0.0305 - 0.86).toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
