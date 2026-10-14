import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { applyLogisticsDiscount, canAdvanceMilestone, canViewDriverContact, isActiveShipment } from "@cahs/shared";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";
export const logisticsRouter = Router();
async function providerVerified(userId) {
    const biz = await prisma.business.findFirst({
        where: { userId, kind: "logistics" },
        include: { verifications: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return biz?.verifications[0]?.status === "approved";
}
logisticsRouter.post("/business", requireAuth, requireRole("LOGISTICS_PROVIDER", "STORAGE_PROVIDER"), async (req, res) => {
    const kind = req.user.role === "STORAGE_PROVIDER" ? "storage" : "logistics";
    const business = await prisma.business.create({
        data: {
            userId: req.user.id,
            name: String(req.body.name),
            cacNumber: String(req.body.cacNumber ?? ""),
            address: String(req.body.address),
            contact: String(req.body.contact),
            kind,
            verifications: { create: { status: "submitted" } },
        },
        include: { verifications: true },
    });
    await audit({ actorId: req.user.id, action: "verification.submitted", entity: "business", entityId: business.id });
    res.status(201).json({ business });
});
logisticsRouter.post("/vehicles", requireAuth, requireRole("LOGISTICS_PROVIDER"), async (req, res) => {
    const vehicle = await prisma.vehicle.create({
        data: {
            providerId: req.user.id,
            plateNumber: String(req.body.plateNumber),
            description: String(req.body.description ?? ""),
        },
    });
    res.status(201).json({ vehicle });
});
logisticsRouter.post("/drivers", requireAuth, requireRole("LOGISTICS_PROVIDER"), async (req, res) => {
    const driver = await prisma.driver.create({
        data: {
            providerId: req.user.id,
            name: String(req.body.name),
            contact: String(req.body.contact),
        },
    });
    res.status(201).json({ driver });
});
logisticsRouter.post("/requests", requireAuth, async (req, res) => {
    const request = await prisma.deliveryRequest.create({
        data: {
            orderId: req.body.orderId,
            requesterId: req.user.id,
            origin: String(req.body.origin),
            destination: String(req.body.destination),
            loadDesc: String(req.body.loadDesc),
            weightKg: Number(req.body.weightKg ?? 0),
            serviceLevel: String(req.body.serviceLevel ?? "standard"),
            pickupWindow: String(req.body.pickupWindow ?? ""),
        },
    });
    res.status(201).json({ request });
});
logisticsRouter.get("/requests", requireAuth, async (req, res) => {
    const requests = await prisma.deliveryRequest.findMany({
        include: { quotes: true, jobs: true },
        orderBy: { createdAt: "desc" },
    });
    res.json({ requests });
});
logisticsRouter.post("/requests/:id/quotes", requireAuth, requireRole("LOGISTICS_PROVIDER"), async (req, res) => {
    if (!(await providerVerified(req.user.id))) {
        return res.status(403).json({ error: "Unverified logistics providers cannot accept jobs or submit quotes." });
    }
    const request = await prisma.deliveryRequest.findUnique({ where: { id: req.params.id } });
    if (!request)
        return res.status(404).json({ error: "Not found" });
    const buyer = await prisma.user.findUnique({ where: { id: request.requesterId } });
    const baseCharge = Number(req.body.baseCharge);
    const rule = await prisma.discountRule.findFirst({ where: { kind: "logistics", active: true } });
    const priced = applyLogisticsDiscount(baseCharge, Boolean(buyer?.isEligibleZenithCustomer), rule
        ? {
            active: rule.active,
            percentOff: rule.percentOff,
            fixedOff: rule.fixedOff,
            discountFunder: rule.discountFunder,
        }
        : undefined);
    const quote = await prisma.quote.create({
        data: {
            requestId: request.id,
            providerId: req.user.id,
            baseCharge: priced.baseCharge,
            discountAmount: priced.discountAmount,
            customerPays: priced.customerPays,
            discountFunder: priced.discountFunder,
            conditions: String(req.body.conditions ?? "Standard handling. Simulated quote."),
        },
    });
    res.status(201).json({
        quote,
        display: {
            route: `${request.origin} → ${request.destination}`,
            load: request.loadDesc,
            serviceLevel: request.serviceLevel,
            conditions: quote.conditions,
            baseCharge: quote.baseCharge,
            discount: quote.discountAmount,
            funder: quote.discountFunder,
            proposedPartnershipBenefit: priced.appliedZenithBenefit,
        },
    });
});
logisticsRouter.post("/quotes/:id/accept", requireAuth, async (req, res) => {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { request: true } });
    if (!quote)
        return res.status(404).json({ error: "Not found" });
    if (quote.request.requesterId !== req.user.id)
        return res.status(403).json({ error: "Forbidden" });
    if (!(await providerVerified(quote.providerId))) {
        return res.status(403).json({ error: "Provider is not verified." });
    }
    const job = await prisma.job.create({
        data: {
            requestId: quote.requestId,
            quoteId: quote.id,
            providerId: quote.providerId,
            status: "assigned",
            etaWindow: "Simulated 24–48 hours",
        },
    });
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "accepted" } });
    if (quote.request.orderId) {
        await prisma.order.update({ where: { id: quote.request.orderId }, data: { status: "fulfilment" } });
    }
    await audit({ actorId: req.user.id, action: "job.assigned", entity: "job", entityId: job.id });
    res.status(201).json({ job });
});
logisticsRouter.post("/jobs/:id/assign", requireAuth, requireRole("LOGISTICS_PROVIDER"), async (req, res) => {
    if (!(await providerVerified(req.user.id))) {
        return res.status(403).json({ error: "Unverified logistics providers cannot accept jobs." });
    }
    const job = await prisma.job.update({
        where: { id: req.params.id },
        data: { driverId: req.body.driverId, vehicleId: req.body.vehicleId },
    });
    res.json({ job });
});
logisticsRouter.post("/jobs/:id/milestones", requireAuth, async (req, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { milestones: { orderBy: { createdAt: "desc" } }, request: true },
    });
    if (!job)
        return res.status(404).json({ error: "Not found" });
    const adminOverride = req.user.role === "PLATFORM_ADMIN" && Boolean(req.body.overrideReason);
    const current = job.milestones[0]?.code ?? null;
    const next = req.body.code;
    const check = canAdvanceMilestone(current, next, adminOverride);
    if (!check.ok)
        return res.status(400).json({ error: check.reason });
    if (adminOverride) {
        await audit({
            actorId: req.user.id,
            action: "milestone.override",
            entity: "job",
            entityId: job.id,
            after: { reason: req.body.overrideReason, next },
        });
    }
    const mile = await prisma.shipmentMilestone.create({
        data: {
            jobId: job.id,
            code: next,
            note: req.body.note,
            location: req.body.location,
            actorId: req.user.id,
        },
    });
    const orderStatus = next === "in_transit" ? "in_transit" : next === "delivered" ? "delivered" : undefined;
    if (orderStatus && job.request.orderId) {
        await prisma.order.update({ where: { id: job.request.orderId }, data: { status: orderStatus } });
    }
    if (next === "delivered") {
        await prisma.job.update({ where: { id: job.id }, data: { status: "completed" } });
    }
    await audit({ actorId: req.user.id, action: "milestone", entity: "shipment_milestone", entityId: mile.id, after: mile });
    await notify(job.request.requesterId, "Shipment update", `Status: ${next.replaceAll("_", " ")}`);
    res.status(201).json({ milestone: mile });
});
logisticsRouter.post("/jobs/:id/location", requireAuth, requireRole("LOGISTICS_PROVIDER"), async (req, res) => {
    const job = await prisma.job.update({
        where: { id: req.params.id },
        data: { mockLat: Number(req.body.lat), mockLng: Number(req.body.lng) },
    });
    res.json({ job, note: "Location is simulated (manual/mock GPS)." });
});
logisticsRouter.post("/jobs/:id/pod", requireAuth, async (req, res) => {
    const pod = await prisma.proofOfDelivery.create({
        data: { jobId: req.params.id, code: String(req.body.code ?? "SIM-POD"), confirmed: Boolean(req.body.confirmed) },
    });
    res.status(201).json({ pod });
});
logisticsRouter.get("/jobs/:id", requireAuth, async (req, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
            milestones: { orderBy: { createdAt: "asc" } },
            driver: true,
            vehicle: true,
            quote: true,
            request: { include: { order: true } },
            pods: true,
            provider: { select: { fullName: true, id: true } },
        },
    });
    if (!job)
        return res.status(404).json({ error: "Not found" });
    const latest = job.milestones.at(-1)?.code;
    const active = isActiveShipment(latest, job.status);
    const party = (() => {
        if (req.user.role === "PLATFORM_ADMIN")
            return "admin";
        if (req.user.id === job.providerId)
            return "assigned_provider";
        if (req.user.id === job.request.requesterId)
            return "buyer";
        if (job.request.order && req.user.id === job.request.order.sellerId)
            return "seller";
        return "other";
    })();
    const showDriver = canViewDriverContact(party, active);
    res.json({
        job: {
            ...job,
            driver: showDriver ? job.driver : null,
            mockLat: showDriver ? job.mockLat : null,
            mockLng: showDriver ? job.mockLng : null,
        },
        driverVisible: showDriver,
    });
});
