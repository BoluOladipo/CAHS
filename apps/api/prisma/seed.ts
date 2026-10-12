import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Demo1234!";

async function user(
  email: string,
  role: Role,
  fullName: string,
  state: string,
  lga: string,
  zenith: boolean,
  extra?: { farmSizeHa?: number; crops?: string; businessName?: string; phone: string },
) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      phone: extra?.phone ?? `080${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role,
      fullName,
      state,
      lga,
      isEligibleZenithCustomer: zenith,
      zenithLinkedAt: zenith ? new Date() : null,
      isDemo: true,
      profile: {
        create: {
          farmSizeHa: extra?.farmSizeHa,
          crops: extra?.crops,
          businessName: extra?.businessName,
        },
      },
      consents: zenith
        ? {
            create: {
              key: "share_with_bank_for_loan",
              granted: true,
              grantedAt: new Date(),
            },
          }
        : undefined,
      bankLinks: zenith
        ? {
            create: {
              bankName: "Zenith Bank",
              maskedAccount: "****4412",
              accountEncrypted: "demo-encrypted",
              isZenith: true,
            },
          }
        : undefined,
    },
  });
}

async function verify(userId: string, kind: string, name: string, status: string, cac: string) {
  return prisma.business.create({
    data: {
      userId,
      name,
      cacNumber: cac,
      address: "Industrial layout, demo address",
      contact: "08030000000",
      kind,
      verifications: { create: { status, decidedAt: status === "approved" ? new Date() : null, decisionNote: status === "approved" ? "Demo approval" : null } },
    },
  });
}

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiFlag.deleteMany();
  await prisma.aiInteraction.deleteMany();
  await prisma.loyaltyLedger.deleteMany();
  await prisma.repayment.deleteMany();
  await prisma.repaymentSchedule.deleteMany();
  await prisma.loanDecision.deleteMany();
  await prisma.document.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.savingsAccount.deleteMany();
  await prisma.proofOfDelivery.deleteMany();
  await prisma.shipmentMilestone.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.deliveryRequest.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.storageBooking.deleteMany();
  await prisma.storageFacility.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.verificationSubmission.deleteMany();
  await prisma.business.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.bankLink.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.dataCorrectionRequest.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.feeRule.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.loanProduct.deleteMany();
  await prisma.savingsProduct.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.configKV.deleteMany();

  await prisma.feeRule.create({
    data: { name: "Platform transaction fee", active: true, nonZenithPercent: 2, zenithPercent: 1.6, discountFunder: "bank" },
  });
  await prisma.discountRule.createMany({
    data: [
      { kind: "logistics", active: true, percentOff: 6, fixedOff: 0, discountFunder: "bank" },
      { kind: "storage", active: true, percentOff: 5, fixedOff: 0, discountFunder: "cahs" },
    ],
  });
  await prisma.featureFlag.createMany({
    data: [
      { key: "ai", enabled: true, note: "Decision support only" },
      { key: "savings", enabled: true, note: "Subject to Zenith Bank approvals" },
      { key: "loyalty", enabled: true, note: "Proposed partnership benefit" },
    ],
  });
  await prisma.loanProduct.create({
    data: { name: "Progressive agricultural loan (proposed)", minAmount: 100000, maxAmount: 5000000, tenorsDays: "90,180,270" },
  });
  await prisma.savingsProduct.createMany({
    data: [
      { name: "Fixed 30 days", tenorDays: 30, zenithRatePercent: 8, nonZenithRatePercent: 6, earlyWithdrawalNote: "Projected return is reduced on early withdrawal." },
      { name: "Fixed 90 days", tenorDays: 90, zenithRatePercent: 12, nonZenithRatePercent: 9, earlyWithdrawalNote: "Projected return is reduced on early withdrawal." },
      { name: "Fixed 180 days", tenorDays: 180, zenithRatePercent: 14, nonZenithRatePercent: 11, earlyWithdrawalNote: "Projected return is reduced on early withdrawal." },
    ],
  });

  const f1 = await user("farmer@cahs.demo", "FARMER", "Amina Yusuf (Demo)", "Kano", "Dawakin Tofa", true, { farmSizeHa: 8, crops: "maize, tomatoes", phone: "08011110001" });
  const f2 = await user("farmer.benue@cahs.demo", "FARMER", "Terna Agbo (Demo)", "Benue", "Makurdi", false, { farmSizeHa: 12, crops: "yam, cassava", phone: "08011110002" });
  const f3 = await user("farmer.oyo@cahs.demo", "FARMER", "Bukola Adeyemi (Demo)", "Oyo", "Ibadan North", true, { farmSizeHa: 5, crops: "cassava, maize", phone: "08011110003" });
  const f4 = await user("farmer.kaduna@cahs.demo", "FARMER", "Ibrahim Sani (Demo)", "Kaduna", "Chikun", false, { farmSizeHa: 20, crops: "maize, rice", phone: "08011110004" });
  const f5 = await user("farmer.cross@cahs.demo", "FARMER", "Ekaette Bassey (Demo)", "Cross River", "Ikom", true, { farmSizeHa: 6, crops: "cocoa", phone: "08011110005" });

  const t1 = await user("trader.zenith@cahs.demo", "TRADER", "Chinedu Okeke (Demo)", "Lagos", "Ikeja", true, { businessName: "Okeke Grains Ltd (Demo)", phone: "08022220001" });
  const t2 = await user("trader@cahs.demo", "TRADER", "Fatima Bello (Demo)", "Kaduna", "Kaduna North", false, { businessName: "Bello Produce (Demo)", phone: "08022220002" });
  const t3 = await user("trader.kano@cahs.demo", "TRADER", "Musa Abdullahi (Demo)", "Kano", "Fagge", true, { businessName: "Abdullahi Trading (Demo)", phone: "08022220003" });
  const t4 = await user("trader.ph@cahs.demo", "TRADER", "Blessing Hart (Demo)", "Rivers", "Port Harcourt", false, { businessName: "Delta Fresh (Demo)", phone: "08022220004" });
  const t5 = await user("trader.abuja@cahs.demo", "TRADER", "Ngozi Eze (Demo)", "FCT", "AMAC", true, { businessName: "Capital Foods (Demo)", phone: "08022220005" });

  const s1 = await user("storage@cahs.demo", "STORAGE_PROVIDER", "GreenSilo Kano (Demo)", "Kano", "Nassarawa", true, { businessName: "GreenSilo Kano", phone: "08033330001" });
  const s2 = await user("storage.ibadan@cahs.demo", "STORAGE_PROVIDER", "Oyo ColdStore (Demo)", "Oyo", "Ibadan South-West", false, { businessName: "Oyo ColdStore", phone: "08033330002" });
  const s3 = await user("storage.makurdi@cahs.demo", "STORAGE_PROVIDER", "Benue Dry Hub (Demo)", "Benue", "Makurdi", true, { businessName: "Benue Dry Hub", phone: "08033330003" });
  const s4 = await user("storage.pending@cahs.demo", "STORAGE_PROVIDER", "Pending Warehouse (Demo)", "Lagos", "Apapa", false, { businessName: "Apapa HoldCo", phone: "08033330004" });

  const l1 = await user("logistics@cahs.demo", "LOGISTICS_PROVIDER", "Sahel Haulage (Demo)", "Kano", "Municipal", true, { businessName: "Sahel Haulage", phone: "08044440001" });
  const l2 = await user("logistics.lagos@cahs.demo", "LOGISTICS_PROVIDER", "Coastal Freight (Demo)", "Lagos", "Apapa", true, { businessName: "Coastal Freight", phone: "08044440002" });
  const l3 = await user("logistics.abuja@cahs.demo", "LOGISTICS_PROVIDER", "Middle Belt Movers (Demo)", "FCT", "AMAC", false, { businessName: "Middle Belt Movers", phone: "08044440003" });
  const l4 = await user("logistics.unverified@cahs.demo", "LOGISTICS_PROVIDER", "Unverified Express (Demo)", "Ogun", "Abeokuta", false, { businessName: "Unverified Express", phone: "08044440004" });

  const bank = await user("bank@cahs.demo", "BANK_OFFICER", "Adaeze Nwosu (Demo officer)", "Lagos", "Victoria Island", true, { phone: "08055550001" });
  await user("bank2@cahs.demo", "BANK_OFFICER", "Yusuf Lawal (Demo officer)", "Kano", "Municipal", true, { phone: "08055550002" });
  const admin = await user("admin@cahs.demo", "PLATFORM_ADMIN", "CAHS Admin (Demo)", "Lagos", "Ikeja", false, { phone: "08066660001" });

  await verify(s1.id, "storage", "GreenSilo Kano", "approved", "RC-100001");
  await verify(s2.id, "storage", "Oyo ColdStore", "approved", "RC-100002");
  await verify(s3.id, "storage", "Benue Dry Hub", "approved", "RC-100003");
  await verify(s4.id, "storage", "Apapa HoldCo", "submitted", "RC-100004");
  await verify(l1.id, "logistics", "Sahel Haulage", "approved", "RC-200001");
  await verify(l2.id, "logistics", "Coastal Freight", "approved", "RC-200002");
  await verify(l3.id, "logistics", "Middle Belt Movers", "approved", "RC-200003");
  await verify(l4.id, "logistics", "Unverified Express", "submitted", "RC-200004");

  const fac1 = await prisma.storageFacility.create({
    data: { ownerId: s1.id, name: "GreenSilo Kano — Dry", state: "Kano", lga: "Nassarawa", storageType: "dry", capacity: 5000, available: 3200, unit: "bags", pricePerUnitPeriod: 150 },
  });
  await prisma.storageFacility.create({
    data: { ownerId: s2.id, name: "Oyo ColdStore", state: "Oyo", lga: "Ibadan South-West", storageType: "cold", capacity: 800, available: 210, unit: "crates", pricePerUnitPeriod: 400 },
  });
  await prisma.storageFacility.create({
    data: { ownerId: s3.id, name: "Benue Dry Hub", state: "Benue", lga: "Makurdi", storageType: "dry", capacity: 3000, available: 1800, unit: "bags", pricePerUnitPeriod: 120 },
  });
  await prisma.storageFacility.create({
    data: { ownerId: s4.id, name: "Apapa Hold (not bookable until verified)", state: "Lagos", lga: "Apapa", storageType: "dry", capacity: 1000, available: 1000, unit: "pallets", pricePerUnitPeriod: 500 },
  });

  const driver = await prisma.driver.create({ data: { providerId: l1.id, name: "Sani Musa (Demo)", contact: "08077770001" } });
  const vehicle = await prisma.vehicle.create({ data: { providerId: l1.id, plateNumber: "KNA-882-XY", description: "10-tonne covered truck" } });

  const crops = [
    ["maize", "kg", "A", 420],
    ["cassava", "kg", "B", 180],
    ["yam", "tuber", "A", 1500],
    ["tomatoes", "crate", "A", 22000],
    ["rice", "kg", "A", 980],
    ["cocoa", "kg", "A", 4200],
  ] as const;
  const farmers = [f1, f2, f3, f4, f5];
  const listings = [];
  for (let i = 0; i < 32; i++) {
    const [produce, unit, grade, price] = crops[i % crops.length];
    const farmer = farmers[i % farmers.length];
    listings.push(
      await prisma.listing.create({
        data: {
          farmerId: farmer.id,
          produceType: produce,
          quantity: 200 + i * 15,
          unit,
          pricePerUnit: price + (i % 5) * 10,
          grade: i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C",
          state: farmer.state,
          lga: farmer.lga,
          availableFrom: new Date(),
          availableTo: new Date(Date.now() + 21 * 864e5),
          harvestDate: new Date(Date.now() - 3 * 864e5),
          harvestNotes: "Demo listing — synthetic harvest window",
          status: "active",
          images: { create: { path: "/placeholder-produce.svg", alt: `${produce} listing photo (demo)` } },
        },
      }),
    );
  }

  const produceTypes = ["maize", "cassava", "yam", "tomatoes", "rice", "cocoa"];
  const now = new Date();
  for (const p of produceTypes) {
    for (let m = 11; m >= 0; m--) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
      await prisma.priceHistory.create({
        data: {
          produceType: p,
          state: "Kano",
          month,
          avgPrice: 200 + m * 12 + p.length * 40,
          volume: 1000 + m * 50,
          synthetic: true,
        },
      });
    }
  }

  const statuses = ["placed", "accepted", "declined", "payment_pending", "paid", "fulfilment", "in_transit", "delivered", "completed", "cancelled", "disputed"];
  const orders = [];
  for (let i = 0; i < statuses.length; i++) {
    const listing = listings[i];
    const qty = 10;
    const subtotal = qty * listing.pricePerUnit;
    const zenith = i % 2 === 0;
    const fee = zenith ? subtotal * 0.016 : subtotal * 0.02;
    const logistics = zenith ? 47000 : 50000;
    const order = await prisma.order.create({
      data: {
        buyerId: zenith ? t1.id : t2.id,
        sellerId: listing.farmerId,
        status: statuses[i],
        deliveryMode: "logistics",
        subtotal,
        platformFee: fee,
        zenithDiscount: zenith ? subtotal * 0.004 : 0,
        discountFunder: zenith ? "bank" : null,
        logisticsCharge: logistics,
        totalDue: subtotal + fee + logistics,
        items: { create: { listingId: listing.id, quantity: qty, unitPrice: listing.pricePerUnit } },
      },
    });
    orders.push(order);
    if (["paid", "fulfilment", "in_transit", "delivered", "completed", "disputed"].includes(statuses[i])) {
      const pay = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: order.buyerId,
          amount: order.totalDue,
          status: statuses[i] === "disputed" ? "disputed" : "success",
          providerRef: `CAHS-SIM-SEED-${i}`,
          method: zenith ? "zenith_simulated" : "other_bank_simulated",
          events: { create: { status: "success", payload: "{\"simulated\":true}" } },
        },
      });
      await prisma.settlement.create({
        data: {
          paymentId: pay.id,
          grossAmount: order.totalDue,
          fees: order.platformFee,
          discounts: order.zenithDiscount,
          discountFunder: order.discountFunder,
          netToSeller: order.subtotal,
          status: statuses[i] === "completed" ? "released" : "held",
        },
      });
    }
  }

  await prisma.dispute.create({
    data: { orderId: orders.find((o) => o.status === "disputed")!.id, raisedById: t2.id, reason: "Quantity short on delivery (demo)", status: "open" },
  });

  const req = await prisma.deliveryRequest.create({
    data: {
      orderId: orders.find((o) => o.status === "in_transit")!.id,
      requesterId: t1.id,
      origin: "Dawakin Tofa, Kano",
      destination: "Ikeja, Lagos",
      loadDesc: "Maize bags — 2 tonnes",
      weightKg: 2000,
      serviceLevel: "standard",
      pickupWindow: "06:00–10:00 WAT",
      status: "assigned",
    },
  });
  const quote = await prisma.quote.create({
    data: {
      requestId: req.id,
      providerId: l1.id,
      baseCharge: 50000,
      discountAmount: 3000,
      customerPays: 47000,
      discountFunder: "bank",
      conditions: "Covered truck. Simulated quote. Proposed partnership benefit.",
      status: "accepted",
    },
  });
  const job = await prisma.job.create({
    data: {
      requestId: req.id,
      quoteId: quote.id,
      providerId: l1.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      status: "in_transit",
      etaWindow: "36–48 hours (indicative)",
      mockLat: 11.5,
      mockLng: 8.5,
    },
  });
  const miles = ["packaged", "collected", "in_transit"];
  for (const code of miles) {
    await prisma.shipmentMilestone.create({ data: { jobId: job.id, code, actorId: l1.id, location: "Kano–Lagos corridor (simulated)" } });
  }

  const booking = await prisma.storageBooking.create({
    data: {
      facilityId: fac1.id,
      userId: f1.id,
      produceType: "maize",
      quantity: 200,
      startDate: new Date(),
      durationDays: 21,
      status: "accepted",
      charge: 28500,
      zenithDiscount: 1500,
      discountFunder: "cahs",
    },
  });
  await prisma.stockMovement.create({ data: { bookingId: booking.id, kind: "intake", quantity: 200, condition: "good" } });
  await prisma.stockMovement.create({ data: { bookingId: booking.id, kind: "dispatch", quantity: 40, destination: "Ikeja buyer", orderRef: orders[0].id } });

  const loanDraft = await prisma.loanApplication.create({
    data: {
      applicantId: f1.id,
      status: "draft",
      amount: 750000,
      purpose: "Inputs for next maize cycle",
      tenorDays: 180,
      farmInfo: "8 ha mixed maize/tomato, Kano",
      crops: "maize, tomatoes",
      landSizeHa: 8,
      historicalSales: "₦4.2m last 12 months (demo)",
      bankMasked: "****4412",
    },
  });
  await prisma.loanApplication.create({
    data: {
      applicantId: f3.id,
      status: "under_review",
      amount: 1200000,
      purpose: "Cassava processing equipment",
      tenorDays: 270,
      farmInfo: "5 ha cassava, Oyo",
      crops: "cassava",
      landSizeHa: 5,
      historicalSales: "₦2.8m (demo)",
      bankMasked: "****4412",
      attachSummaries: true,
      consentSnapshot: "{\"attach\":true}",
    },
  });
  const approved = await prisma.loanApplication.create({
    data: {
      applicantId: f1.id,
      status: "repaying",
      amount: 500000,
      purpose: "Working capital",
      tenorDays: 90,
      farmInfo: "8 ha",
      crops: "maize",
      landSizeHa: 8,
      historicalSales: "₦4.2m",
      bankMasked: "****4412",
    },
  });
  await prisma.loanDecision.create({
    data: { applicationId: approved.id, officerId: bank.id, status: "approved", reason: "Affordability and records reviewed (demo). Not an automated decision." },
  });
  await prisma.repaymentSchedule.createMany({
    data: [
      { applicationId: approved.id, dueDate: new Date(Date.now() + 30 * 864e5), amount: 166666.67, status: "upcoming" },
      { applicationId: approved.id, dueDate: new Date(Date.now() + 60 * 864e5), amount: 166666.67, status: "upcoming" },
      { applicationId: approved.id, dueDate: new Date(Date.now() + 90 * 864e5), amount: 166666.66, status: "upcoming" },
    ],
  });
  await prisma.repayment.create({ data: { applicationId: approved.id, amount: 166666.67, simulated: true } });
  await prisma.loanApplication.create({
    data: {
      applicantId: f2.id,
      status: "rejected",
      amount: 3000000,
      purpose: "Expansion",
      tenorDays: 180,
      farmInfo: "12 ha yam",
      crops: "yam",
      landSizeHa: 12,
      historicalSales: "Insufficient documented sales (demo)",
      bankMasked: "****8891",
    },
  });
  void loanDraft;

  const prod90 = await prisma.savingsProduct.findFirst({ where: { tenorDays: 90 } });
  if (prod90) {
    await prisma.savingsAccount.create({
      data: {
        userId: t1.id,
        productId: prod90.id,
        principal: 200000,
        maturesAt: new Date(Date.now() + 60 * 864e5),
        projected: 6575.34,
        acknowledged: true,
      },
    });
  }

  await prisma.loyaltyLedger.createMany({
    data: [
      { userId: t1.id, points: 120, reason: "Completed delivery (demo)" },
      { userId: f1.id, points: 80, reason: "Repeat sale (demo)" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: f1.id, title: "Welcome (demo)", body: "Prototype: simulated payments, loans and savings. No real funds are handled." },
      { userId: t1.id, title: "Order paid (simulated)", body: "Your maize order payment is held until delivery confirmation." },
      { userId: bank.id, title: "Queue", body: "Loan applications await human review." },
    ],
  });

  await prisma.auditEvent.create({
    data: { actorId: admin.id, action: "seed", entity: "system", entityId: "seed", afterJson: "{\"demo\":true}" },
  });

  console.log("Seed complete. Demo password for all users: Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
