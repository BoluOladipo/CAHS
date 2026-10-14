import { describe, expect, it } from "vitest";
import { projectedReturn, SAVINGS_DISCLOSURES } from "./savings.js";
describe("savings disclosures", () => {
    it("requires projected-return language and bank handling", () => {
        expect(SAVINGS_DISCLOSURES.some((d) => d.toLowerCase().includes("projected"))).toBe(true);
        expect(SAVINGS_DISCLOSURES.some((d) => d.includes("Zenith Bank"))).toBe(true);
    });
    it("computes a projected (not guaranteed) return", () => {
        expect(projectedReturn(100000, 10, 365)).toBe(10000);
    });
});
