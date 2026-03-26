import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";

export interface IOBChartData {
  time: number; // minutes
  iob: number; // units
  percentage: number; // % of original dose
}

export interface IOBChartProps {
  data: IOBChartData[];
  title?: string;
  showPercentage?: boolean;
  height?: number;
}

/**
 * IOB Timeline Chart Component
 * Visualizes insulin on-board (IOB) decay curve over time
 * 
 * Stage 2 — Visualisation: Interactive charts for insulin behavior
 */
export function IOBChart({
  data,
  title = "Insulin On Board (IOB) Timeline",
  showPercentage = false,
  height = 300,
}: IOBChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No IOB data available
        </div>
      </Card>
    );
  }

  // Format data for display
  const chartData = data.map((point) => ({
    time: point.time,
    iob: Math.round(point.iob * 100) / 100,
    percentage: Math.round(point.percentage * 10) / 10,
    timeLabel: `${Math.floor(point.time / 60)}h ${point.time % 60}m`,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="iobGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ab5c1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#2ab5c1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis
            dataKey="timeLabel"
            stroke="#64748b"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            label={{ value: "IOB (units)", angle: -90, position: "insideLeft" }}
            stroke="#64748b"
            style={{ fontSize: "12px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e0e7ff",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "iob") {
                return [value.toFixed(3), "IOB (units)"];
              }
              return [value.toFixed(1), "Percentage (%)"];
            }}
          />
          <Area
            type="monotone"
            dataKey="iob"
            stroke="#2ab5c1"
            fill="url(#iobGradient)"
            strokeWidth={2}
            dot={false}
            name="IOB"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong>Peak IOB:</strong> {Math.max(...chartData.map((d) => d.iob)).toFixed(3)} units
        </p>
        <p>
          <strong>Duration:</strong> {Math.max(...chartData.map((d) => d.time))} minutes
        </p>
      </div>
    </Card>
  );
}

/**
 * Basal vs. Bolus Breakdown Chart
 * Visualizes the composition of IOB from different insulin types
 */
export interface IOBBreakdownProps {
  bolusIOB: number;
  basalIOB: number;
  totalIOB: number;
}

export function IOBBreakdown({ bolusIOB, basalIOB, totalIOB }: IOBBreakdownProps) {
  const bolusPercentage = totalIOB > 0 ? (bolusIOB / totalIOB) * 100 : 0;
  const basalPercentage = totalIOB > 0 ? (basalIOB / totalIOB) * 100 : 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-primary mb-4">IOB Breakdown</h3>
      <div className="space-y-4">
        {/* Total IOB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">Total IOB</span>
            <span className="text-2xl font-bold text-primary">{totalIOB.toFixed(3)} U</span>
          </div>
        </div>

        {/* Bolus IOB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">Bolus IOB</span>
            <span className="text-lg font-semibold text-secondary">{bolusIOB.toFixed(3)} U</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${bolusPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{bolusPercentage.toFixed(1)}% of total</p>
        </div>

        {/* Basal IOB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">Basal IOB</span>
            <span className="text-lg font-semibold text-accent">{basalIOB.toFixed(3)} U</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${basalPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{basalPercentage.toFixed(1)}% of total</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Insulin Stacking Indicator
 * Shows how much IOB is from recent vs. older doses
 */
export interface StackingIndicatorProps {
  recentStacking: number; // % from last 2 hours
  moderateStacking: number; // % from 2-4 hours ago
  elderlyStacking: number; // % from 4+ hours ago
}

export function StackingIndicator({
  recentStacking,
  moderateStacking,
  elderlyStacking,
}: StackingIndicatorProps) {
  const getStackingLevel = () => {
    if (recentStacking > 60) return "High";
    if (recentStacking > 30) return "Moderate";
    return "Low";
  };

  const getStackingColor = () => {
    if (recentStacking > 60) return "text-red-600";
    if (recentStacking > 30) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-primary mb-4">Insulin Stacking</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Stacking Level</span>
          <span className={`text-lg font-bold ${getStackingColor()}`}>{getStackingLevel()}</span>
        </div>

        <div className="space-y-3">
          {/* Recent (0-2 hours) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-foreground">Recent (0-2h)</span>
              <span className="text-sm font-semibold text-secondary">{recentStacking.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${recentStacking}%` }}
              />
            </div>
          </div>

          {/* Moderate (2-4 hours) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-foreground">Moderate (2-4h)</span>
              <span className="text-sm font-semibold text-accent">{moderateStacking.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${moderateStacking}%` }}
              />
            </div>
          </div>

          {/* Elderly (4+ hours) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-foreground">Elderly (4+h)</span>
              <span className="text-sm font-semibold text-muted-foreground">{elderlyStacking.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-muted h-2 rounded-full transition-all duration-300"
                style={{ width: `${elderlyStacking}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-sky-pale rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> High stacking indicates recent insulin doses are still active. Monitor for hypoglycemia risk.
          </p>
        </div>
      </div>
    </Card>
  );
}
