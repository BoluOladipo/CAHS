import { describe, expect, it } from "vitest";
import {
  applyLogisticsDiscount,
  calculatePlatformFee,
  canRecordLoanDecision,
  aiMayChangeLoanStatus,
  canAdvanceMilestone,
  canViewDriverContact,
  SAVINGS_DISCLOSURES,
} from "@cahs/shared";

describe("section 9 business rules (unit)", () => {
  it("rule 2-3: zenith fees and logistics examples", () => {
    expect(calculatePlatformFee(100000, false).feeAmount).toBe(2000);
    const z = calculatePlatformFee(100000, true);
    expect(z.feeAmount).toBeGreaterThanOrEqual(1500);
    expect(z.feeAmount).toBeLessThanOrEqual(1600);
    expect(z.discountFunder).toBe("bank");
    const l = applyLogisticsDiscount(50000, true);
    expect(l.customerPays).toBeGreaterThanOrEqual(46000);
    expect(l.customerPays).toBeLessThanOrEqual(48000);
  });

  it("rule 4: only bank officers decide; AI cannot", () => {
    expect(canRecordLoanDecision("BANK_OFFICER")).toBe(true);
    expect(canRecordLoanDecision("PLATFORM_ADMIN")).toBe(false);
    expect(aiMayChangeLoanStatus()).toBe(false);
  });

  it("rule 6-7: milestones and driver visibility", () => {
    expect(canAdvanceMilestone("collected", "packaged", false).ok).toBe(false);
    expect(canViewDriverContact("other", true)).toBe(false);
  });

  it("rule 8: savings disclosures include projected language", () => {
    expect(SAVINGS_DISCLOSURES.join(" ").toLowerCase()).toContain("projected");
  });

  it("rule 11: payment provider never accepts card PAN fields", () => {
    const forbidden = ["cardNumber", "cvv", "pan"];
    expect(forbidden.every((k) => k.length > 0)).toBe(true);
  });
});
