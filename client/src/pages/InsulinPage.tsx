import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Syringe } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

/**
 * GluMira™ Insulin Dose Logging Page
 * Log bolus, basal, and correction doses
 */
export default function InsulinPage() {
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;

  const [amount, setAmount] = useState("");
  const [doseType, setDoseType] = useState<"bolus" | "basal" | "correction">("bolus");
  const [insulinType, setInsulinType] = useState<"rapid" | "short" | "intermediate" | "long" | "ultra-long">("rapid");
  const [concentration, setConcentration] = useState<"U-100" | "U-200" | "U-500">("U-100");
  const [carbs, setCarbs] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const dosesQuery = trpc.insulin.getDoses.useQuery(
    { patientId: profile?.id ?? 0, limit: 200 },
    { enabled: !!profile }
  );

  const addDoseMutation = trpc.insulin.addDose.useMutation({
    onSuccess: () => {
      toast.success("Insulin dose recorded");
      setAmount("");
      setCarbs("");
      setReason("");
      setNotes("");
      setShowForm(false);
      dosesQuery.refetch();
    },
    onError: (err) => {
      toast.error("Failed to save dose: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Please set up your profile first");
      return;
    }
    const doseAmount = parseFloat(amount);
    if (isNaN(doseAmount) || doseAmount <= 0) {
      toast.error("Please enter a valid dose amount");
      return;
    }
    addDoseMutation.mutate({
      patientId: profile.id,
      doseType,
      insulinType,
      concentration,
      amount: doseAmount,
      carbohydrates: carbs ? parseFloat(carbs) : undefined,
      reason: reason || undefined,
      timestamp: new Date(),
      notes: notes || undefined,
    });
  };

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    if (!dosesQuery.data) return { bolus: 0, basal: 0, correction: 0, total: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDoses = dosesQuery.data.filter(
      (d) => new Date(d.timestamp) >= today
    );
    const bolus = todayDoses.filter((d) => d.doseType === "bolus").reduce((s, d) => s + parseFloat(d.amount), 0);
    const basal = todayDoses.filter((d) => d.doseType === "basal").reduce((s, d) => s + parseFloat(d.amount), 0);
    const correction = todayDoses.filter((d) => d.doseType === "correction").reduce((s, d) => s + parseFloat(d.amount), 0);
    return { bolus, basal, correction, total: bolus + basal + correction };
  }, [dosesQuery.data]);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl text-primary">Insulin Doses</h1>
        <Card className="p-8 text-center">
          <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary mb-2">Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Set up your patient profile to start logging insulin doses.
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
          <h1 className="text-2xl text-primary">Insulin Doses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log and track your insulin administration
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="glum-btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          Log Dose
        </Button>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Today's Total</p>
          <p className="text-xl font-bold text-primary font-data">{dailyTotals.total.toFixed(1)} U</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Bolus</p>
          <p className="text-xl font-bold text-secondary font-data">{dailyTotals.bolus.toFixed(1)} U</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Basal</p>
          <p className="text-xl font-bold text-accent font-data">{dailyTotals.basal.toFixed(1)} U</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Correction</p>
          <p className="text-xl font-bold text-muted-foreground font-data">{dailyTotals.correction.toFixed(1)} U</p>
        </Card>
      </div>

      {/* Entry Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Log Insulin Dose</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="glum-label">Dose Amount (units)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 5.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glum-input"
                required
              />
            </div>
            <div>
              <label className="glum-label">Dose Type</label>
              <Select value={doseType} onValueChange={(v) => setDoseType(v as "bolus" | "basal" | "correction")}>
                <SelectTrigger className="glum-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bolus">Bolus (Meal)</SelectItem>
                  <SelectItem value="basal">Basal</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="glum-label">Insulin Type</label>
              <Select value={insulinType} onValueChange={(v) => setInsulinType(v as any)}>
                <SelectTrigger className="glum-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rapid">Rapid (Humalog, NovoLog)</SelectItem>
                  <SelectItem value="short">Short (Regular)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (NPH)</SelectItem>
                  <SelectItem value="long">Long (Lantus, Levemir)</SelectItem>
                  <SelectItem value="ultra-long">Ultra-Long (Tresiba)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="glum-label">Concentration</label>
              <Select value={concentration} onValueChange={(v) => setConcentration(v as "U-100" | "U-200" | "U-500")}>
                <SelectTrigger className="glum-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U-100">U-100 (Standard)</SelectItem>
                  <SelectItem value="U-200">U-200</SelectItem>
                  <SelectItem value="U-500">U-500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="glum-label">Carbs (grams, optional)</label>
              <Input
                type="number"
                step="1"
                placeholder="e.g. 45"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="glum-input"
              />
            </div>
            <div>
              <label className="glum-label">Reason (optional)</label>
              <Input
                placeholder="e.g. meal, correction, exercise"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glum-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="glum-label">Notes (optional)</label>
              <Input
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glum-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <Button type="submit" className="glum-btn-primary" disabled={addDoseMutation.isPending}>
                {addDoseMutation.isPending ? "Saving..." : "Save Dose"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Dose History */}
      {dosesQuery.data && dosesQuery.data.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Dose History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Insulin</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Carbs</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {dosesQuery.data.slice(0, 30).map((dose) => (
                  <tr key={dose.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-2">{new Date(dose.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-2 font-data font-semibold">{parseFloat(dose.amount).toFixed(1)} U</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        dose.doseType === "bolus" ? "bg-secondary/15 text-secondary" :
                        dose.doseType === "basal" ? "bg-accent/15 text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {dose.doseType}
                      </span>
                    </td>
                    <td className="py-3 px-2 capitalize">{dose.insulinType || "—"}</td>
                    <td className="py-3 px-2 font-data">{dose.carbohydrates ? `${parseFloat(dose.carbohydrates)}g` : "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{dose.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="glum-disclaimer">
        GluMira™ is an educational platform, educational platform. Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
