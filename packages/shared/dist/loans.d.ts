import type { LoanStatus } from "./statuses.js";
export declare const BANK_DECISION_STATUSES: LoanStatus[];
export declare function canRecordLoanDecision(actorRole: string): boolean;
export declare function aiMayChangeLoanStatus(): boolean;
export declare const LOAN_HISTORY_DISCLAIMER = "Every new loan is subject to affordability, verification, credit policy and bank approval. Repayment history does not guarantee approval or a larger loan. Customers who repay on time and show improved business performance may be considered for higher limits in later cycles.";
export declare const LOAN_READINESS_LABEL = "Decision support only. Not a credit decision.";
