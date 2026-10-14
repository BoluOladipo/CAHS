import type { DiscountFunder } from "./statuses.js";
export type FeeRule = {
    id?: string;
    name: string;
    active: boolean;
    nonZenithPercent: number;
    zenithPercent: number;
    discountFunder: DiscountFunder;
    appliesToEligibleZenithOnly: boolean;
};
export declare const DEFAULT_PLATFORM_FEE_RULE: FeeRule;
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
export declare function calculatePlatformFee(orderAmount: number, isEligibleZenithCustomer: boolean, rule?: FeeRule): FeeBreakdown;
export type LogisticsDiscountRule = {
    active: boolean;
    percentOff: number;
    fixedOff: number;
    discountFunder: DiscountFunder;
};
export declare const DEFAULT_LOGISTICS_DISCOUNT: LogisticsDiscountRule;
export type LogisticsQuotePricing = {
    baseCharge: number;
    discountAmount: number;
    customerPays: number;
    discountFunder: DiscountFunder | null;
    appliedZenithBenefit: boolean;
};
export declare function applyLogisticsDiscount(baseCharge: number, isEligibleZenithCustomer: boolean, rule?: LogisticsDiscountRule): LogisticsQuotePricing;
export type StorageDiscountRule = {
    active: boolean;
    percentOff: number;
    discountFunder: DiscountFunder;
};
export declare const DEFAULT_STORAGE_DISCOUNT: StorageDiscountRule;
export declare function applyStorageDiscount(baseCharge: number, isEligibleZenithCustomer: boolean, rule?: StorageDiscountRule): LogisticsQuotePricing;
