import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IOBChart, IOBBreakdown, StackingIndicator, type IOBChartData } from "@/components/IOBChart";
import { trpc } from "@/lib/trpc";
import { Activity, Plus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface DoseEntry {
  id: string;
  amount: string;
  insulinType: "rapid" | "short" | "intermediate" | "long" | "ultra-long";
  concentration: "U-100" | "U-200" | "U-500";
  category: "bolus" | "basal" | "correction";
  minutesAgo: string;
}

/**
 * GluMira™ IOB Analysis Page
 * Walsh bilinear DIA curve visualization and stacking analysis
 */
export default function IOBPage() {
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;

  const [doses, setDoses] = useState<DoseEntry[]>([
    {
      id: "1",
      amount: "5",
      insulinType: "rapid",
      concentration: "U-100",
      category: "bolus",
      minutesAgo: "60",
    },
  ]);
  const [customDia, setCustomDia] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const calculateMutation = trpc.analysis.calculateIOB.useMutation({
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast.success("IOB analysis complete");
    },
    onError: (err) => {
      toast.error("Analysis failed: " + err.message);
    },
  });

  const addDose = () => {
    setDoses([
      ...doses,
      {
        id: Date.now().toString(),
        amount: "",
        insulinType: "rapid",
        concentration: "U-100",
        category: "bolus",
        minutesAgo: "",
      },
    ]);
  };

  const removeDose = (id: string) => {
    if (doses.length <= 1) return;
    setDoses(doses.filter((d) => d.id !== id));
  };

  const updateDose = (id: string, field: keyof DoseEntry, value: string) => {
    setDoses(doses.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleCalculate = () => {
    if (!profile) {
      toast.error("Please set up your profile first");
      return;
    }

    const validDoses = doses.filter((d) => {
      const amt = parseFloat(d.amount);
      const mins = parseInt(d.minutesAgo);
      return !isNaN(amt) && amt > 0 && !isNaN(mins) && mins >= 0;
    });

    if (validDoses.length === 0) {
      toast.error("Please enter at least one valid dose");
      return;
    }

    const now = new Date();
    calculateMutation.mutate({
      patientId: profile.id,
      customDiaHours: customDia ? parseFloat(customDia) : undefined,
      doses: validDoses.map((d) => ({
        amount: parseFloat(d.amount),
        timestamp: new Date(now.getTime() - parseInt(d.minutesAgo) * 60 * 1000),
        insulinType: d.insulinType,
        concentration: d.concentration,
        category: d.category,
      })),
    });
  };

  const chartData: IOBChartData[] = useMemo(() => {
    if (!analysisResult?.decayPoints) return [];
    return analysisResult.decayPoints.map((p: any) => ({
      time: p.time,
      iob: p.iob,
      percentage: p.percentage,
    }));
  }, [analysisResult]);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl text-primary">IOB Analysis</h1>
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary mb-2">Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Set up your patient profile to use the IOB analysis engine.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-primary">IOB Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Walsh bilinear DIA decay curve — powered by IOB Hunter™ v7.0
        </p>
      </div>

      {/* Dose Entry */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Enter Doses</h3>
          <Button onClick={addDose} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Dose
          </Button>
        </div>

        <div className="space-y-4">
          {doses.map((dose, index) => (
            <div key={dose.id} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end p-4 bg-muted/20 rounded-lg">
              <div>
                <label className="glum-label">Amount (U)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="5.0"
                  value={dose.amount}
                  onChange={(e) => updateDose(dose.id, "amount", e.target.value)}
                  className="glum-input"
                />
              </div>
              <div>
                <label className="glum-label">Minutes Ago</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={dose.minutesAgo}
                  onChange={(e) => updateDose(dose.id, "minutesAgo", e.target.value)}
                  className="glum-input"
                />
              </div>
              <div>
                <label className="glum-label">Insulin</label>
                <Select value={dose.insulinType} onValueChange={(v) => updateDose(dose.id, "insulinType", v)}>
                  <SelectTrigger className="glum-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rapid">Rapid</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="ultra-long">Ultra-Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="glum-label">Concentration</label>
                <Select value={dose.concentration} onValueChange={(v) => updateDose(dose.id, "concentration", v)}>
                  <SelectTrigger className="glum-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U-100">U-100</SelectItem>
                    <SelectItem value="U-200">U-200</SelectItem>
                    <SelectItem value="U-500">U-500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="glum-label">Category</label>
                <Select value={dose.category} onValueChange={(v) => updateDose(dose.id, "category", v)}>
                  <SelectTrigger className="glum-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bolus">Bolus</SelectItem>
                    <SelectItem value="basal">Basal</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {doses.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDose(dose.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom DIA */}
        <div className="mt-4 flex items-end gap-4">
          <div className="w-48">
            <label className="glum-label">Custom DIA (hours, optional)</label>
            <Input
              type="number"
              step="0.5"
              min="2"
              max="8"
              placeholder="Default per type"
              value={customDia}
              onChange={(e) => setCustomDia(e.target.value)}
              className="glum-input"
            />
          </div>
          <Button
            onClick={handleCalculate}
            className="glum-btn-primary"
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending ? "Calculating..." : "Calculate IOB"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {analysisResult && (
        <>
          {/* IOB Chart */}
          <IOBChart data={chartData} title="IOB Decay Curve (Walsh Bilinear)" />

          {/* Breakdown and Stacking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IOBBreakdown
              bolusIOB={analysisResult.bolusIOB}
              basalIOB={analysisResult.basalIOB}
              totalIOB={analysisResult.totalIOB}
            />
            <StackingIndicator
              recentStacking={analysisResult.stackingRisk.recentPercent}
              moderateStacking={analysisResult.stackingRisk.moderatePercent}
              elderlyStacking={analysisResult.stackingRisk.elderlyPercent}
            />
          </div>

          {/* Summary Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Analysis Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Total IOB</p>
                <p className="text-xl font-bold text-primary font-data">{analysisResult.totalIOB.toFixed(3)} U</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">DIA Used</p>
                <p className="text-xl font-bold text-primary font-data">{analysisResult.diaUsed}h</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Stacking Risk</p>
                <p className={`text-xl font-bold font-data ${
                  analysisResult.stackingRisk.level === "safe" ? "text-green-600" :
                  analysisResult.stackingRisk.level === "moderate" ? "text-amber-600" :
                  "text-red-600"
                }`}>
                  {analysisResult.stackingRisk.level.charAt(0).toUpperCase() + analysisResult.stackingRisk.level.slice(1)}
                </p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Correction IOB</p>
                <p className="text-xl font-bold text-muted-foreground font-data">{analysisResult.correctionIOB.toFixed(3)} U</p>
              </div>
            </div>
            {analysisResult.stackingRisk.message && (
              <div className={`mt-4 p-3 rounded-lg border ${
                analysisResult.stackingRisk.level === "safe" ? "glum-alert-success" :
                analysisResult.stackingRisk.level === "moderate" ? "glum-alert-warning" :
                "glum-alert-danger"
              }`}>
                <p className="text-sm">{analysisResult.stackingRisk.message}</p>
              </div>
            )}
          </Card>
        </>
      )}

      <p className="glum-disclaimer">
        GluMira™ is an educational platform, educational platform. Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
