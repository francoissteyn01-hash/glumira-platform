/**
 * GluMira™ Admin Participants Page
 * Version: 7.0.0
 *
 * Full beta participant management:
 *  - Status filter (all / active / pending / inactive)
 *  - Search by participant ID or display name
 *  - Activate / deactivate participants
 *  - Export CSV
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

type ParticipantStatus = "active" | "pending" | "inactive";

interface Participant {
  participantId: string;
  userId: string;
  displayName: string;
  diabetesType: string;
  regimeId: string;
  status: ParticipantStatus;
  enrolledAt: string | null;
  country: string | null;
  notes: string | null;
}

// ─── Status badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: ParticipantStatus }) {
  const map: Record<ParticipantStatus, string> = {
    active:   "bg-green-100 text-green-700",
    pending:  "bg-amber-100 text-amber-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── CSV export ───────────────────────────────────────────────

function exportCsv(participants: Participant[]) {
  const header = ["Participant ID", "Display Name", "Diabetes Type", "Regime", "Status", "Enrolled At", "Country"];
  const rows = participants.map((p) => [
    p.participantId,
    p.displayName,
    p.diabetesType,
    p.regimeId,
    p.status,
    p.enrolledAt ?? "",
    p.country ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `glumira-participants-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ParticipantStatus>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/participants?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setParticipants(json.participants ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load participants");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  // ── Status toggle ──────────────────────────────────────────

  const toggleStatus = async (p: Participant) => {
    const next: ParticipantStatus = p.status === "active" ? "inactive" : "active";
    setUpdating(p.participantId);
    try {
      const res = await fetch(`/api/admin/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: p.participantId, status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setParticipants((prev) =>
        prev.map((x) => x.participantId === p.participantId ? { ...x, status: next } : x)
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.participantId.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      p.country?.toLowerCase().includes(q)
    );
  });

  // ── Counts ─────────────────────────────────────────────────

  const counts = {
    all:      participants.length,
    active:   participants.filter((p) => p.status === "active").length,
    pending:  participants.filter((p) => p.status === "pending").length,
    inactive: participants.filter((p) => p.status === "inactive").length,
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Beta Participants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.all} total · {counts.active} active · {counts.pending} pending
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "active", "pending", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                statusFilter === s
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, name, country…"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 w-56"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={fetchParticipants} className="ml-3 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No participants found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Participant ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Regime</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Enrolled</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.participantId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.participantId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.diabetesType}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.regimeId}</td>
                  <td className="px-4 py-3 text-gray-500">{p.country ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.enrolledAt ? new Date(p.enrolledAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p)}
                      disabled={updating === p.participantId || p.status === "pending"}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        p.status === "active"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : p.status === "inactive"
                          ? "border-green-200 text-green-600 hover:bg-green-50"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {updating === p.participantId ? "…" :
                        p.status === "active" ? "Deactivate" :
                        p.status === "inactive" ? "Activate" : "Pending"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 italic">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
