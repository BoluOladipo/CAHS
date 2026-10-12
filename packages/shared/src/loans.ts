import type { LoanStatus } from "./statuses.js";

export const BANK_DECISION_STATUSES: LoanStatus[] = [
  "approved",
  "rejected",
  "counter_offered",
  "more_info_requested",
  "disbursed",
];

export function canRecordLoanDecision(actorRole: string): boolean {
  return actorRole === "BANK_OFFICER";
}

export function aiMayChangeLoanStatus(): boolean {
  return false;
}

export const LOAN_HISTORY_DISCLAIMER =
  "Every new loan is subject to affordability, verification, credit policy and bank approval. Repayment history does not guarantee approval or a larger loan. Customers who repay on time and show improved business performance may be considered for higher limits in later cycles.";

export const LOAN_READINESS_LABEL = "Decision support only. Not a credit decision.";
