import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";

export const adminRouter = Router();

adminRouter.get("/verifications", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  const submissions = await prisma.verificationSubmission.findMany({
    include: { business: { include: { user: true } }, documents: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ submissions });
});

adminRouter.post("/verifications/:id/decide", requireAuth, requireRole("PLATFORM_ADMIN"), async (req, res) => {
  const status = String(req.body.status);
  const submission = await prisma.verificationSubmission.update({
    where: { id: req.params.id },
    data: {
      status,
      reviewerId: req.user!.id,
      decisionNote: String(req.body.reason ?? ""),
      decidedAt: new Date(),
    },
    include: { business: true },
  });
  await audit({ actorId: req.user!.id, action: "verification.decision", entity: "verification", entityId: submission.id, after: submission });
  await notify(submission.business.userId, "Verification update", `Status: ${status}`);
  res.json({ submission });
});

adminRouter.get("/users", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isEligibleZenithCustomer: true, createdAt: true },
  });
  res.json({ users });
});

adminRouter.get("/flags", requireAuth, requireRole("PLATFORM_ADMIN", "BANK_OFFICER"), async (_req, res) => {
  res.json({ flags: await prisma.featureFlag.findMany() });
});

adminRouter.patch("/flags/:key", requireAuth, requireRole("PLATFORM_ADMIN"), async (req, res) => {
  const flag = await prisma.featureFlag.update({
    where: { key: req.params.key },
    data: { enabled: Boolean(req.body.enabled) },
  });
  await audit({ actorId: req.user!.id, action: "flag.update", entity: "feature_flag", entityId: flag.id, after: flag });
  res.json({ flag });
});

adminRouter.get("/fee-rules", requireAuth, requireRole("PLATFORM_ADMIN", "BANK_OFFICER"), async (_req, res) => {
  res.json({ feeRules: await prisma.feeRule.findMany(), discountRules: await prisma.discountRule.findMany() });
});

adminRouter.post("/fee-rules", requireAuth, requireRole("PLATFORM_ADMIN", "BANK_OFFICER"), async (req, res) => {
  const rule = await prisma.feeRule.create({
    data: {
      name: String(req.body.name),
      active: Boolean(req.body.active ?? true),
      nonZenithPercent: Number(req.body.nonZenithPercent),
      zenithPercent: Number(req.body.zenithPercent),
      discountFunder: String(req.body.discountFunder ?? "bank"),
    },
  });
  res.status(201).json({ rule, label: "Proposed partnership benefit" });
});

adminRouter.get("/audit", requireAuth, requireRole("PLATFORM_ADMIN"), async (req, res) => {
  const events = await prisma.auditEvent.findMany({
    where: {
      entity: req.query.entity ? String(req.query.entity) : undefined,
      actorId: req.query.actorId ? String(req.query.actorId) : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ events });
});

adminRouter.get("/audit.csv", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  const events = await prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const csv = ["id,action,entity,entityId,actorId,createdAt", ...events.map((e) => `${e.id},${e.action},${e.entity},${e.entityId},${e.actorId ?? ""},${e.createdAt.toISOString()}`)].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

adminRouter.get("/disputes", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  res.json({ disputes: await prisma.dispute.findMany({ include: { order: true, raisedBy: true } }) });
});

adminRouter.get("/health", async (_req, res) => {
  res.json({ ok: true, service: "cahs-api", simulated: true, time: new Date().toISOString() });
});

adminRouter.get("/monitoring", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  const [users, orders, payments, loans] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.loanApplication.count(),
  ]);
  res.json({ users, orders, payments, loans, errorsLogged: 0 });
});

adminRouter.post("/fraud-report", requireAuth, async (req, res) => {
  await audit({ actorId: req.user!.id, action: "fraud.report", entity: "report", entityId: req.user!.id, after: req.body });
  res.json({ ok: true, message: "Report recorded in the audit log for review." });
});

adminRouter.get("/analytics", requireAuth, requireRole("PLATFORM_ADMIN", "BANK_OFFICER"), async (_req, res) => {
  const users = await prisma.user.findMany();
  const orders = await prisma.order.findMany();
  const payments = await prisma.payment.findMany({ include: { settlement: true } });
  const loans = await prisma.loanApplication.findMany({ include: { repayments: true } });
  const savings = await prisma.savingsAccount.findMany();
  const jobs = await prisma.job.findMany({ include: { milestones: true } });
  const bookings = await prisma.storageBooking.findMany();
  const disputes = await prisma.dispute.findMany();
  const eligible = users.filter((u) => u.isEligibleZenithCustomer);
  const completed = orders.filter((o) => o.status === "completed");
  const incentiveCost = payments.reduce((s, p) => s + (p.settlement?.discounts ?? 0), 0);
  const paymentVolumeEligible = payments
    .filter((p) => users.find((u) => u.id === p.userId)?.isEligibleZenithCustomer)
    .reduce((s, p) => s + p.amount, 0);
  const onTime = jobs.filter((j) => j.status === "completed").length;
  res.json({
    demo: true,
    label: "Demo data",
    customerGrowth: {
      newEligibleZenithAccounts: eligible.length,
      activationRate: users.length ? eligible.length / users.length : 0,
      costPerActivatedCustomer: eligible.length ? incentiveCost / eligible.length : 0,
    },
    marketplace: {
      activeFarmers: users.filter((u) => u.role === "FARMER").length,
      activeBuyers: users.filter((u) => u.role === "TRADER").length,
      listings: await prisma.listing.count(),
      completedOrders: completed.length,
      repeatTransactions: completed.length > 0 ? 0.32 : 0,
      monthlyActiveUsers: users.length,
    },
    serviceQuality: {
      onTimeDelivery: jobs.length ? onTime / jobs.length : 0,
      trackingUpdateCompleteness: jobs.length
        ? jobs.filter((j) => j.milestones.length >= 6).length / jobs.length
        : 0,
      disputeRate: orders.length ? disputes.length / orders.length : 0,
      storageBookingFulfilment: bookings.length
        ? bookings.filter((b) => b.status === "accepted").length / bookings.length
        : 0,
      deliverySuccess: jobs.length ? onTime / jobs.length : 0,
      warehouseUsage: bookings.length,
      spoilageReports: 1,
    },
    financial: {
      paymentVolumeEligible,
      incentiveCost,
      note: "Incentive cost is not revenue. GTV and deposit balances are not CAHS revenue.",
      savingsOptInRate: users.length ? savings.length / users.length : 0,
      balancesRetained: savings.filter((s) => s.status === "active").reduce((s, a) => s + a.principal, 0),
      loanCompletionRate: loans.length ? loans.filter((l) => ["approved", "disbursed", "repaying", "closed"].includes(l.status)).length / loans.length : 0,
      repaymentPerformance: loans.filter((l) => l.status === "closed").length,
      arrears: loans.filter((l) => l.status === "in_arrears").length,
      retention90: 0.71,
      retention180: 0.54,
      benefitRedemption: incentiveCost,
      complaints: disputes.length,
    },
    revenueStreams: {
      platformServiceFees: payments.reduce((s, p) => s + (p.settlement?.fees ?? 0), 0),
      warehouseCoordination: 0,
      logisticsCoordination: 0,
      subscriptions: 0,
      bankReferralRequiresLegalAgreement: true,
    },
  });
});

adminRouter.get("/ai-monitor", requireAuth, requireRole("PLATFORM_ADMIN"), async (_req, res) => {
  const interactions = await prisma.aiInteraction.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  res.json({ interactions });
});
