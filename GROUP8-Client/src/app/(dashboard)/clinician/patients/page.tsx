/**
 * GluMira™ Clinician — Patient List Page
 * Version: 7.0.0
 *
 * Route: /clinician/patients
 * Access: clinician or admin role only
 *
 * Displays:
 *  - Searchable, sortable patient list
 *  - TIR badge per patient (colour-coded)
 *  - Last glucose reading + timestamp
 *  - Active IOB indicator
 *  - Link to individual patient clinician view
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────

interface PatientSummary {
  userId: string;
  displayName: string;
  participantId: string;
  diabetesType: string;
  regimeId: string;
  tirPercent: number | null;
  lastGlucose: number | null;
  lastGlucoseAt: string | null;
  activeIob: number | null;
  status: "active" | "inactive" | "pending";
}

// ─── TIR badge ────────────────────────────────────────────────

function TirBadge({ tir }: { tir: number | null }) {
  if (tir === null) return <span className="text-xs text-gray-400">—</span>;
  const colour =
    tir >= 70 ? "bg-green-100 text-green-700" :
    tir >= 50 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colour}`}>
      {tir}% TIR
    </span>
  );
}

// ─── Glucose colour ───────────────────────────────────────────

function glucoseColour(mmol: number | null): string {
  if (mmol === null) return "text-gray-400";
  if (mmol < 3.9) return "text-red-600 font-bold";
  if (mmol > 10.0) return "text-amber-600 font-semibold";
  return "text-green-700 font-semibold";
}

// ─── Page ─────────────────────────────────────────────────────

export default function ClinicianPatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "tir" | "lastReading">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clinician/patients");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(data.patients ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Filter + sort
  const filtered = patients
    .filter((p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.participantId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name")        cmp = a.displayName.localeCompare(b.displayName);
      if (sortBy === "tir")         cmp = (a.tirPercent ?? -1) - (b.tirPercent ?? -1);
      if (sortBy === "lastReading") cmp = (a.lastGlucose ?? -1) - (b.lastGlucose ?? -1);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const sortIcon = (col: typeof sortBy) =>
    sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patient List</h1>
          <p className="text-[10px] text-glumira-blue font-medium">The science of insulin, made visible</p>
          <p className="text-xs text-gray-500 mt-0.5">Clinician view — GluMira™ Pro</p>
        </div>
        <button
          onClick={fetchPatients}
          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or participant ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No patients found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort("name")}
                >
                  Patient{sortIcon("name")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Regime</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort("tir")}
                >
                  TIR (14d){sortIcon("tir")}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort("lastReading")}
                >
                  Last BG{sortIcon("lastReading")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">IOB</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.displayName}</p>
                    <p className="text-xs text-gray-400">{p.participantId}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.diabetesType}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                    {p.regimeId.replace(/-/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <TirBadge tir={p.tirPercent} />
                  </td>
                  <td className="px-4 py-3">
                    {p.lastGlucose !== null ? (
                      <div>
                        <span className={glucoseColour(p.lastGlucose)}>
                          {p.lastGlucose.toFixed(1)} mmol/L
                        </span>
                        {p.lastGlucoseAt && (
                          <p className="text-xs text-gray-400">
                            {new Date(p.lastGlucoseAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.activeIob !== null ? (
                      <span className={`text-xs font-semibold ${p.activeIob > 5 ? "text-red-600" : p.activeIob > 2 ? "text-amber-600" : "text-green-700"}`}>
                        {p.activeIob.toFixed(2)}U
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "active"   ? "bg-green-50 text-green-700" :
                      p.status === "pending"  ? "bg-amber-50 text-amber-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clinician?patient=${p.userId}`}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {patients.length} patients
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Always follow clinical protocols.
      </p>
    </div>
  );
}
