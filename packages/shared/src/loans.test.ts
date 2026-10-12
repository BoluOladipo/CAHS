import { describe, expect, it } from "vitest";
import { aiMayChangeLoanStatus, canRecordLoanDecision } from "./loans.js";

describe("loan governance", () => {
  it("allows only bank officers to record decisions", () => {
    expect(canRecordLoanDecision("BANK_OFFICER")).toBe(true);
    expect(canRecordLoanDecision("PLATFORM_ADMIN")).toBe(false);
    expect(canRecordLoanDecision("FARMER")).toBe(false);
  });

  it("never lets AI change a loan status", () => {
    expect(aiMayChangeLoanStatus()).toBe(false);
  });
});
