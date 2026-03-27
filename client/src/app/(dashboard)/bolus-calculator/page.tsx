/**
 * GluMira™ — Bolus Calculator Page
 *
 * Dashboard page for the bolus calculator tool.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import BolusCalculatorForm from "@/components/BolusCalculatorForm";

export const metadata = {
  title: "Bolus Calculator — GluMira™",
  description: "Calculate meal and correction bolus doses",
};

export default function BolusCalculatorPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bolus Calculator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calculate meal and correction insulin doses based on your personal settings.
          Powered by IOB Hunter™.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <BolusCalculatorForm />
      </div>
    </div>
  );
}
