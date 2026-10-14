import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { projectedReturn, SAVINGS_DISCLOSURES } from "@cahs/shared";
import { audit } from "../lib/audit.js";
import { savingsService } from "../services/providers.js";
export const savingsRouter = Router();
async function savingsEnabled() {
    const flag = await prisma.featureFlag.findUnique({ where: { key: "savings" } });
    return flag?.enabled !== false;
}
savingsRouter.get("/products", requireAuth, async (req, res) => {
    if (!(await savingsEnabled()))
        return res.status(404).json({ error: "Savings is feature-flagged off." });
    const products = await prisma.savingsProduct.findMany({ where: { active: true } });
    res.json({
        products: products.map((p) => ({
            ...p,
            displayedRate: req.user.isEligibleZenithCustomer ? p.zenithRatePercent : p.nonZenithRatePercent,
            holdingInstitution: "Zenith Bank",
        })),
        disclosures: SAVINGS_DISCLOSURES,
        subjectTo: "Subject to Zenith Bank approvals",
    });
});
savingsRouter.post("/accounts", requireAuth, async (req, res) => {
    if (!(await savingsEnabled()))
        return res.status(404).json({ error: "Savings is feature-flagged off." });
    if (!req.body.acknowledged) {
        return res.status(400).json({ error: "You must acknowledge all disclosures before opening a savings option." });
    }
    const product = await prisma.savingsProduct.findUnique({ where: { id: String(req.body.productId) } });
    if (!product)
        return res.status(404).json({ error: "Product not found" });
    const principal = Number(req.body.principal);
    const rate = req.user.isEligibleZenithCustomer ? product.zenithRatePercent : product.nonZenithRatePercent;
    const projected = projectedReturn(principal, rate, product.tenorDays);
    const maturesAt = new Date(Date.now() + product.tenorDays * 864e5);
    await savingsService.open({ userId: req.user.id, productId: product.id, principal });
    const account = await prisma.savingsAccount.create({
        data: {
            userId: req.user.id,
            productId: product.id,
            principal,
            maturesAt,
            projected,
            acknowledged: true,
        },
    });
    await audit({ actorId: req.user.id, action: "savings.opened", entity: "savings_account", entityId: account.id, after: account });
    res.status(201).json({
        account,
        projectedReturn: projected,
        holdingInstitution: "Zenith Bank",
        disclosures: SAVINGS_DISCLOSURES,
        simulated: true,
    });
});
savingsRouter.get("/accounts", requireAuth, async (req, res) => {
    const accounts = await prisma.savingsAccount.findMany({
        where: { userId: req.user.id },
        include: { product: true },
    });
    res.json({ accounts, note: "Customer deposit balances are not CAHS revenue." });
});
