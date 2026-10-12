import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { paymentProvider } from "../services/providers.js";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";
import { calculatePlatformFee, applyLogisticsDiscount, isDiscountFunder } from "@cahs/shared";
import type { FeeRule } from "@cahs/shared";

export const paymentsRouter = Router();

paymentsRouter.get("/quote", requireAuth, async (req, res) => {
  const amount = Number(req.query.amount ?? 0);
  const logisticsBase = Number(req.query.logisticsBase ?? 0);
  const storedFeeRule = await prisma.feeRule.findFirst({ where: { active: true } });
  let feeRule: FeeRule | undefined;
  if (storedFeeRule) {
    const { discountFunder } = storedFeeRule;
    if (!isDiscountFunder(discountFunder)) {
      return res.status(500).json({ error: "Invalid fee rule configuration" });
    }
    feeRule = { ...storedFeeRule, discountFunder };
  }
  const fee = calculatePlatformFee(amount, req.user!.isEligibleZenithCustomer, feeRule);
  const logRule = await prisma.discountRule.findFirst({ where: { kind: "logistics", active: true } });
  const logistics = logisticsBase
    ? applyLogisticsDiscount(logisticsBase, req.user!.isEligibleZenithCustomer, logRule
        ? {
            active: logRule.active,
            percentOff: logRule.percentOff,
            fixedOff: logRule.fixedOff,
            discountFunder: logRule.discountFunder as "bank",
          }
        : undefined)
    : null;
  res.json({
    fee,
    logistics,
    proposedPartnershipBenefit: "Proposed partnership benefit",
    note: fee.note,
  });
});

paymentsRouter.post("/checkout", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: String(req.body.orderId) } });
  if (!order || order.buyerId !== req.user!.id) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "payment_pending") return res.status(400).json({ error: "Order is not awaiting payment" });
  const method = String(req.body.method ?? "other_bank");
  const checkout = await paymentProvider.createCheckout({
    amount: order.totalDue,
    method,
    customerEmail: req.user!.email,
  });
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      userId: req.user!.id,
      amount: order.totalDue,
      status: "pending",
      providerRef: checkout.reference,
      method,
      events: { create: { status: "pending", payload: JSON.stringify({ simulated: true }) } },
    },
  });
  await audit({ actorId: req.user!.id, action: "payment.pending", entity: "payment", entityId: payment.id });
  res.json({
    payment,
    redirectUrl: checkout.redirectUrl,
    banner: "Prototype: simulated payments. No real funds are handled. Card details are never collected.",
  });
});

paymentsRouter.post("/sandbox/complete", requireAuth, async (req, res) => {
  const reference = String(req.body.reference);
  const payment = await prisma.payment.findUnique({ where: { providerRef: reference }, include: { order: true } });
  if (!payment) return res.status(404).json({ error: "Unknown reference" });
  const capture = await paymentProvider.capture(reference);
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: capture.status,
      events: { create: { status: capture.status, payload: JSON.stringify(capture.providerPayload) } },
    },
  });
  if (capture.status === "success" && payment.orderId) {
    await prisma.order.update({ where: { id: payment.orderId }, data: { status: "paid" } });
    await prisma.settlement.create({
      data: {
        paymentId: payment.id,
        grossAmount: payment.amount,
        fees: payment.order?.platformFee ?? 0,
        discounts: payment.order?.zenithDiscount ?? 0,
        discountFunder: payment.order?.discountFunder,
        netToSeller: (payment.order?.subtotal ?? payment.amount) - 0,
        status: "held",
      },
    });
    await notify(payment.userId, "Payment confirmed", `Simulated payment ${reference} succeeded. Funds are held until delivery confirmation.`);
  }
  await audit({ actorId: req.user!.id, action: "payment.success", entity: "payment", entityId: payment.id, after: updated });
  res.json({ payment: updated, simulated: true });
});

paymentsRouter.get("/settlements", requireAuth, async (req, res) => {
  const where =
    req.user!.role === "PLATFORM_ADMIN" || req.user!.role === "BANK_OFFICER"
      ? {}
      : { payment: { userId: req.user!.id } };
  const settlements = await prisma.settlement.findMany({
    where,
    include: { payment: { include: { order: true } } },
    orderBy: { paymentId: "desc" },
  });
  res.json({ settlements, note: "Gross transaction value is not platform revenue." });
});

paymentsRouter.get("/receipts/:paymentId.csv", requireAuth, async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.paymentId },
    include: { settlement: true, order: true },
  });
  if (!payment) return res.status(404).send("not found");
  const csv = [
    "reference,amount,status,fees,discounts,funder,netToSeller,simulated",
    `${payment.providerRef},${payment.amount},${payment.status},${payment.settlement?.fees ?? ""},${payment.settlement?.discounts ?? ""},${payment.settlement?.discountFunder ?? ""},${payment.settlement?.netToSeller ?? ""},true`,
  ].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

paymentsRouter.post("/disputes", requireAuth, requireRole("TRADER"), async (req, res) => {
  const dispute = await prisma.dispute.create({
    data: {
      orderId: String(req.body.orderId),
      raisedById: req.user!.id,
      reason: String(req.body.reason),
    },
  });
  await prisma.order.update({ where: { id: dispute.orderId }, data: { status: "disputed" } });
  await prisma.payment.updateMany({ where: { orderId: dispute.orderId }, data: { status: "disputed" } });
  await audit({ actorId: req.user!.id, action: "dispute.raised", entity: "dispute", entityId: dispute.id });
  res.status(201).json({ dispute });
});

paymentsRouter.post("/disputes/:id/resolve", requireAuth, requireRole("PLATFORM_ADMIN"), async (req, res) => {
  const resolution = String(req.body.resolution);
  const dispute = await prisma.dispute.update({
    where: { id: req.params.id },
    data: { status: "resolved", resolution },
  });
  if (resolution === "refund_full" || resolution === "refund_partial") {
    const payment = await prisma.payment.findFirst({ where: { orderId: dispute.orderId } });
    if (payment) {
      await prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: resolution === "refund_full" ? payment.amount : Number(req.body.amount ?? 0),
          reason: resolution,
        },
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "refunded" } });
    }
  }
  await audit({ actorId: req.user!.id, action: "dispute.resolved", entity: "dispute", entityId: dispute.id, after: dispute });
  res.json({ dispute });
});

paymentsRouter.get("/reconciliation", requireAuth, requireRole("PLATFORM_ADMIN", "BANK_OFFICER"), async (req, res) => {
  const payments = await prisma.payment.findMany({ include: { events: true, settlement: true } });
  const rows = payments.map((p) => ({
    platformRef: p.providerRef,
    platformStatus: p.status,
    providerStatus: p.events.at(-1)?.status ?? p.status,
    mismatch: (p.events.at(-1)?.status ?? p.status) !== p.status,
    amount: p.amount,
  }));
  res.json({ rows, mismatches: rows.filter((r) => r.mismatch) });
});
