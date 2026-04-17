/**
 * GluMira™ V7 — server/middleware/auth.ts
 * Supabase JWT verification middleware for Express routes.
 */

import { type Request, type Response, type NextFunction } from "express";
import { supabase } from "../db";

declare global {
   
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; email?: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.userId = data.user.id;
    req.user = { id: data.user.id, email: data.user.email };
    next();
  }).catch(() => {
    res.status(401).json({ error: "Auth check failed" });
  });
}

export type AuthRequest = {
  user?: { id: string; email?: string };
} & Request

export function getUserId(req: Request): string {
  if (!req.userId) throw new Error("userId not set — requireAuth must run first");
  return req.userId;
}
