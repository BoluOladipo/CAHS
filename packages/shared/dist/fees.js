import { roundMoney } from "./money.js";
export const DEFAULT_PLATFORM_FEE_RULE = {
    name: "Platform transaction fee",
    active: true,
    nonZenithPercent: 2.0,
    zenithPercent: 1.6,
    discountFunder: "bank",
    appliesToEligibleZenithOnly: true,
};
export function calculatePlatformFee(orderAmount, isEligibleZenithCustomer, rule = DEFAULT_PLATFORM_FEE_RULE) {
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
export const DEFAULT_LOGISTICS_DISCOUNT = {
    active: true,
    percentOff: 6,
    fixedOff: 0,
    discountFunder: "bank",
};
export function applyLogisticsDiscount(baseCharge, isEligibleZenithCustomer, rule = DEFAULT_LOGISTICS_DISCOUNT) {
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
export const DEFAULT_STORAGE_DISCOUNT = {
    active: true,
    percentOff: 5,
    discountFunder: "cahs",
};
export function applyStorageDiscount(baseCharge, isEligibleZenithCustomer, rule = DEFAULT_STORAGE_DISCOUNT) {
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
