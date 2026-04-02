/**
 * GluMira™ V7 — server/routes/invite.route.ts
 * Sends branded invite emails via Supabase admin API with custom metadata.
 *
 * POST /api/invite  { email, recipient_name }
 * Requires authenticated user (the inviter).
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { supabase } from "../db";

export const inviteRouter = Router();

inviteRouter.use(requireAuth);

inviteRouter.post("/", async (req: Request, res: Response) => {
  try {
    const inviterUserId = getUserId(req);
    const { email, recipient_name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    // Look up inviter name from their profile
    const { data: inviterProfile } = await supabase
      .from("patient_self_profiles")
      .select("first_name, last_name")
      .eq("user_id", inviterUserId)
      .maybeSingle();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name ?? ""} ${inviterProfile.last_name ?? ""}`.trim() || "A GluMira™ user"
      : "A GluMira™ user";

    // Send invite via Supabase admin API with custom metadata
    // Supabase injects metadata into the email template via {{ .Data.key }}
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        inviter_name: inviterName,
        recipient_name: recipient_name || "there",
      },
      redirectTo: `${process.env.CLIENT_URL ?? "http://localhost:5173"}/auth/accept-invite`,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user_id: data.user?.id,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
