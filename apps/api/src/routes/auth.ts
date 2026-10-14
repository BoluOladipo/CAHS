import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { isStrongPassword, PASSWORD_HINT, ROLES, type Role } from "@cahs/shared";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { hashToken } from "../lib/crypto.js";
import { audit } from "../lib/audit.js";
import { createOtp, verifyOtp } from "../services/otp.js";
import { sendOtpEmail } from "../services/mailer.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string(),
  fullName: z.string().min(2),
  role: z.enum(ROLES),
  state: z.string().min(2),
  lga: z.string().min(2),
  farmSizeHa: z.number().optional(),
  crops: z.string().optional(),
  businessName: z.string().optional(),
});

function tokens(user: { id: string; role: Role; email: string; isEligibleZenithCustomer: boolean; fullName: string }) {
  const access = jwt.sign({ ...user, typ: "access" }, config.jwtAccess, { expiresIn: "15m" });
  const refresh = jwt.sign({ id: user.id, typ: "refresh" }, config.jwtRefresh, { expiresIn: "7d" });
  return { access, refresh };
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!isStrongPassword(parsed.data.password)) return res.status(400).json({ error: PASSWORD_HINT });
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.data.email.toLowerCase() }, { phone: parsed.data.phone }] },
  });
  if (exists) return res.status(409).json({ error: "Email or phone already registered" });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      state: parsed.data.state,
      lga: parsed.data.lga,
      isDemo: false,
      profile: {
        create: {
          farmSizeHa: parsed.data.farmSizeHa,
          crops: parsed.data.crops,
          businessName: parsed.data.businessName,
        },
      },
    },
  });
  const t = tokens({
    id: user.id,
    role: user.role,
    email: user.email,
    isEligibleZenithCustomer: user.isEligibleZenithCustomer,
    fullName: user.fullName,
  });
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(t.refresh), expiresAt: new Date(Date.now() + 7 * 864e5) },
  });
  await audit({ actorId: user.id, action: "register", entity: "user", entityId: user.id });
  res.status(201).json({
    accessToken: t.access,
    refreshToken: t.refresh,
    user: publicUser(user),
  });
});

authRouter.post("/request-otp", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  const code = createOtp(email);
  const mailRes = await sendOtpEmail(email, code, user?.fullName);
  res.json({
    ok: true,
    message: mailRes.ok
      ? `Verification code sent to ${email}`
      : `OTP generated (delivery notice: ${mailRes.error ?? "simulated"}). Demo code 123456 is also accepted.`,
    delivered: mailRes.ok,
    simulatedOtpHint: "Demo OTP 123456 is also accepted for evaluation.",
  });
});

authRouter.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").toLowerCase();
  const password = String(req.body.password ?? "");
  const otp = req.body.otp as string | undefined;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (user.role === "BANK_OFFICER" || user.role === "PLATFORM_ADMIN") {
    if (otp && !verifyOtp(email, otp)) {
      return res.status(401).json({ error: "Invalid OTP. Use the code sent to your email or 123456." });
    }
  } else if (otp) {
    if (!verifyOtp(email, otp)) {
      return res.status(401).json({ error: "Invalid OTP. Use the code sent to your email or 123456." });
    }
  }
  const t = tokens({
    id: user.id,
    role: user.role,
    email: user.email,
    isEligibleZenithCustomer: user.isEligibleZenithCustomer,
    fullName: user.fullName,
  });
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(t.refresh), expiresAt: new Date(Date.now() + 7 * 864e5) },
  });
  await audit({ actorId: user.id, action: "login", entity: "user", entityId: user.id });
  res.json({
    accessToken: t.access,
    refreshToken: t.refresh,
    user: publicUser(user),
    simulatedOtpHint:
      user.role === "BANK_OFFICER" || user.role === "PLATFORM_ADMIN"
        ? "Simulated OTP for staff: 123456 or request email code"
        : undefined,
  });
});

authRouter.post("/refresh", async (req, res) => {
  const token = String(req.body.refreshToken ?? "");
  try {
    const payload = jwt.verify(token, config.jwtRefresh) as { id: string };
    const stored = await prisma.refreshToken.findFirst({
      where: { userId: payload.id, tokenHash: hashToken(token), revokedAt: null },
    });
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ error: "Refresh expired" });
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: "Unknown user" });
    const t = tokens({
      id: user.id,
      role: user.role,
      email: user.email,
      isEligibleZenithCustomer: user.isEligibleZenithCustomer,
      fullName: user.fullName,
    });
    res.json({ accessToken: t.access });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  await prisma.refreshToken.updateMany({
    where: { userId: req.user!.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  res.json({ ok: true });
});

authRouter.post("/password-reset", async (req, res) => {
  const email = String(req.body.email ?? "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = createOtp(email);
    await sendOtpEmail(email, code, user.fullName);
  }
  res.json({ ok: true, message: "If the account exists, a verification code was dispatched to your email." });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { profile: true, consents: true, bankLinks: true },
  });
  res.json({
    user: user
      ? {
          ...publicUser(user),
          profile: user.profile,
          consents: user.consents,
          bankLinks: user.bankLinks.map((b) => ({
            id: b.id,
            bankName: b.bankName,
            maskedAccount: b.maskedAccount,
            isZenith: b.isZenith,
            verifiedAt: b.verifiedAt,
          })),
        }
      : null,
  });
});

function publicUser(user: {
  id: string;
  email: string;
  phone: string;
  role: Role;
  fullName: string;
  state: string;
  lga: string;
  isEligibleZenithCustomer: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    fullName: user.fullName,
    state: user.state,
    lga: user.lga,
    isEligibleZenithCustomer: user.isEligibleZenithCustomer,
  };
}
