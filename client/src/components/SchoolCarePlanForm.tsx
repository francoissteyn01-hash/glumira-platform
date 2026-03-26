/**
 * GluMira™ School Care Plan Form
 * Version: 7.0.0
 * Module: MOD-SCHOOL
 *
 * Multi-step form for generating a printable school diabetes care plan.
 * Steps:
 *   1. Patient & School Details
 *   2. Insulin & Glucose Targets
 *   3. Meal Regime Selection
 *   4. Emergency Contacts
 *   5. Preview & Print
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  User,
  Syringe,
  UtensilsCrossed,
  Phone,
  Printer,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  altPhone: string;
}

interface FormData {
  // Step 1 — Patient & School
  patientFirstName: string;
  patientLastName: string;
  dateOfBirth: string;
  diabetesType: "type1" | "type2" | "gestational" | "other";
  schoolName: string;
  teacherName: string;
  grade: string;
  academicYear: string;

  // Step 2 — Insulin & Targets
  insulinType: string;
  insulinConcentration: "U-100" | "U-200" | "U-500";
  diaHours: number;
  deliveryMethod: "pen" | "pump" | "syringe";
  targetGlucoseMin: number;
  targetGlucoseMax: number;
  hypoThresholdMgdl: number;
  hyperThresholdMgdl: number;

  // Step 3 — Meal Regime
  mealRegimeId: string;
  customHypoThresholdMgdl: string;

  // Step 4 — Contacts
  emergencyContacts: EmergencyContact[];
  clinicianName: string;
  clinicianPhone: string;
  clinicianEmail: string;
  planDate: string;
  reviewDate: string;
  additionalNotes: string;
}

const INITIAL_FORM: FormData = {
  patientFirstName: "",
  patientLastName: "",
  dateOfBirth: "",
  diabetesType: "type1",
  schoolName: "",
  teacherName: "",
  grade: "",
  academicYear: new Date().getFullYear().toString(),
  insulinType: "Rapid-acting (NovoRapid)",
  insulinConcentration: "U-100",
  diaHours: 6,
  deliveryMethod: "pen",
  targetGlucoseMin: 70,
  targetGlucoseMax: 180,
  hypoThresholdMgdl: 70,
  hyperThresholdMgdl: 250,
  mealRegimeId: "pediatric-standard",
  customHypoThresholdMgdl: "",
  emergencyContacts: [{ name: "", relationship: "", phone: "", altPhone: "" }],
  clinicianName: "",
  clinicianPhone: "",
  clinicianEmail: "",
  planDate: new Date().toISOString().split("T")[0],
  reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  additionalNotes: "",
};

const STEPS = [
  { id: 1, label: "Patient & School", icon: User },
  { id: 2, label: "Insulin & Targets", icon: Syringe },
  { id: 3, label: "Meal Regime", icon: UtensilsCrossed },
  { id: 4, label: "Contacts", icon: Phone },
  { id: 5, label: "Preview & Print", icon: Printer },
];

// ─── Component ────────────────────────────────────────────────

interface SchoolCarePlanFormProps {
  onClose?: () => void;
}

export default function SchoolCarePlanForm({ onClose }: SchoolCarePlanFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regimesQuery = trpc.meals.getRegimes.useQuery();

  // ── Field helpers ──
  const set = (field: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setContact = (idx: number, field: keyof EmergencyContact, value: string) => {
    const updated = form.emergencyContacts.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    set("emergencyContacts", updated);
  };

  const addContact = () =>
    set("emergencyContacts", [
      ...form.emergencyContacts,
      { name: "", relationship: "", phone: "", altPhone: "" },
    ]);

  const removeContact = (idx: number) =>
    set(
      "emergencyContacts",
      form.emergencyContacts.filter((_, i) => i !== idx)
    );

  // ── Generate ──
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const payload = {
        patientFirstName: form.patientFirstName,
        patientLastName: form.patientLastName,
        dateOfBirth: form.dateOfBirth,
        diabetesType: form.diabetesType,
        schoolName: form.schoolName,
        teacherName: form.teacherName || undefined,
        grade: form.grade || undefined,
        academicYear: form.academicYear || undefined,
        insulinType: form.insulinType,
        insulinConcentration: form.insulinConcentration,
        diaHours: form.diaHours,
        deliveryMethod: form.deliveryMethod,
        targetGlucoseMin: form.targetGlucoseMin,
        targetGlucoseMax: form.targetGlucoseMax,
        hypoThresholdMgdl: form.hypoThresholdMgdl,
        hyperThresholdMgdl: form.hyperThresholdMgdl,
        mealRegimeId: form.mealRegimeId,
        customHypoThresholdMgdl: form.customHypoThresholdMgdl
          ? Number(form.customHypoThresholdMgdl)
          : undefined,
        emergencyContacts: form.emergencyContacts.filter((c) => c.name && c.phone),
        clinicianName: form.clinicianName,
        clinicianPhone: form.clinicianPhone,
        clinicianEmail: form.clinicianEmail || undefined,
        planDate: form.planDate,
        reviewDate: form.reviewDate,
        additionalNotes: form.additionalNotes || undefined,
      };

      const res = await fetch("/api/school-care-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setGeneratedHtml(data.html);
      setStep(5);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate care plan");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Print ──
  const handlePrint = () => {
    if (!generatedHtml) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(generatedHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  // ─── Step Renders ──────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-primary">Patient &amp; School Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name *</Label>
          <Input value={form.patientFirstName} onChange={(e) => set("patientFirstName", e.target.value)} placeholder="e.g. Amara" />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input value={form.patientLastName} onChange={(e) => set("patientLastName", e.target.value)} placeholder="e.g. Nakamura" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date of Birth *</Label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
        <div>
          <Label>Diabetes Type *</Label>
          <Select value={form.diabetesType} onValueChange={(v) => set("diabetesType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="type1">Type 1 Diabetes</SelectItem>
              <SelectItem value="type2">Type 2 Diabetes</SelectItem>
              <SelectItem value="gestational">Gestational Diabetes</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>School Name *</Label>
        <Input value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} placeholder="e.g. Windhoek Primary School" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Teacher Name</Label>
          <Input value={form.teacherName} onChange={(e) => set("teacherName", e.target.value)} placeholder="e.g. Ms. Brandt" />
        </div>
        <div>
          <Label>Grade / Class</Label>
          <Input value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. Grade 4" />
        </div>
        <div>
          <Label>Academic Year</Label>
          <Input value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="e.g. 2026" />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-primary">Insulin &amp; Glucose Targets</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Insulin Type *</Label>
          <Input value={form.insulinType} onChange={(e) => set("insulinType", e.target.value)} placeholder="e.g. Rapid-acting (NovoRapid)" />
        </div>
        <div>
          <Label>Concentration *</Label>
          <Select value={form.insulinConcentration} onValueChange={(v) => set("insulinConcentration", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="U-100">U-100</SelectItem>
              <SelectItem value="U-200">U-200</SelectItem>
              <SelectItem value="U-500">U-500</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Delivery Method *</Label>
          <Select value={form.deliveryMethod} onValueChange={(v) => set("deliveryMethod", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pen">Insulin Pen</SelectItem>
              <SelectItem value="pump">Insulin Pump (CSII)</SelectItem>
              <SelectItem value="syringe">Insulin Syringe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Duration of Action (hours) *</Label>
          <Input type="number" min={2} max={8} step={0.5} value={form.diaHours} onChange={(e) => set("diaHours", Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Target Glucose Min (mg/dL) *</Label>
          <Input type="number" value={form.targetGlucoseMin} onChange={(e) => set("targetGlucoseMin", Number(e.target.value))} />
        </div>
        <div>
          <Label>Target Glucose Max (mg/dL) *</Label>
          <Input type="number" value={form.targetGlucoseMax} onChange={(e) => set("targetGlucoseMax", Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-red-600">Hypo Threshold (mg/dL) *</Label>
          <Input type="number" value={form.hypoThresholdMgdl} onChange={(e) => set("hypoThresholdMgdl", Number(e.target.value))} className="border-red-200 focus:border-red-400" />
          <p className="text-xs text-muted-foreground mt-1">Below this = hypoglycaemia</p>
        </div>
        <div>
          <Label className="text-amber-600">Hyper Threshold (mg/dL) *</Label>
          <Input type="number" value={form.hyperThresholdMgdl} onChange={(e) => set("hyperThresholdMgdl", Number(e.target.value))} className="border-amber-200 focus:border-amber-400" />
          <p className="text-xs text-muted-foreground mt-1">Above this = hyperglycaemia</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-primary">Meal Regime Selection</h3>
      <div>
        <Label>Active Meal Regime *</Label>
        <Select value={form.mealRegimeId} onValueChange={(v) => set("mealRegimeId", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {regimesQuery.data?.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            )) ?? (
              <>
                <SelectItem value="pediatric-standard">Pediatric Standard</SelectItem>
                <SelectItem value="standard-3meal">Standard 3-Meal</SelectItem>
                <SelectItem value="ramadan">Ramadan Fasting</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      {/* Regime preview */}
      {form.mealRegimeId && regimesQuery.data && (
        (() => {
          const regime = regimesQuery.data.find((r: any) => r.id === form.mealRegimeId);
          if (!regime) return null;
          return (
            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">{regime.category}</Badge>
                {regime.fasting && <Badge variant="outline" className="border-amber-300 text-amber-700">Fasting</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{regime.description}</p>
              <div className="flex gap-4 text-xs">
                <span className="text-red-600 font-medium">Hypo: {regime.hypoThreshold} mg/dL</span>
                <span className="text-amber-600 font-medium">Hyper: {regime.hyperThreshold} mg/dL</span>
                <span className="text-muted-foreground">{regime.meals.length} meals</span>
              </div>
            </Card>
          );
        })()
      )}
      <div>
        <Label>Clinician Hypo Override (mg/dL) — optional</Label>
        <Input
          type="number"
          value={form.customHypoThresholdMgdl}
          onChange={(e) => set("customHypoThresholdMgdl", e.target.value)}
          placeholder="Leave blank to use regime default"
        />
        <p className="text-xs text-muted-foreground mt-1">Overrides the regime hypo threshold if set by clinician</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-primary">Emergency Contacts &amp; Clinician</h3>
      {/* Emergency contacts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Emergency Contacts *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addContact}>
            <Plus className="w-3 h-3 mr-1" /> Add Contact
          </Button>
        </div>
        <div className="space-y-3">
          {form.emergencyContacts.map((c, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Contact {i + 1}</span>
                {form.emergencyContacts.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(i)}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Full name *" value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} />
                <Input placeholder="Relationship (e.g. Mother)" value={c.relationship} onChange={(e) => setContact(i, "relationship", e.target.value)} />
                <Input placeholder="Primary phone *" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} />
                <Input placeholder="Alternate phone" value={c.altPhone} onChange={(e) => setContact(i, "altPhone", e.target.value)} />
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* Clinician */}
      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold">Diabetes Care Team</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label>Clinician Name *</Label>
            <Input value={form.clinicianName} onChange={(e) => set("clinicianName", e.target.value)} placeholder="e.g. Dr. S. Visser" />
          </div>
          <div>
            <Label>Clinic Phone *</Label>
            <Input value={form.clinicianPhone} onChange={(e) => set("clinicianPhone", e.target.value)} placeholder="+264 61 300 000" />
          </div>
          <div>
            <Label>Clinic Email</Label>
            <Input type="email" value={form.clinicianEmail} onChange={(e) => set("clinicianEmail", e.target.value)} placeholder="clinic@example.com" />
          </div>
        </div>
      </div>
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Plan Date *</Label>
          <Input type="date" value={form.planDate} onChange={(e) => set("planDate", e.target.value)} />
        </div>
        <div>
          <Label>Review Date *</Label>
          <Input type="date" value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)} />
        </div>
      </div>
      {/* Notes */}
      <div>
        <Label>Additional Notes</Label>
        <Textarea
          value={form.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder="e.g. Patient carries glucagon kit. Allergic to latex."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-primary">Preview &amp; Print</h3>
      {generatedHtml ? (
        <>
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Care plan generated successfully</p>
              <p className="text-xs text-green-600">
                {form.patientFirstName} {form.patientLastName} · {form.schoolName}
              </p>
            </div>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <iframe
              srcDoc={generatedHtml}
              className="w-full h-[500px]"
              title="School Care Plan Preview"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print / Save as PDF
            </Button>
            <Button variant="outline" onClick={() => setStep(4)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Use your browser's print dialog to save as PDF. Select "Save as PDF" as the printer.
          </p>
        </>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No care plan generated yet.</p>
          <Button className="mt-4" onClick={() => setStep(4)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
          </Button>
        </div>
      )}
    </div>
  );

  // ─── Navigation ───────────────────────────────────────────

  const canProceed = () => {
    if (step === 1) return !!(form.patientFirstName && form.patientLastName && form.dateOfBirth && form.schoolName);
    if (step === 2) return !!(form.insulinType && form.diaHours && form.hypoThresholdMgdl < form.hyperThresholdMgdl);
    if (step === 3) return !!form.mealRegimeId;
    if (step === 4) return !!(
      form.emergencyContacts.some((c) => c.name && c.phone) &&
      form.clinicianName &&
      form.clinicianPhone &&
      form.planDate &&
      form.reviewDate
    );
    return true;
  };

  const handleNext = async () => {
    if (step === 4) {
      await handleGenerate();
    } else {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isDone ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      {step < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep((s) => s - 1) : onClose?.()}
            disabled={isGenerating}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
          >
            {isGenerating ? (
              "Generating…"
            ) : step === 4 ? (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Care Plan
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        GluMira™ is an educational platform only. Not a medical device.
        Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
