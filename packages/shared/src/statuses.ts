export const LISTING_STATUSES = ["draft", "active", "reserved", "sold", "expired"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "declined",
  "payment_pending",
  "paid",
  "fulfilment",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "more_info_needed",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SHIPMENT_MILESTONES = [
  "packaged",
  "collected",
  "in_transit",
  "arrived_at_destination_warehouse",
  "out_for_delivery",
  "delivered",
] as const;
export type ShipmentMilestone = (typeof SHIPMENT_MILESTONES)[number];

export const PAYMENT_STATUSES = ["pending", "success", "failed", "refunded", "disputed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const LOAN_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "more_info_requested",
  "approved",
  "rejected",
  "counter_offered",
  "disbursed",
  "repaying",
  "closed",
  "in_arrears",
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LOAN_DECISION_STATUSES = ["approved", "rejected", "counter_offered", "more_info_requested"] as const;
export type LoanDecisionStatus = (typeof LOAN_DECISION_STATUSES)[number];

export const SAVINGS_STATUSES = ["active", "matured", "withdrawn", "early_withdrawn", "renewed"] as const;
export type SavingsStatus = (typeof SAVINGS_STATUSES)[number];

export const DISCOUNT_FUNDERS = ["bank", "cahs", "provider", "split"] as const;
export type DiscountFunder = (typeof DISCOUNT_FUNDERS)[number];

export function isDiscountFunder(value: string): value is DiscountFunder {
  return DISCOUNT_FUNDERS.some((funder) => funder === value);
}
