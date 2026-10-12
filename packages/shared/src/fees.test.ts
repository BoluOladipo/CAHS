import { describe, expect, it } from "vitest";
import { applyLogisticsDiscount, calculatePlatformFee, DEFAULT_LOGISTICS_DISCOUNT, DEFAULT_PLATFORM_FEE_RULE } from "./fees.js";

describe("platform fees (document illustration)", () => {
  it("charges ₦2,000 on ₦100,000 for non-Zenith customers", () => {
    const result = calculatePlatformFee(100000, false, DEFAULT_PLATFORM_FEE_RULE);
    expect(result.feeAmount).toBe(2000);
    expect(result.appliedZenithBenefit).toBe(false);
    expect(result.discountFunder).toBeNull();
  });

  it("charges between ₦1,500 and ₦1,600 on ₦100,000 for eligible Zenith customers", () => {
    const result = calculatePlatformFee(100000, true, DEFAULT_PLATFORM_FEE_RULE);
    expect(result.feeAmount).toBeGreaterThanOrEqual(1500);
    expect(result.feeAmount).toBeLessThanOrEqual(1600);
    expect(result.feeAmount).toBe(1600);
    expect(result.appliedZenithBenefit).toBe(true);
    expect(result.discountFunder).toBe("bank");
  });

  it("does not apply Zenith fees when the customer is not eligible", () => {
    const result = calculatePlatformFee(100000, false);
    expect(result.appliedZenithBenefit).toBe(false);
  });
});

describe("logistics discount (document illustration)", () => {
  it("prices a ₦50,000 delivery between ₦46,000 and ₦48,000 for eligible Zenith customers", () => {
    const result = applyLogisticsDiscount(50000, true, DEFAULT_LOGISTICS_DISCOUNT);
    expect(result.customerPays).toBeGreaterThanOrEqual(46000);
    expect(result.customerPays).toBeLessThanOrEqual(48000);
    expect(result.customerPays).toBe(47000);
    expect(result.discountFunder).toBe("bank");
  });

  it("keeps the standard ₦50,000 charge for non-Zenith customers", () => {
    const result = applyLogisticsDiscount(50000, false, DEFAULT_LOGISTICS_DISCOUNT);
    expect(result.customerPays).toBe(50000);
    expect(result.discountFunder).toBeNull();
  });
});
