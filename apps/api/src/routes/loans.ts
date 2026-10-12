import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, logSensitiveAccess } from "../middleware/auth.js";
import { canRecordLoanDecision, LOAN_HISTORY_DISCLAIMER, LOAN_READINESS_LABEL } from "@cahs/shared";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";
import { aiService } from "../services/ai.js";
import { loanReferral } from "../services/providers.js";

export const loansRouter = Router();

loansRouter.get("/products", requireAuth, async (_req, res) => {
  const products = await prisma.loanProduct.findMany({ where: { active: true } });
  res.json({ products, disclaimer: LOAN_HISTORY_DISCLAIMER });
});

loansRouter.post("/applications", requireAuth, requireRole("FARMER", "TRADER"), async (req, res) => {
  const consent = await prisma.consent.findUnique({
    where: { userId_key: { userId: req.user!.id, key: "share_with_bank_for_loan" } },
  });
  const attach = Boolean(req.body.attachSummaries) && Boolean(consent?.granted);
  let summaries = null;
  if (attach) {
    const orders = await prisma.order.findMany({
      where: { OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }] },
    });
    summaries = {
      orderCount: orders.length,
      completed: orders.filter((o) => o.status === "completed").length,
      salesVolume: orders.filter((o) => o.sellerId === req.user!.id).reduce((s, o) => s + o.subtotal, 0),
    };
  }
  const app = await prisma.loanApplication.create({
    data: {
      applicantId: req.user!.id,
      amount: Number(req.body.amount),
      purpose: String(req.body.purpose),
      tenorDays: Number(req.body.tenorDays ?? 90),
      farmInfo: String(req.body.farmInfo ?? ""),
      crops: String(req.body.crops ?? ""),
      landSizeHa: Number(req.body.landSizeHa ?? 0),
      historicalSales: String(req.body.historicalSales ?? ""),
      bankMasked: String(req.body.bankMasked ?? "****0000"),
      attachSummaries: attach,
      consentSnapshot: JSON.stringify({ attach, consent: consent ?? null, summaries }),
      status: "submitted",
    },
  });
  await loanReferral.submit(app.id);
  await audit({ actorId: req.user!.id, action: "loan.submitted", entity: "loan_application", entityId: app.id, after: app });
  await notify(req.user!.id, "Loan application submitted", "Your application was sent for bank officer review. This is simulated.");
  res.status(201).json({ application: app, attachedSummaries: attach, disclaimer: LOAN_HISTORY_DISCLAIMER });
});

loansRouter.get("/applications", requireAuth, async (req, res) => {
  if (req.user!.role === "BANK_OFFICER") {
    const queue = await prisma.loanApplication.findMany({
      include: { applicant: { select: { fullName: true, email: true, isEligibleZenithCustomer: true } }, decisions: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ applications: queue });
  }
  const mine = await prisma.loanApplication.findMany({
    where: { applicantId: req.user!.id },
    include: { decisions: true, schedule: true, repayments: true },
  });
  res.json({ applications: mine, disclaimer: LOAN_HISTORY_DISCLAIMER });
});

loansRouter.get("/applications/:id", requireAuth, async (req, res) => {
  const app = await prisma.loanApplication.findUnique({
    where: { id: req.params.id },
    include: { applicant: true, documents: true, decisions: true, schedule: true, repayments: true },
  });
  if (!app) return res.status(404).json({ error: "Not found" });
  if (req.user!.role !== "BANK_OFFICER" && app.applicantId !== req.user!.id && req.user!.role !== "PLATFORM_ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.user!.role === "BANK_OFFICER") {
    await logSensitiveAccess(req.user!.id, "loan.view", app.id);
  }
  const consent = await prisma.consent.findUnique({
    where: { userId_key: { userId: app.applicantId, key: "share_with_bank_for_loan" } },
  });
  const attach = app.attachSummaries && Boolean(consent?.granted);
  let summaries = undefined;
  if (attach) {
    const orders = await prisma.order.findMany({
      where: { OR: [{ buyerId: app.applicantId }, { sellerId: app.applicantId }] },
    });
    summaries = { orders: orders.length, completed: orders.filter((o) => o.status === "completed").length };
  }
  const readiness = await aiService.loanReadiness({
    amount: app.amount,
    purpose: app.purpose,
    farmInfo: app.farmInfo,
    crops: app.crops,
    historicalSales: app.historicalSales,
    attachSummaries: attach,
    summaries,
  });
  res.json({ application: app, readiness, label: LOAN_READINESS_LABEL, disclaimer: LOAN_HISTORY_DISCLAIMER });
});

loansRouter.post("/applications/:id/decision", requireAuth, requireRole("BANK_OFFICER"), async (req, res) => {
  if (!canRecordLoanDecision(req.user!.role)) {
    return res.status(403).json({ error: "Only authorised bank officers can record loan decisions." });
  }
  const status = String(req.body.status);
  const reason = String(req.body.reason ?? "");
  if (!reason) return res.status(400).json({ error: "A decision reason is required." });
  const allowed = ["approved", "rejected", "counter_offered", "more_info_requested"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid decision status" });
  const decision = await prisma.loanDecision.create({
    data: {
      applicationId: req.params.id,
      officerId: req.user!.id,
      status,
      reason,
      counterAmount: req.body.counterAmount ? Number(req.body.counterAmount) : null,
    },
  });
  const updated = await prisma.loanApplication.update({
    where: { id: req.params.id },
    data: { status, internalNotes: req.body.internalNotes },
  });
  await audit({
    actorId: req.user!.id,
    action: "loan.decision",
    entity: "loan_application",
    entityId: updated.id,
    after: { status, reason, officerId: req.user!.id },
  });
  await notify(updated.applicantId, "Loan application update", `Status: ${status}. ${reason}`);
  res.json({ application: updated, decision });
});

loansRouter.post("/applications/:id/disburse", requireAuth, requireRole("BANK_OFFICER"), async (req, res) => {
  const app = await prisma.loanApplication.findUnique({ where: { id: req.params.id } });
  if (!app || app.status !== "approved") return res.status(400).json({ error: "Only approved applications can be disbursed (simulated)." });
  const instalments = 3;
  const each = Math.round((app.amount / instalments) * 100) / 100;
  const schedule = await Promise.all(
    Array.from({ length: instalments }).map((_, i) =>
      prisma.repaymentSchedule.create({
        data: {
          applicationId: app.id,
          dueDate: new Date(Date.now() + (i + 1) * 30 * 864e5),
          amount: each,
        },
      }),
    ),
  );
  const updated = await prisma.loanApplication.update({ where: { id: app.id }, data: { status: "disbursed" } });
  await audit({ actorId: req.user!.id, action: "loan.disbursed", entity: "loan_application", entityId: app.id });
  res.json({ application: updated, schedule, simulated: true });
});

loansRouter.post("/applications/:id/repay", requireAuth, async (req, res) => {
  const app = await prisma.loanApplication.findUnique({ where: { id: req.params.id }, include: { schedule: true, repayments: true } });
  if (!app || app.applicantId !== req.user!.id) return res.status(404).json({ error: "Not found" });
  const repayment = await prisma.repayment.create({
    data: { applicationId: app.id, amount: Number(req.body.amount), simulated: true },
  });
  const paid = app.repayments.reduce((s, r) => s + r.amount, 0) + repayment.amount;
  const due = app.schedule.reduce((s, r) => s + r.amount, 0);
  const status = paid >= due ? "closed" : "repaying";
  await prisma.loanApplication.update({ where: { id: app.id }, data: { status } });
  await audit({ actorId: req.user!.id, action: "loan.repayment", entity: "loan_application", entityId: app.id });
  res.json({ repayment, status, simulated: true });
});
