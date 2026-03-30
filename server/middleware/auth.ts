/**
 * GluMira™ V7 — server/middleware/auth.ts
 * Supabase JWT verification middleware for Express routes.
 */

import { type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.userId = data.user.id;
    next();
  }).catch(() => {
    res.status(401).json({ error: "Auth check failed" });
  });
}

// AuthRequest — Express Request with authenticated user fields
export interface AuthRequest extends Request {
  user?: { id: string; email?: string };
}

export function getUserId(req: Request): string {
  if (!req.userId) throw new Error("userId not set — requireAuth must run first");
  return req.userId;
}
