import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";
import { calculatePlatformFee, applyLogisticsDiscount, isDiscountFunder } from "@cahs/shared";
import type { FeeRule } from "@cahs/shared";
import { aiService } from "../services/ai.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/listings", async (req, res) => {
  const { produce, state, grade, q, minPrice, maxPrice, verifiedSeller } = req.query;
  let rows: any[] = [];
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: { in: ["active", "reserved"] },
        produceType: produce ? String(produce) : undefined,
        state: state ? String(state) : undefined,
        grade: grade ? String(grade) : undefined,
        pricePerUnit: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
        OR: q
          ? [
              { produceType: { contains: String(q), mode: "insensitive" } },
              { harvestNotes: { contains: String(q), mode: "insensitive" } },
            ]
          : undefined,
      },
      include: { farmer: { select: { fullName: true, isEligibleZenithCustomer: true, id: true } }, images: true },
      orderBy: { createdAt: "desc" },
    });
    rows = listings;
    if (verifiedSeller === "true") {
      rows = listings.filter((l) => l.farmer.isEligibleZenithCustomer);
    }
  } catch (err) {
    console.warn("[listings] Database offline, serving prototype demo listings:", (err as Error).message);
    rows = [
      {
        id: "demo-listing-1",
        produceType: "Soybeans",
        quantity: 50,
        unit: "bags (100kg)",
        pricePerUnit: 48000,
        grade: "Grade A",
        state: "Benue",
        lga: "Gboko",
        status: "active",
        harvestNotes: "Naturally sun-dried, moisture < 10%",
        farmer: { id: "demo-farmer", fullName: "Musa Ibrahim", isEligibleZenithCustomer: true },
        images: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-listing-2",
        produceType: "Yellow Maize",
        quantity: 120,
        unit: "bags (50kg)",
        pricePerUnit: 26500,
        grade: "Grade A",
        state: "Kaduna",
        lga: "Zaria",
        status: "active",
        harvestNotes: "Clean, sorted yellow corn",
        farmer: { id: "demo-farmer-2", fullName: "Fatima Aliyu", isEligibleZenithCustomer: true },
        images: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-listing-3",
        produceType: "Cassava Tubers",
        quantity: 30,
        unit: "tonnes",
        pricePerUnit: 85000,
        grade: "Grade B",
        state: "Oyo",
        lga: "Iseyin",
        status: "active",
        harvestNotes: "Fresh harvest, ready for garri processing",
        farmer: { id: "demo-farmer-3", fullName: "Biodun Adeleke", isEligibleZenithCustomer: false },
        images: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }
  res.json({ listings: rows, note: "Demo data may be labelled as such on farmer profiles." });
});

marketplaceRouter.get("/listings/compare", async (req, res) => {
  const ids = String(req.query.ids ?? "")
    .split(",")
    .filter(Boolean);
  const listings = await prisma.listing.findMany({
    where: { id: { in: ids } },
    include: { farmer: { select: { fullName: true, state: true } }, images: true },
  });
  res.json({ listings });
});

marketplaceRouter.get("/listings/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { farmer: { select: { fullName: true, state: true, lga: true } }, images: true },
  });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  const history = await prisma.priceHistory.findMany({
    where: { produceType: listing.produceType },
    orderBy: { month: "asc" },
  });
  const insight = await aiService.priceInsight(listing.produceType, history);
  res.json({ listing, priceInsight: insight });
});

marketplaceRouter.post("/listings", requireAuth, requireRole("FARMER"), async (req, res) => {
  const b = req.body ?? {};
  const listing = await prisma.listing.create({
    data: {
      farmerId: req.user!.id,
      produceType: String(b.produceType),
      quantity: Number(b.quantity),
      unit: String(b.unit ?? "kg"),
      pricePerUnit: Number(b.pricePerUnit),
      grade: String(b.grade ?? "B"),
      state: String(b.state ?? req.user!.fullName),
      lga: String(b.lga ?? ""),
      availableFrom: new Date(b.availableFrom ?? Date.now()),
      availableTo: new Date(b.availableTo ?? Date.now() + 14 * 864e5),
      harvestDate: b.harvestDate ? new Date(b.harvestDate) : null,
      harvestNotes: b.harvestNotes,
      status: b.status ?? "active",
    },
  });
  await audit({ actorId: req.user!.id, action: "listing.create", entity: "listing", entityId: listing.id, after: listing });
  res.status(201).json({ listing });
});

marketplaceRouter.patch("/listings/:id", requireAuth, requireRole("FARMER", "PLATFORM_ADMIN"), async (req, res) => {
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.user!.role === "FARMER" && existing.farmerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const listing = await prisma.listing.update({
    where: { id: req.params.id },
    data: {
      produceType: req.body.produceType,
      quantity: req.body.quantity,
      pricePerUnit: req.body.pricePerUnit,
      grade: req.body.grade,
      status: req.body.status,
      harvestNotes: req.body.harvestNotes,
    },
  });
  res.json({ listing });
});

marketplaceRouter.get("/orders", requireAuth, async (req, res) => {
  const where =
    req.user!.role === "TRADER"
      ? { buyerId: req.user!.id }
      : req.user!.role === "FARMER"
        ? { sellerId: req.user!.id }
        : {};
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { listing: true } }, buyer: true, seller: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
});

marketplaceRouter.get("/orders/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { listing: true } }, buyer: true, seller: true, payments: { include: { settlement: true } }, disputes: true },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (
    order.buyerId !== req.user!.id &&
    order.sellerId !== req.user!.id &&
    req.user!.role !== "PLATFORM_ADMIN" &&
    req.user!.role !== "BANK_OFFICER"
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json({ order });
});

marketplaceRouter.get("/price-insights", async (req, res) => {
  const produce = String(req.query.produce ?? "maize").toLowerCase();
  const history = await prisma.priceHistory.findMany({
    where: { produceType: { equals: produce, mode: "insensitive" } },
    orderBy: { month: "asc" },
  });
  const insight = await aiService.priceInsight(produce, history);
  res.json({ priceInsight: insight });
});

marketplaceRouter.post("/orders", requireAuth, requireRole("TRADER"), async (req, res) => {
  const listingId = String(req.body.listingId);
  const quantity = Number(req.body.quantity);
  const deliveryMode = String(req.body.deliveryMode ?? "self_collection");
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "active") return res.status(400).json({ error: "Listing not available" });
  if (quantity <= 0 || quantity > listing.quantity - listing.reservedQty) {
    return res.status(400).json({ error: "Quantity not available" });
  }
  const subtotal = quantity * listing.pricePerUnit;
  const storedFeeRule = await prisma.feeRule.findFirst({ where: { active: true } });
  let feeRule: FeeRule | undefined;
  if (storedFeeRule) {
    const { discountFunder } = storedFeeRule;
    if (!isDiscountFunder(discountFunder)) {
      return res.status(500).json({ error: "Invalid fee rule configuration" });
    }
    feeRule = { ...storedFeeRule, discountFunder };
  }
  const fee = calculatePlatformFee(subtotal, req.user!.isEligibleZenithCustomer, feeRule ?? undefined);
  const logisticsRule = await prisma.discountRule.findFirst({ where: { kind: "logistics", active: true } });
  let logisticsCharge = 0;
  let logisticsFunder: string | null = null;
  if (deliveryMode === "logistics") {
    const base = Number(req.body.logisticsBase ?? 50000);
    const priced = applyLogisticsDiscount(base, req.user!.isEligibleZenithCustomer, logisticsRule
      ? {
          active: logisticsRule.active,
          percentOff: logisticsRule.percentOff,
          fixedOff: logisticsRule.fixedOff,
          discountFunder: logisticsRule.discountFunder as "bank",
        }
      : undefined);
    logisticsCharge = priced.customerPays;
    logisticsFunder = priced.discountFunder;
  }
  const order = await prisma.order.create({
    data: {
      buyerId: req.user!.id,
      sellerId: listing.farmerId,
      status: "placed",
      deliveryMode,
      subtotal,
      platformFee: fee.feeAmount,
      zenithDiscount: fee.zenithDiscountAmount,
      discountFunder: fee.discountFunder ?? logisticsFunder,
      logisticsCharge,
      totalDue: subtotal + fee.feeAmount + logisticsCharge,
      items: { create: { listingId, quantity, unitPrice: listing.pricePerUnit } },
    },
    include: { items: true },
  });
  await audit({ actorId: req.user!.id, action: "order.placed", entity: "order", entityId: order.id, after: order });
  await notify(listing.farmerId, "New order", `A buyer placed an order on ${listing.produceType}.`);
  res.status(201).json({
    order,
    feeBreakdown: fee,
    proposedPartnershipBenefit: fee.appliedZenithBenefit,
  });
});

marketplaceRouter.post("/orders/:id/decision", requireAuth, requireRole("FARMER"), async (req, res) => {
  const accept = Boolean(req.body.accept);
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order || order.sellerId !== req.user!.id) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "placed") return res.status(400).json({ error: "Order is not awaiting decision" });
  if (accept) {
    for (const item of order.items) {
      const listing = await prisma.listing.findUnique({ where: { id: item.listingId } });
      if (!listing) continue;
      const available = listing.quantity - listing.reservedQty;
      if (item.quantity > available) return res.status(400).json({ error: "Insufficient remaining quantity" });
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          reservedQty: listing.reservedQty + item.quantity,
          status: listing.reservedQty + item.quantity >= listing.quantity ? "reserved" : listing.status,
        },
      });
    }
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: accept ? "payment_pending" : "declined" },
  });
  await audit({
    actorId: req.user!.id,
    action: accept ? "order.accepted" : "order.declined",
    entity: "order",
    entityId: order.id,
    before: order,
    after: updated,
  });
  await notify(order.buyerId, "Order update", accept ? "Your order was accepted. Payment is pending." : "Your order was declined.");
  res.json({ order: updated });
});

marketplaceRouter.post("/orders/:id/cancel", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (order.buyerId !== req.user!.id && req.user!.role !== "PLATFORM_ADMIN") return res.status(403).json({ error: "Forbidden" });
  for (const item of order.items) {
    const listing = await prisma.listing.findUnique({ where: { id: item.listingId } });
    if (listing && ["accepted", "payment_pending", "placed"].includes(order.status)) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          reservedQty: Math.max(0, listing.reservedQty - item.quantity),
          status: "active",
        },
      });
    }
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
  await audit({ actorId: req.user!.id, action: "order.cancelled", entity: "order", entityId: order.id, after: updated });
  res.json({ order: updated });
});

marketplaceRouter.post("/orders/:id/complete", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (order.buyerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "completed", rating: req.body.rating, ratingComment: req.body.comment },
  });
  await prisma.settlement.updateMany({
    where: { payment: { orderId: order.id } },
    data: { status: "released", settledAt: new Date() },
  });
  await audit({ actorId: req.user!.id, action: "order.completed", entity: "order", entityId: order.id });
  res.json({ order: updated });
});
