import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { LOAN_READINESS_LABEL } from "@cahs/shared";

export class AIService {
  async chat(userId: string, prompt: string) {
    const lower = prompt.toLowerCase();
    if (/(approve|reject).*(loan|credit)|guarantee.*(loan|return|profit)/.test(lower)) {
      const output =
        "I cannot approve, reject or guarantee loans, returns or profits. Credit decisions belong to authorised bank officers. Returns on savings are projected and subject to bank confirmation.";
      return this.log(userId, prompt, output);
    }
    const output = this.fallback(prompt);
    return this.log(userId, prompt, output);
  }

  fallback(prompt: string) {
    const lower = prompt.toLowerCase();
    if (lower.includes("list") || lower.includes("produce")) {
      return "Guided listing: 1) Choose the crop. 2) Enter quantity and unit. 3) Set a fair price per unit. 4) Add grade and harvest window. 5) Add a photo. 6) Publish as active. Keep sentences short. Need this in Pidgin, Hausa, Yoruba or Igbo? Ask and I will switch.";
    }
    if (lower.includes("loan") || lower.includes("checklist")) {
      return "Loan checklist (not a credit decision): farm or business details, crop/activity, land size, historical sales, amount, purpose, tenor, bank account (simulated), supporting documents, and consent if you want platform summaries attached. Bank officers make every decision.";
    }
    if (lower.includes("shipment") || lower.includes("delivery")) {
      return "Shipment statuses in order: packaged → collected → in transit → arrived at destination warehouse → out for delivery → delivered. ETAs are windows, not promises.";
    }
    return "I can help you list produce, explain platform steps, prepare a loan checklist, or explain shipment statuses. I do not make credit decisions or access other users' data.";
  }

  async loanReadiness(application: {
    amount: number;
    purpose: string;
    farmInfo: string;
    crops: string;
    historicalSales: string;
    attachSummaries: boolean;
    summaries?: unknown;
  }) {
    const missing: string[] = [];
    if (!application.farmInfo) missing.push("farm/business information");
    if (!application.crops) missing.push("crops/activities");
    if (!application.historicalSales) missing.push("historical sales");
    if (!application.purpose) missing.push("purpose");
    return {
      label: LOAN_READINESS_LABEL,
      missing,
      organised: {
        requestedAmount: application.amount,
        purpose: application.purpose,
        farm: application.farmInfo,
        crops: application.crops,
        historicalSales: application.historicalSales,
        platformSummaries: application.attachSummaries ? application.summaries ?? null : "Not attached — consent not active",
      },
      note: "Human review required. This is decision support only.",
    };
  }

  async priceInsight(produceType: string, history: { avgPrice: number }[]) {
    if (!history.length) {
      return { indicativeMin: null, indicativeMax: null, confidence: "low", basis: "No history", synthetic: true };
    }
    const prices = history.map((h) => h.avgPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const recent = prices.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return {
      produceType,
      indicativeMin: Math.round(avg * 0.9),
      indicativeMax: Math.round(avg * 1.1),
      demandSignal: recentAvg >= avg ? "steady to firm" : "softer than 12-month average",
      confidence: "medium",
      basis: "Synthetic 12-month seed prices (demo data) plus current listing sample. Indicative only.",
      synthetic: true,
    };
  }

  async spoilageRisk(input: { crop: string; durationDays: number; temperatureC: number; humidity: number; condition: string }) {
    const reasons: string[] = [];
    let score = 0;
    if (input.durationDays > 14) {
      score += 2;
      reasons.push("Storage duration above 14 days");
    }
    if (input.temperatureC > 28) {
      score += 2;
      reasons.push("Simulated temperature above 28°C");
    }
    if (input.humidity > 75) {
      score += 2;
      reasons.push("Simulated humidity above 75%");
    }
    if (["damaged", "wet"].includes(input.condition)) {
      score += 3;
      reasons.push(`Reported condition: ${input.condition}`);
    }
    const perishable = ["tomatoes", "tomato", "vegetables"].some((c) => input.crop.toLowerCase().includes(c));
    if (perishable) score += 1;
    return {
      advisory: true,
      level: score >= 5 ? "high" : score >= 3 ? "moderate" : "low",
      reasons: reasons.length ? reasons : ["No elevated risk factors in simulated inputs"],
    };
  }

  private async log(userId: string, prompt: string, output: string) {
    const row = await prisma.aiInteraction.create({ data: { userId, prompt, output } });
    return { id: row.id, output, logged: true };
  }
}

export const aiService = new AIService();
void config;
