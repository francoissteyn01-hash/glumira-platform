/**
 * GluMira™ V7 — CaregiverManagePage.tsx
 * Manage linked caregivers: invite, change role, revoke.
 * Max 4 caregivers per child profile.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

interface CaregiverLink {
  id: string;
  caregiver_email: string;
  caregiver_user_id: string | null;
  role: "editor" | "viewer";
  invite_status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
}

const MAX_CAREGIVERS = 4;

export default function CaregiverManagePage() {
  const { user, session } = useAuth();
  const [links, setLinks] = useState<CaregiverLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    }),
    [session],
  );

  const fetchLinks = useCallback(async () => {
    if (!session || !user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/caregiver/links/${user.id}`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setLinks(data.links ?? []);
      else setError(data.error);
    } catch {
      setError("Failed to load caregivers");
    } finally {
      setLoading(false);
    }
  }, [session, user, headers]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function invite() {
    setError(null);
    setSuccess(null);
    if (!email.trim()) return setError("Email is required");
    if (links.length >= MAX_CAREGIVERS) return setError("Maximum 4 caregivers reached");

    const res = await fetch(`${API}/api/caregiver/invite`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ childProfileId: user!.id, email: email.trim(), role }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
      fetchLinks();
    } else {
      setError(data.error);
    }
  }

  async function changeRole(id: string, newRole: "editor" | "viewer") {
    setError(null);
    const res = await fetch(`${API}/api/caregiver/${id}/role`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) fetchLinks();
    else setError((await res.json()).error);
  }

  async function revoke(id: string) {
    setError(null);
    const res = await fetch(`${API}/api/caregiver/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (res.ok) fetchLinks();
    else setError((await res.json()).error);
  }

  const slotsUsed = links.length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Manage Caregivers</h1>
          <span className="text-xs text-[var(--text-muted)]">
            {slotsUsed} of {MAX_CAREGIVERS} slots used
          </span>
        </div>

        {/* ── Invite form ─────────────────────────────────────────────── */}
        <Card title="Invite Caregiver">
          <div className="space-y-3">
            <label htmlFor="cg-email" className="sr-only">Caregiver email</label>
            <input
              id="cg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@email.com"
              className="w-full rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center gap-3">
              <label htmlFor="cg-role" className="sr-only">Role</label>
              <select
                id="cg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — can edit data</option>
              </select>
              <button type="button"
                onClick={invite}
                disabled={slotsUsed >= MAX_CAREGIVERS || !email.trim()}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Send invite
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && <p className="text-xs text-green-400">{success}</p>}
          </div>
        </Card>

        {/* ── Linked caregivers ───────────────────────────────────────── */}
        <Card title="Linked Caregivers">
          {loading ? (
            <p className="text-sm text-[var(--text-muted)] animate-pulse">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No caregivers linked yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {links.map((link) => (
                <li key={link.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">{link.caregiver_email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <RoleBadge role={link.role} />
                        <StatusBadge status={link.invite_status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {link.invite_status === "accepted" && (
                        <button type="button"
                          onClick={() => changeRole(link.id, link.role === "editor" ? "viewer" : "editor")}
                          className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-light)] transition-colors"
                        >
                          {link.role === "editor" ? "Make viewer" : "Make editor"}
                        </button>
                      )}
                      <button type="button"
                        onClick={() => revoke(link.id)}
                        className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-700 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Slot indicator ──────────────────────────────────────────── */}
        <div className="flex gap-2">
          {Array.from({ length: MAX_CAREGIVERS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < slotsUsed ? "bg-brand-500" : "bg-[var(--bg-card)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isEditor = role === "editor";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
        isEditor
          ? "bg-brand-600/20 text-brand-400"
          : "bg-[var(--bg-card)]/50 text-[var(--text-muted)]"
      }`}
    >
      {isEditor ? "Editor" : "Viewer"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") return null;
  return (
    <span className="inline-flex items-center rounded-md bg-yellow-900/30 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
      Pending
    </span>
  );
}
