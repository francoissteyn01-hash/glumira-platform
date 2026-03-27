import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { User, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

/**
 * GluMira™ Profile Page
 * Patient profile creation and management
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [diabetesType, setDiabetesType] = useState<"type1" | "type2" | "gestational" | "other">("type1");
  const [glucoseUnit, setGlucoseUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");
  const [targetMin, setTargetMin] = useState("80");
  const [targetMax, setTargetMax] = useState("180");
  const [isf, setIsf] = useState("");
  const [icr, setIcr] = useState("");
  const [diaHours, setDiaHours] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setDiabetesType((profile.diabetesType as any) || "type1");
      setGlucoseUnit((profile.glucoseUnit as any) || "mg/dL");
      setTargetMin(profile.targetGlucoseMin || "80");
      setTargetMax(profile.targetGlucoseMax || "180");
      setIsf(profile.insulinSensitivityFactor || "");
      setIcr(profile.carbRatio || "");
      setDiaHours(profile.iobDecayTime ? (profile.iobDecayTime / 60).toString() : "");
    }
  }, [profile]);

  const createMutation = trpc.patient.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error("Failed to create profile: " + err.message);
    },
  });

  const updateMutation = trpc.patient.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error("Failed to update profile: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      diabetesType,
      glucoseUnit,
      targetGlucoseMin: targetMin ? parseFloat(targetMin) : undefined,
      targetGlucoseMax: targetMax ? parseFloat(targetMax) : undefined,
      insulinSensitivityFactor: isf ? parseFloat(isf) : undefined,
      carbRatio: icr ? parseFloat(icr) : undefined,
      iobDecayTime: diaHours ? Math.round(parseFloat(diaHours) * 60) : undefined,
    };

    if (profile) {
      updateMutation.mutate({ patientId: profile.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-primary">Patient Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile ? "Update your diabetes management settings" : "Set up your profile to start tracking"}
        </p>
      </div>

      {/* Account Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary">{user?.name || "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-primary mb-6">
          {profile ? "Edit Profile" : "Create Profile"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="glum-label">First Name</label>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="glum-input"
                />
              </div>
              <div>
                <label className="glum-label">Last Name</label>
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="glum-input"
                />
              </div>
            </div>
          </div>

          {/* Diabetes Settings */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Diabetes Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="glum-label">Diabetes Type</label>
                <Select value={diabetesType} onValueChange={(v) => setDiabetesType(v as any)}>
                  <SelectTrigger className="glum-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type1">Type 1</SelectItem>
                    <SelectItem value="type2">Type 2</SelectItem>
                    <SelectItem value="gestational">Gestational</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="glum-label">Glucose Unit</label>
                <Select value={glucoseUnit} onValueChange={(v) => setGlucoseUnit(v as any)}>
                  <SelectTrigger className="glum-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg/dL">mg/dL</SelectItem>
                    <SelectItem value="mmol/L">mmol/L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Target Range */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Target Glucose Range</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="glum-label">Target Min ({glucoseUnit})</label>
                <Input
                  type="number"
                  step="1"
                  placeholder={glucoseUnit === "mg/dL" ? "80" : "4.4"}
                  value={targetMin}
                  onChange={(e) => setTargetMin(e.target.value)}
                  className="glum-input"
                />
              </div>
              <div>
                <label className="glum-label">Target Max ({glucoseUnit})</label>
                <Input
                  type="number"
                  step="1"
                  placeholder={glucoseUnit === "mg/dL" ? "180" : "10.0"}
                  value={targetMax}
                  onChange={(e) => setTargetMax(e.target.value)}
                  className="glum-input"
                />
              </div>
            </div>
          </div>

          {/* Insulin Settings */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Insulin Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="glum-label">ISF (Sensitivity Factor)</label>
                <Input
                  type="number"
                  step="1"
                  placeholder={glucoseUnit === "mg/dL" ? "e.g. 50" : "e.g. 2.8"}
                  value={isf}
                  onChange={(e) => setIsf(e.target.value)}
                  className="glum-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {glucoseUnit}/unit of insulin
                </p>
              </div>
              <div>
                <label className="glum-label">ICR (Carb Ratio)</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g. 10"
                  value={icr}
                  onChange={(e) => setIcr(e.target.value)}
                  className="glum-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  grams carbs per unit
                </p>
              </div>
              <div>
                <label className="glum-label">DIA (hours)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="2"
                  max="8"
                  placeholder="e.g. 6"
                  value={diaHours}
                  onChange={(e) => setDiaHours(e.target.value)}
                  className="glum-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration of Insulin Action
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="glum-btn-primary" disabled={isPending}>
              <Save className="w-4 h-4 mr-1" />
              {isPending ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
            </Button>
          </div>
        </form>
      </Card>

      <p className="glum-disclaimer">
        GluMira™ is an educational platform, educational platform. Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
