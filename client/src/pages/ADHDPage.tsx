import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle, Coffee, Zap } from "lucide-react";

// --- TYPES AND INTERFACES ---
type StimulantType = 'Concerta' | 'Ritalin' | 'Vyvanse' | 'Adderall';

interface MedicationInfo {
  type: StimulantType;
  peakHours: [number, number];
  duration: [number, number];
}

interface MedicationEntry {
  type: StimulantType;
  doseTime: string; // HH:mm format
}

// --- CONSTANTS ---
const MEDICATION_PROFILES: Record<StimulantType, MedicationInfo> = {
  Concerta: { type: "Concerta", peakHours: [6, 8], duration: [10, 12] },
  Ritalin: { type: "Ritalin", peakHours: [1, 2], duration: [3, 4] },
  Vyvanse: { type: "Vyvanse", peakHours: [3, 4], duration: [12, 14] },
  Adderall: { type: "Adderall", peakHours: [2, 3], duration: [4, 6] },
};

const EXPECTED_MEAL_TIMES = { breakfast: 8, lunch: 12, dinner: 18 }; // Hour of the day

// --- HELPER FUNCTIONS ---
const timeToHour = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

// --- UI COMPONENTS ---

const MedicationTimeline = ({ medication }: { medication: MedicationEntry | null }) => {
  const timelineData = useMemo(() => {
    if (!medication) return [];

    const doseHour = timeToHour(medication.doseTime);
    const profile = MEDICATION_PROFILES[medication.type];

    const events = [];

    // Medication active window
    const activeStart = doseHour;
    const activeEnd = doseHour + profile.duration[1];
    events.push({ 
      id: 'med-active', 
      start: activeStart, 
      end: activeEnd, 
      label: `${medication.type} Active`, 
      type: 'med-active' 
    });

    // Medication peak window (appetite suppression)
    const peakStart = doseHour + profile.peakHours[0];
    const peakEnd = doseHour + profile.peakHours[1];
    events.push({ 
      id: 'med-peak', 
      start: peakStart, 
      end: peakEnd, 
      label: 'Peak Effect / Appetite Suppression', 
      type: 'med-peak' 
    });

    // Expected meal times
    Object.entries(EXPECTED_MEAL_TIMES).forEach(([meal, hour]) => {
      events.push({ id: meal, start: hour, end: hour + 1, label: meal.charAt(0).toUpperCase() + meal.slice(1), type: 'meal' });
    });

    return events;
  }, [medication]);

  const isMealTimeIrregular = (mealHour: number) => {
      if (!medication) return false;
      const doseHour = timeToHour(medication.doseTime);
      const profile = MEDICATION_PROFILES[medication.type];
      const peakStart = doseHour + profile.peakHours[0];
      const peakEnd = doseHour + profile.peakHours[1];
      return mealHour >= peakStart && mealHour <= peakEnd;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>24-Hour Interaction Timeline</CardTitle>
        <CardDescription>Visualizing medication effects, appetite, and meal timing.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          {/* Hour markers */}
          <div className="flex justify-between text-xs text-gray-500 absolute top-0 left-4 right-4">
            {[...Array(7)].map((_, i) => <span key={i}>{i * 4}:00</span>)}
          </div>
          {/* Timeline bars */}
          <div className="relative h-full mt-6">
            {timelineData.map(event => (
              <TooltipProvider key={event.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute h-8 rounded-md px-2 flex items-center justify-center text-white text-xs`}
                      style={{
                        left: `${(event.start / 24) * 100}%`,
                        width: `${((event.end - event.start) / 24) * 100}%`,
                        top: event.type === 'meal' ? '60%' : (event.type === 'med-active' ? '10%' : '35%'),
                        backgroundColor: event.type === 'meal' ? (isMealTimeIrregular(event.start) ? '#F59E0B' : '#0D9488') : (event.type === 'med-active' ? '#3B82F6' : '#EF4444'),
                      }}
                    >
                      {event.label}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{event.label}: {event.start.toFixed(1)}h - {event.end.toFixed(1)}h</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        <div className="flex justify-around mt-4 text-xs">
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>Medication Active</div>
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>Peak Effect / Appetite Suppression</div>
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-teal-500 mr-2"></span>Normal Meal Window</div>
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>Caution: Meal in Suppression Window</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ADHDPage() {
  const [medication, setMedication] = useState<MedicationEntry | null>(null);
  const [medType, setMedType] = useState<StimulantType>('Concerta');
  const [doseTime, setDoseTime] = useState("07:00");

  const handleUpdate = () => {
    setMedication({ type: medType, doseTime });
  };

  const appetiteSuppressionWindow = useMemo(() => {
    if (!medication) return null;
    const profile = MEDICATION_PROFILES[medication.type];
    const start = timeToHour(medication.doseTime) + profile.peakHours[0];
    const end = timeToHour(medication.doseTime) + profile.peakHours[1];
    return { start: start.toFixed(1), end: end.toFixed(1) };
  }, [medication]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ADHD Comorbidity Management</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Understanding Stimulant Medication & Glucose</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Zap className="h-5 w-5 text-amber-500" />
            <span>In partnership with <a href="https://chadd.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-600">CHADD</a></span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input and Education */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Medication</CardTitle>
              <CardDescription>Enter your daily stimulant medication details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="med-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medication Type</label>
                <Select onValueChange={(v: StimulantType) => setMedType(v)} defaultValue={medType}>
                  <SelectTrigger id="med-type">
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MEDICATION_PROFILES).map(med => <SelectItem key={med} value={med}>{med}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="dose-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dose Time</label>
                <Input id="dose-time" type="time" value={doseTime} onChange={e => setDoseTime(e.target.value)} />
              </div>
              <Button onClick={handleUpdate} className="w-full bg-navy-700 hover:bg-navy-800 text-white">Update Timeline</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-teal-500" /> Educational Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>Stimulant medications for ADHD can significantly impact appetite. During the medication's peak effect window, you may not feel hungry, which can lead to missed meals.</p>
              <p>Skipping meals, especially when using insulin, increases the risk of hypoglycemia (low blood glucose). This tool helps you visualize these high-risk periods.</p>
              <p>Being aware of these patterns allows you to plan small, nutrient-dense snacks or adjust meal times to ensure stable glucose levels.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline and Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <MedicationTimeline medication={medication} />

          {appetiteSuppressionWindow && (
            <Alert className="border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 !text-amber-500" />
              <AlertTitle>Appetite Suppression Alert</AlertTitle>
              <AlertDescription>
                Be mindful of reduced appetite between approximately <strong>{appetiteSuppressionWindow.start}h</strong> and <strong>{appetiteSuppressionWindow.end}h</strong>. This is the peak activity window for {medication?.type}. Consider planning a snack even if you don't feel hungry to prevent low blood sugar.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
              <Coffee className="h-4 w-4" />
              <AlertTitle>Irregular Meal Pattern Detection</AlertTitle>
              <AlertDescription>
                The timeline will flag meals scheduled during your medication's peak appetite suppression window. A warning color (<span className="text-amber-600 font-semibold">Amber</span>) indicates a higher risk of skipping this meal. Try to eat consistently.
              </AlertDescription>
          </Alert>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
        <p><strong>Disclaimer:</strong> GluMira™ is an educational platform and not a medical device. The information provided is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        <p className="mt-2">For support, contact <a href="mailto:dev@glumira.ai" className="underline">dev@glumira.ai</a>. This tool does not collect or store any personal health information.</p>
      </footer>
    </div>
  );
}
