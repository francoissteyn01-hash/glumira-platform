import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlucoseTrendChart, type GlucoseDataPoint } from "@/components/GlucoseTrendChart";
import { trpc } from "@/lib/trpc";
import { Plus, Droplets } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

/**
 * GluMira™ Glucose Tracking Page
 * Manual glucose entry + trend visualization
 */
export default function GlucosePage() {
  const { user } = useAuth();
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;

  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseUnit, setGlucoseUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");
  const [readingType, setReadingType] = useState<"cgm" | "fingerstick" | "manual">("manual");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const readingsQuery = trpc.glucose.getReadings.useQuery(
    { patientId: profile?.id ?? 0, limit: 200 },
    { enabled: !!profile }
  );

  const addReadingMutation = trpc.glucose.addReading.useMutation({
    onSuccess: () => {
      toast.success("Glucose reading saved");
      setGlucoseValue("");
      setNotes("");
      setShowForm(false);
      readingsQuery.refetch();
    },
    onError: (err) => {
      toast.error("Failed to save reading: " + err.message);
    },
  });

  const chartData: GlucoseDataPoint[] = useMemo(() => {
    if (!readingsQuery.data) return [];
    return readingsQuery.data.map((r) => ({
      timestamp: new Date(r.timestamp),
      glucoseValue: parseFloat(r.glucoseValue),
      glucoseUnit: r.glucoseUnit as "mg/dL" | "mmol/L",
      readingType: r.readingType as "cgm" | "fingerstick" | "manual",
    }));
  }, [readingsQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Please set up your profile first");
      return;
    }
    const value = parseFloat(glucoseValue);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid glucose value");
      return;
    }
    addReadingMutation.mutate({
      patientId: profile.id,
      glucoseValue: value,
      glucoseUnit,
      readingType,
      timestamp: new Date(),
      notes: notes || undefined,
    });
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl text-primary">Glucose Tracking</h1>
        <Card className="p-8 text-center">
          <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary mb-2">Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Set up your patient profile to start tracking glucose readings.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-primary">Glucose Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log readings and visualize your glucose trends
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="glum-btn-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Reading
        </Button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary mb-4">New Glucose Reading</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="glum-label">Glucose Value</label>
              <Input
                type="number"
                step="0.1"
                placeholder={glucoseUnit === "mg/dL" ? "e.g. 120" : "e.g. 6.7"}
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                className="glum-input"
                required
              />
            </div>
            <div>
              <label className="glum-label">Unit</label>
              <Select value={glucoseUnit} onValueChange={(v) => setGlucoseUnit(v as "mg/dL" | "mmol/L")}>
                <SelectTrigger className="glum-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg/dL">mg/dL</SelectItem>
                  <SelectItem value="mmol/L">mmol/L</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="glum-label">Reading Type</label>
              <Select value={readingType} onValueChange={(v) => setReadingType(v as "cgm" | "fingerstick" | "manual")}>
                <SelectTrigger className="glum-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="fingerstick">Fingerstick</SelectItem>
                  <SelectItem value="cgm">CGM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="glum-label">Notes (optional)</label>
              <Input
                placeholder="e.g. Before lunch"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glum-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
              <Button type="submit" className="glum-btn-primary" disabled={addReadingMutation.isPending}>
                {addReadingMutation.isPending ? "Saving..." : "Save Reading"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Glucose Trend Chart */}
      <GlucoseTrendChart
        data={chartData}
        targetMin={profile.targetGlucoseMin ? parseFloat(profile.targetGlucoseMin) : 80}
        targetMax={profile.targetGlucoseMax ? parseFloat(profile.targetGlucoseMax) : 180}
      />

      {/* Recent Readings Table */}
      {readingsQuery.data && readingsQuery.data.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Recent Readings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Value</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {readingsQuery.data.slice(0, 20).map((reading) => {
                  const value = parseFloat(reading.glucoseValue);
                  const statusClass = value < 70 ? "glum-glucose-hypo" :
                    value < 80 ? "glum-glucose-low" :
                    value <= 180 ? "glum-glucose-target" :
                    value <= 250 ? "glum-glucose-high" :
                    "glum-glucose-very-high";
                  return (
                    <tr key={reading.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-2">{new Date(reading.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`glum-glucose-badge ${statusClass}`}>
                          {value.toFixed(0)} {reading.glucoseUnit}
                        </span>
                      </td>
                      <td className="py-3 px-2 capitalize">{reading.readingType}</td>
                      <td className="py-3 px-2 text-muted-foreground">{reading.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="glum-disclaimer">
        GluMira™ is an educational platform, not a medical device. Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
