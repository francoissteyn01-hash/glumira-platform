import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, AlertTriangle, Target, Clock, Pill, BookOpen, BarChart3, Calculator, Edit } from 'lucide-react';
import { toast } from "sonner";

// --- Types and Constants ---
type ThyroidCondition = 'none' | 'hypothyroid' | 'hyperthyroid' | 'hashimotos' | 'graves' | 'post-thyroidectomy';
type GlucoseUnit = 'mmol/L' | 'mg/dL';

const thyroidConditions: { value: ThyroidCondition; label: string; description: string }[] = [
  { value: 'none', label: 'No Diagnosed Condition', description: 'Standard metabolic rate assumed.' },
  { value: 'hypothyroid', label: 'Hypothyroidism', description: 'Underactive thyroid, may slow metabolism.' },
  { value: 'hyperthyroid', label: 'Hyperthyroidism', description: 'Overactive thyroid, may speed up metabolism.' },
  { value: 'hashimotos', label: "Hashimoto's Thyroiditis", description: 'Autoimmune condition often leading to hypothyroidism.' },
  { value: 'graves', label: "Graves' Disease", description: 'Autoimmune condition causing hyperthyroidism.' },
  { value: 'post-thyroidectomy', label: 'Post-Thyroidectomy', description: 'Surgical removal of the thyroid.' },
];

const TSHReference = { normal: { min: 0.4, max: 4.0 } };
const MG_DL_CONVERSION_FACTOR = 18.0182;

interface TSHLog { date: string; level: number; }

// --- Helper Components ---
const InfoTooltip = ({ children }: { children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-4 w-4 text-gray-400 cursor-pointer ml-2" />
    </TooltipTrigger>
    <TooltipContent className="w-64">
      <p>{children}</p>
    </TooltipContent>
  </Tooltip>
);

// --- Main Component ---
export default function ThyroidPage() {
  const [condition, setCondition] = useState<ThyroidCondition>('none');
  const [tshLevel, setTshLevel] = useState<string>('');
  const [tshHistory, setTshHistory] = useState<TSHLog[]>([
    { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], level: 4.8 },
    { date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], level: 3.2 },
  ]);
  const [manualDelay, setManualDelay] = useState<string>('');
  const [glucoseUnit, setGlucoseUnit] = useState<GlucoseUnit>('mmol/L');
  const [bolusTime, setBolusTime] = useState<string>('15');

  const gastricEmptyingModifier = useMemo(() => {
    if (manualDelay !== '' && !isNaN(parseInt(manualDelay, 10))) {
      const delay = parseInt(manualDelay, 10);
      return { delay, label: `${delay >= 0 ? '+' : ''}${delay} min (Manual)` };
    }
    switch (condition) {
      case 'hypothyroid': case 'hashimotos': return { delay: 20, label: '+20 min delay' };
      case 'hyperthyroid': case 'graves': return { delay: -15, label: '-15 min acceleration' };
      default: return { delay: 0, label: 'Normal' };
    }
  }, [condition, manualDelay]);

  const adjustedBolusTime = useMemo(() => {
    const baseTime = parseInt(bolusTime, 10) || 0;
    return baseTime + gastricEmptyingModifier.delay;
  }, [bolusTime, gastricEmptyingModifier.delay]);

  const getTshStatus = (level: number) => {
    if (isNaN(level)) return { text: 'N/A', color: 'text-slate-500' };
    if (level > TSHReference.normal.max) return { text: 'High', color: 'text-amber-600' };
    if (level < TSHReference.normal.min) return { text: 'Low', color: 'text-red-600' };
    return { text: 'Normal', color: 'text-teal-600' };
  };

  const handleAddTsh = () => {
    const level = parseFloat(tshLevel);
    if (!isNaN(level) && level > 0) {
      setTshHistory(prev => [...prev, { date: new Date().toISOString().split('T')[0], level }].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setTshLevel('');
      toast.success("TSH level logged successfully!");
    } else {
      toast.error("Please enter a valid TSH level.");
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen text-gray-800">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-navy">Thyroid & Diabetes Co-Management</h1>
            <p className="text-slate-600">Navigating the interplay between thyroid health and glucose control.</p>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <span className={`text-sm font-medium ${glucoseUnit === 'mmol/L' ? 'text-teal-600' : 'text-slate-400'}`}>mmol/L</span>
            <Switch checked={glucoseUnit === 'mg/dL'} onCheckedChange={(checked) => setGlucoseUnit(checked ? 'mg/dL' : 'mmol/L')} id="glucose-unit-switch" />
            <span className={`text-sm font-medium ${glucoseUnit === 'mg/dL' ? 'text-teal-600' : 'text-slate-400'}`}>mg/dL</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5 text-teal-600" />Thyroid Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-700">Select your diagnosed thyroid condition to tailor the platform's calculations and educational content.</p>
                <Select onValueChange={(value) => setCondition(value as ThyroidCondition)} defaultValue={condition}>
                  <SelectTrigger className="w-full md:w-2/3"><SelectValue placeholder="Select a condition..." /></SelectTrigger>
                  <SelectContent>{thyroidConditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2 h-4">{thyroidConditions.find(c => c.value === condition)?.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5 text-teal-600" />Gastric Emptying & Glucose Curve</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className='text-center p-6 bg-teal-50/50 rounded-lg border'>
                    <p className='text-base font-semibold text-navy flex items-center justify-center'>Estimated Post-Meal Spike Shift <InfoTooltip>Thyroid status can alter how quickly your stomach empties, shifting the timing of post-meal glucose spikes.</InfoTooltip></p>
                    <p className={`text-4xl font-bold ${gastricEmptyingModifier.delay > 0 ? 'text-amber-600' : gastricEmptyingModifier.delay < 0 ? 'text-red-600' : 'text-teal-600'}`}>{gastricEmptyingModifier.label}</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 relative">
                        <div className="absolute text-xs -top-5 text-slate-500" style={{ left: 'calc(50% - 20px)' }}>Normal</div>
                        <div className="absolute h-3.5 w-3.5 bg-slate-500 rounded-full -top-1 border-2 border-white" style={{ left: '50%' }} />
                        <div className={`absolute h-3.5 w-3.5 ${gastricEmptyingModifier.delay > 0 ? 'bg-amber-600' : gastricEmptyingModifier.delay < 0 ? 'bg-red-600' : 'bg-teal-600'} rounded-full -top-1 border-2 border-white transition-all duration-500`} style={{ left: `calc(50% + ${gastricEmptyingModifier.delay / 1.5}px)`}} />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium flex items-center" htmlFor="manual-delay">Manual Gastric Delay Override <InfoTooltip>If you consistently observe a different delay in your glucose spike after meals, enter it here in minutes.</InfoTooltip></label>
                    <div className="flex items-center space-x-2 mt-1">
                        <Input id="manual-delay" type="number" placeholder="e.g., 30 for +30min" value={manualDelay} onChange={e => setManualDelay(e.target.value)} className="w-48" />
                        <Button variant="outline" size="sm" onClick={() => setManualDelay('')}>Clear</Button>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Calculator className="mr-2 h-5 w-5 text-teal-600" />Meal Timing Adjustment Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label htmlFor="bolus-time" className="text-sm font-medium">Typical Pre-bolus Time (minutes before eating)</label>
                        <Input id="bolus-time" type="number" value={bolusTime} onChange={e => setBolusTime(e.target.value)} className="mt-1 w-48" />
                    </div>
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                        <p className="font-semibold text-lg text-amber-800">Adjusted Pre-bolus Recommendation:</p>
                        <p className="text-2xl font-bold text-amber-900">{adjustedBolusTime} minutes before meal</p>
                        <p className="text-xs text-amber-700 mt-1">This is an educational estimate. Always follow your clinical guidance.</p>
                    </div>
                </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-amber-600" />TSH Level Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-3 flex items-center">Log your TSH levels to monitor trends. <InfoTooltip>Normal TSH range is typically {TSHReference.normal.min}-{TSHReference.normal.max} mIU/L. Levels can indicate hypo- or hyperthyroidism.</InfoTooltip></p>
                <div className="flex items-center space-x-2 mb-4">
                  <Input type="number" placeholder="New TSH level" value={tshLevel} onChange={(e) => setTshLevel(e.target.value)} />
                  <Button onClick={handleAddTsh}>Log</Button>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Recent History:</h4>
                    {tshHistory.length > 0 ? (
                        <ul className="text-sm space-y-1">{tshHistory.slice(0, 5).map((log, i) => (
                            <li key={i} className="flex justify-between"><span>{log.date}:</span> <span className={`font-medium ${getTshStatus(log.level).color}`}>{log.level} mIU/L ({getTshStatus(log.level).text})</span></li>
                        ))}</ul>
                    ) : <p className="text-xs text-slate-500">No TSH levels logged yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Pill className="mr-2 h-5 w-5 text-red-600" />Key Interaction Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Levothyroxine & Meal Timing</AlertTitle>
                  <AlertDescription>For optimal absorption, take Levothyroxine on an empty stomach, 30-60 minutes before your first meal. Food can decrease its absorption by up to 40%.</AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Insulin Sensitivity Advisory</AlertTitle>
                  <AlertDescription>Adjusting thyroid medication dosage can alter insulin sensitivity for 4-6 weeks. Increased vigilance in glucose monitoring is recommended during this period.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-teal-600" />Educational Corner</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-3">
                  <p>The thyroid and pancreas are metabolic powerhouses. Thyroid hormones directly influence how your body uses glucose and responds to insulin.</p>
                  <p><strong>Hypothyroidism (underactive):</strong> Often slows metabolism, which can decrease insulin clearance and potentially lead to more prolonged periods of hypoglycemia after an insulin dose.</p>
                  <p><strong>Hyperthyroidism (overactive):</strong> Can accelerate metabolism, increasing glucose production by the liver and speeding up insulin breakdown, often requiring higher insulin doses.</p>
              </CardContent>
            </Card>

            <div className="text-xs text-slate-500 p-2 text-center space-y-1">
              <p><strong>Disclaimer:</strong> GluMira™ is an educational platform and not a medical device. All information is for educational purposes only. Consult a qualified healthcare provider for medical advice.</p>
              <p>Partnership Target: <a href="https://www.thyroid.org" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">American Thyroid Association</a> | Contact: <a href="mailto:dev@glumira.ai" className="text-teal-600 hover:underline">dev@glumira.ai</a></p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
