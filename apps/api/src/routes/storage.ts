import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { applyStorageDiscount, assertNonNegativeCapacity, runningBalance } from "@cahs/shared";
import { audit } from "../lib/audit.js";
import { aiService } from "../services/ai.js";

export const storageRouter = Router();

async function storageVerified(userId: string) {
  const biz = await prisma.business.findFirst({
    where: { userId, kind: "storage" },
    include: { verifications: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return biz?.verifications[0]?.status === "approved";
}

storageRouter.get("/facilities", async (_req, res) => {
  const facilities = await prisma.storageFacility.findMany({ include: { owner: { select: { fullName: true } } } });
  const withBadge = await Promise.all(
    facilities.map(async (f) => ({
      ...f,
      verified: await storageVerified(f.ownerId),
    })),
  );
  res.json({ facilities: withBadge.filter((f) => f.verified || true) });
});

storageRouter.post("/facilities", requireAuth, requireRole("STORAGE_PROVIDER"), async (req, res) => {
  const verified = await storageVerified(req.user!.id);
  const facility = await prisma.storageFacility.create({
    data: {
      ownerId: req.user!.id,
      name: String(req.body.name),
      state: String(req.body.state),
      lga: String(req.body.lga),
      storageType: String(req.body.storageType ?? "dry"),
      capacity: Number(req.body.capacity),
      available: Number(req.body.capacity),
      unit: String(req.body.unit ?? "bags"),
      pricePerUnitPeriod: Number(req.body.pricePerUnitPeriod),
    },
  });
  res.status(201).json({ facility, bookable: verified, note: verified ? "Verified" : "Unverified providers cannot publish bookable capacity." });
});

storageRouter.post("/bookings", requireAuth, requireRole("FARMER", "TRADER"), async (req, res) => {
  const facility = await prisma.storageFacility.findUnique({ where: { id: String(req.body.facilityId) } });
  if (!facility) return res.status(404).json({ error: "Facility not found" });
  if (!(await storageVerified(facility.ownerId))) {
    return res.status(403).json({ error: "Unverified storage providers cannot accept bookings." });
  }
  const quantity = Number(req.body.quantity);
  try {
    assertNonNegativeCapacity(facility.available, quantity);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
  const durationDays = Number(req.body.durationDays ?? 7);
  const base = facility.pricePerUnitPeriod * quantity * Math.ceil(durationDays / 7);
  const priced = applyStorageDiscount(base, req.user!.isEligibleZenithCustomer);
  const booking = await prisma.storageBooking.create({
    data: {
      facilityId: facility.id,
      userId: req.user!.id,
      produceType: String(req.body.produceType),
      quantity,
      startDate: new Date(req.body.startDate ?? Date.now()),
      durationDays,
      status: "requested",
      charge: priced.customerPays,
      zenithDiscount: priced.discountAmount,
      discountFunder: priced.discountFunder,
    },
  });
  res.status(201).json({ booking, proposedPartnershipBenefit: priced.appliedZenithBenefit });
});

storageRouter.post("/bookings/:id/decision", requireAuth, requireRole("STORAGE_PROVIDER"), async (req, res) => {
  if (!(await storageVerified(req.user!.id))) {
    return res.status(403).json({ error: "Unverified storage providers cannot accept bookings." });
  }
  const booking = await prisma.storageBooking.findUnique({ where: { id: req.params.id }, include: { facility: true } });
  if (!booking || booking.facility.ownerId !== req.user!.id) return res.status(404).json({ error: "Not found" });
  const accept = Boolean(req.body.accept);
  if (accept) {
    try {
      assertNonNegativeCapacity(booking.facility.available, booking.quantity);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
    await prisma.storageFacility.update({
      where: { id: booking.facilityId },
      data: { available: booking.facility.available - booking.quantity },
    });
  }
  const updated = await prisma.storageBooking.update({
    where: { id: booking.id },
    data: { status: accept ? "accepted" : "declined" },
  });
  await audit({ actorId: req.user!.id, action: accept ? "storage.accepted" : "storage.declined", entity: "storage_booking", entityId: booking.id });
  res.json({ booking: updated });
});

storageRouter.post("/bookings/:id/movement", requireAuth, requireRole("STORAGE_PROVIDER"), async (req, res) => {
  const booking = await prisma.storageBooking.findUnique({
    where: { id: req.params.id },
    include: { movements: true, facility: true },
  });
  if (!booking) return res.status(404).json({ error: "Not found" });
  const kind = String(req.body.kind);
  const quantity = Number(req.body.quantity);
  const intake = booking.movements.filter((m) => m.kind === "intake").reduce((s, m) => s + m.quantity, 0);
  const dispatch = booking.movements.filter((m) => m.kind === "dispatch").reduce((s, m) => s + m.quantity, 0);
  try {
    if (kind === "dispatch") runningBalance(intake, dispatch + quantity);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
  const movement = await prisma.stockMovement.create({
    data: {
      bookingId: booking.id,
      kind,
      quantity,
      condition: req.body.condition,
      destination: req.body.destination,
      orderRef: req.body.orderRef,
      note: req.body.note,
    },
  });
  const risk = await aiService.spoilageRisk({
    crop: booking.produceType,
    durationDays: booking.durationDays,
    temperatureC: Number(req.body.temperatureC ?? 26),
    humidity: Number(req.body.humidity ?? 60),
    condition: String(req.body.condition ?? "good"),
  });
  res.status(201).json({ movement, risk, ledgerBalance: runningBalance(intake + (kind === "intake" ? quantity : 0), dispatch + (kind === "dispatch" ? quantity : 0)) });
});

storageRouter.get("/bookings/:id/ledger", requireAuth, async (req, res) => {
  const booking = await prisma.storageBooking.findUnique({
    where: { id: req.params.id },
    include: { movements: { orderBy: { createdAt: "asc" } }, facility: true },
  });
  if (!booking) return res.status(404).json({ error: "Not found" });
  const intake = booking.movements.filter((m) => m.kind === "intake").reduce((s, m) => s + m.quantity, 0);
  const dispatch = booking.movements.filter((m) => m.kind === "dispatch").reduce((s, m) => s + m.quantity, 0);
  const risk = await aiService.spoilageRisk({
    crop: booking.produceType,
    durationDays: booking.durationDays,
    temperatureC: 26,
    humidity: 65,
    condition: "good",
  });
  res.json({ booking, intake, dispatch, balance: runningBalance(intake, dispatch), risk });
});

storageRouter.get("/occupancy", requireAuth, requireRole("STORAGE_PROVIDER"), async (req, res) => {
  const facilities = await prisma.storageFacility.findMany({
    where: { ownerId: req.user!.id },
    include: { bookings: true },
  });
  res.json({ facilities });
});
