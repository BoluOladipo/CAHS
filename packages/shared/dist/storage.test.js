import { describe, expect, it } from "vitest";
import { assertNonNegativeCapacity, runningBalance } from "./storage.js";
describe("storage capacity and ledger", () => {
    it("rejects bookings that would go negative", () => {
        expect(() => assertNonNegativeCapacity(10, 11)).toThrow(/cannot go negative/);
        expect(() => assertNonNegativeCapacity(10, 10)).not.toThrow();
    });
    it("reconciles intake minus dispatch", () => {
        expect(runningBalance(100, 40)).toBe(60);
        expect(() => runningBalance(10, 11)).toThrow(/does not reconcile/);
    });
});
