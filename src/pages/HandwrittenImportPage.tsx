/**
 * GluMira™ V7 — Handwritten Import Page
 * Capture photo of handwritten logbook, manually enter data from reference image.
 * Full OCR is future phase — this provides structured manual entry.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Row {
  time: string;
  glucose: string;
  insulin_type: string;
  dose: string;
  food_notes: string;
}

const EMPTY_ROW: Row = { time: "", glucose: "", insulin_type: "", dose: "", food_notes: "" };

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 40, padding: "8px 10px", borderRadius: 6,
  border: "1px solid #dee2e6", background: "#ffffff", color: "#1a2a5e",
  fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

export default function HandwrittenImportPage() {
  const { session } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((r) => [...r, { ...EMPTY_ROW }]);
  }

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function importAll() {
    if (!session) return;
    setImporting(true);
    setError(null);
    setToast(null);
    try {
      const valid = rows.filter((r) => r.time);
      for (const row of valid) {
        await fetch("/trpc/mealLog.create", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            json: {
              meal_time: new Date(`${new Date().toISOString().slice(0, 10)}T${row.time}`).toISOString(),
              event_type: row.dose ? "meal_bolus" : "meal",
              insulin_type: row.insulin_type || null,
              units: row.dose ? parseFloat(row.dose) : null,
              glucose_value: row.glucose ? parseFloat(row.glucose) : null,
              glucose_units: "mmol",
              food_description: row.food_notes || null,
              carbs_g: null, protein_g: null, fat_g: null, fibre_g: null,
              low_treatment_type: null, low_treatment_grams: null,
              comment: "Imported from handwritten notes",
            },
          }),
        });
      }
      setToast(`${valid.length} entries imported successfully`);
      setTimeout(() => setToast(null), 4000);
      setRows([{ ...EMPTY_ROW }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 700, color: "#1a2a5e", margin: "0 0 4px" }}>
          Import Handwritten Notes
        </h1>
        <p style={{ fontSize: 14, color: "#52667a", margin: "0 0 20px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Take a photo of your logbook page, then enter the data below.
        </p>

        {/* Photo capture */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 20 }}>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer" }}>
            {photo ? (
              <img src={photo} alt="Logbook" loading="lazy" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, border: "1px solid #dee2e6" }} />
            ) : (
              <div style={{ width: "100%", height: 150, borderRadius: 8, border: "2px dashed #dee2e6", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{"\u{1F4F7}"} Tap to capture logbook page</span>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setPhoto(ev.target?.result as string);
              reader.readAsDataURL(file);
            }} />
          </label>
        </div>

        {/* Data entry rows */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 20 }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Enter data from your logbook:</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  {["Time", "Glucose", "Insulin", "Dose", "Food Notes"].map((h) => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 600, color: "#52667a", padding: "6px 4px", textAlign: "left", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: "4px 4px" }}><input type="time" value={row.time} onChange={(e) => updateRow(i, "time", e.target.value)} style={{ ...inputStyle, minWidth: 90 }} /></td>
                    <td style={{ padding: "4px 4px" }}><input type="number" step="any" value={row.glucose} onChange={(e) => updateRow(i, "glucose", e.target.value)} placeholder="mmol" style={{ ...inputStyle, minWidth: 70 }} /></td>
                    <td style={{ padding: "4px 4px" }}><input value={row.insulin_type} onChange={(e) => updateRow(i, "insulin_type", e.target.value)} placeholder="e.g. Fiasp" style={{ ...inputStyle, minWidth: 80 }} /></td>
                    <td style={{ padding: "4px 4px" }}><input type="number" step="any" value={row.dose} onChange={(e) => updateRow(i, "dose", e.target.value)} placeholder="U" style={{ ...inputStyle, minWidth: 60 }} /></td>
                    <td style={{ padding: "4px 4px" }}><input value={row.food_notes} onChange={(e) => updateRow(i, "food_notes", e.target.value)} placeholder="Food" style={{ ...inputStyle, minWidth: 120 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 8, border: "1px solid #dee2e6", background: "#f8f9fa", color: "#1a2a5e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            + Add Row
          </button>
        </div>

        {error && <div style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", fontSize: 13, color: "#991b1b", marginBottom: 12 }}>{error}</div>}
        {toast && <div style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", fontSize: 13, color: "#166534", marginBottom: 12 }}>{toast}</div>}

        <button onClick={importAll} disabled={importing || rows.every((r) => !r.time)} style={{ width: "100%", minHeight: 52, borderRadius: 10, border: "none", background: importing ? "#94a3b8" : "#16a34a", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: importing ? "not-allowed" : "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {importing ? "Importing..." : "Import All to Meal Log"}
        </button>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
