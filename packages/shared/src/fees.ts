import type { DiscountFunder } from "./statuses.js";
import { roundMoney } from "./money.js";

export type FeeRule = {
  id?: string;
  name: string;
  active: boolean;
  nonZenithPercent: number;
  zenithPercent: number;
  discountFunder: DiscountFunder;
  appliesToEligibleZenithOnly: boolean;
};

export const DEFAULT_PLATFORM_FEE_RULE: FeeRule = {
  name: "Platform transaction fee",
  active: true,
  nonZenithPercent: 2.0,
  zenithPercent: 1.6,
  discountFunder: "bank",
  appliesToEligibleZenithOnly: true,
};

export type FeeBreakdown = {
  orderAmount: number;
  feePercent: number;
  feeAmount: number;
  zenithDiscountAmount: number;
  discountFunder: DiscountFunder | null;
  appliedZenithBenefit: boolean;
  totalDueBeforeLogistics: number;
  note: string;
};

export function calculatePlatformFee(
  orderAmount: number,
  isEligibleZenithCustomer: boolean,
  rule: FeeRule = DEFAULT_PLATFORM_FEE_RULE,
): FeeBreakdown {
  const useZenith = Boolean(rule.active && isEligibleZenithCustomer && rule.appliesToEligibleZenithOnly);
  const feePercent = useZenith ? rule.zenithPercent : rule.nonZenithPercent;
  const feeAmount = roundMoney((orderAmount * feePercent) / 100);
  const nonZenithFee = roundMoney((orderAmount * rule.nonZenithPercent) / 100);
  const zenithDiscountAmount = useZenith ? roundMoney(nonZenithFee - feeAmount) : 0;

  return {
    orderAmount: roundMoney(orderAmount),
    feePercent,
    feeAmount,
    zenithDiscountAmount,
    discountFunder: useZenith ? rule.discountFunder : null,
    appliedZenithBenefit: useZenith,
    totalDueBeforeLogistics: roundMoney(orderAmount + feeAmount),
    note: "Final pricing must reflect the approved payment-provider structure, applicable charges and agreed funding of the discount.",
  };
}

export type LogisticsDiscountRule = {
  active: boolean;
  percentOff: number;
  fixedOff: number;
  discountFunder: DiscountFunder;
};

export const DEFAULT_LOGISTICS_DISCOUNT: LogisticsDiscountRule = {
  active: true,
  percentOff: 6,
  fixedOff: 0,
  discountFunder: "bank",
};

export type LogisticsQuotePricing = {
  baseCharge: number;
  discountAmount: number;
  customerPays: number;
  discountFunder: DiscountFunder | null;
  appliedZenithBenefit: boolean;
};

export function applyLogisticsDiscount(
  baseCharge: number,
  isEligibleZenithCustomer: boolean,
  rule: LogisticsDiscountRule = DEFAULT_LOGISTICS_DISCOUNT,
): LogisticsQuotePricing {
  const useZenith = rule.active && isEligibleZenithCustomer;
  const percentCut = roundMoney((baseCharge * rule.percentOff) / 100);
  const discountAmount = useZenith ? roundMoney(percentCut + rule.fixedOff) : 0;
  return {
    baseCharge: roundMoney(baseCharge),
    discountAmount,
    customerPays: roundMoney(baseCharge - discountAmount),
    discountFunder: useZenith ? rule.discountFunder : null,
    appliedZenithBenefit: useZenith,
  };
}

export type StorageDiscountRule = {
  active: boolean;
  percentOff: number;
  discountFunder: DiscountFunder;
};

export const DEFAULT_STORAGE_DISCOUNT: StorageDiscountRule = {
  active: true,
  percentOff: 5,
  discountFunder: "cahs",
};

export function applyStorageDiscount(
  baseCharge: number,
  isEligibleZenithCustomer: boolean,
  rule: StorageDiscountRule = DEFAULT_STORAGE_DISCOUNT,
): LogisticsQuotePricing {
  const useZenith = rule.active && isEligibleZenithCustomer;
  const discountAmount = useZenith ? roundMoney((baseCharge * rule.percentOff) / 100) : 0;
  return {
    baseCharge: roundMoney(baseCharge),
    discountAmount,
    customerPays: roundMoney(baseCharge - discountAmount),
    discountFunder: useZenith ? rule.discountFunder : null,
    appliedZenithBenefit: useZenith,
  };
}
