import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@cahs/shared";
import { config } from "../config.js";
import { prisma } from "../prisma.js";

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  isEligibleZenithCustomer: boolean;
  fullName: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, config.jwtAccess) as AuthUser & { typ?: string };
    if (payload.typ && payload.typ !== "access") return res.status(401).json({ error: "Invalid token" });
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      isEligibleZenithCustomer: payload.isEligibleZenithCustomer,
      fullName: payload.fullName,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission for this action" });
    }
    next();
  };
}

export async function logSensitiveAccess(userId: string, action: string, entityId: string) {
  await prisma.auditEvent.create({
    data: { actorId: userId, action, entity: "sensitive", entityId },
  });
}
