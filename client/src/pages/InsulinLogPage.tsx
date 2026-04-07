import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getBasalInsulins,
  getBolusInsulins,
} from "../lib/country-insulin-formulary";
import { DISCLAIMER } from "../lib/constants";
import UnitToggle, { convertGlucose } from "../components/UnitToggle";

/* ------------------------------------------------------------------ */
/*  API helper                                                         */
/* ------------------------------------------------------------------ */
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const TABS = [
  "Basal",
  "Meal Bolus",
  "Finger Stick",
  "Food Log",
  "Low Intervention",
  "Import Data",
] as const;

type Tab = (typeof TABS)[number];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Correction"] as const;
const FOOD_MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const BG_CONTEXTS = [
  "Fasting",
  "Pre-meal",
  "Post-meal (1h)",
  "Post-meal (2h)",
  "Bedtime",
  "Night check",
  "Low treatment check",
  "Other",
] as const;

const LOW_TREATMENTS = [
  "Dextab (1/4)",
  "Dextab (1/2)",
  "Dextab (full)",
  "Juice box",
  "Regular Coke",
  "Jelly beans",
  "Glucose gel",
  "Honey",
  "Glucose tabs",
  "Other food",
] as const;

const AMOUNT_UNITS = ["g", "mg", "ml"] as const;

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */
const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2ab5c1] focus:border-transparent outline-none";
const labelCls = "block text-xs uppercase tracking-wide text-[#718096] mb-1";
const cardCls = "bg-white rounded-xl border border-[#e2e8f0] p-4 space-y-4";
const ctaBtnCls =
  "w-full rounded-lg bg-[#f59e0b] text-white font-semibold py-2.5 px-4 text-sm hover:bg-[#e08e00] transition-colors";
const deleteBtnCls =
  "text-xs text-red-500 hover:text-red-700 transition-colors";

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeToISO(time: string): string {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */
export default function InsulinLogPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Basal");

  /* ---- Basal state ---- */
  const basalInsulins = getBasalInsulins("ZA");
  const [basalEntries, setBasalEntries] = useState<any[]>([]);
  const [basalInsulin, setBasalInsulin] = useState(basalInsulins[0] ?? "");
  const [basalDose, setBasalDose] = useState("");
  const [basalTime, setBasalTime] = useState(nowHHMM);

  /* ---- Bolus state ---- */
  const bolusInsulins = getBolusInsulins("ZA");
  const [bolusInsulin, setBolusInsulin] = useState(bolusInsulins[0] ?? "");
  const [bolusDose, setBolusDose] = useState("");
  const [bolusTime, setBolusTime] = useState(nowHHMM);
  const [bolusMealType, setBolusMealType] = useState<string>(MEAL_TYPES[0]);

  /* ---- Finger Stick state ---- */
  const [bgValue, setBgValue] = useState("");
  const [bgUnit, setBgUnit] = useState<"mmol/L" | "mg/dL">("mmol/L");
  const [bgTime, setBgTime] = useState(nowHHMM);
  const [bgContext, setBgContext] = useState<string>(BG_CONTEXTS[0]);

  /* ---- Food Log state ---- */
  const [foodMealType, setFoodMealType] = useState<string>(FOOD_MEAL_TYPES[0]);
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodFibre, setFoodFibre] = useState("");
  const [foodDesc, setFoodDesc] = useState("");
  const [foodTime, setFoodTime] = useState(nowHHMM);

  /* ---- Low Intervention state ---- */
  const [lowTreatment, setLowTreatment] = useState<string>(LOW_TREATMENTS[0]);
  const [lowAmount, setLowAmount] = useState("");
  const [lowAmountUnit, setLowAmountUnit] = useState<string>(AMOUNT_UNITS[0]);
  const [lowGlucBefore, setLowGlucBefore] = useState("");
  const [lowGlucAfter, setLowGlucAfter] = useState("");
  const [lowTime, setLowTime] = useState(nowHHMM);
  const [lowResolved, setLowResolved] = useState<"Yes" | "No" | "Pending">("Pending");

  /* ---- Import Data state ---- */
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [nsUrl, setNsUrl] = useState("");
  const [nsSecret, setNsSecret] = useState("");
  const [nsStatus, setNsStatus] = useState<string | null>(null);
  const [nsSyncBG, setNsSyncBG] = useState(true);
  const [nsSyncTreatments, setNsSyncTreatments] = useState(true);
  const [nsSyncProfile, setNsSyncProfile] = useState(false);
  const [nsAutoSync, setNsAutoSync] = useState(false);

  /* ---- General ---- */
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  /* Load today's basal entries */
  const fetchBasalEntries = useCallback(async () => {
    try {
      const data = await apiFetch("/api/insulin-log?type=basal&today=true");
      setBasalEntries(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchBasalEntries();
  }, [fetchBasalEntries]);

  /* Helpers */
  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  /* ---- Handlers ---- */
  const handleAddBasal = async () => {
    if (!basalDose) return;
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log", {
        method: "POST",
        body: JSON.stringify({
          insulin_name: basalInsulin,
          dose: Number(basalDose),
          administered_at: timeToISO(basalTime),
        }),
      });
      setBasalDose("");
      setBasalTime(nowHHMM());
      flash("Basal dose logged.");
      fetchBasalEntries();
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBasal = async (id: string) => {
    try {
      await apiFetch(`/api/insulin-log/${id}`, { method: "DELETE" });
      fetchBasalEntries();
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    }
  };

  const handleAddBolus = async () => {
    if (!bolusDose) return;
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/bolus", {
        method: "POST",
        body: JSON.stringify({
          insulin_name: bolusInsulin,
          dose: Number(bolusDose),
          administered_at: timeToISO(bolusTime),
          meal_type: bolusMealType,
        }),
      });
      setBolusDose("");
      setBolusTime(nowHHMM());
      flash("Bolus logged.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogBG = async () => {
    if (!bgValue) return;
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/bg", {
        method: "POST",
        body: JSON.stringify({
          value: Number(bgValue),
          unit: bgUnit,
          measured_at: timeToISO(bgTime),
          context: bgContext,
        }),
      });
      setBgValue("");
      setBgTime(nowHHMM());
      flash("BG reading logged.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogFood = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/food", {
        method: "POST",
        body: JSON.stringify({
          meal_type: foodMealType,
          carbs_g: Number(foodCarbs) || 0,
          protein_g: Number(foodProtein) || 0,
          fat_g: Number(foodFat) || 0,
          fibre_g: Number(foodFibre) || 0,
          description: foodDesc,
          logged_at: timeToISO(foodTime),
        }),
      });
      setFoodCarbs("");
      setFoodProtein("");
      setFoodFat("");
      setFoodFibre("");
      setFoodDesc("");
      setFoodTime(nowHHMM());
      flash("Food logged.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogLow = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/low-intervention", {
        method: "POST",
        body: JSON.stringify({
          treatment_type: lowTreatment,
          amount: Number(lowAmount) || 0,
          amount_unit: lowAmountUnit,
          glucose_before: Number(lowGlucBefore) || null,
          glucose_after: Number(lowGlucAfter) || null,
          treated_at: timeToISO(lowTime),
          resolved: lowResolved,
        }),
      });
      setLowAmount("");
      setLowGlucBefore("");
      setLowGlucAfter("");
      setLowTime(nowHHMM());
      setLowResolved("Pending");
      flash("Low intervention logged.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* CSV parsing */
  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = vals[i]?.trim() ?? "";
        });
        return row;
      });
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleClarityImport = async () => {
    if (!csvRows.length) return;
    setLoading(true);
    try {
      const data = await apiFetch("/api/insulin-log/clarity/import", {
        method: "POST",
        body: JSON.stringify({ rows: csvRows }),
      });
      setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 });
      flash("Import complete.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNSTest = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/insulin-log/nightscout/test", {
        method: "POST",
        body: JSON.stringify({ url: nsUrl, api_secret: nsSecret }),
      });
      setNsStatus(data.status ?? "Connected");
    } catch (e: any) {
      setNsStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNSSync = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/nightscout/sync", {
        method: "POST",
        body: JSON.stringify({
          url: nsUrl,
          api_secret: nsSecret,
          sync_bg: nsSyncBG,
          sync_treatments: nsSyncTreatments,
          sync_profile: nsSyncProfile,
        }),
      });
      flash("Nightscout sync started.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNSSaveConfig = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/insulin-log/nightscout/config", {
        method: "PUT",
        body: JSON.stringify({
          url: nsUrl,
          api_secret: nsSecret,
          sync_bg: nsSyncBG,
          sync_treatments: nsSyncTreatments,
          sync_profile: nsSyncProfile,
          auto_sync: nsAutoSync,
        }),
      });
      flash("Nightscout config saved.");
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* BG low check */
  const bgIsLow =
    bgValue !== "" &&
    ((bgUnit === "mmol/L" && Number(bgValue) <= 3.9) ||
      (bgUnit === "mg/dL" && Number(bgValue) <= 70));

  /* Basal summary */
  const basalTotalUnits = basalEntries.reduce((s, e) => s + (Number(e.dose) || 0), 0);
  const basalInjections = basalEntries.length;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a2a5e]">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a2a5e] text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {feedback}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-bold">Insulin Log</h1>

        {/* ---- Tab bar ---- */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 min-w-max border-b border-[#e2e8f0]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-[#2ab5c1] text-[#1a2a5e]"
                    : "text-[#718096]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  TAB 1: BASAL                                                 */}
        {/* ============================================================ */}
        {activeTab === "Basal" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <div className={`${cardCls} flex-1 text-center`}>
                <p className={labelCls}>Total units today</p>
                <p className="text-2xl font-bold">{basalTotalUnits.toFixed(2)}</p>
              </div>
              <div className={`${cardCls} flex-1 text-center`}>
                <p className={labelCls}>Injections</p>
                <p className="text-2xl font-bold">{basalInjections}</p>
              </div>
            </div>

            {/* Form */}
            <div className={cardCls}>
              <div>
                <label className={labelCls}>Insulin type</label>
                <select
                  className={inputCls}
                  value={basalInsulin}
                  onChange={(e) => setBasalInsulin(e.target.value)}
                >
                  {basalInsulins.map((ins: string) => (
                    <option key={ins} value={ins}>
                      {ins}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Dose (units)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  className={inputCls}
                  value={basalDose}
                  onChange={(e) => setBasalDose(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <label className={labelCls}>Time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={basalTime}
                  onChange={(e) => setBasalTime(e.target.value)}
                />
              </div>

              <button
                className={ctaBtnCls}
                onClick={handleAddBasal}
                disabled={loading}
              >
                {loading ? "Saving…" : "Add Dose"}
              </button>
            </div>

            {/* Entries list */}
            {basalEntries.length > 0 && (
              <div className={cardCls}>
                <p className={labelCls}>Today&rsquo;s entries</p>
                <ul className="divide-y divide-[#e2e8f0]">
                  {basalEntries.map((entry: any) => (
                    <li
                      key={entry.id ?? entry._id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          {entry.insulin_name}
                        </span>
                        <span className="ml-2 text-sm text-[#718096]">
                          {entry.dose}u
                        </span>
                        <span className="ml-2 text-xs text-[#718096]">
                          {new Date(entry.administered_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <button
                        className={deleteBtnCls}
                        onClick={() => handleDeleteBasal(entry.id ?? entry._id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 2: MEAL BOLUS                                            */}
        {/* ============================================================ */}
        {activeTab === "Meal Bolus" && (
          <div className={cardCls}>
            <div>
              <label className={labelCls}>Insulin type</label>
              <select
                className={inputCls}
                value={bolusInsulin}
                onChange={(e) => setBolusInsulin(e.target.value)}
              >
                {bolusInsulins.map((ins: string) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Dose (units)</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                className={inputCls}
                value={bolusDose}
                onChange={(e) => setBolusDose(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>

            <div>
              <label className={labelCls}>Time</label>
              <input
                type="time"
                className={inputCls}
                value={bolusTime}
                onChange={(e) => setBolusTime(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Meal type</label>
              <select
                className={inputCls}
                value={bolusMealType}
                onChange={(e) => setBolusMealType(e.target.value)}
              >
                {MEAL_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={ctaBtnCls}
              onClick={handleAddBolus}
              disabled={loading}
            >
              {loading ? "Saving…" : "Log Bolus"}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 3: FINGER STICK / BG                                     */}
        {/* ============================================================ */}
        {activeTab === "Finger Stick" && (
          <div className={cardCls}>
            <div>
              <label className={labelCls}>Glucose value</label>
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={bgValue}
                onChange={(e) => setBgValue(e.target.value)}
                placeholder={bgUnit === "mmol/L" ? "e.g. 5.6" : "e.g. 101"}
              />
            </div>

            <div>
              <label className={labelCls}>Unit</label>
              <UnitToggle
                value={bgUnit}
                onChange={(u: "mmol/L" | "mg/dL") => {
                  if (bgValue) {
                    const converted = convertGlucose(Number(bgValue), bgUnit, u);
                    setBgValue(String(Math.round(converted * 10) / 10));
                  }
                  setBgUnit(u);
                }}
              />
            </div>

            <div>
              <label className={labelCls}>Time</label>
              <input
                type="time"
                className={inputCls}
                value={bgTime}
                onChange={(e) => setBgTime(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Context</label>
              <select
                className={inputCls}
                value={bgContext}
                onChange={(e) => setBgContext(e.target.value)}
              >
                {BG_CONTEXTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {bgIsLow && (
              <div className="rounded-lg bg-red-50 border border-red-300 p-3 text-sm text-red-700">
                <strong>Low glucose detected</strong> &mdash; log a low
                intervention?
              </div>
            )}

            <button
              className={ctaBtnCls}
              onClick={handleLogBG}
              disabled={loading}
            >
              {loading ? "Saving…" : "Log Reading"}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 4: FOOD LOG                                              */}
        {/* ============================================================ */}
        {activeTab === "Food Log" && (
          <div className={cardCls}>
            <div>
              <label className={labelCls}>Meal type</label>
              <select
                className={inputCls}
                value={foodMealType}
                onChange={(e) => setFoodMealType(e.target.value)}
              >
                {FOOD_MEAL_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Food regime</label>
              <p className="text-sm font-medium">Full Carb Count</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={foodCarbs}
                  onChange={(e) => setFoodCarbs(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={foodProtein}
                  onChange={(e) => setFoodProtein(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={foodFat}
                  onChange={(e) => setFoodFat(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Fibre (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={foodFibre}
                  onChange={(e) => setFoodFibre(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Food description</label>
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={foodDesc}
                onChange={(e) => setFoodDesc(e.target.value)}
                placeholder="Describe what you ate…"
              />
            </div>

            <div>
              <label className={labelCls}>Time</label>
              <input
                type="time"
                className={inputCls}
                value={foodTime}
                onChange={(e) => setFoodTime(e.target.value)}
              />
            </div>

            <button
              className={ctaBtnCls}
              onClick={handleLogFood}
              disabled={loading}
            >
              {loading ? "Saving…" : "Log Food"}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 5: LOW INTERVENTION                                      */}
        {/* ============================================================ */}
        {activeTab === "Low Intervention" && (
          <div className={cardCls}>
            <div>
              <label className={labelCls}>Treatment type</label>
              <select
                className={inputCls}
                value={lowTreatment}
                onChange={(e) => setLowTreatment(e.target.value)}
              >
                {LOW_TREATMENTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className={`${inputCls} flex-1`}
                  value={lowAmount}
                  onChange={(e) => setLowAmount(e.target.value)}
                />
                <select
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:ring-2 focus:ring-[#2ab5c1] focus:border-transparent outline-none"
                  value={lowAmountUnit}
                  onChange={(e) => setLowAmountUnit(e.target.value)}
                >
                  {AMOUNT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Glucose before</label>
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={lowGlucBefore}
                onChange={(e) => setLowGlucBefore(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Glucose after (15 min)</label>
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={lowGlucAfter}
                onChange={(e) => setLowGlucAfter(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Time</label>
              <input
                type="time"
                className={inputCls}
                value={lowTime}
                onChange={(e) => setLowTime(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Did it resolve?</label>
              <div className="flex gap-2">
                {(["Yes", "No", "Pending"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLowResolved(opt)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      lowResolved === opt
                        ? "bg-[#2ab5c1] text-white"
                        : "bg-[#f8f9fa] border border-gray-200 text-[#718096]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={ctaBtnCls}
              onClick={handleLogLow}
              disabled={loading}
            >
              {loading ? "Saving…" : "Log Intervention"}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 6: IMPORT DATA                                           */}
        {/* ============================================================ */}
        {activeTab === "Import Data" && (
          <div className="space-y-6">
            {/* Dexcom Clarity */}
            <div className={cardCls}>
              <h2 className="text-base font-semibold">Dexcom Clarity Import</h2>

              <div>
                <label className={labelCls}>CSV file</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVSelect}
                  className="block w-full text-sm text-[#718096] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f8f9fa] file:px-3 file:py-2 file:text-sm file:font-medium"
                />
                {csvFileName && (
                  <p className="mt-1 text-xs text-[#718096]">{csvFileName}</p>
                )}
              </div>

              {csvRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e2e8f0]">
                        {Object.keys(csvRows[0]).map((h) => (
                          <th
                            key={h}
                            className="text-left py-1 px-2 text-[#718096] font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-[#e2e8f0]">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="py-1 px-2">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 10 && (
                    <p className="text-xs text-[#718096] mt-1">
                      Showing 10 of {csvRows.length} rows
                    </p>
                  )}
                </div>
              )}

              <button
                className={ctaBtnCls}
                onClick={handleClarityImport}
                disabled={loading || csvRows.length === 0}
              >
                {loading ? "Importing…" : "Import"}
              </button>

              {importResult && (
                <p className="text-sm text-[#718096]">
                  {importResult.imported} imported, {importResult.skipped} skipped
                </p>
              )}
            </div>

            {/* Nightscout */}
            <div className={cardCls}>
              <h2 className="text-base font-semibold">Nightscout Connect</h2>

              <div>
                <label className={labelCls}>Nightscout URL</label>
                <input
                  type="text"
                  className={inputCls}
                  value={nsUrl}
                  onChange={(e) => setNsUrl(e.target.value)}
                  placeholder="https://your-site.herokuapp.com"
                />
              </div>

              <div>
                <label className={labelCls}>API Secret</label>
                <input
                  type="password"
                  className={inputCls}
                  value={nsSecret}
                  onChange={(e) => setNsSecret(e.target.value)}
                />
              </div>

              <button
                className="w-full rounded-lg border border-[#2ab5c1] text-[#2ab5c1] font-semibold py-2 px-4 text-sm hover:bg-[#2ab5c1] hover:text-white transition-colors"
                onClick={handleNSTest}
                disabled={loading}
              >
                {loading ? "Testing…" : "Test Connection"}
              </button>

              {nsStatus && (
                <p
                  className={`text-sm ${
                    nsStatus.startsWith("Error")
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {nsStatus}
                </p>
              )}

              <div className="space-y-2">
                <p className={labelCls}>Sync options</p>
                {[
                  { label: "BG entries", checked: nsSyncBG, set: setNsSyncBG },
                  {
                    label: "Treatments",
                    checked: nsSyncTreatments,
                    set: setNsSyncTreatments,
                  },
                  {
                    label: "Profile",
                    checked: nsSyncProfile,
                    set: setNsSyncProfile,
                  },
                ].map(({ label, checked, set }) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => set(e.target.checked)}
                      className="rounded border-gray-300 text-[#2ab5c1] focus:ring-[#2ab5c1]"
                    />
                    {label}
                  </label>
                ))}

                <label className="flex items-center gap-2 text-sm pt-2 border-t border-[#e2e8f0]">
                  <input
                    type="checkbox"
                    checked={nsAutoSync}
                    onChange={(e) => setNsAutoSync(e.target.checked)}
                    className="rounded border-gray-300 text-[#2ab5c1] focus:ring-[#2ab5c1]"
                  />
                  Auto-sync
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  className={`${ctaBtnCls} flex-1`}
                  onClick={handleNSSync}
                  disabled={loading}
                >
                  {loading ? "Syncing…" : "Sync Now"}
                </button>
                <button
                  className="flex-1 rounded-lg border border-[#2ab5c1] text-[#2ab5c1] font-semibold py-2.5 px-4 text-sm hover:bg-[#2ab5c1] hover:text-white transition-colors"
                  onClick={handleNSSaveConfig}
                  disabled={loading}
                >
                  Save Config
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- Disclaimer ---- */}
        <div className="mt-8 rounded-xl bg-white border border-[#e2e8f0] p-4">
          <p className="text-xs text-[#718096] leading-relaxed">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
