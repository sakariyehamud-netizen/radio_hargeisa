import crypto from "node:crypto";
import { type NextFunction, type Request, type Response } from "express";
import { type DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "../lib/firebase-admin.ts";
import { getOrCreateUser } from "../db/users.ts";
import { getEntityById, type DbUser } from "../db/repo.ts";
import {
  isAdminRole,
  isStaffRole,
  resolveRole,
  type AppRole,
} from "../lib/rbac.ts";

const SESSION_SECRET = process.env.SESSION_SECRET || "rh_somaliland_session_1942";

export function signSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token?: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return parsed.uid || null;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  currentUser?: DbUser | null;
  currentRole: AppRole;
}

export async function attachAuthUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  req.currentUser = null;
  req.currentRole = "USER";

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return next();

  // 1. 2-part signed session token for seeded / email workspace sessions
  if (token.split(".").length === 2) {
    const uid = verifySessionToken(token);
    if (!uid) {
      return next();
    }
    try {
      const dbUser = (await getEntityById("User", uid)) as DbUser | undefined;
      if (dbUser && dbUser.account_status !== "SUSPENDED") {
        req.currentUser = dbUser;
        req.currentRole = resolveRole(dbUser);
      }
      return next();
    } catch (dbErr) {
      console.error("Database lookup failed during session auth:", dbErr);
      return res
        .status(503)
        .json({ error: "Service temporarily unavailable. Please try again." });
    }
  }

  // 2. Verify Firebase ID Token (3-part JWT)
  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return next();
  }

  req.user = decodedToken;
  try {
    const dbUser = (await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || "",
      decodedToken.name
    )) as DbUser;
    if (dbUser && dbUser.account_status !== "SUSPENDED") {
      req.currentUser = dbUser;
      req.currentRole = resolveRole(dbUser);
    }
    return next();
  } catch (dbErr) {
    console.error("Database synchronization failed during Firebase auth:", dbErr);
    return res
      .status(503)
      .json({ error: "Service temporarily unavailable. Please try again." });
  }
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.currentUser) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  next();
}

export function requireStaff(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.currentUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!isStaffRole(req.currentRole)) {
    return res.status(403).json({ error: "Staff role required" });
  }
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.currentUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!isAdminRole(req.currentRole)) {
    return res.status(403).json({ error: "Administrator access required" });
  }
  next();
}
