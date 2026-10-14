import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { paymentProvider } from "../services/providers.js";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";
import { calculatePlatformFee, applyLogisticsDiscount, isDiscountFunder } from "@cahs/shared";
export const paymentsRouter = Router();
paymentsRouter.get("/quote", requireAuth, async (req, res) => {
    const amount = Number(req.query.amount ?? 0);
    const logisticsBase = Number(req.query.logisticsBase ?? 0);
    const storedFeeRule = await prisma.feeRule.findFirst({ where: { active: true } });
    let feeRule;
    if (storedFeeRule) {
        const { discountFunder } = storedFeeRule;
        if (!isDiscountFunder(discountFunder)) {
            return res.status(500).json({ error: "Invalid fee rule configuration" });
        }
        feeRule = { ...storedFeeRule, discountFunder };
    }
    const fee = calculatePlatformFee(amount, req.user.isEligibleZenithCustomer, feeRule);
    const logRule = await prisma.discountRule.findFirst({ where: { kind: "logistics", active: true } });
    const logistics = logisticsBase
        ? applyLogisticsDiscount(logisticsBase, req.user.isEligibleZenithCustomer, logRule
            ? {
                active: logRule.active,
                percentOff: logRule.percentOff,
                fixedOff: logRule.fixedOff,
                discountFunder: logRule.discountFunder,
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
    if (!order || order.buyerId !== req.user.id)
        return res.status(404).json({ error: "Order not found" });
    if (order.status !== "payment_pending")
        return res.status(400).json({ error: "Order is not awaiting payment" });
    const method = String(req.body.method ?? "other_bank");
    const checkout = await paymentProvider.createCheckout({
        amount: order.totalDue,
        method,
        customerEmail: req.user.email,
    });
    const payment = await prisma.payment.create({
        data: {
            orderId: order.id,
            userId: req.user.id,
            amount: order.totalDue,
            status: "pending",
            providerRef: checkout.reference,
            method,
            events: { create: { status: "pending", payload: JSON.stringify({ simulated: true }) } },
        },
    });
    await audit({ actorId: req.user.id, action: "payment.pending", entity: "payment", entityId: payment.id });
    res.json({
        payment,
        redirectUrl: checkout.redirectUrl,
        banner: "Prototype: simulated payments. No real funds are handled. Card details are never collected.",
    });
});
paymentsRouter.post("/sandbox/complete", requireAuth, async (req, res) => {
    const reference = String(req.body.reference);
    const payment = await prisma.payment.findUnique({ where: { providerRef: reference }, include: { order: true } });
    if (!payment)
        return res.status(404).json({ error: "Unknown reference" });
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
    await audit({ actorId: req.user.id, action: "payment.success", entity: "payment", entityId: payment.id, after: updated });
    res.json({ payment: updated, simulated: true });
});
paymentsRouter.get("/settlements", requireAuth, async (req, res) => {
    const where = req.user.role === "PLATFORM_ADMIN" || req.user.role === "BANK_OFFICER"
        ? {}
        : { payment: { userId: req.user.id } };
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
    if (!payment)
        return res.status(404).send("not found");
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
            raisedById: req.user.id,
            reason: String(req.body.reason),
        },
    });
    await prisma.order.update({ where: { id: dispute.orderId }, data: { status: "disputed" } });
    await prisma.payment.updateMany({ where: { orderId: dispute.orderId }, data: { status: "disputed" } });
    await audit({ actorId: req.user.id, action: "dispute.raised", entity: "dispute", entityId: dispute.id });
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
    await audit({ actorId: req.user.id, action: "dispute.resolved", entity: "dispute", entityId: dispute.id, after: dispute });
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
// --- Pending-State Payment Protection Engine (Zecathon 6.0: Strengthening Trust in Digital Banking) ---
// Customer status check: returns a single unified transaction view (internal retry attempts hidden from customer)
paymentsRouter.get("/status/:reference", requireAuth, async (req, res) => {
    const payment = await prisma.payment.findUnique({
        where: { providerRef: req.params.reference },
        include: { order: true },
    });
    if (!payment)
        return res.status(404).json({ error: "Payment not found" });
    let customerMessage = "Transaction confirmed.";
    if (payment.status === "pending" || payment.status === "processing") {
        customerMessage =
            "Pending: automatic background retry in progress. You see one single transaction and will not be charged twice.";
    }
    else if (payment.status === "not_completed") {
        customerMessage =
            "Transfer not completed. No funds have been debited; any temporary hold has been released. You may safely try again.";
    }
    res.json({
        payment: {
            id: payment.id,
            providerRef: payment.providerRef,
            amount: payment.amount,
            status: payment.status,
            orderId: payment.orderId,
            holdReleased: payment.holdReleased,
            customerMessage,
            createdAt: payment.createdAt,
        },
        singleTransactionView: true,
        banner: "Prototype: simulated payments. No real funds are handled.",
    });
});
// Trigger a background retry using the SAME original reference (idempotent, never double-debits)
paymentsRouter.post("/:reference/retry-attempt", requireAuth, async (req, res) => {
    const payment = await prisma.payment.findUnique({
        where: { providerRef: req.params.reference },
        include: { order: true },
    });
    if (!payment)
        return res.status(404).json({ error: "Payment not found" });
    const nextCount = payment.retryCount + 1;
    const intervals = [30, 120, 300, 900]; // 30s, 2m, 5m, 15m
    const nextIntervalSec = intervals[Math.min(nextCount, intervals.length - 1)];
    // Log internal timestamped retry event (auditable by bank/platform admin)
    await prisma.paymentEvent.create({
        data: {
            paymentId: payment.id,
            status: "pending_retry",
            payload: JSON.stringify({
                attempt: nextCount,
                timestamp: new Date().toISOString(),
                reference: payment.providerRef,
                nextIntervalSec,
                simulatedSwitchCode: "INCOMPLETE_RETRY_SCHEDULED",
            }),
        },
    });
    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: "pending",
            retryCount: nextCount,
            nextRetryAt: new Date(Date.now() + nextIntervalSec * 1000),
        },
    });
    await audit({
        actorId: req.user.id,
        action: "payment.pending_retry",
        entity: "payment",
        entityId: payment.id,
        after: { attempt: nextCount, reference: payment.providerRef },
    });
    res.json({
        payment: updated,
        message: `Attempt #${nextCount} logged. Next automated retry in ${nextIntervalSec}s with same reference ${payment.providerRef}.`,
    });
});
// Simulate successful confirmation from bank switch
paymentsRouter.post("/:reference/complete-success", requireAuth, async (req, res) => {
    const payment = await prisma.payment.findUnique({
        where: { providerRef: req.params.reference },
        include: { order: true },
    });
    if (!payment)
        return res.status(404).json({ error: "Payment not found" });
    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: "successful",
            events: {
                create: {
                    status: "successful",
                    payload: JSON.stringify({
                        confirmedAt: new Date().toISOString(),
                        bankSwitchCode: "00_APPROVED",
                        reference: payment.providerRef,
                        attemptsTotal: payment.retryCount + 1,
                    }),
                },
            },
        },
    });
    if (payment.orderId) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { status: "paid" } });
        await prisma.settlement.upsert({
            where: { paymentId: payment.id },
            create: {
                paymentId: payment.id,
                grossAmount: payment.amount,
                fees: payment.order?.platformFee ?? 0,
                discounts: payment.order?.zenithDiscount ?? 0,
                discountFunder: payment.order?.discountFunder,
                netToSeller: payment.order?.subtotal ?? payment.amount,
                status: "held",
            },
            update: { status: "held" },
        });
        await notify(payment.userId, "Payment confirmed", `Pending transfer ${payment.providerRef} completed successfully. One single charge applied.`);
    }
    await audit({ actorId: req.user.id, action: "payment.pending_resolved_success", entity: "payment", entityId: payment.id });
    res.json({ payment: updated, success: true });
});
// Simulate retry window timeout: marks as "not_completed" and releases any reserved holds
paymentsRouter.post("/:reference/timeout-release", requireAuth, async (req, res) => {
    const payment = await prisma.payment.findUnique({
        where: { providerRef: req.params.reference },
        include: { order: true },
    });
    if (!payment)
        return res.status(404).json({ error: "Payment not found" });
    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: "not_completed",
            holdReleased: true,
            events: {
                create: {
                    status: "not_completed",
                    payload: JSON.stringify({
                        reason: "RETRY_WINDOW_EXPIRED",
                        releasedAt: new Date().toISOString(),
                        holdReleased: true,
                        reference: payment.providerRef,
                    }),
                },
            },
        },
    });
    if (payment.orderId) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { status: "payment_pending" } });
        await notify(payment.userId, "Transfer not completed", `Retry window for transfer ${payment.providerRef} ended without confirmation. No funds were debited and holds were released.`);
    }
    await audit({ actorId: req.user.id, action: "payment.pending_timeout_released", entity: "payment", entityId: payment.id });
    res.json({ payment: updated, holdReleased: true });
});
// Admin / Bank Officer engine view: shows all pending payments with full timestamped retry logs
paymentsRouter.get("/pending-engine", requireAuth, async (_req, res) => {
    const pendingPayments = await prisma.payment.findMany({
        where: { status: { in: ["pending", "processing", "not_completed"] } },
        include: { events: { orderBy: { createdAt: "desc" } }, order: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json({
        pendingPayments,
        conceptNote: "Pending-State Payment Protection: automatic background retries with identical reference prevent duplicate debits.",
    });
});
