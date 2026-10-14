import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../prisma.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ error: "Authentication required" });
    try {
        const payload = jwt.verify(token, config.jwtAccess);
        if (payload.typ && payload.typ !== "access")
            return res.status(401).json({ error: "Invalid token" });
        req.user = {
            id: payload.id,
            role: payload.role,
            email: payload.email,
            isEligibleZenithCustomer: payload.isEligibleZenithCustomer,
            fullName: payload.fullName,
        };
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired session" });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "Authentication required" });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "You do not have permission for this action" });
        }
        next();
    };
}
export async function logSensitiveAccess(userId, action, entityId) {
    await prisma.auditEvent.create({
        data: { actorId: userId, action, entity: "sensitive", entityId },
    });
}
