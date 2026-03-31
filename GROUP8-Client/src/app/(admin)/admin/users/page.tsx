"use client";

/**
 * GluMira™ — Admin Users Page
 * /admin/users
 *
 * Displays all registered users with:
 *   - Search by email / display name
 *   - Role filter (patient | clinician | admin)
 *   - Status filter (active | suspended)
 *   - Role promotion / demotion
 *   - Account suspension toggle
 *   - Pagination (25 per page)
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "patient" | "clinician" | "admin";
type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  diabetesType: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  readingCount: number;
  feedbackCount: number;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Mock data for UI development ─────────────────────────────────────────────

function mockUsers(): AdminUser[] {
  const roles: UserRole[] = ["patient", "patient", "patient", "clinician", "admin"];
  return Array.from({ length: 25 }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    displayName: i % 3 === 0 ? null : `User ${i + 1}`,
    role: roles[i % roles.length],
    status: i === 3 ? "suspended" : "active",
    diabetesType: i % 2 === 0 ? "T1D" : "T2D",
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    lastSignInAt: i < 10 ? new Date(Date.now() - i * 3600000).toISOString() : null,
    readingCount: Math.floor(Math.random() * 500),
    feedbackCount: Math.floor(Math.random() * 5),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search && { search }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data: UsersResponse = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      } else {
        // Fallback to mock data during development
        const all = mockUsers();
        setUsers(all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
        setTotal(all.length);
      }
    } catch {
      const all = mockUsers();
      setUsers(all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(all.length);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Role change ────────────────────────────────────────────────────────────
  async function changeRole(userId: string, newRole: UserRole) {
    setActionLoading(userId + "-role");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated to ${newRole}`);
      } else {
        showToast("Failed to update role.");
      }
    } catch {
      showToast("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Status toggle ──────────────────────────────────────────────────────────
  async function toggleStatus(userId: string, current: UserStatus) {
    const newStatus: UserStatus = current === "active" ? "suspended" : "active";
    setActionLoading(userId + "-status");
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        showToast(`Account ${newStatus === "suspended" ? "suspended" : "reactivated"}`);
      } else {
        showToast("Failed to update status.");
      }
    } catch {
      showToast("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const roleBadge: Record<UserRole, string> = {
    patient: "bg-blue-100 text-blue-700",
    clinician: "bg-purple-100 text-purple-700",
    admin: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} registered accounts</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-800 text-white px-4 py-2.5 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search email or name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | "all"); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="all">All roles</option>
          <option value="patient">Patient</option>
          <option value="clinician">Clinician</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as UserStatus | "all"); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Readings</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Last sign-in</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                    Loading users…
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    user.status === "suspended" ? "opacity-60" : ""
                  }`}
                >
                  {/* User info */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {user.displayName ?? <span className="text-slate-400 italic">No name</span>}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {user.diabetesType && (
                      <span className="text-xs text-slate-400">{user.diabetesType}</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Readings */}
                  <td className="px-4 py-3 text-slate-600">{user.readingCount}</td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("en-ZA")}
                  </td>

                  {/* Last sign-in */}
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleDateString("en-ZA")
                      : "Never"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Role selector */}
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
                        disabled={actionLoading === user.id + "-role"}
                        className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-50"
                      >
                        <option value="patient">Patient</option>
                        <option value="clinician">Clinician</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Suspend / reactivate */}
                      <button
                        onClick={() => toggleStatus(user.id, user.status)}
                        disabled={actionLoading === user.id + "-status"}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          user.status === "active"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {user.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg border px-3 py-1.5 transition-colors ${
                    p === page
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
