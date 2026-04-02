/**
 * GluMira™ V7 — server/routes/caregiver.route.ts
 * Multi-caregiver access: invite, accept, list, role change, revoke.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { supabase } from "../db";

export const caregiverRouter = Router();
caregiverRouter.use(requireAuth);

// ── Helpers ──────────────────────────────────────────────────────────────────

async function isEditorOrOwner(userId: string, childProfileId: string): Promise<boolean> {
  // Owner check
  if (userId === childProfileId) return true;
  // Editor check
  const { data } = await supabase
    .from("caregiver_links")
    .select("id")
    .eq("child_profile_id", childProfileId)
    .eq("caregiver_user_id", userId)
    .eq("role", "editor")
    .eq("invite_status", "accepted")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function isLinkedCaregiver(userId: string, childProfileId: string): Promise<"editor" | "viewer" | null> {
  const { data } = await supabase
    .from("caregiver_links")
    .select("role")
    .eq("child_profile_id", childProfileId)
    .eq("caregiver_user_id", userId)
    .eq("invite_status", "accepted")
    .limit(1)
    .single();
  return data?.role ?? null;
}

// ── POST /api/caregiver/invite — send invite ────────────────────────────────

caregiverRouter.post("/invite", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { childProfileId, email, role } = req.body;

  if (!childProfileId || !email || !role) {
    return res.status(400).json({ error: "childProfileId, email, and role are required" });
  }
  if (!["editor", "viewer"].includes(role)) {
    return res.status(400).json({ error: "role must be editor or viewer" });
  }

  const allowed = await isEditorOrOwner(userId, childProfileId);
  if (!allowed) return res.status(403).json({ error: "Only profile owner or editor can invite" });

  const { data, error } = await supabase
    .from("caregiver_links")
    .insert({
      child_profile_id: childProfileId,
      caregiver_email: email.toLowerCase().trim(),
      role,
      invited_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("Maximum 4")) {
      return res.status(409).json({ error: "Maximum 4 caregivers per child profile" });
    }
    if (error.code === "23505") {
      return res.status(409).json({ error: "This email has already been invited" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ link: data });
});

// ── GET /api/caregiver/accept/:token — accept invite ────────────────────────

caregiverRouter.get("/accept/:token", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { token } = req.params;

  // Look up user email
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (!userData?.user?.email) {
    return res.status(400).json({ error: "Could not resolve user email" });
  }

  const { data, error } = await supabase
    .from("caregiver_links")
    .update({
      caregiver_user_id: userId,
      invite_status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("invite_token", token)
    .eq("caregiver_email", userData.user.email.toLowerCase())
    .eq("invite_status", "pending")
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Invite not found or already used" });
  }

  res.json({ link: data });
});

// ── GET /api/caregiver/links/:childId — list caregivers for a child ─────────

caregiverRouter.get("/links/:childId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { childId } = req.params;

  const allowed = await isEditorOrOwner(userId, childId);
  const role = await isLinkedCaregiver(userId, childId);
  if (!allowed && !role) {
    return res.status(403).json({ error: "Not authorized to view caregivers for this profile" });
  }

  const { data, error } = await supabase
    .from("caregiver_links")
    .select("id, caregiver_email, caregiver_user_id, role, invite_status, created_at, accepted_at")
    .eq("child_profile_id", childId)
    .neq("invite_status", "revoked")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ links: data ?? [] });
});

// ── PATCH /api/caregiver/:id/role — change role (editors only) ──────────────

caregiverRouter.patch("/:id/role", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { role } = req.body;

  if (!["editor", "viewer"].includes(role)) {
    return res.status(400).json({ error: "role must be editor or viewer" });
  }

  // Fetch the link to check permissions
  const { data: link } = await supabase
    .from("caregiver_links")
    .select("child_profile_id")
    .eq("id", id)
    .single();

  if (!link) return res.status(404).json({ error: "Link not found" });

  const allowed = await isEditorOrOwner(userId, link.child_profile_id);
  if (!allowed) return res.status(403).json({ error: "Only profile owner or editor can change roles" });

  const { data, error } = await supabase
    .from("caregiver_links")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ link: data });
});

// ── DELETE /api/caregiver/:id — revoke access (editors only) ────────────────

caregiverRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const { data: link } = await supabase
    .from("caregiver_links")
    .select("child_profile_id")
    .eq("id", id)
    .single();

  if (!link) return res.status(404).json({ error: "Link not found" });

  const allowed = await isEditorOrOwner(userId, link.child_profile_id);
  if (!allowed) return res.status(403).json({ error: "Only profile owner or editor can revoke" });

  const { error } = await supabase
    .from("caregiver_links")
    .update({ invite_status: "revoked" })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── GET /api/caregiver/children — list children linked to current user ──────

caregiverRouter.get("/children", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const { data, error } = await supabase
    .from("caregiver_links")
    .select("id, child_profile_id, role, invite_status, created_at")
    .eq("caregiver_user_id", userId)
    .eq("invite_status", "accepted")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ children: data ?? [] });
});

// ── Permission middleware for data routes ────────────────────────────────────

export async function checkCaregiverAccess(
  req: Request,
  res: Response,
  next: () => void,
) {
  const userId = getUserId(req);
  const targetProfileId = req.params.profileId ?? req.body?.profileId ?? userId;

  // Own profile — always allow
  if (userId === targetProfileId) return next();

  const role = await isLinkedCaregiver(userId, targetProfileId);
  if (!role) return res.status(403).json({ error: "Not authorized" });

  // Viewers can only read
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (isWrite && role === "viewer") {
    return res.status(403).json({ error: "Viewer access is read-only" });
  }

  next();
}
