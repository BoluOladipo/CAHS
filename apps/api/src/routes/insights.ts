import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../lib/audit.js";

export const insightsRouter = Router();

// Default baseline financial data matching Zecathon 6.0 proposal illustrative specification
const DEFAULT_FINANCIAL_PROFILE = {
  monthLabel: "October 2026",
  totalRevenue: 2400000,
  totalExpenditure: 1650000,
  recordedLosses: 120000,
  netResult: 630000,
  prodChangePercent: 8.0,
  revChangePercent: 12.0,
  breakdown: {
    revenueByCrop: [
      { name: "Maize (White & Yellow)", amount: 1200000, percentage: 50.0 },
      { name: "Fresh Tomatoes (Plum)", amount: 850000, percentage: 35.4 },
      { name: "Soya Beans", amount: 350000, percentage: 14.6 },
    ],
    expenditureByCategory: [
      { category: "Farming inputs & seeds", amount: 900000, percentage: 54.5 },
      { category: "Storage & warehouse fees", amount: 350000, percentage: 21.2 },
      { category: "Logistics & transport", amount: 280000, percentage: 17.0 },
      { category: "Platform transaction fees", amount: 120000, percentage: 7.3 },
    ],
    lossesByCategory: [
      { cause: "Ambient heat spoilage (uncooled storage)", amount: 80000, percentage: 66.7 },
      { cause: "In-transit handling & crate vibration", amount: 40000, percentage: 33.3 },
    ],
  },
  aiGrowthPlan: [
    {
      title: "Cold Chain Spoilage Mitigation",
      impact: "+₦52,000 / month estimated recovery",
      description:
        "Moving 20% of your tomato harvest into Kano Cold Storage (2-4°C) would cut your ₦80,000 spoilage loss by 65%.",
      category: "Storage",
    },
    {
      title: "Logistics Route Freight Pooling",
      impact: "-₦35,000 transport cost reduction",
      description:
        "Consolidating weekly outbound grain dispatches to Mile 12 Lagos with 2 neighboring farms in your LGA saves transit overhead.",
      category: "Logistics",
    },
    {
      title: "High-Demand Crop Allocation",
      impact: "+14% projected demand index",
      description:
        "Marketplace demand indicators project firm farmgate pricing for Soya Beans in the upcoming cycle. Allocate 2 hectares.",
      category: "Production",
    },
    {
      title: "Zenith Bank Working Capital Pre-Qualification",
      impact: "Eligible for up to ₦1,500,000 seasonal facility",
      description:
        "Your verified positive net margin (₦630,000/mo) and steady cashflow make your business a prime candidate for the Zenith Bank Seasonal SME Input Loan.",
      category: "Financing",
    },
  ],
};

// Customer view: returns verified business financial insights
insightsRouter.get("/my-summary", requireAuth, async (req, res) => {
  let profile = await prisma.businessFinancialProfile.findUnique({
    where: { userId: req.user!.id },
  });

  if (!profile) {
    profile = await prisma.businessFinancialProfile.create({
      data: {
        userId: req.user!.id,
        monthLabel: DEFAULT_FINANCIAL_PROFILE.monthLabel,
        totalRevenue: DEFAULT_FINANCIAL_PROFILE.totalRevenue,
        totalExpenditure: DEFAULT_FINANCIAL_PROFILE.totalExpenditure,
        recordedLosses: DEFAULT_FINANCIAL_PROFILE.recordedLosses,
        netResult: DEFAULT_FINANCIAL_PROFILE.netResult,
        prodChangePercent: DEFAULT_FINANCIAL_PROFILE.prodChangePercent,
        revChangePercent: DEFAULT_FINANCIAL_PROFILE.revChangePercent,
        breakdownJson: JSON.stringify(DEFAULT_FINANCIAL_PROFILE.breakdown),
        aiPlanJson: JSON.stringify(DEFAULT_FINANCIAL_PROFILE.aiGrowthPlan),
      },
    });
  }

  const breakdown = profile.breakdownJson ? JSON.parse(profile.breakdownJson) : DEFAULT_FINANCIAL_PROFILE.breakdown;
  const aiGrowthPlan = profile.aiPlanJson ? JSON.parse(profile.aiPlanJson) : DEFAULT_FINANCIAL_PROFILE.aiGrowthPlan;

  res.json({
    summary: {
      id: profile.id,
      monthLabel: profile.monthLabel,
      totalRevenue: profile.totalRevenue,
      totalExpenditure: profile.totalExpenditure,
      recordedLosses: profile.recordedLosses,
      netResult: profile.netResult,
      prodChangePercent: profile.prodChangePercent,
      revChangePercent: profile.revChangePercent,
      sharedWithBank: profile.sharedWithBank,
      sharedAt: profile.sharedAt,
    },
    breakdown,
    aiGrowthPlan,
    disclaimer:
      "Guidance only. Not financial advice. Accuracy depends on completeness of recorded or user-authorised transactions. Does not guarantee loan approval or yield results.",
  });
});

// Customer: Toggle consent to share verified financial records with Zenith Bank for loan assessment
insightsRouter.post("/toggle-consent", requireAuth, async (req, res) => {
  const share = Boolean(req.body.sharedWithBank);

  const profile = await prisma.businessFinancialProfile.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      sharedWithBank: share,
      sharedAt: share ? new Date() : null,
      monthLabel: DEFAULT_FINANCIAL_PROFILE.monthLabel,
      totalRevenue: DEFAULT_FINANCIAL_PROFILE.totalRevenue,
      totalExpenditure: DEFAULT_FINANCIAL_PROFILE.totalExpenditure,
      recordedLosses: DEFAULT_FINANCIAL_PROFILE.recordedLosses,
      netResult: DEFAULT_FINANCIAL_PROFILE.netResult,
      prodChangePercent: DEFAULT_FINANCIAL_PROFILE.prodChangePercent,
      revChangePercent: DEFAULT_FINANCIAL_PROFILE.revChangePercent,
      breakdownJson: JSON.stringify(DEFAULT_FINANCIAL_PROFILE.breakdown),
      aiPlanJson: JSON.stringify(DEFAULT_FINANCIAL_PROFILE.aiGrowthPlan),
    },
    update: {
      sharedWithBank: share,
      sharedAt: share ? new Date() : null,
    },
  });

  await audit({
    actorId: req.user!.id,
    action: share ? "insights.consent_shared_with_bank" : "insights.consent_revoked",
    entity: "businessFinancialProfile",
    entityId: profile.id,
  });

  res.json({
    sharedWithBank: profile.sharedWithBank,
    sharedAt: profile.sharedAt,
    message: share
      ? "Your business financial profile is now shared with Zenith Bank for credit underwriting."
      : "Data sharing with Zenith Bank has been paused.",
  });
});

// Bank Officer: Inspect customer verified financial insights (only if customer granted consent)
insightsRouter.get("/bank-view/:userId", requireAuth, requireRole("BANK_OFFICER", "PLATFORM_ADMIN"), async (req, res) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, fullName: true, email: true, role: true, state: true, lga: true },
  });
  if (!targetUser) return res.status(404).json({ error: "Customer not found" });

  const profile = await prisma.businessFinancialProfile.findUnique({
    where: { userId: req.params.userId },
  });

  if (!profile || !profile.sharedWithBank) {
    return res.status(403).json({
      error: "Consent required",
      message: "This customer has not currently opted in to share their automated financial records with the bank.",
      customer: targetUser,
    });
  }

  const breakdown = profile.breakdownJson ? JSON.parse(profile.breakdownJson) : DEFAULT_FINANCIAL_PROFILE.breakdown;
  const aiGrowthPlan = profile.aiPlanJson ? JSON.parse(profile.aiPlanJson) : DEFAULT_FINANCIAL_PROFILE.aiGrowthPlan;

  res.json({
    customer: targetUser,
    summary: {
      monthLabel: profile.monthLabel,
      totalRevenue: profile.totalRevenue,
      totalExpenditure: profile.totalExpenditure,
      recordedLosses: profile.recordedLosses,
      netResult: profile.netResult,
      prodChangePercent: profile.prodChangePercent,
      revChangePercent: profile.revChangePercent,
      sharedAt: profile.sharedAt,
    },
    breakdown,
    aiGrowthPlan,
    verifiedByPlatform: true,
  });
});
