import { v4 as uuid } from "uuid";
import { maskAccount, encryptField } from "../lib/crypto.js";

export interface PaymentProvider {
  createCheckout(input: {
    amount: number;
    method: string;
    customerEmail: string;
    referenceHint?: string;
  }): Promise<{ reference: string; redirectUrl: string; status: "pending" }>;
  capture(reference: string): Promise<{ status: "success" | "failed"; providerPayload: unknown }>;
}

export class MockSandboxProvider implements PaymentProvider {
  async createCheckout(input: {
    amount: number;
    method: string;
    customerEmail: string;
  }) {
    const reference = `CAHS-SIM-${uuid()}`;
    return {
      reference,
      redirectUrl: `/pay/sandbox?ref=${encodeURIComponent(reference)}&amount=${input.amount}&method=${encodeURIComponent(input.method)}`,
      status: "pending" as const,
    };
  }

  async capture(reference: string) {
    return {
      status: "success" as const,
      providerPayload: { reference, simulated: true, neverStoresCards: true },
    };
  }
}

export interface BankAccountVerificationService {
  verify(accountNumber: string, bankName: string): Promise<{
    ok: boolean;
    isZenith: boolean;
    masked: string;
    encrypted: string;
  }>;
}

export class MockBankAccountVerificationService implements BankAccountVerificationService {
  async verify(accountNumber: string, bankName: string) {
    const isZenith = bankName.toLowerCase().includes("zenith");
    return {
      ok: accountNumber.replace(/\D/g, "").length >= 10,
      isZenith,
      masked: maskAccount(accountNumber),
      encrypted: encryptField(accountNumber),
    };
  }
}

export interface LoanReferralService {
  submit(applicationId: string): Promise<{ accepted: boolean; note: string }>;
}

export class MockLoanReferralService implements LoanReferralService {
  async submit(applicationId: string) {
    return {
      accepted: true,
      note: `Simulated referral queued for bank review (${applicationId}). No real credit decision.`,
    };
  }
}

export interface SavingsProductService {
  open(input: { userId: string; productId: string; principal: number }): Promise<{ heldBy: string }>;
}

export class MockSavingsProductService implements SavingsProductService {
  async open() {
    return { heldBy: "Zenith Bank (simulated administration)" };
  }
}

export const paymentProvider: PaymentProvider = new MockSandboxProvider();
export const bankVerification: BankAccountVerificationService = new MockBankAccountVerificationService();
export const loanReferral: LoanReferralService = new MockLoanReferralService();
export const savingsService: SavingsProductService = new MockSavingsProductService();
