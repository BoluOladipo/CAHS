export const SAVINGS_DISCLOSURES = [
  "Funds are handled by Zenith Bank under its own legal, regulatory, liquidity and risk obligations.",
  "CAHS makes no promise about how deposits are deployed and no guaranteed profit.",
  "Returns shown are projected and subject to bank confirmation.",
  "Tax treatment: where applicable.",
  "Early withdrawal may reduce projected return and may attract fees, subject to the product terms.",
  "This product is simulated in the prototype. No real funds are held.",
  "Subject to Zenith Bank approvals.",
] as const;

export function projectedReturn(principal: number, annualRatePercent: number, tenorDays: number): number {
  const projected = principal * (annualRatePercent / 100) * (tenorDays / 365);
  return Math.round((projected + Number.EPSILON) * 100) / 100;
}
