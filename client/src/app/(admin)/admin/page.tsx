/**
 * GluMira™ Admin Dashboard
 * Version: 7.0.0
 *
 * Displays:
 *  - Platform stats (users, readings, doses, active beta participants)
 *  - Beta feedback submissions (star rating, category, comment)
 *  - Beta participant list with status and Nightscout URL
 *  - Health check status widget
 *
 * Access: admin role only (enforced via Supabase RLS + server-side check)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface PlatformStats {
  totalUsers: number;
  activeUsers7d: number;
  totalReadings: number;
  totalDoses: number;
  betaParticipants: number;
  feedbackCount: number;
  avgFeedbackRating: number;
}

interface FeedbackItem {
  id: string;
  userId: string;
  rating: number;
  category: string;
  comment: string;
  createdAt: string;
}

interface BetaParticipant {
  id: string;
  participantId: string;
  email: string;
  nightscoutUrl?: string;
  status: "active" | "inactive" | "pending";
  joinedAt: string;
  lastActiveAt?: string;
}

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  supabase: boolean;
  database: boolean;
  uptime: number;
  version: string;
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  colour = "teal",
}: {
  label: string;
  value: string | number;
  sub?: string;
  colour?: "teal" | "blue" | "amber" | "green" | "purple";
}) {
  const colours: Record<string, string> = {
    teal:   "bg-teal-50 border-teal-200 text-teal-700",
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    amber:  "bg-amber-50 border-amber-200 text-amber-700",
    green:  "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colours[colour]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [participants, setParticipants] = useState<BetaParticipant[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "feedback" | "participants">("overview");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, statsRes, feedbackRes, participantsRes] = await Promise.allSettled([
        fetch("/api/health"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/feedback"),
        fetch("/api/admin/participants"),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
      }
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }
      if (feedbackRes.status === "fulfilled" && feedbackRes.value.ok) {
        const d = await feedbackRes.value.json();
        setFeedback(d.feedback ?? []);
      }
      if (participantsRes.status === "fulfilled" && participantsRes.value.ok) {
        const d = await participantsRes.value.json();
        setParticipants(d.participants ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusColour = (s: string) =>
    s === "active" ? "text-green-700 bg-green-50" :
    s === "pending" ? "text-amber-700 bg-amber-50" :
    "text-gray-500 bg-gray-50";

  const healthColour = health?.status === "ok" ? "text-green-700" :
    health?.status === "degraded" ? "text-amber-700" : "text-red-700";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-[10px] text-glumira-blue font-medium">The science of insulin, made visible</p>
          <p className="text-sm text-gray-500 mt-1">GluMira™ Platform — Internal</p>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <span className={`text-xs font-semibold ${healthColour}`}>
              ● {health.status.toUpperCase()}
            </span>
          )}
          <button
            onClick={fetchAll}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["overview", "feedback", "participants"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users"       value={stats?.totalUsers ?? "—"}       colour="teal"   />
                <StatCard label="Active (7d)"       value={stats?.activeUsers7d ?? "—"}    colour="blue"   />
                <StatCard label="Beta Participants" value={stats?.betaParticipants ?? "—"} colour="purple" />
                <StatCard label="Feedback Received" value={stats?.feedbackCount ?? "—"}    colour="amber"
                  sub={stats?.avgFeedbackRating ? `Avg ${stats.avgFeedbackRating.toFixed(1)} ★` : undefined}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Readings" value={stats?.totalReadings?.toLocaleString() ?? "—"} colour="green" />
                <StatCard label="Total Doses"    value={stats?.totalDoses?.toLocaleString() ?? "—"}    colour="teal"  />
              </div>

              {/* Health widget */}
              {health && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">System Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={health.status === "ok" ? "text-green-500" : "text-red-500"}>●</span>
                      <span className="text-gray-600">App: <strong>{health.status}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={health.supabase ? "text-green-500" : "text-red-500"}>●</span>
                      <span className="text-gray-600">Supabase: <strong>{health.supabase ? "ok" : "down"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={health.database ? "text-green-500" : "text-red-500"}>●</span>
                      <span className="text-gray-600">Database: <strong>{health.database ? "ok" : "down"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏱</span>
                      <span className="text-gray-600">Uptime: <strong>{Math.floor(health.uptime / 3600)}h</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Beta Feedback ({feedback.length})
              </h2>
              {feedback.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No feedback yet.</p>
              ) : (
                <div className="space-y-3">
                  {feedback.map((f) => (
                    <div key={f.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Stars rating={f.rating} />
                          <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            {f.category}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {f.comment && (
                        <p className="text-sm text-gray-700 mt-2">{f.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === "participants" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Beta Participants ({participants.length})
              </h2>
              {participants.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No participants yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">ID</th>
                        <th className="text-left pb-2 font-medium">Email</th>
                        <th className="text-left pb-2 font-medium">Nightscout</th>
                        <th className="text-left pb-2 font-medium">Status</th>
                        <th className="text-left pb-2 font-medium">Joined</th>
                        <th className="text-left pb-2 font-medium">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-2 font-mono text-gray-600">{p.participantId}</td>
                          <td className="py-2 text-gray-600">{p.email}</td>
                          <td className="py-2">
                            {p.nightscoutUrl ? (
                              <a
                                href={p.nightscoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline"
                              >
                                {new URL(p.nightscoutUrl).hostname}
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColour(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-500">
                            {new Date(p.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 text-gray-500">
                            {p.lastActiveAt
                              ? new Date(p.lastActiveAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
