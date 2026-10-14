export const LISTING_STATUSES = ["draft", "active", "reserved", "sold", "expired"];
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
];
export const VERIFICATION_STATUSES = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "more_info_needed",
];
export const SHIPMENT_MILESTONES = [
    "packaged",
    "collected",
    "in_transit",
    "arrived_at_destination_warehouse",
    "out_for_delivery",
    "delivered",
];
export const PAYMENT_STATUSES = ["pending", "success", "failed", "refunded", "disputed"];
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
];
export const LOAN_DECISION_STATUSES = ["approved", "rejected", "counter_offered", "more_info_requested"];
export const SAVINGS_STATUSES = ["active", "matured", "withdrawn", "early_withdrawn", "renewed"];
export const DISCOUNT_FUNDERS = ["bank", "cahs", "provider", "split"];
export function isDiscountFunder(value) {
    return DISCOUNT_FUNDERS.some((funder) => funder === value);
}
