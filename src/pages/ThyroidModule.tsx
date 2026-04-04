import React, { useState, useMemo } from "react";
import {
  calculateThyroidInsulinImpact,
  assessHashimotoOverlap,
  generateThyroidMonitoringPlan,
  type ThyroidProfile,
} from "../lib/thyroid-impact";

type Condition = ThyroidProfile["condition"];

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "euthyroid", label: "Normal (Euthyroid)" },
  { value: "hypothyroid", label: "Hypothyroid" },
  { value: "hyperthyroid", label: "Hyperthyroid" },
  { value: "hashimotos", label: "Hashimoto's Thyroiditis" },
];

function TshIndicator({ tsh }: { tsh: number }) {
  const isLow = tsh < 0.4;
  const isHigh = tsh > 4.0;
  const isNormal = !isLow && !isHigh;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 rounded-full bg-gray-200 relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            isLow ? "bg-amber-400 w-1/4" : isHigh ? "bg-red-400 w-full" : "bg-emerald-400"
          }`}
          style={{
            width: isNormal
              ? `${Math.min(((tsh - 0.4) / 3.6) * 100, 100)}%`
              : isLow
              ? "15%"
              : "100%",
          }}
        />
      </div>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isLow
            ? "bg-amber-50 text-amber-700"
            : isHigh
            ? "bg-red-50 text-red-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {isLow ? "Low" : isHigh ? "High" : "Normal"}
      </span>
    </div>
  );
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#1A2A5E] hover:bg-gray-50 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
}

export default function ThyroidModule() {
  const [condition, setCondition] = useState<Condition>("euthyroid");
  const [tsh, setTsh] = useState<number>(2.5);
  const [t4, setT4] = useState<number>(8);
  const [onMedication, setOnMedication] = useState(false);
  const [isDoseChanging, setIsDoseChanging] = useState(false);
  const [currentISF, setCurrentISF] = useState<number>(50);
  const [lastTshDate, setLastTshDate] = useState("2026-03-01");
  const [t1dYears, setT1dYears] = useState<number>(5);

  const impact = useMemo(() => calculateThyroidInsulinImpact(tsh, currentISF), [tsh, currentISF]);

  const hashimoto = useMemo(
    () => assessHashimotoOverlap(condition === "hashimotos", t1dYears),
    [condition, t1dYears]
  );

  const monitoringPlan = useMemo(
    () => generateThyroidMonitoringPlan(lastTshDate, onMedication, isDoseChanging),
    [lastTshDate, onMedication, isDoseChanging]
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1A2A5E]">Thyroid Module</h1>
          <p className="text-sm text-gray-500 mt-1">
            Understand how your thyroid function affects your insulin needs.
          </p>
        </div>

        {/* My Thyroid Profile */}
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#1A2A5E]">My Thyroid Profile</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              TSH Level (mIU/L)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={tsh}
              onChange={(e) => setTsh(parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
            />
            <TshIndicator tsh={tsh} />
            <p className="text-xs text-gray-400 mt-1">Reference range: 0.4 - 4.0 mIU/L</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Free T4 (pmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={t4}
              onChange={(e) => setT4(parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onMedication}
                onChange={(e) => setOnMedication(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#1A2A5E] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
            <span className="text-sm text-[#1A2A5E]">On thyroid medication</span>
          </div>

          {onMedication && (
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDoseChanging}
                  onChange={(e) => setIsDoseChanging(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#1A2A5E] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className="text-sm text-[#1A2A5E]">Currently adjusting dose</span>
            </div>
          )}
        </section>

        {/* Insulin Sensitivity Impact */}
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#1A2A5E]">Insulin Sensitivity Impact</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Your current ISF (mg/dL per unit)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="500"
              value={currentISF}
              onChange={(e) => setCurrentISF(parseFloat(e.target.value) || 1)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#F8F9FA] rounded-lg p-3">
              <p className="text-xs text-gray-500">Current ISF</p>
              <p className="text-xl font-bold text-[#1A2A5E]">{currentISF}</p>
            </div>
            <div className="bg-[#F8F9FA] rounded-lg p-3">
              <p className="text-xs text-gray-500">Adjusted ISF</p>
              <p className="text-xl font-bold text-[#1A2A5E]">{impact.adjustedISF}</p>
            </div>
            <div className="bg-[#F8F9FA] rounded-lg p-3">
              <p className="text-xs text-gray-500">Change</p>
              <p
                className={`text-xl font-bold ${
                  impact.direction === "decreased"
                    ? "text-red-500"
                    : impact.direction === "increased"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {impact.change === 0 ? "--" : `${impact.change}%`}
              </p>
            </div>
          </div>

          {impact.direction === "decreased" && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
              Your hypothyroid state may be causing insulin resistance. You may need{" "}
              <strong>more insulin</strong> than usual. Watch for persistent highs.
            </div>
          )}
          {impact.direction === "increased" && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
              Your hyperthyroid state may be increasing insulin sensitivity. You may need{" "}
              <strong>less insulin</strong> than usual. Watch for unexpected lows.
            </div>
          )}
          {impact.direction === "none" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
              Your TSH is within the normal range. No thyroid-related insulin adjustment needed.
            </div>
          )}
        </section>

        {/* Monitoring Schedule */}
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#1A2A5E]">Monitoring Schedule</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last TSH test date</label>
            <input
              type="date"
              value={lastTshDate}
              onChange={(e) => setLastTshDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
            />
          </div>

          <div className="space-y-2">
            {monitoringPlan.map((item, i) => {
              const isPast = new Date(item.dueDate) < new Date();
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isPast ? "border-red-200 bg-red-50" : "border-gray-100 bg-[#F8F9FA]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A2A5E]">{item.test}</p>
                    <p className={`text-xs ${isPast ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {isPast ? "Overdue" : "Due"}: {item.dueDate}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : item.priority === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hashimoto + T1D Overlap */}
        {condition === "hashimotos" && (
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[#1A2A5E]">Hashimoto's + T1D Overlap</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Years since T1D diagnosis
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="80"
                value={t1dYears}
                onChange={(e) => setT1dYears(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A2A5E] focus:outline-none focus:ring-2 focus:ring-[#1A2A5E]/20"
              />
            </div>

            <div
              className={`p-4 rounded-lg border text-sm ${
                hashimoto.riskLevel === "elevated"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : hashimoto.riskLevel === "watch"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              <p className="font-semibold mb-1">
                Risk level:{" "}
                <span className="uppercase tracking-wide">{hashimoto.riskLevel}</span>
              </p>
              <p>{hashimoto.message}</p>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Hashimoto's thyroiditis and Type 1 diabetes are both autoimmune conditions driven by
                the immune system attacking the body's own tissues. Having one increases the
                likelihood of developing the other.
              </p>
              <p>
                During thyroid flares, your blood glucose may become harder to manage. Periods of
                thyroid instability often coincide with increased insulin resistance or unexpected
                lows.
              </p>
            </div>
          </section>
        )}

        {/* Educational Accordion */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[#1A2A5E] mb-3">
            How thyroid function affects your insulin needs
          </h2>

          <AccordionItem title="Hypothyroidism and insulin resistance">
            <p>
              When your thyroid is underactive (high TSH), your metabolism slows down. This often
              leads to increased insulin resistance, meaning your usual insulin doses may not lower
              your blood glucose as effectively. You may notice persistent highs and may need to
              increase your basal and bolus doses by 10-20% until your thyroid levels stabilise.
            </p>
          </AccordionItem>

          <AccordionItem title="Hyperthyroidism and hypoglycaemia risk">
            <p>
              An overactive thyroid (low TSH) speeds up your metabolism, which can increase insulin
              sensitivity. This means your usual insulin doses may cause unexpected lows. You may
              need to reduce doses by 10-20% and monitor more frequently, especially overnight and
              after exercise.
            </p>
          </AccordionItem>

          <AccordionItem title="Thyroid medication changes and insulin timing">
            <p>
              When your doctor adjusts your thyroid medication (e.g., levothyroxine dose change), it
              takes 4-6 weeks for the full effect on your metabolism. During this transition, review
              your insulin doses every 2 weeks. Keep a closer eye on your CGM trends and be prepared
              to adjust basal rates and correction factors.
            </p>
          </AccordionItem>

          <AccordionItem title="Autoimmune connection: T1D and thyroid disease">
            <p>
              About 15-30% of people with Type 1 diabetes develop thyroid autoimmunity. Both
              conditions involve the immune system attacking healthy tissue. Annual thyroid screening
              (TSH + antibodies) is recommended for everyone with T1D, even if you have no thyroid
              symptoms.
            </p>
          </AccordionItem>

          <AccordionItem title="When to contact your care team">
            <p>
              Reach out to your endocrinologist if you experience unexplained blood glucose pattern
              changes lasting more than a week, significant weight changes without dietary changes,
              new fatigue or energy changes, or if your TSH result is outside the reference range.
              Never adjust thyroid medication without medical guidance.
            </p>
          </AccordionItem>
        </section>

        {/* Disclaimer */}
        <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-600 mb-1">Disclaimer</p>
          <p>
            This module provides educational information about the relationship between thyroid
            function and insulin management. It does not replace professional medical advice. All
            insulin dose adjustments should be discussed with your endocrinologist or diabetes care
            team. The calculations shown are estimates based on general population data and may not
            reflect your individual response. Always verify with lab work and clinical guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
