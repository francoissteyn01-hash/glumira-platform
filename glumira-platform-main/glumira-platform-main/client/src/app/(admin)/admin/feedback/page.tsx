"use client";

/**
 * GluMira™ — Admin Feedback Page
 * /admin/feedback
 *
 * Full beta feedback list with:
 *  - Category filter (bug / feature / ux / general / praise)
 *  - Star rating filter (1–5)
 *  - Date range filter
 *  - Search (comment text)
 *  - Sortable columns (date, rating, category)
 *  - Pagination (25 per page)
 *  - CSV export
 *  - Mark as reviewed / archive
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: string;
  userId: string;
  participantId: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  category: "bug" | "feature" | "ux" | "general" | "praise";
  comment: string;
  page: string | null;
  reviewed: boolean;
  archived: boolean;
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  avgRating: number;
  byCategory: Record<string, number>;
  unreviewed: number;
}

type SortField = "createdAt" | "rating" | "category";
type SortDir = "asc" | "desc";

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ["all", "bug", "feature", "ux", "general", "praise"] as const;
const PAGE_SIZE = 25;

const CATEGORY_COLOURS: Record<string, string> = {
  bug: "bg-red-100 text-red-700",
  feature: "bg-blue-100 text-blue-700",
  ux: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-700",
  praise: "bg-green-100 text-green-700",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function stars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function ratingColour(n: number): string {
  if (n >= 4) return "text-green-600";
  if (n >= 3) return "text-amber-500";
  return "text-red-500";
}

function exportCsv(items: FeedbackItem[]): void {
  const header = ["id", "participantId", "rating", "category", "comment", "page", "reviewed", "createdAt"];
  const rows = items.map(f => [
    f.id,
    f.participantId ?? "",
    f.rating,
    f.category,
    `"${(f.comment ?? "").replace(/"/g, '""')}"`,
    f.page ?? "",
    f.reviewed ? "yes" : "no",
    f.createdAt,
  ]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `glumira-feedback-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const router = useRouter();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort + pagination
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (minRating > 0) params.set("minRating", String(minRating));
      if (showArchived) params.set("archived", "true");
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/admin/feedback?${params}`);
      if (!res.ok) {
        if (res.status === 403) { router.push("/dashboard"); return; }
        throw new Error(`Failed to load feedback (${res.status})`);
      }
      const data = await res.json();
      setItems(data.feedback ?? []);
      setStats(data.stats ?? null);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [category, minRating, showArchived, dateFrom, dateTo, router]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const markReviewed = async (id: string, reviewed: boolean) => {
    setItems(prev => prev.map(f => f.id === id ? { ...f, reviewed } : f));
    await fetch(`/api/admin/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reviewed }),
    });
  };

  const archiveItem = async (id: string) => {
    setItems(prev => prev.filter(f => f.id !== id));
    await fetch(`/api/admin/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: true }),
    });
  };

  // ─── Filter + sort + paginate ────────────────────────────────────────────

  const filtered = items
    .filter(f => {
      if (search && !f.comment?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
      else if (sortField === "rating") cmp = a.rating - b.rating;
      else if (sortField === "category") cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sortIcon = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beta Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and manage feedback from beta participants
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">Avg Rating</p>
            <p className={`text-2xl font-bold ${ratingColour(Math.round(stats.avgRating))}`}>
              {stats.avgRating.toFixed(1)} ★
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">Unreviewed</p>
            <p className="text-2xl font-bold text-amber-600">{stats.unreviewed}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">Bugs</p>
            <p className="text-2xl font-bold text-red-600">{stats.byCategory?.bug ?? 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Category */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === cat
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Min rating */}
          <select
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="px-3 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>All ratings</option>
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r}>≥ {r} ★</option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Show archived */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search comments…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No feedback matches your filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date{sortIcon("createdAt")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Participant
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700"
                    onClick={() => toggleSort("rating")}
                  >
                    Rating{sortIcon("rating")}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700"
                    onClick={() => toggleSort("category")}
                  >
                    Category{sortIcon("category")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Comment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(f => (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-50 transition-colors ${f.reviewed ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(f.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-mono">
                      {f.participantId ?? f.userId.slice(0, 8) + "…"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${ratingColour(f.rating)}`}>
                        {stars(f.rating)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLOURS[f.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {f.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-slate-700 line-clamp-2">{f.comment}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {f.page ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => markReviewed(f.id, !f.reviewed)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            f.reviewed
                              ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {f.reviewed ? "Unmark" : "Review"}
                        </button>
                        <button
                          onClick={() => archiveItem(f.id)}
                          className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1 text-xs text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
