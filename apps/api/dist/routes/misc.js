import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { aiService } from "../services/ai.js";
export const notifyRouter = Router();
export const aiRouter = Router();
export const rewardsRouter = Router();
notifyRouter.get("/", requireAuth, async (req, res) => {
    const items = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json({ notifications: items });
});
notifyRouter.post("/:id/read", requireAuth, async (req, res) => {
    await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: new Date() } });
    res.json({ ok: true });
});
aiRouter.post("/chat", requireAuth, async (req, res) => {
    const flag = await prisma.featureFlag.findUnique({ where: { key: "ai" } });
    if (flag && !flag.enabled)
        return res.status(404).json({ error: "AI assistance is feature-flagged off." });
    const result = await aiService.chat(req.user.id, String(req.body.prompt ?? ""));
    res.json({ ...result, disclaimer: "Decision support only. Optional. Human-reviewed where used for loans." });
});
aiRouter.post("/feedback", requireAuth, async (req, res) => {
    await prisma.aiInteraction.update({
        where: { id: String(req.body.id) },
        data: { feedback: String(req.body.feedback), flagged: Boolean(req.body.flagged) },
    });
    if (req.body.flagged) {
        await prisma.aiFlag.create({ data: { interactionId: String(req.body.id), reason: String(req.body.reason ?? "user_flag") } });
    }
    res.json({ ok: true });
});
rewardsRouter.get("/", requireAuth, async (req, res) => {
    const flag = await prisma.featureFlag.findUnique({ where: { key: "loyalty" } });
    if (flag && !flag.enabled)
        return res.json({ entries: [], disabled: true });
    const entries = await prisma.loyaltyLedger.findMany({ where: { userId: req.user.id } });
    const balance = entries.reduce((s, e) => s + e.points, 0);
    res.json({ entries, balance, label: "Proposed partnership benefit" });
});
