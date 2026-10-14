import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { aiService } from "../services/ai.js";
import { audit } from "../lib/audit.js";
import { notify } from "../lib/notify.js";

export const supportRouter = Router();

// Stage 1: AI guided self-service triage
supportRouter.post("/triage", requireAuth, async (req, res) => {
  const text = String(req.body.text ?? "");
  if (!text.trim()) {
    return res.status(400).json({ error: "Please describe your issue." });
  }

  const result = await aiService.triageComplaint(req.user!.id, {
    text,
    orderId: req.body.orderId ? String(req.body.orderId) : undefined,
    paymentRef: req.body.paymentRef ? String(req.body.paymentRef) : undefined,
  });

  res.json({
    ...result,
    stage: 1,
    banner: "AI customer support & complaint triage (decision support only). Security notice: CAHS and Zenith Bank will never ask for your PIN, OTP, or password.",
  });
});

// Stage 2: Urgency-ranked escalation to Zenith Bank support queue
supportRouter.post("/escalate", requireAuth, async (req, res) => {
  const { category, priority, summary, stepsTried, relatedTxnRef, relatedOrderId } = req.body;
  if (!summary || !category) {
    return res.status(400).json({ error: "Missing required escalation fields." });
  }

  const validPriority = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(priority) ? priority : "MEDIUM";
  const validCategory = ["PAYMENT", "DELIVERY", "DISPUTE", "LOAN", "REFUND", "ACCOUNT"].includes(category)
    ? category
    : "ACCOUNT";

  const complaintCase = await prisma.complaintCase.create({
    data: {
      userId: req.user!.id,
      category: validCategory,
      priority: validPriority,
      status: "RECEIVED",
      summary: String(summary),
      stepsTried: stepsTried ? String(stepsTried) : undefined,
      relatedTxnRef: relatedTxnRef ? String(relatedTxnRef) : undefined,
      relatedOrderId: relatedOrderId ? String(relatedOrderId) : undefined,
    },
    include: { user: true },
  });

  await notify(
    req.user!.id,
    "Complaint case received",
    `Case #${complaintCase.id.slice(0, 8)} (${complaintCase.priority}) received. A Zenith Bank officer is assigned based on urgency.`
  );

  await audit({
    actorId: req.user!.id,
    action: "support.case_escalated",
    entity: "complaintCase",
    entityId: complaintCase.id,
    after: { priority: validPriority, category: validCategory },
  });

  res.status(201).json({
    case: complaintCase,
    message: "Your case has been escalated to the Zenith Bank triage queue.",
  });
});

// Customer: list my submitted complaints
supportRouter.get("/my-cases", requireAuth, async (req, res) => {
  const cases = await prisma.complaintCase.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ cases });
});

// Bank Officer / Admin: Live urgency-ranked complaint queue
supportRouter.get("/bank-queue", requireAuth, requireRole("BANK_OFFICER", "PLATFORM_ADMIN"), async (req, res) => {
  const priorityFilter = req.query.priority ? String(req.query.priority) : undefined;
  const statusFilter = req.query.status ? String(req.query.status) : undefined;

  const where: any = {};
  if (priorityFilter && priorityFilter !== "ALL") where.priority = priorityFilter;
  if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

  const cases = await prisma.complaintCase.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isEligibleZenithCustomer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Rank with priority weighting: CRITICAL (0), HIGH (1), MEDIUM (2), LOW (3)
  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...cases].sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  res.json({
    cases: sorted,
    summary: {
      total: cases.length,
      critical: cases.filter((c) => c.priority === "CRITICAL" && c.status !== "RESOLVED").length,
      high: cases.filter((c) => c.priority === "HIGH" && c.status !== "RESOLVED").length,
      medium: cases.filter((c) => c.priority === "MEDIUM" && c.status !== "RESOLVED").length,
      unresolved: cases.filter((c) => c.status !== "RESOLVED").length,
    },
  });
});

// Bank Officer / Admin: Assign case to officer
supportRouter.post("/cases/:id/assign", requireAuth, requireRole("BANK_OFFICER", "PLATFORM_ADMIN"), async (req, res) => {
  const complaintCase = await prisma.complaintCase.findUnique({ where: { id: req.params.id } });
  if (!complaintCase) return res.status(404).json({ error: "Case not found" });

  const updated = await prisma.complaintCase.update({
    where: { id: req.params.id },
    data: {
      assignedTo: req.user!.fullName,
      status: "INVESTIGATING",
    },
  });

  await notify(
    complaintCase.userId,
    "Investigation started",
    `Case #${complaintCase.id.slice(0, 8)} is now being investigated by ${req.user!.fullName} (Zenith Bank).`
  );

  await audit({
    actorId: req.user!.id,
    action: "support.case_assigned",
    entity: "complaintCase",
    entityId: req.params.id,
  });

  res.json({ case: updated });
});

// Bank Officer / Admin: Resolve complaint case
supportRouter.post("/cases/:id/resolve", requireAuth, requireRole("BANK_OFFICER", "PLATFORM_ADMIN"), async (req, res) => {
  const complaintCase = await prisma.complaintCase.findUnique({ where: { id: req.params.id } });
  if (!complaintCase) return res.status(404).json({ error: "Case not found" });

  const resolutionNote = String(req.body.note ?? "Issue investigated and resolved with customer.");

  const updated = await prisma.complaintCase.update({
    where: { id: req.params.id },
    data: {
      status: "RESOLVED",
      resolutionNote,
      resolvedAt: new Date(),
    },
  });

  await notify(
    complaintCase.userId,
    "Complaint resolved",
    `Case #${complaintCase.id.slice(0, 8)} has been resolved: ${resolutionNote}`
  );

  await audit({
    actorId: req.user!.id,
    action: "support.case_resolved",
    entity: "complaintCase",
    entityId: req.params.id,
    after: { resolutionNote },
  });

  res.json({ case: updated });
});
