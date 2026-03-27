"use client";

import { useState } from "react";
import { useTravelZones } from "@/hooks/useTravelZones";

const TIMEZONES = [
  { label: "UTC-12 (Baker Island)", value: -12 },
  { label: "UTC-10 (Hawaii)", value: -10 },
  { label: "UTC-8 (PST)", value: -8 },
  { label: "UTC-7 (MST)", value: -7 },
  { label: "UTC-6 (CST)", value: -6 },
  { label: "UTC-5 (EST)", value: -5 },
  { label: "UTC-3 (Brazil)", value: -3 },
  { label: "UTC+0 (GMT/UTC)", value: 0 },
  { label: "UTC+1 (CET)", value: 1 },
  { label: "UTC+2 (SAST/EET)", value: 2 },
  { label: "UTC+3 (EAT/MSK)", value: 3 },
  { label: "UTC+4 (GST)", value: 4 },
  { label: "UTC+5:30 (IST)", value: 5.5 },
  { label: "UTC+8 (CST/AWST)", value: 8 },
  { label: "UTC+9 (JST)", value: 9 },
  { label: "UTC+10 (AEST)", value: 10 },
  { label: "UTC+12 (NZST)", value: 12 },
];

export default function TravelZonesPage() {
  const { advice, loading, error, getAdvice } = useTravelZones();
  const [form, setForm] = useState({
    originTimezoneOffset: "2",
    destinationTimezoneOffset: "0",
    departureHour: "10",
    flightDurationHours: "6",
    basalDoseTime: "22",
    basalDoseUnits: "24",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getAdvice({
      originTimezoneOffset: Number(form.originTimezoneOffset),
      destinationTimezoneOffset: Number(form.destinationTimezoneOffset),
      departureHour: Number(form.departureHour),
      flightDurationHours: Number(form.flightDurationHours),
      basalDoseTime: Number(form.basalDoseTime),
      basalDoseUnits: Number(form.basalDoseUnits),
    });
  };

  const riskBg: Record<string, string> = {
    low: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-amber-100 text-amber-800 border-amber-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Travel Zone Planner</h1>
      <p className="text-gray-600">
        Plan your insulin schedule for travel across time zones.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin Timezone</label>
            <select value={form.originTimezoneOffset}
              onChange={(e) => setForm({ ...form, originTimezoneOffset: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2">
              {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Timezone</label>
            <select value={form.destinationTimezoneOffset}
              onChange={(e) => setForm({ ...form, destinationTimezoneOffset: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2">
              {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Hour (0-23)</label>
            <input type="number" min="0" max="23" value={form.departureHour}
              onChange={(e) => setForm({ ...form, departureHour: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flight Duration (hours)</label>
            <input type="number" step="0.5" value={form.flightDurationHours}
              onChange={(e) => setForm({ ...form, flightDurationHours: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basal Dose Time (0-23)</label>
            <input type="number" min="0" max="23" value={form.basalDoseTime}
              onChange={(e) => setForm({ ...form, basalDoseTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basal Dose (units)</label>
            <input type="number" step="0.5" value={form.basalDoseUnits}
              onChange={(e) => setForm({ ...form, basalDoseUnits: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Calculating..." : "Get Travel Advice"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {advice && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${riskBg[advice.risk]}`}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold capitalize">{advice.risk} Risk</p>
              <span className="text-sm">{advice.direction === "east" ? "Eastward" : "Westward"} — {advice.hoursDifference}h shift</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{advice.monitoringFrequencyHours}h</p>
              <p className="text-gray-600">Glucose Checks</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{advice.basalAdjustment.newDoseTime}:00</p>
              <p className="text-gray-600">New Dose Time</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-1">Basal Adjustment</h3>
            <p className="text-sm text-blue-700">{advice.basalAdjustment.explanation}</p>
            {advice.basalAdjustment.unitsChange !== 0 && (
              <p className="mt-1 text-sm font-medium text-blue-800">
                Units change: {advice.basalAdjustment.unitsChange > 0 ? "+" : ""}{advice.basalAdjustment.unitsChange}u
              </p>
            )}
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-1">Meal Timing</h3>
            <p className="text-sm text-gray-700">{advice.mealTimingAdvice}</p>
          </div>

          {advice.warnings.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {advice.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside text-sm text-teal-700 space-y-1">
              {advice.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <p className="text-xs text-gray-400 text-center">
            GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
            Always discuss travel plans with your diabetes team.
          </p>
        </div>
      )}
    </div>
  );
}
