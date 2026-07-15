import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET || "undifest-secret-key-change-in-production";
const JWT_EXPIRES_IN = "30d";

export interface JWTPayload {
  adminId: string;
  username: string;
  role?: string;
}

export interface UserJWTPayload {
  userId: string;
  phoneNumber: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateUserToken(payload: UserJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function verifyUserToken(token: string): UserJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJWTPayload;
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  // Fetch admin from database to get current role and status
  const admin = await storage.getAdminUser(payload.adminId);

  if (!admin || !admin.isActive) {
    return res.status(401).json({ error: "Unauthorized: Admin account is inactive" });
  }

  // Check IP whitelist if configured
  if (admin.allowedIps) {
    const clientIp = req.ip || req.socket.remoteAddress || "";
    const allowedIps = admin.allowedIps.split(",").map(ip => ip.trim());

    if (!allowedIps.includes(clientIp)) {
      return res.status(403).json({ error: "Forbidden: IP address not whitelisted" });
    }
  }

  // Attach admin info to request with role
  (req as any).admin = { ...payload, role: admin.role };
  next();
}

// Middleware to require specific role
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;

    if (!admin) {
      return res.status(401).json({ error: "Unauthorized: No admin info" });
    }

    // Superadmin always has access
    if (admin.role === "superadmin") {
      return next();
    }

    // Check if admin's role is in allowed roles
    if (!allowedRoles.includes(admin.role)) {
      return res.status(403).json({
        error: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        current: admin.role
      });
    }

    next();
  };
}

// Middleware to block viewer role from write operations
export function requireWrite(req: Request, res: Response, next: NextFunction) {
  const admin = (req as any).admin;

  if (!admin) {
    return res.status(401).json({ error: "Unauthorized: No admin info" });
  }

  // Superadmin and qs_custom can write
  if (admin.role === "superadmin" || admin.role === "qs_custom") {
    return next();
  }

  // Viewer cannot write
  if (admin.role === "viewer") {
    return res.status(403).json({
      error: "Forbidden: Viewer role cannot perform write operations"
    });
  }

  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyUserToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  // Attach user info to request
  (req as any).user = payload;
  next();
}
