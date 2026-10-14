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

  async triageComplaint(
    userId: string,
    input: { text: string; orderId?: string; paymentRef?: string }
  ) {
    const text = input.text.trim();
    const lower = text.toLowerCase();

    // 1. Determine category
    let category: "PAYMENT" | "DELIVERY" | "DISPUTE" | "LOAN" | "REFUND" | "ACCOUNT" = "ACCOUNT";
    if (/(payment|debit|charged|bank|transfer|ref|switch|card)/.test(lower)) {
      category = "PAYMENT";
    } else if (/(delivery|shipment|driver|transit|vehicle|delayed|truck|courier|eta)/.test(lower)) {
      category = "DELIVERY";
    } else if (/(dispute|spoiled|damaged|quality|grade|short|missing|bad produce|rotten)/.test(lower)) {
      category = "DISPUTE";
    } else if (/(loan|credit|disbursement|tenor|repayment|underwriting)/.test(lower)) {
      category = "LOAN";
    } else if (/(refund|reverse|reversal|money back)/.test(lower)) {
      category = "REFUND";
    }

    // 2. Fetch relevant internal records for facts
    let recordFact = "";
    let isPerishableAtRisk = false;

    if (category === "PAYMENT" || input.paymentRef) {
      const payment = await prisma.payment.findFirst({
        where: input.paymentRef ? { providerRef: input.paymentRef } : { userId },
        orderBy: { createdAt: "desc" },
        include: { order: true, events: true },
      });
      if (payment) {
        recordFact = `Found payment reference ${payment.providerRef} (₦${payment.amount.toLocaleString()}): Current status is "${payment.status}". Background retries: ${payment.retryCount}.`;
      }
    } else if (category === "DELIVERY" || input.orderId) {
      const order = await prisma.order.findFirst({
        where: input.orderId ? { id: input.orderId } : { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { listing: true } },
          deliveryRequests: { include: { jobs: { include: { milestones: true, driver: true } } } },
        },
      });
      if (order) {
        const itemNames = order.items.map((i) => i.listing.produceType).join(", ");
        isPerishableAtRisk = order.items.some((i) =>
          ["tomato", "tomatoes", "pepper", "vegetable"].some((c) => i.listing.produceType.toLowerCase().includes(c))
        );
        const latestJob = order.deliveryRequests[0]?.jobs[0];
        recordFact = `Order #${order.id.slice(0, 8)} (${itemNames}): Status "${order.status}". Logistics job: ${
          latestJob ? latestJob.status : "Pending assignment"
        }.`;
      }
    } else if (category === "LOAN") {
      const loan = await prisma.loanApplication.findFirst({
        where: { applicantId: userId },
        orderBy: { createdAt: "desc" },
      });
      if (loan) {
        recordFact = `Latest loan application #${loan.id.slice(0, 8)} for ₦${loan.amount.toLocaleString()}: Status "${loan.status}". Bank officer review queue.`;
      }
    }

    // 3. Determine urgency priority
    // Critical: money debited/held without confirmation, suspected fraud, unauthorized transaction
    // High: perishable delivery at risk, failed loan disbursement or repayment problem, repeated unresolved contact
    // Medium: order quality dispute, document verification delay
    // Low: general questions, feedback
    let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";

    const hasFraudSignal = /(fraud|scam|unauthorized|stolen|phishing|hacked)/.test(lower);
    const hasDebitWithoutConfirmation =
      /(debited|money taken|debited twice|double debit|deducted)/.test(lower) &&
      /(no order|not showing|failed|pending|unconfirmed|delay)/.test(lower);

    if (hasFraudSignal || hasDebitWithoutConfirmation) {
      priority = "CRITICAL";
    } else if (
      isPerishableAtRisk ||
      /(perishable|spoiling|spoil|rotten|damage)/.test(lower) ||
      (category === "LOAN" && /(disbursement failed|deducted twice)/.test(lower))
    ) {
      priority = "HIGH";
    } else if (category === "DISPUTE" || category === "DELIVERY" || /(cac|document|verification|delay)/.test(lower)) {
      priority = "MEDIUM";
    }

    // 4. Generate Stage 1 guidance steps
    const steps: string[] = [];
    if (category === "PAYMENT") {
      steps.push("1. Verify your transaction reference from your bank alert or checkout receipt.");
      steps.push(
        "2. CAHS Pending-State Protection automatically retries pending transfers in the background using the original reference — duplicate debits are prevented."
      );
      steps.push(
        "3. Check the Orders tab or the Pending Payments section. As soon as the switch confirms completion, your order status updates automatically."
      );
      steps.push(
        "4. If funds remain held with no order update, click 'Escalate to Zenith Bank Team' below for immediate investigation."
      );
    } else if (category === "DELIVERY") {
      steps.push("1. Check the live shipment tracker under Transport / Shipments for latest verified GPS checkpoint.");
      steps.push("2. For perishable produce, cold-storage diversion is automatically triggered if transit exceeds 6 hours beyond ETA.");
      steps.push("3. Verified driver and vehicle details are available in your authorized shipment view.");
      steps.push("4. If the driver is unreachable or cargo is at risk of heat spoil, escalate immediately.");
    } else if (category === "DISPUTE") {
      steps.push("1. Inspect and photograph produce condition upon arrival before confirming delivery.");
      steps.push("2. Verify delivered grade against the seller listing specifications.");
      steps.push("3. Payment is securely held in escrow and is not released to the seller while a dispute is active.");
      steps.push("4. Submit dispute evidence for expedited review by platform admin.");
    } else if (category === "LOAN") {
      steps.push("1. Confirm that all required documents and farm details are attached to your application.");
      steps.push("2. Grant consent to share your CAHS verified trading and financial summary for faster underwriting.");
      steps.push("3. Note that credit decisions are made solely by authorized Zenith Bank officers, not AI.");
      steps.push("4. Typical review turnaround during the pilot is 48-72 business hours.");
    } else {
      steps.push("1. Review your registered business and personal profile in account settings.");
      steps.push("2. Ensure uploaded CAC certificates or identity credentials are clear and legible.");
      steps.push("3. If an issue persists, escalate below with your registered email and phone number.");
    }

    return {
      category,
      recordFact: recordFact || "Platform status checked: no conflicting records found.",
      steps,
      securityNote: "Security reminder: Neither CAHS nor Zenith Bank will ever ask for your PIN, OTP, or password. Never disclose them to anyone.",
      suggestedPriority: priority,
      summary: text.slice(0, 200),
    };
  }

  private async log(userId: string, prompt: string, output: string) {
    const row = await prisma.aiInteraction.create({ data: { userId, prompt, output } });
    return { id: row.id, output, logged: true };
  }
}

export const aiService = new AIService();
void config;
