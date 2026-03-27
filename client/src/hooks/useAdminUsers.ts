/**
 * GluMira™ — useAdminUsers.ts
 *
 * React hook for admin user management.
 * Wraps GET /api/admin/users, PATCH /api/admin/users/[id]/role,
 * and PATCH /api/admin/users/[id]/status.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole   = "patient" | "clinician" | "admin" | "superadmin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAdminUsersOptions {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

interface UseAdminUsersResult {
  users: AdminUser[];
  total: number;
  loading: boolean;
  error: string | null;
  updateRole:   (userId: string, role: UserRole)     => Promise<boolean>;
  updateStatus: (userId: string, status: UserStatus) => Promise<boolean>;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminUsers(options: UseAdminUsersOptions = {}): UseAdminUsersResult {
  const { page = 1, pageSize = 25, role, status, search } = options;

  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    qs.set("page",     String(page));
    qs.set("pageSize", String(pageSize));
    if (role)   qs.set("role",   role);
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);

    fetch(`/api/admin/users?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<AdminUsersPage>;
      })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load users");
        setLoading(false);
      });
  }, [page, pageSize, role, status, search, refreshKey]);

  const updateRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      setError(msg);
      return false;
    }
  }, []);

  const updateStatus = useCallback(async (userId: string, newStatus: UserStatus): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
      return false;
    }
  }, []);

  return { users, total, loading, error, updateRole, updateStatus, refresh };
}

export default useAdminUsers;
