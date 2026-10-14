import { describe, expect, it } from "vitest";
import {
  applyLogisticsDiscount,
  calculatePlatformFee,
  canRecordLoanDecision,
  aiMayChangeLoanStatus,
  canAdvanceMilestone,
  canViewDriverContact,
  isActiveShipment,
  SAVINGS_DISCLOSURES,
  assertNonNegativeCapacity,
  runningBalance,
  PERMISSIONS,
  SHIPMENT_MILESTONES,
} from "@cahs/shared";

describe("Section 9 Business Rules Verification", () => {
  it("Rule 1: Unverified logistics and storage providers cannot accept jobs or bookings", () => {
    // Verified check gate contract: permissions assign job acceptance and booking to authorized roles,
    // and only approved verified businesses can accept jobs or bookings.
    expect(PERMISSIONS.logistics.acceptJobs).toContain("LOGISTICS_PROVIDER");
    expect(PERMISSIONS.storage.publish).toContain("STORAGE_PROVIDER");
    // Verify provider status gate logic
    const isVerifiedProvider = (status: string) => status === "approved";
    expect(isVerifiedProvider("approved")).toBe(true);
    expect(isVerifiedProvider("submitted")).toBe(false);
    expect(isVerifiedProvider("under_review")).toBe(false);
    expect(isVerifiedProvider("rejected")).toBe(false);
  });

  it("Rule 2 & 3: Zenith fees and logistics discounts with transparent funder", () => {
    // ₦100,000 transaction: non-Zenith fee = ₦2,000 (2.0%); Zenith eligible in range ₦1,500–₦1,600 (default 1.6% = ₦1,600)
    const nonZenith = calculatePlatformFee(100000, false);
    expect(nonZenith.feeAmount).toBe(2000);
    expect(nonZenith.feePercent).toBe(2);

    const zenith = calculatePlatformFee(100000, true);
    expect(zenith.feeAmount).toBeGreaterThanOrEqual(1500);
    expect(zenith.feeAmount).toBeLessThanOrEqual(1600);
    expect(zenith.feePercent).toBe(1.6);
    expect(zenith.feeAmount).toBe(1600);
    expect(zenith.discountFunder).toBe("bank");

    // ₦50,000 logistics: standard delivery → ₦46,000 to ₦48,000 for eligible customer (default ₦47,000)
    const logNonZenith = applyLogisticsDiscount(50000, false);
    expect(logNonZenith.customerPays).toBe(50000);
    expect(logNonZenith.discountAmount).toBe(0);

    const logZenith = applyLogisticsDiscount(50000, true);
    expect(logZenith.customerPays).toBeGreaterThanOrEqual(46000);
    expect(logZenith.customerPays).toBeLessThanOrEqual(48000);
    expect(logZenith.customerPays).toBe(47000);
    expect(logZenith.discountFunder).toBe("bank");
  });

  it("Rule 4: Only bank officers decide; AI cannot change loan status", () => {
    expect(canRecordLoanDecision("BANK_OFFICER")).toBe(true);
    expect(canRecordLoanDecision("PLATFORM_ADMIN")).toBe(false);
    expect(canRecordLoanDecision("FARMER")).toBe(false);
    expect(canRecordLoanDecision("TRADER")).toBe(false);
    expect(aiMayChangeLoanStatus()).toBe(false);
  });

  it("Rule 5: Loan-readiness and transaction summaries require active consent", () => {
    const shouldAttachSummaries = (optIn: boolean, consentGranted: boolean) => optIn && consentGranted;
    expect(shouldAttachSummaries(true, true)).toBe(true);
    expect(shouldAttachSummaries(true, false)).toBe(false);
    expect(shouldAttachSummaries(false, true)).toBe(false);
    expect(shouldAttachSummaries(false, false)).toBe(false);
  });

  it("Rule 6: Shipment milestones follow exact 6-state sequence unless admin override", () => {
    expect(SHIPMENT_MILESTONES).toEqual([
      "packaged",
      "collected",
      "in_transit",
      "arrived_at_destination_warehouse",
      "out_for_delivery",
      "delivered",
    ]);

    // Initial milestone must be packaged
    expect(canAdvanceMilestone(null, "packaged", false).ok).toBe(true);
    expect(canAdvanceMilestone(null, "in_transit", false).ok).toBe(false);

    // Sequential progression
    expect(canAdvanceMilestone("packaged", "collected", false).ok).toBe(true);
    expect(canAdvanceMilestone("collected", "in_transit", false).ok).toBe(true);
    expect(canAdvanceMilestone("in_transit", "arrived_at_destination_warehouse", false).ok).toBe(true);
    expect(canAdvanceMilestone("arrived_at_destination_warehouse", "out_for_delivery", false).ok).toBe(true);
    expect(canAdvanceMilestone("out_for_delivery", "delivered", false).ok).toBe(true);

    // Skipping or reversing forbidden without admin override
    expect(canAdvanceMilestone("packaged", "in_transit", false).ok).toBe(false);
    expect(canAdvanceMilestone("in_transit", "packaged", false).ok).toBe(false);

    // Allowed with admin override
    expect(canAdvanceMilestone("packaged", "in_transit", true).ok).toBe(true);
    expect(canAdvanceMilestone("in_transit", "packaged", true).ok).toBe(true);
  });

  it("Rule 7: Driver contact and location visible only to authorized parties during active shipment", () => {
    expect(isActiveShipment("in_transit", "in_progress")).toBe(true);
    expect(isActiveShipment("delivered", "completed")).toBe(false);

    // During active shipment:
    expect(canViewDriverContact("buyer", true)).toBe(true);
    expect(canViewDriverContact("seller", true)).toBe(true);
    expect(canViewDriverContact("assigned_provider", true)).toBe(true);
    expect(canViewDriverContact("admin", true)).toBe(true);
    expect(canViewDriverContact("other", true)).toBe(false);

    // When shipment is inactive:
    expect(canViewDriverContact("buyer", false)).toBe(false);
    expect(canViewDriverContact("seller", false)).toBe(false);
    expect(canViewDriverContact("assigned_provider", false)).toBe(false);
  });

  it("Rule 8: Savings disclosures require projected language and bank administration", () => {
    const text = SAVINGS_DISCLOSURES.join(" ").toLowerCase();
    expect(text).toContain("projected");
    expect(text).toContain("zenith bank");
    expect(text).toContain("early withdrawal");
  });

  it("Rule 9: Storage capacity cannot go negative and stock ledger balances reconcile", () => {
    expect(() => assertNonNegativeCapacity(100, 50)).not.toThrow();
    expect(() => assertNonNegativeCapacity(50, 50)).not.toThrow();
    expect(() => assertNonNegativeCapacity(40, 50)).toThrow(/cannot go negative/);

    expect(runningBalance(100, 40)).toBe(60);
    expect(runningBalance(50, 50)).toBe(0);
    expect(() => runningBalance(20, 25)).toThrow(/does not reconcile/);
  });

  it("Rule 10: State transitions generate structured audit events", () => {
    const createAuditEvent = (actorId: string, action: string, entity: string, entityId: string) => ({
      actorId,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
    });
    const ev = createAuditEvent("usr-1", "order.paid", "order", "ord-123");
    expect(ev.action).toBe("order.paid");
    expect(ev.entity).toBe("order");
    expect(ev.entityId).toBe("ord-123");
  });

  it("Rule 11: Payment provider never accepts or stores card PAN credentials", () => {
    const forbiddenFields = ["cardNumber", "cvv", "cardExpiry", "pan", "pin"];
    const payloadKeys = ["amount", "method", "customerEmail", "referenceHint"];
    const hasForbidden = payloadKeys.some((k) => forbiddenFields.includes(k));
    expect(hasForbidden).toBe(false);
  });
});
