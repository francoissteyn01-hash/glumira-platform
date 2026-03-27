import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Info, AlertCircle, CheckCircle, Shield } from "lucide-react";

// --- CONSTANTS & TYPES ---
type Regime = {
  name: string;
  hypoThreshold: number;
};

const mealRegimes: Regime[] = [
  { name: "Full Carb Count", hypoThreshold: 5.0 },
  { name: "Dr. Bernstein", hypoThreshold: 4.2 },
  { name: "Low Carb (<50g)", hypoThreshold: 4.5 },
  { name: "Mediterranean", hypoThreshold: 5.0 },
  { name: "Keto (<20g)", hypoThreshold: 4.0 },
  { name: "Standard ADA", hypoThreshold: 5.0 },
  { name: "South Asian", hypoThreshold: 5.0 },
  { name: "Vegetarian", hypoThreshold: 5.0 },
  { name: "Vegan", hypoThreshold: 4.8 },
  { name: "Halal", hypoThreshold: 5.0 },
  { name: "Kosher", hypoThreshold: 5.0 },
  { name: "Gluten-Free", hypoThreshold: 5.0 },
  { name: "DASH", hypoThreshold: 5.0 },
  { name: "Paleo", hypoThreshold: 4.5 },
  { name: "Carnivore", hypoThreshold: 4.0 },
  { name: "Intermittent Fasting 16:8", hypoThreshold: 4.5 },
  { name: "Ramadan Fasting", hypoThreshold: 5.0 },
  { name: "Athletic/High-Carb", hypoThreshold: 5.5 },
  { name: "Tube Feeding", hypoThreshold: 5.0 },
  { name: "Toddler/Picky Eater", hypoThreshold: 5.5 },
];

const TrafficLightIndicator = ({ threshold }: { threshold: number }) => {
  let color = "bg-red-500";
  let text = "Act Now";
  let Icon = AlertCircle;

  if (threshold >= 4.0 && threshold < 5.0) {
    color = "bg-amber-500";
    text = "Monitor";
    Icon = Shield;
  } else if (threshold >= 5.0) {
    color = "bg-teal-500";
    text = "OK";
    Icon = CheckCircle;
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full ${color}`}></div>
      <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
      <span className="font-medium">{text}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function SchoolCarePlanPage() {
  const [selectedRegime, setSelectedRegime] = useState<Regime>(mealRegimes[0]);
  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");
  const [emergencyContact1, setEmergencyContact1] = useState("");
  const [emergencyContact2, setEmergencyContact2] = useState("");
  const [insulinProtocol, setInsulinProtocol] = useState("");
  const [hypoTreatment, setHypoTreatment] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [activityGuidelines, setActivityGuidelines] = useState("");

  const handleGeneratePdf = () => {
    // In a real app, this would use a library like jsPDF or a backend service
    alert("PDF generation is a demo feature. Printing the page is recommended for now.");
    window.print();
  };

  return (
    <TooltipProvider>
      <div className="bg-gray-50/50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <header className="text-center">
            <h1 className="text-3xl font-bold text-navy">School Care Plan Generator</h1>
            <p className="text-body text-lg mt-2">Create a comprehensive, school-safe diabetes care plan.</p>
            <p className="text-sm text-gray-500 mt-1">Partnered with ISPAD Guidelines</p>
          </header>

          {/* Disclaimer */}
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Educational Platform Disclaimer</AlertTitle>
            <AlertDescription>
              GluMira™ is an educational platform, not a medical device. The information provided is for guidance and should be reviewed by a qualified healthcare professional. For medical advice, please consult your doctor. Contact: <a href="mailto:dev@glumira.ai" className="underline">dev@glumira.ai</a>.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Controls */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Meal Regime</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the child's dietary plan. This adjusts the hypoglycemia (hypo) alert threshold.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={(value) => setSelectedRegime(mealRegimes.find(r => r.name === value) || mealRegimes[0])} defaultValue={selectedRegime.name}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a regime" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealRegimes.map((regime) => (
                        <SelectItem key={regime.name} value={regime.name}>{regime.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 p-3 bg-light-blue rounded-lg text-center">
                    <p className="text-sm text-body">Hypo Threshold</p>
                    <p className="text-2xl font-bold text-navy">{selectedRegime.hypoThreshold.toFixed(1)} <span className="text-lg font-normal">mmol/L</span></p>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                     <p className="text-sm text-body mb-2 text-center">School-Safe Alert</p>
                    <TrafficLightIndicator threshold={selectedRegime.hypoThreshold} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start p-2 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5"/>
                        <div><span className="font-bold text-green-800">GREEN: OK</span><br/>Blood glucose is in target range. No action needed.</div>
                    </div>
                    <div className="flex items-start p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <Shield className="w-5 h-5 text-amber-600 mr-2 mt-0.5"/>
                        <div><span className="font-bold text-amber-800">AMBER: Monitor</span><br/>Nearing hypo. Monitor closely, consider a small snack.</div>
                    </div>
                    <div className="flex items-start p-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5"/>
                        <div><span className="font-bold text-red-800">RED: Act Now</span><br/>Hypoglycemia. Follow hypo treatment steps immediately.</div>
                    </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Plan Form & Preview */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Care Plan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="childName">Child's Full Name</Label>
                      <Input id="childName" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g., Jane Doe" />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact1">Emergency Contact 1 (Name & Phone)</Label>
                      <Input id="contact1" value={emergencyContact1} onChange={(e) => setEmergencyContact1(e.target.value)} placeholder="e.g., John Doe - 555-1234" />
                    </div>
                    <div>
                      <Label htmlFor="contact2">Emergency Contact 2 (Name & Phone)</Label>
                      <Input id="contact2" value={emergencyContact2} onChange={(e) => setEmergencyContact2(e.target.value)} placeholder="e.g., Mary Smith - 555-5678" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="insulinProtocol">Insulin Protocol (e.g., pump settings, correction factors)</Label>
                    <Textarea id="insulinProtocol" value={insulinProtocol} onChange={(e) => setInsulinProtocol(e.target.value)} placeholder="Describe insulin delivery method and doses..." />
                  </div>
                  <div>
                    <Label htmlFor="hypoTreatment">Hypoglycemia Treatment Steps</Label>
                    <Textarea id="hypoTreatment" value={hypoTreatment} onChange={(e) => setHypoTreatment(e.target.value)} placeholder="1. Give 15g fast-acting carbs (juice box).\n2. Wait 15 mins, re-check BG.\n3. If still low, repeat step 1." />
                  </div>
                   <div>
                    <Label htmlFor="mealPlan">Meal & Snack Plan</Label>
                    <Textarea id="mealPlan" value={mealPlan} onChange={(e) => setMealPlan(e.target.value)} placeholder="e.g., Lunch at 12:00 PM (approx. 45g carbs). Snack at 2:30 PM (15g carbs)." />
                  </div>
                  <div>
                    <Label htmlFor="activityGuidelines">Activity Guidelines (PE, Sports)</Label>
                    <Textarea id="activityGuidelines" value={activityGuidelines} onChange={(e) => setActivityGuidelines(e.target.value)} placeholder="e.g., Reduce basal by 30% one hour before PE. Give 10g carb snack before swimming." />
                  </div>
                </CardContent>
              </Card>

              {/* Document Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Care Plan Document Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 border rounded-lg bg-white shadow-sm font-sans text-sm text-gray-800">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-navy">School Diabetes Care Plan</h2>
                        <p className="font-semibold">{childName || "[Child's Name]"}</p>
                        <p className="text-xs">DOB: {dob || "[Date of Birth]"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-xs border-t border-b py-2">
                        <div><span className="font-bold">Contact 1:</span> {emergencyContact1 || "..."}</div>
                        <div><span className="font-bold">Contact 2:</span> {emergencyContact2 || "..."}</div>
                    </div>
                    <h3 className="font-bold text-teal-700 mb-1">Hypoglycemia (Low BG) Action Plan</h3>
                    <div className="p-2 border-l-4 border-red-500 bg-red-50 mb-3">
                        <p className="font-bold">Treat if BG is below {selectedRegime.hypoThreshold.toFixed(1)} mmol/L</p>
                        <pre className="whitespace-pre-wrap font-sans text-xs mt-1">{hypoTreatment || "1. Give fast-acting carbs...\n2. Wait 15 mins & re-check..."}</pre>
                    </div>
                    <h3 className="font-bold text-teal-700 mb-1">Insulin Protocol</h3>
                    <pre className="whitespace-pre-wrap font-sans text-xs mb-3">{insulinProtocol || "..."}</pre>
                    <h3 className="font-bold text-teal-700 mb-1">Meal Plan</h3>
                    <pre className="whitespace-pre-wrap font-sans text-xs mb-3">{mealPlan || "..."}</pre>
                    <h3 className="font-bold text-teal-700 mb-1">Activity Guidelines</h3>
                    <pre className="whitespace-pre-wrap font-sans text-xs">{activityGuidelines || "..."}</pre>
                </CardContent>
              </Card>

              <Button onClick={handleGeneratePdf} className="w-full bg-navy hover:bg-navy-deep text-white" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Generate & Print Care Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
