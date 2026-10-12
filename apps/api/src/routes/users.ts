import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { bankVerification } from "../services/providers.js";
import { audit } from "../lib/audit.js";

export const usersRouter = Router();

usersRouter.patch("/me", requireAuth, async (req, res) => {
  const { fullName, state, lga, farmSizeHa, crops, businessName } = req.body ?? {};
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      fullName: fullName ?? undefined,
      state: state ?? undefined,
      lga: lga ?? undefined,
      profile: {
        upsert: {
          create: { farmSizeHa, crops, businessName },
          update: { farmSizeHa, crops, businessName },
        },
      },
    },
    include: { profile: true },
  });
  res.json({ user });
});

usersRouter.get("/consents", requireAuth, async (req, res) => {
  const consents = await prisma.consent.findMany({ where: { userId: req.user!.id } });
  res.json({ consents });
});

usersRouter.post("/consents", requireAuth, async (req, res) => {
  const key = String(req.body.key ?? "");
  const granted = Boolean(req.body.granted);
  const existing = await prisma.consent.findUnique({
    where: { userId_key: { userId: req.user!.id, key } },
  });
  const consent = await prisma.consent.upsert({
    where: { userId_key: { userId: req.user!.id, key } },
    create: {
      userId: req.user!.id,
      key,
      granted,
      grantedAt: granted ? new Date() : null,
    },
    update: {
      granted,
      grantedAt: granted ? new Date() : existing?.grantedAt,
      revokedAt: granted ? null : new Date(),
    },
  });
  await audit({
    actorId: req.user!.id,
    action: granted ? "consent.grant" : "consent.revoke",
    entity: "consent",
    entityId: consent.id,
    after: consent,
  });
  res.json({ consent });
});

usersRouter.post("/bank-link", requireAuth, async (req, res) => {
  const accountNumber = String(req.body.accountNumber ?? "");
  const bankName = String(req.body.bankName ?? "");
  const consentShare = Boolean(req.body.consentShare);
  if (!consentShare) {
    return res.status(400).json({ error: "Explicit consent is required to verify and link an account." });
  }
  const result = await bankVerification.verify(accountNumber, bankName);
  if (!result.ok) return res.status(400).json({ error: "Account could not be verified (simulated)." });
  const link = await prisma.bankLink.create({
    data: {
      userId: req.user!.id,
      bankName,
      maskedAccount: result.masked,
      accountEncrypted: result.encrypted,
      isZenith: result.isZenith,
    },
  });
  if (result.isZenith) {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { isEligibleZenithCustomer: true, zenithLinkedAt: new Date() },
    });
  }
  await audit({ actorId: req.user!.id, action: "bank.link", entity: "bank_link", entityId: link.id });
  res.json({
    link: { id: link.id, bankName: link.bankName, maskedAccount: link.maskedAccount, isZenith: link.isZenith },
    shared: "Verification timestamp and masked account number only. Full account number is encrypted at rest.",
    proposedPartnershipBenefit: result.isZenith,
  });
});

usersRouter.post("/data-correction", requireAuth, async (req, res) => {
  const row = await prisma.dataCorrectionRequest.create({
    data: { userId: req.user!.id, description: String(req.body.description ?? "") },
  });
  res.status(201).json({ request: row });
});
