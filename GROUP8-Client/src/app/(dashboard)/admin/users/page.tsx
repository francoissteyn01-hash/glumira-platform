/**
 * GluMira™ — Admin Users Management Page
 *
 * Lists all platform users with role and status management.
 * Admin-only access.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState } from "react";
import { useAdminUsers, type AdminUser, type UserRole, type UserStatus } from "@/hooks/useAdminUsers";

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLOURS: Record<UserRole, string> = {
  patient:    "bg-blue-50 text-blue-700 border-blue-200",
  clinician:  "bg-teal-50 text-teal-700 border-teal-200",
  admin:      "bg-purple-50 text-purple-700 border-purple-200",
  superadmin: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_COLOURS: Record<UserStatus, string> = {
  active:    "bg-emerald-50 text-emerald-700",
  inactive:  "bg-slate-50 text-slate-500",
  suspended: "bg-red-50 text-red-700",
  pending:   "bg-amber-50 text-amber-700",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLOURS[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOURS[status]}`}>
      {status}
    </span>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onRoleChange,
  onStatusChange,
}: {
  user: AdminUser;
  onRoleChange:   (id: string, role: UserRole)     => void;
  onStatusChange: (id: string, status: UserStatus) => void;
}) {
  const ROLES:    UserRole[]   = ["patient", "clinician", "admin", "superadmin"];
  const STATUSES: UserStatus[] = ["active", "inactive", "suspended", "pending"];

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm text-slate-800">
        <p className="font-medium">{user.displayName ?? "—"}</p>
        <p className="text-xs text-slate-400">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "Never"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Role selector */}
          <select
            value={user.role}
            onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
            className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {/* Status selector */}
          <select
            value={user.status}
            onChange={(e) => onStatusChange(user.id, e.target.value as UserStatus)}
            className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  const { users, total, loading, error, updateRole, updateStatus, refresh } = useAdminUsers({
    page,
    pageSize: 25,
    role: roleFilter,
    search: search || undefined,
  });

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-400">{total.toLocaleString()} total users</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 w-64"
        />
        <select
          value={roleFilter ?? ""}
          onChange={(e) => { setRoleFilter((e.target.value as UserRole) || undefined); setPage(1); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">All roles</option>
          <option value="patient">Patient</option>
          <option value="clinician">Clinician</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Last Sign-in</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={updateRole}
                    onStatusChange={updateStatus}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
