import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart, Book, Droplets, FileText, Flag, HelpCircle, Info, Lightbulb, Shield, TrendingDown, TrendingUp, AlertTriangle, Baby } from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES & INTERFACES ---
type Trimester = 1 | 2 | 3;

interface GlucoseTarget {
  guideline: string;
  fasting: string;
  oneHour: string;
  twoHour: string;
  tir?: string;
}

interface InsulinSafety {
  name: string;
  category: 'B' | 'C';
  description: string;
}

// --- CONSTANTS & MOCK DATA ---
const ISF_ICR_MODIFIERS: Record<Trimester, { isf: number; icr: number }> = {
  1: { isf: 1.1, icr: 1.0 }, // Mild insulin resistance
  2: { isf: 0.7, icr: 0.8 }, // Increasing resistance
  3: { isf: 0.5, icr: 0.6 }, // Peak insulin resistance
};

const PREGNANCY_GLUCOSE_TARGETS: GlucoseTarget[] = [
  { guideline: 'NICE NG3', fasting: '<5.3', oneHour: '<7.8', twoHour: '<6.4' },
  { guideline: 'ADA', fasting: '<5.3', oneHour: '<7.2', twoHour: '<6.7' },
  { guideline: 'CONCEPTT', fasting: '3.5-5.3', oneHour: '<7.8', twoHour: '-', tir: '>70% (3.5-7.8)' },
];

const GDM_GLUCOSE_TARGETS: GlucoseTarget[] = [
    { guideline: 'NICE NG3 (GDM)', fasting: '<5.3', oneHour: '<7.8', twoHour: '-' },
    { guideline: 'ADA (GDM)', fasting: '<5.3', oneHour: '<7.8', twoHour: '<6.7' },
];

const INSULIN_SAFETY_DATA: InsulinSafety[] = [
  { name: 'Glargine (Lantus)', category: 'C', description: 'Use with caution if benefits outweigh risks.' },
  { name: 'Detemir (Levemir)', category: 'B', description: 'Considered a first-line basal insulin in pregnancy.' },
  { name: 'Aspart (NovoLog)', category: 'B', description: 'Preferred rapid-acting insulin during pregnancy.' },
  { name: 'Lispro (Humalog)', category: 'B', description: 'Well-studied and considered safe in pregnancy.' },
];

const trimesterWeeks = {
    1: { start: 1, end: 13 },
    2: { start: 14, end: 27 },
    3: { start: 28, end: 40 },
};

// --- HELPER COMPONENTS ---
const InfoTooltip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 text-gray-400 cursor-pointer hover:text-teal-600" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-gray-800 text-white p-3 rounded-lg shadow-lg">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const PregnancyTimeline = ({ currentTrimester }: { currentTrimester: Trimester }) => {
    return (
        <div className="w-full px-4 pt-4 pb-2">
            <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full"></div>
                <div className="absolute left-0 top-1/2 h-1 bg-teal-500 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((trimesterWeeks[currentTrimester].end / 40) * 100)}%` }}></div>
                {[1, 2, 3].map((tri) => {
                    const isActive = tri <= currentTrimester;
                    return (
                        <div key={tri} className="z-10 flex flex-col items-center group">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-teal-500 border-teal-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                                {tri}
                            </div>
                            <p className={`text-xs mt-2 font-medium transition-colors ${isActive ? 'text-teal-700' : 'text-gray-600'}`}>Trimester {tri}</p>
                            <p className="text-xs text-gray-400">Wks {trimesterWeeks[tri as Trimester].start}-{trimesterWeeks[tri as Trimester].end}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function PregnancyPage() {
  const [trimester, setTrimester] = useState<Trimester>(1);
  const [isGdmMode, setIsGdmMode] = useState(false);
  const [unit, setUnit] = useState<'mmol/L' | 'mg/dL'>('mmol/L');

  const convertToMgDl = (mmol: string) => {
    if (mmol === '-' || !mmol) return '-';
    const conversionFactor = 18.0182;
    if (mmol.includes('-')) {
        const [low, high] = mmol.split('-').map(v => Math.round(parseFloat(v) * conversionFactor));
        return `${low}-${high}`;
    }
    const operator = mmol.match(/[<>≥≤]/g)?.[0] || '';
    const val = parseFloat(mmol.replace(operator, ''));
    if (isNaN(val)) return '-';
    const converted = Math.round(val * conversionFactor);
    return `${operator}${converted}`;
  };

  const displayValue = (value: string) => unit === 'mg/dL' ? convertToMgDl(value) : value;

  const currentModifiers = ISF_ICR_MODIFIERS[trimester];
  const currentTargets = isGdmMode ? GDM_GLUCOSE_TARGETS : PREGNANCY_GLUCOSE_TARGETS;

  const handleGenerateACP = () => {
    toast.success('Antenatal Care Plan Generated!', {
      description: 'A draft of your ACP has been created. Check your documents folder to view and share it with your provider.',
      action: { label: 'Close', onClick: () => {} },
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      <header className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-100 p-3 rounded-xl">
            <Baby className="h-6 w-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pregnancy & Diabetes</h1>
            <p className="text-sm text-gray-500">Educational tools for managing glucose during pregnancy.</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-800">Pregnancy Timeline & Trimester Selection</span>
                <InfoTooltip text="Select your current trimester to see tailored guidance. Insulin needs change significantly as pregnancy progresses." />
              </CardTitle>
              <CardDescription>Visually track your pregnancy journey and adjust settings for each stage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <PregnancyTimeline currentTrimester={trimester} />
                <div className="flex items-center justify-center space-x-4 pt-4">
                    <Label htmlFor="trimester-select" className="font-medium">Current Trimester:</Label>
                    <Select value={String(trimester)} onValueChange={(value) => setTrimester(Number(value) as Trimester)}>
                        <SelectTrigger id="trimester-select" className="w-[240px]">
                            <SelectValue placeholder="Select Trimester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Trimester 1 (Weeks 1-13)</SelectItem>
                            <SelectItem value="2">Trimester 2 (Weeks 14-27)</SelectItem>
                            <SelectItem value="3">Trimester 3 (Weeks 28-40)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                  <span>Insulin Sensitivity Modifiers</span>
                  <InfoTooltip text="Hormonal changes in pregnancy cause insulin resistance. These multipliers show typical adjustments for your Insulin Sensitivity Factor (ISF) and Insulin-to-Carb Ratio (ICR) per trimester." />
                </CardTitle>
                <CardDescription>As pregnancy progresses, you'll likely need more insulin. These are *typical* starting points for adjustment.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-around text-center pt-4">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-teal-600 tracking-tight">x{currentModifiers.isf.toFixed(1)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">ISF Modifier</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-amber-600 tracking-tight">x{currentModifiers.icr.toFixed(1)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">ICR Modifier</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                  <span>Insulin Safety</span>
                  <InfoTooltip text="Pregnancy safety categories for common insulins, as rated by the FDA. Category B is generally preferred over Category C. Always consult your doctor." />
                </CardTitle>
                <CardDescription>Not all insulins are equally studied for pregnancy. Here are the safety categories for common types.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-3">
                  {INSULIN_SAFETY_DATA.map(insulin => (
                    <li key={insulin.name} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{insulin.name}</span>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${insulin.category === 'B' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        <Shield size={14} />
                        <span>Category {insulin.category}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-800">Pregnancy Glucose Targets ({unit})</CardTitle>
                        <CardDescription>Comparison of international guidelines. Use the toggles to switch between units or enable GDM mode.</CardDescription>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                        <div className="flex items-center space-x-2">
                            <Switch id="gdm-mode" checked={isGdmMode} onCheckedChange={setIsGdmMode} />
                            <Label htmlFor="gdm-mode" className="text-sm">GDM Mode</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-1 rounded-lg border bg-gray-100/60">
                            <span className={`px-2 py-0.5 text-sm font-medium rounded-md transition-colors ${unit === 'mmol/L' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>mmol/L</span>
                            <Switch id="unit-switch" checked={unit === 'mg/dL'} onCheckedChange={(c) => setUnit(c ? 'mg/dL' : 'mmol/L')} />
                            <span className={`px-2 py-0.5 text-sm font-medium rounded-md transition-colors ${unit === 'mg/dL' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>mg/dL</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Guideline</TableHead>
                    <TableHead>Fasting</TableHead>
                    <TableHead>1hr Post-Meal</TableHead>
                    <TableHead>2hr Post-Meal</TableHead>
                    <TableHead>Time in Range (TIR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTargets.map(target => (
                    <TableRow key={target.guideline}>
                      <TableCell className="font-medium">{target.guideline}</TableCell>
                      <TableCell>{displayValue(target.fasting)}</TableCell>
                      <TableCell>{displayValue(target.oneHour)}</TableCell>
                      <TableCell>{displayValue(target.twoHour)}</TableCell>
                      <TableCell>{target.tir || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Key Clinical Alerts & Considerations</CardTitle>
              <CardDescription>Important situations during and after pregnancy that require special attention and proactive management.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Postpartum Crash Warning</AlertTitle>
                    <AlertDescription>Insulin sensitivity rebounds dramatically (2-3x) within 24-72 hours post-delivery. Proactive and significant insulin reduction is critical to prevent severe hypoglycemia.</AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900">
                    <TrendingDown className="h-4 w-4 text-amber-700" />
                    <AlertTitle className="font-semibold">Breastfeeding Hypo Window</AlertTitle>
                    <AlertDescription>Glucose can drop by 1-2 mmol/L (18-36 mg/dL) during or after breastfeeding. Plan a carbohydrate snack beforehand.</AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-orange-50 border-orange-200 text-orange-900">
                    <TrendingUp className="h-4 w-4 text-orange-700" />
                    <AlertTitle className="font-semibold">Steroid-Induced Hyperglycemia</AlertTitle>
                    <AlertDescription>Antenatal steroids (e.g., dexamethasone) for fetal lung development can cause significant glucose spikes for 24-72 hours. A temporary basal rate increase or correction factor adjustment is often needed.</AlertDescription>
                </Alert>
                 <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-900">
                    <Lightbulb className="h-4 w-4 text-blue-700" />
                    <AlertTitle className="font-semibold">Gestational Diabetes (GDM)</AlertTitle>
                    <AlertDescription>GDM management focuses on diet, exercise, and sometimes medication, with specific glucose targets. Use the "GDM Mode" toggle above for tailored guidance.</AlertDescription>
                </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Antenatal Care Plan (ACP) Generator</CardTitle>
              <CardDescription>Generate a summary document of your pregnancy settings, targets, and key considerations to share with your healthcare provider.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGenerateACP} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate ACP Document
                </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 pt-6 mt-6 border-t">
        <p className="font-semibold">Disclaimer: GluMira™ is an educational platform, educational platform.</p>
        <p>All information presented is for educational purposes only and should not replace advice from a qualified healthcare professional. Do not make changes to your medical treatment without consulting your provider.</p>
        <p className="mt-2">Contact for support: <a href="mailto:dev@glumira.ai" className="text-teal-600 hover:underline">dev@glumira.ai</a></p>
      </footer>
    </div>
  );
}
