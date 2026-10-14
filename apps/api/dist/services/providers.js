import { v4 as uuid } from "uuid";
import { maskAccount, encryptField } from "../lib/crypto.js";
export class MockSandboxProvider {
    async createCheckout(input) {
        const reference = `CAHS-SIM-${uuid()}`;
        return {
            reference,
            redirectUrl: `/pay/sandbox?ref=${encodeURIComponent(reference)}&amount=${input.amount}&method=${encodeURIComponent(input.method)}`,
            status: "pending",
        };
    }
    async capture(reference) {
        return {
            status: "success",
            providerPayload: { reference, simulated: true, neverStoresCards: true },
        };
    }
}
export class MockBankAccountVerificationService {
    async verify(accountNumber, bankName) {
        const isZenith = bankName.toLowerCase().includes("zenith");
        return {
            ok: accountNumber.replace(/\D/g, "").length >= 10,
            isZenith,
            masked: maskAccount(accountNumber),
            encrypted: encryptField(accountNumber),
        };
    }
}
export class MockLoanReferralService {
    async submit(applicationId) {
        return {
            accepted: true,
            note: `Simulated referral queued for bank review (${applicationId}). No real credit decision.`,
        };
    }
}
export class MockSavingsProductService {
    async open() {
        return { heldBy: "Zenith Bank (simulated administration)" };
    }
}
export const paymentProvider = new MockSandboxProvider();
export const bankVerification = new MockBankAccountVerificationService();
export const loanReferral = new MockLoanReferralService();
export const savingsService = new MockSavingsProductService();
